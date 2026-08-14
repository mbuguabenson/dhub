import { WS } from '@deriv/shared';
import { TTradeLog, TTradeSummary } from '../Types';

export type TAutoTradeConfig = {
    symbol: string;
    contract_type: string;
    duration: number;
    barrier?: number | string;
    initial_stake: number;
    martingale: number;
    take_profit: number;
    stop_loss: number;
    currency?: string;
    is_recovery_enabled?: boolean;
    recovery_consecutive_losses?: number;
    recovery_market?: string;
    recovery_contract_type?: string;
    recovery_barrier?: number | string;
    onStatusChange?: (status: {
        is_running: boolean;
        current_stake: number;
        total_runs: number;
        total_profit: number;
        consecutive_losses: number;
        message: string;
    }) => void;
    onTradeComplete?: (trade: TTradeLog, summary: TTradeSummary) => void;
};

export class TradeExecutionService {
    private is_running = false;
    private config: TAutoTradeConfig | null = null;
    private current_stake = 1;
    private consecutive_losses = 0;
    private total_runs = 0;
    private wins = 0;
    private losses = 0;
    private total_stake = 0;
    private total_profit = 0;
    private trade_history: TTradeLog[] = [];
    private active_contract_sub_id: string | null = null;

    public isRunning() {
        return this.is_running;
    }

    public getTradeHistory() {
        return this.trade_history;
    }

    public getSummary(): TTradeSummary {
        return {
            total_runs: this.total_runs,
            wins: this.wins,
            losses: this.losses,
            win_rate: this.total_runs > 0 ? parseFloat(((this.wins / this.total_runs) * 100).toFixed(1)) : 0,
            total_stake: parseFloat(this.total_stake.toFixed(2)),
            total_profit: parseFloat(this.total_profit.toFixed(2)),
        };
    }

    public startAutoTrading(config: TAutoTradeConfig) {
        if (this.is_running) return;
        this.is_running = true;
        this.config = config;
        this.current_stake = config.initial_stake;
        this.consecutive_losses = 0;
        this.executeNextTrade();
    }

    public stopAutoTrading(reason = 'Manual Stop') {
        this.is_running = false;
        if (this.active_contract_sub_id) {
            try {
                WS.forgetStream(this.active_contract_sub_id);
            } catch (e) {
                // ignore
            }
            this.active_contract_sub_id = null;
        }
        this.notifyStatus(reason);
    }

    public resetStats() {
        this.total_runs = 0;
        this.wins = 0;
        this.losses = 0;
        this.total_stake = 0;
        this.total_profit = 0;
        this.consecutive_losses = 0;
        this.trade_history = [];
    }

