import React from 'react';
import clsx from 'clsx';
import { useStore } from '@deriv/stores';
import { TMarketInfo, TTradeLog, TTradeSummary } from '../../Types';
import { tradeExecution } from '../../Services/trade-execution-service';

type THighProbability24hBotProps = {
    markets: TMarketInfo[];
};

type TTargetConfig = {
    label: string;
    contract_type: 'DIGITOVER' | 'DIGITUNDER';
    barrier: number;
    default_martingale: number;
};

const TARGET_PRESETS: TTargetConfig[] = [
    { label: 'Over 1 (High Safety)', contract_type: 'DIGITOVER', barrier: 1, default_martingale: 3.1 },
    { label: 'Over 2 (Balanced Safe)', contract_type: 'DIGITOVER', barrier: 2, default_martingale: 2.1 },
    { label: 'Over 3 (Moderate)', contract_type: 'DIGITOVER', barrier: 3, default_martingale: 1.5 },
    { label: 'Under 8 (High Safety)', contract_type: 'DIGITUNDER', barrier: 8, default_martingale: 3.1 },
    { label: 'Under 7 (Balanced Safe)', contract_type: 'DIGITUNDER', barrier: 7, default_martingale: 2.1 },
    { label: 'Under 6 (Moderate)', contract_type: 'DIGITUNDER', barrier: 6, default_martingale: 1.5 },
];

