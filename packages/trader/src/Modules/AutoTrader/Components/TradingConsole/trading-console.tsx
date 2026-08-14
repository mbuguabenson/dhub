import React from 'react';
import clsx from 'clsx';
import { VOLATILITY_MARKETS } from '../../Services/market-scanner-service';
import { tradeExecution } from '../../Services/trade-execution-service';
import { TTradeLog, TTradeSummary } from '../../Types';

type TTradingConsoleProps = {
    selected_market: string;
    onSelectMarket: (symbol: string) => void;
    contract_type: string;
    onChangeContractType: (type: string) => void;
    barrier: number | string;
    onChangeBarrier: (barrier: number | string) => void;
    duration: number;
    onChangeDuration: (duration: number) => void;
    current_tick?: number;
};

const CONTRACT_TYPE_OPTIONS = [
    { value: 'DIGITUNDER', label: 'Under' },
    { value: 'DIGITOVER', label: 'Over' },
    { value: 'DIGITEVEN', label: 'Even' },
    { value: 'DIGITODD', label: 'Odd' },
    { value: 'DIGITMATCH', label: 'Matches' },
    { value: 'DIGITDIFF', label: 'Differs' },
    { value: 'CALL', label: 'Rise' },
    { value: 'PUT', label: 'Fall' },
];