    private async executeNextTrade() {
        if (!this.is_running || !this.config) return;

        // Check TP and SL conditions
        if (this.config.take_profit > 0 && this.total_profit >= this.config.take_profit) {
            this.stopAutoTrading(`Take Profit Reached: +$${this.total_profit.toFixed(2)}`);
            return;
        }

        if (this.config.stop_loss > 0 && this.total_profit <= -Math.abs(this.config.stop_loss)) {
            this.stopAutoTrading(`Stop Loss Triggered: -$${Math.abs(this.total_profit).toFixed(2)}`);
            return;
        }

        // Check 5 consecutive losses auto-kill safety
        if (this.consecutive_losses >= 5) {
            this.stopAutoTrading('Auto-Kill Protection: 5 Consecutive Losses');
            return;
        }

        // Determine if recovery mode is active
        const is_in_recovery =
            this.config.is_recovery_enabled &&
            this.consecutive_losses >= (this.config.recovery_consecutive_losses || 2);

        const active_symbol = is_in_recovery && this.config.recovery_market
            ? this.config.recovery_market
            : this.config.symbol;

        const active_contract_type = is_in_recovery && this.config.recovery_contract_type
            ? this.config.recovery_contract_type
            : this.config.contract_type;

        const active_barrier = is_in_recovery && this.config.recovery_barrier !== undefined
            ? this.config.recovery_barrier
            : this.config.barrier;

        const stake_amount = parseFloat(this.current_stake.toFixed(2));
        this.notifyStatus(`Placing trade on ${active_symbol} with $${stake_amount}...`);

        try {
            // 1. Request Proposal
            const proposal_req: any = {
                proposal: 1,
                amount: stake_amount,
                basis: 'stake',
                currency: this.config.currency || 'USD',
                symbol: active_symbol,
                duration: this.config.duration || 1,
                duration_unit: 't',
                contract_type: active_contract_type,
            };

            if (active_barrier !== undefined && active_barrier !== null && active_barrier !== '') {
                proposal_req.barrier = String(active_barrier);
            }

            const proposal_res = await WS.send(proposal_req);

            if (proposal_res.error) {
                this.notifyStatus(`Proposal error: ${proposal_res.error.message}`);
                this.stopAutoTrading(`Error: ${proposal_res.error.message}`);
                return;
            }

            const proposal_id = proposal_res.proposal?.id;
            if (!proposal_id) {
                this.stopAutoTrading('Invalid proposal ID received');
                return;
            }

            // 2. Buy Contract
            const buy_res = await WS.buy({
                proposal_id,
                price: stake_amount,
            });

            if (buy_res.error) {
                this.notifyStatus(`Buy error: ${buy_res.error.message}`);
                this.stopAutoTrading(`Buy Error: ${buy_res.error.message}`);
                return;
            }

            const contract_id = buy_res.buy?.contract_id;
            if (!contract_id) {
                this.stopAutoTrading('No contract ID received from purchase');
                return;
            }

            this.total_runs++;
            this.total_stake += stake_amount;

            const pending_trade: TTradeLog = {
                id: String(contract_id),
                timestamp: Date.now(),
                symbol: active_symbol,
                strategy: active_contract_type,
                contract_type: active_contract_type,
                barrier: active_barrier,
                stake: stake_amount,
                profit: 0,
                status: 'pending',
            };

            this.trade_history = [pending_trade, ...this.trade_history.slice(0, 49)];
            this.notifyTradeComplete(pending_trade);

            // 3. Track Contract to completion
            this.trackContractOutcome(contract_id, pending_trade);
        } catch (err: any) {
            console.error('[TradeExecutionService] Execution Error:', err);
            this.stopAutoTrading(`Execution Error: ${err.message || err}`);
        }
    }

    private trackContractOutcome(contract_id: number, trade: TTradeLog) {
        try {
            const subscriber = WS.subscribeProposalOpenContract(contract_id, (response: any) => {
                if (response.proposal_open_contract) {
                    const poc = response.proposal_open_contract;
                    if (poc.is_sold) {
                        // Unsubscribe from this contract stream
                        if (response.subscription?.id) {
                            try {
                                WS.forgetStream(response.subscription.id);
                            } catch (e) {
                                // ignore
                            }
                        }

                        const profit = Number(poc.profit || 0);
                        const status = poc.status === 'won' ? 'won' : 'lost';

                        // Update trade object
                        trade.status = status;
                        trade.profit = profit;
                        trade.entry_spot = poc.entry_spot ? Number(poc.entry_spot) : undefined;
                        trade.exit_spot = poc.exit_tick ? Number(poc.exit_tick) : undefined;

                        this.total_profit += profit;

                        if (status === 'won') {
                            this.wins++;
                            this.consecutive_losses = 0;
                            // Reset stake on win
                            this.current_stake = this.config?.initial_stake || 1;
                        } else {
                            this.losses++;
                            this.consecutive_losses++;
                            // Apply Martingale multiplier on loss
                            const multiplier = this.config?.martingale || 1;
                            this.current_stake = multiplier > 1 ? this.current_stake * multiplier : this.config?.initial_stake || 1;
                        }

                        this.notifyTradeComplete(trade);

                        // Pause 1 second before next trade
                        if (this.is_running) {
                            setTimeout(() => {
                                this.executeNextTrade();
                            }, 1200);
                        }
                    }
                }
            });

            if (subscriber && typeof subscriber.then === 'function') {
                subscriber.then((sub: any) => {
                    if (sub?.subscription?.id) {
                        this.active_contract_sub_id = sub.subscription.id;
                    }
                });
            }
        } catch (e) {
            console.error('[TradeExecutionService] Track Error:', e);
        }
    }

    private notifyStatus(message: string) {
        this.config?.onStatusChange?.({
            is_running: this.is_running,
            current_stake: this.current_stake,
            total_runs: this.total_runs,
            total_profit: this.total_profit,
            consecutive_losses: this.consecutive_losses,
            message,
        });
    }

    private notifyTradeComplete(trade: TTradeLog) {
        this.config?.onTradeComplete?.(trade, this.getSummary());
    }
}

export const tradeExecution = new TradeExecutionService();