const HighProbability24hBot = ({ markets = [] }: THighProbability24hBotProps) => {
    const { client } = useStore();
    const balance = Number(client.balance || 1000);

    const [selected_preset, setSelectedPreset] = React.useState<TTargetConfig>(TARGET_PRESETS[1]); // Over 2 default
    const [balance_percentage, setBalancePercentage] = React.useState<number>(1); // 1%
    const [use_martingale, setUseMartingale] = React.useState<boolean>(true);
    const [custom_martingale, setCustomMartingale] = React.useState<number>(2.1);
    const [session_hours, setSessionHours] = React.useState<number>(8); // Up to 24 hours
    const [auto_switch_best_market, setAutoSwitchBestMarket] = React.useState<boolean>(true);
    const [selected_market, setSelectedMarket] = React.useState<string>('1HZ100V');

    const [is_running, setIsRunning] = React.useState<boolean>(false);
    const [status_msg, setStatusMsg] = React.useState<string>('Ready to start high probability 24h session');
    const [trade_history, setTradeHistory] = React.useState<TTradeLog[]>([]);
    const [summary, setSummary] = React.useState<TTradeSummary>({
        total_runs: 0,
        wins: 0,
        losses: 0,
        win_rate: 0,
        total_stake: 0,
        total_profit: 0,
    });

    // Auto-calculated Stake from Balance Percentage
    const calculated_stake = Math.max(0.35, parseFloat(((balance * balance_percentage) / 100).toFixed(2)));

    // Find Best Market based on Power Score & Safe Zone
    const best_market = React.useMemo(() => {
        const sorted = [...markets].sort((a, b) => b.power - a.power);
        return sorted[0] || markets[0];
    }, [markets]);

    const active_market_symbol = auto_switch_best_market && best_market ? best_market.symbol : selected_market;

    const handlePresetChange = (preset: TTargetConfig) => {
        setSelectedPreset(preset);
        setCustomMartingale(preset.default_martingale);
    };

    const handleStart24hBot = () => {
        setIsRunning(true);
        setStatusMsg(`24h Bot started on ${active_market_symbol} with ${selected_preset.label}`);

        tradeExecution.startAutoTrading({
            symbol: active_market_symbol,
            contract_type: selected_preset.contract_type,
            duration: 1,
            barrier: selected_preset.barrier,
            initial_stake: calculated_stake,
            martingale: use_martingale ? custom_martingale : 1,
            take_profit: (balance * 0.2), // 20% default profit target
            stop_loss: (balance * 0.15), // 15% default stop loss
            onStatusChange: status => {
                setIsRunning(status.is_running);
                setStatusMsg(status.message);
            },
            onTradeComplete: (trade, updated_summary) => {
                setTradeHistory(tradeExecution.getTradeHistory());
                setSummary(updated_summary);
            },
        });
    };

    const handleStop24hBot = () => {
        tradeExecution.stopAutoTrading('Stopped by user');
        setIsRunning(false);
        setStatusMsg('24h Bot paused.');
    };

    return (
        <div className='autotrader-24h-bot'>
            {/* Header & Market Powers Smart Screen */}
            <div className='autotrader-card'>
                <div className='autotrader-card__header'>
                    <div>
                        <span className='autotrader-card__title'>24-Hour High Probability Bot</span>
                        <div className='autotrader-card__sub'>Trades Over 1, 2, 3 or Under 6, 7, 8 with Safe-Zone Enforcement</div>
                    </div>
                    <span className={clsx('autotrader-status-pill', is_running ? 'autotrader-status-pill--running' : 'autotrader-status-pill--idle')}>
                        {is_running ? '24H ENGINE LIVE' : 'STOPPED'}
                    </span>
                </div>

                {/* Market Power Scanner Strip */}
                <div className='autotrader-market-power-strip'>
                    <div className='autotrader-market-power-strip__title'>
                        <span>Market Power Radar</span>
                        <span className='text-emerald'>Best Market: {best_market?.display_name || 'Loading...'} ({best_market?.power || 50}% Power)</span>
                    </div>

                    <div className='autotrader-market-power-strip__grid'>
                        {markets.slice(0, 6).map(m => (
                            <div
                                key={m.symbol}
                                className={clsx('autotrader-radar-item', {
                                    'autotrader-radar-item--safe': m.is_safe,
                                    'autotrader-radar-item--active': m.symbol === active_market_symbol,
                                })}
                            >
                                <span className='autotrader-radar-item__name'>{m.symbol}</span>
                                <span className='autotrader-radar-item__power'>{m.power}%</span>
                                <span className={clsx('autotrader-radar-item__badge', m.is_safe ? 'badge-safe' : 'badge-choppy')}>
                                    {m.is_safe ? 'SAFE' : 'CHOPPY'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Target Strategy & Risk Controls */}
            <div className='autotrader-card'>
                <div className='autotrader-card__header'>
                    <span className='autotrader-card__title'>Strategy Presets & Money Management</span>
                </div>

                {/* Strategy Presets Grid */}
                <div className='autotrader-presets-grid'>
                    {TARGET_PRESETS.map((preset, idx) => (
                        <button
                            key={idx}
                            type='button'
                            className={clsx('autotrader-preset-btn', {
                                'autotrader-preset-btn--selected': selected_preset.label === preset.label,
                            })}
                            disabled={is_running}
                            onClick={() => handlePresetChange(preset)}
                        >
                            <span className='autotrader-preset-btn__title'>{preset.label}</span>
                            <span className='autotrader-preset-btn__sub'>Default Martingale: {preset.default_martingale}x</span>
                        </button>
                    ))}
                </div>

                {/* Form Controls */}
                <div className='autotrader-form-grid mt-4'>
                    <div className='autotrader-field'>
                        <label className='autotrader-field__label'>Account Balance Stake %</label>
                        <div className='autotrader-pct-buttons'>
                            {[1, 2, 3, 4, 5].map(pct => (
                                <button
                                    key={pct}
                                    type='button'
                                    className={clsx('autotrader-pct-btn', balance_percentage === pct && 'active')}
                                    disabled={is_running}
                                    onClick={() => setBalancePercentage(pct)}
                                >
                                    {pct}% (${((balance * pct) / 100).toFixed(2)})
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className='autotrader-field'>
                        <label className='autotrader-field__label'>Auto-Calculated Stake</label>
                        <input
                            type='text'
                            className='autotrader-input'
                            value={`$${calculated_stake}`}
                            readOnly
                        />
                    </div>

                    <div className='autotrader-field'>
                        <label className='autotrader-field__label'>Martingale Multiplier</label>
                        <input
                            type='number'
                            step='0.1'
                            min='1'
                            className='autotrader-input'
                            value={use_martingale ? custom_martingale : 1}
                            disabled={is_running || !use_martingale}
                            onChange={e => setCustomMartingale(parseFloat(e.target.value) || 1)}
                        />
                    </div>

                    <div className='autotrader-field'>
                        <label className='autotrader-field__label'>Target Session Runtime (Hours)</label>
                        <input
                            type='number'
                            min='1'
                            max='24'
                            className='autotrader-input'
                            value={session_hours}
                            disabled={is_running}
                            onChange={e => setSessionHours(parseInt(e.target.value, 10) || 1)}
                        />
                    </div>
                </div>

                {/* Auto Switch Markets Toggle */}
                <div className='autotrader-toggle-row mt-4'>
                    <label className='autotrader-toggle-label'>
                        <input
                            type='checkbox'
                            checked={auto_switch_best_market}
                            disabled={is_running}
                            onChange={e => setAutoSwitchBestMarket(e.target.checked)}
                        />
                        <span>Auto-Switch to highest scoring Safe Market continuously</span>
                    </label>
                </div>

                {/* Status Bar */}
                <div className='autotrader-status-bar mt-4'>
                    <span className='autotrader-status-bar__label'>Bot Status:</span>
                    <span className='autotrader-status-bar__msg'>{status_msg}</span>
                </div>

                {/* Action Buttons */}
                <div className='autotrader-actions mt-4'>
                    {is_running ? (
                        <button
                            type='button'
                            className='autotrader-btn autotrader-btn--danger autotrader-btn--block'
                            onClick={handleStop24hBot}
                        >
                            Stop 24-Hour Bot
                        </button>
                    ) : (
                        <button
                            type='button'
                            className='autotrader-btn autotrader-btn--success autotrader-btn--block'
                            onClick={handleStart24hBot}
                        >
                            Start 24-Hour Automated Session
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
        </div>
    );
};

export default HighProbability24hBot;