const TradingConsole = ({
    selected_market,
    onSelectMarket,
    contract_type,
    onChangeContractType,
    barrier,
    onChangeBarrier,
    duration,
    onChangeDuration,
    current_tick,
}: TTradingConsoleProps) => {
    const [stake, setStake] = React.useState<number>(1);
    const [martingale, setMartingale] = React.useState<number>(2);
    const [take_profit, setTakeProfit] = React.useState<number>(10);
    const [stop_loss, setStopLoss] = React.useState<number>(25);
    const [entry_point, setEntryPoint] = React.useState<string>('');
    const [is_recovery_enabled, setIsRecoveryEnabled] = React.useState<boolean>(false);
    const [recovery_losses, setRecoveryLosses] = React.useState<number>(2);
    const [recovery_market, setRecoveryMarket] = React.useState<string>('1HZ100V');
    const [recovery_contract_type, setRecoveryContractType] = React.useState<string>('DIGITEVEN');

    const [is_running, setIsRunning] = React.useState<boolean>(false);
    const [status_message, setStatusMessage] = React.useState<string>('Ready to trade');
    const [trade_history, setTradeHistory] = React.useState<TTradeLog[]>([]);
    const [summary, setSummary] = React.useState<TTradeSummary>({
        total_runs: 0,
        wins: 0,
        losses: 0,
        win_rate: 0,
        total_stake: 0,
        total_profit: 0,
    });

    const is_digit_type = contract_type.startsWith('DIGIT');
    const needs_barrier = ['DIGITUNDER', 'DIGITOVER', 'DIGITMATCH', 'DIGITDIFF'].includes(contract_type);

    const handleStartAutoTrading = () => {
        setIsRunning(true);
        setStatusMessage('Auto-Trader activated. Scanning entry condition...');

        tradeExecution.startAutoTrading({
            symbol: selected_market,
            contract_type,
            duration,
            barrier: needs_barrier ? barrier : undefined,
            initial_stake: stake,
            martingale,
            take_profit,
            stop_loss,
            is_recovery_enabled,
            recovery_consecutive_losses: recovery_losses,
            recovery_market,
            recovery_contract_type,
            onStatusChange: status => {
                setIsRunning(status.is_running);
                setStatusMessage(status.message);
            },
            onTradeComplete: (trade, updated_summary) => {
                setTradeHistory(tradeExecution.getTradeHistory());
                setSummary(updated_summary);
            },
        });
    };

    const handleStopAutoTrading = () => {
        tradeExecution.stopAutoTrading('Manually Stopped');
        setIsRunning(false);
        setStatusMessage('Auto-Trader paused.');
    };

    const handleSinglePurchase = () => {
        tradeExecution.startAutoTrading({
            symbol: selected_market,
            contract_type,
            duration,
            barrier: needs_barrier ? barrier : undefined,
            initial_stake: stake,
            martingale: 1,
            take_profit: 999999,
            stop_loss: 999999,
            onStatusChange: status => {
                setStatusMessage(status.message);
                if (status.total_runs >= 1) {
                    tradeExecution.stopAutoTrading('Single Run Complete');
                }
            },
            onTradeComplete: (trade, updated_summary) => {
                setTradeHistory(tradeExecution.getTradeHistory());
                setSummary(updated_summary);
                tradeExecution.stopAutoTrading('Single Run Complete');
            },
        });
    };

    return (
        <div className='autotrader-console-section'>
            {/* Trading Parameters Form */}
            <div className='autotrader-card'>
                <div className='autotrader-card__header'>
                    <span className='autotrader-card__title'>Trading Engine Console</span>
                    <span className={clsx('autotrader-status-pill', is_running ? 'autotrader-status-pill--running' : 'autotrader-status-pill--idle')}>
                        {is_running ? 'AUTO-TRADING ACTIVE' : 'IDLE'}
                    </span>
                </div>

                <div className='autotrader-form-grid'>
                    {/* Market Selector */}
                    <div className='autotrader-field'>
                        <label className='autotrader-field__label'>Market</label>
                        <select
                            className='autotrader-select'
                            value={selected_market}
                            disabled={is_running}
                            onChange={e => onSelectMarket(e.target.value)}
                        >
                            {VOLATILITY_MARKETS.map(m => (
                                <option key={m.symbol} value={m.symbol}>
                                    {m.display_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Trade Type */}
                    <div className='autotrader-field'>
                        <label className='autotrader-field__label'>Contract Type</label>
                        <select
                            className='autotrader-select'
                            value={contract_type}
                            disabled={is_running}
                            onChange={e => onChangeContractType(e.target.value)}
                        >
                            {CONTRACT_TYPE_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Prediction / Barrier */}
                    {needs_barrier && (
                        <div className='autotrader-field'>
                            <label className='autotrader-field__label'>Prediction Barrier (0 - 9)</label>
                            <input
                                type='number'
                                min='0'
                                max='9'
                                className='autotrader-input'
                                value={barrier}
                                disabled={is_running}
                                onChange={e => onChangeBarrier(parseInt(e.target.value, 10))}
                            />
                        </div>
                    )}

                    {/* Duration */}
                    <div className='autotrader-field'>
                        <label className='autotrader-field__label'>Duration (Ticks)</label>
                        <input
                            type='number'
                            min='1'
                            max='10'
                            className='autotrader-input'
                            value={duration}
                            disabled={is_running}
                            onChange={e => onChangeDuration(parseInt(e.target.value, 10) || 1)}
                        />
                    </div>

                    {/* Stake */}
                    <div className='autotrader-field'>
                        <label className='autotrader-field__label'>Initial Stake ($)</label>
                        <input
                            type='number'
                            min='0.35'
                            step='0.5'
                            className='autotrader-input'
                            value={stake}
                            disabled={is_running}
                            onChange={e => setStake(parseFloat(e.target.value) || 1)}
                        />
                    </div>

                    {/* Martingale */}
                    <div className='autotrader-field'>
                        <label className='autotrader-field__label'>Martingale Multiplier</label>
                        <input
                            type='number'
                            min='1'
                            step='0.1'
                            className='autotrader-input'
                            value={martingale}
                            disabled={is_running}
                            onChange={e => setMartingale(parseFloat(e.target.value) || 1)}
                        />
                    </div>

                    {/* Take Profit */}
                    <div className='autotrader-field'>
                        <label className='autotrader-field__label'>Take Profit Target ($)</label>
                        <input
                            type='number'
                            min='1'
                            className='autotrader-input'
                            value={take_profit}
                            disabled={is_running}
                            onChange={e => setTakeProfit(parseFloat(e.target.value) || 10)}
                        />
                    </div>

                    {/* Stop Loss */}
                    <div className='autotrader-field'>
                        <label className='autotrader-field__label'>Stop Loss Limit ($)</label>
                        <input
                            type='number'
                            min='1'
                            className='autotrader-input'
                            value={stop_loss}
                            disabled={is_running}
                            onChange={e => setStopLoss(parseFloat(e.target.value) || 25)}
                        />
                    </div>
                </div>

                {/* Status Message */}
                <div className='autotrader-status-bar'>
                    <span className='autotrader-status-bar__label'>Engine Status:</span>
                    <span className='autotrader-status-bar__msg'>{status_message}</span>
                </div>

                {/* Action Buttons */}
                <div className='autotrader-actions'>
                    <button
                        type='button'
                        className='autotrader-btn autotrader-btn--secondary'
                        disabled={is_running}
                        onClick={handleSinglePurchase}
                    >
                        Single Run Purchase
                    </button>

                    {is_running ? (
                        <button
                            type='button'
                            className='autotrader-btn autotrader-btn--danger'
                            onClick={handleStopAutoTrading}
                        >
                            Stop Auto-Trading
                        </button>
                    ) : (
                        <button
                            type='button'
                            className='autotrader-btn autotrader-btn--success'
                            onClick={handleStartAutoTrading}
                        >
                            Start Continuous Auto-Trading
                        </button>
                    )}
                </div>
            </div>

            {/* Performance Summary Banner */}
            <div className='autotrader-ledger-summary'>
                <div className='autotrader-summary-card'>
                    <span className='autotrader-summary-card__label'>Total Runs</span>
                    <span className='autotrader-summary-card__val'>{summary.total_runs}</span>
                </div>
                <div className='autotrader-summary-card'>
                    <span className='autotrader-summary-card__label'>Wins</span>
                    <span className='autotrader-summary-card__val text-emerald'>{summary.wins}</span>
                </div>
                <div className='autotrader-summary-card'>
                    <span className='autotrader-summary-card__label'>Losses</span>
                    <span className='autotrader-summary-card__val text-red'>{summary.losses}</span>
                </div>
                <div className='autotrader-summary-card'>
                    <span className='autotrader-summary-card__label'>Win Rate</span>
                    <span className='autotrader-summary-card__val'>{summary.win_rate}%</span>
                </div>
                <div className='autotrader-summary-card'>
                    <span className='autotrader-summary-card__label'>Total Stake</span>
                    <span className='autotrader-summary-card__val'>${summary.total_stake}</span>
                </div>
                <div className='autotrader-summary-card autotrader-summary-card--profit'>
                    <span className='autotrader-summary-card__label'>Net Profit</span>
                    <span
                        className={clsx(
                            'autotrader-summary-card__val autotrader-summary-card__val--bold',
                            summary.total_profit >= 0 ? 'text-emerald' : 'text-red'
                        )}
                    >
                        {summary.total_profit >= 0 ? `+$${summary.total_profit.toFixed(2)}` : `-$${Math.abs(summary.total_profit).toFixed(2)}`}
                    </span>
                </div>
            </div>

            {/* Live Transaction History Table */}
            <div className='autotrader-card autotrader-card--table'>
                <div className='autotrader-card__header'>
                    <span className='autotrader-card__title'>Transaction Ledger</span>
                    <span className='autotrader-card__badge'>{trade_history.length} Records</span>
                </div>

                <div className='autotrader-table-wrapper'>
                    <table className='autotrader-table'>
                        <thead>
                            <tr>
                                <th>Time</th>
                                <th>Market</th>
                                <th>Contract</th>
                                <th>Stake</th>
                                <th>Entry Spot</th>
                                <th>Exit Spot</th>
                                <th>Profit / Loss</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {trade_history.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className='text-center py-4 text-secondary'>
                                        No transactions yet. Start trading to populate ledger.
                                    </td>
                                </tr>
                            ) : (
                                trade_history.map(trade => (
                                    <tr key={trade.id}>
                                        <td>{new Date(trade.timestamp).toLocaleTimeString()}</td>
                                        <td><strong>{trade.symbol}</strong></td>
                                        <td>{trade.contract_type} {trade.barrier !== undefined ? `(${trade.barrier})` : ''}</td>
                                        <td>${trade.stake.toFixed(2)}</td>
                                        <td>{trade.entry_spot ?? '-'}</td>
                                        <td>{trade.exit_spot ?? '-'}</td>
                                        <td className={clsx('font-bold', trade.profit > 0 ? 'text-emerald' : trade.profit < 0 ? 'text-red' : '')}>
                                            {trade.profit > 0 ? `+$${trade.profit.toFixed(2)}` : trade.profit < 0 ? `-$${Math.abs(trade.profit).toFixed(2)}` : '$0.00'}
                                        </td>
                                        <td>
                                            <span
                                                className={clsx('autotrader-badge', {
                                                    'autotrader-badge--won': trade.status === 'won',
                                                    'autotrader-badge--lost': trade.status === 'lost',
                                                    'autotrader-badge--pending': trade.status === 'pending',
                                                })}
                                            >
                                                {trade.status.toUpperCase()}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default TradingConsole;
