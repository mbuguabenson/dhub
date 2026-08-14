import React from 'react';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import { useStore } from '@deriv/stores';

import { marketScanner, VOLATILITY_MARKETS } from '../Services/market-scanner-service';
import { TMarketInfo, TStrategyType } from '../Types';

import DigitDistributionMeter from '../Components/Visualizations/digit-distribution-meter';
import LastDigitLineGraph from '../Components/Visualizations/last-digit-line-graph';
import LastSevenDigitsCards from '../Components/Visualizations/last-seven-digits-cards';
import StrategyAnalytics from '../Components/StrategyAnalytics/strategy-analytics';
import TradingConsole from '../Components/TradingConsole/trading-console';
import HighProbability24hBot from '../Components/HighProbability24hBot/high-probability-bot';

const AutoTrader = observer(() => {
    const { client } = useStore();
    const [main_tab, setMainTab] = React.useState<'analytics_engine' | '24h_bot'>('analytics_engine');
    const [markets, setMarkets] = React.useState<TMarketInfo[]>([]);
    const [selected_market, setSelectedMarket] = React.useState<string>('1HZ100V');
    const [selected_strategy, setSelectedStrategy] = React.useState<TStrategyType>('over_under');
    const [auto_switch_markets, setAutoSwitchMarkets] = React.useState<boolean>(false);

    const [contract_type, setContractType] = React.useState<string>('DIGITUNDER');
    const [barrier, setBarrier] = React.useState<number | string>(5);
    const [duration, setDuration] = React.useState<number>(1);

    // Subscribe to live market scanner
    React.useEffect(() => {
        const unsubscribe = marketScanner.subscribe(updated_markets => {
            setMarkets(updated_markets);
        });
        return () => unsubscribe();
    }, []);

    // Get active market info
    const active_market = React.useMemo(() => {
        if (auto_switch_markets && markets.length > 0) {
            // Find market with highest power score
            const sorted = [...markets].sort((a, b) => b.power - a.power);
            return sorted[0];
        }
        return markets.find(m => m.symbol === selected_market) || markets[0] || {
            symbol: selected_market,
            display_name: 'Volatility 100 (1s) Index',
            power: 50,
            is_safe: false,
            under_percentage: 50,
            over_percentage: 50,
            even_percentage: 50,
            odd_percentage: 50,
            rise_percentage: 50,
            fall_percentage: 50,
            hottest_digit: 0,
            coldest_digit: 0,
            last_digits: [],
        };
    }, [markets, selected_market, auto_switch_markets]);

    const handleApplySignal = (signal: { contract_type: string; barrier: number; ticks: number }) => {
        setContractType(signal.contract_type);
        setBarrier(signal.barrier);
        setDuration(signal.ticks || 1);
    };

    return (
        <div className='autotrader-container'>
            {/* Header Toolbar */}
            <div className='autotrader-header'>
                <div className='autotrader-header__left'>
                    <h1 className='autotrader-header__title'>Smart AutoTrader Engine</h1>
                    <span className='autotrader-header__subtitle'>
                        Real-Time Multi-Volatility Scanner & Strategy Automation
                    </span>
                </div>

                {/* Sub-Tabs Selector */}
                <div className='autotrader-nav-tabs'>
                    <button
                        type='button'
                        className={clsx('autotrader-nav-tabs__btn', main_tab === 'analytics_engine' && 'active')}
                        onClick={() => setMainTab('analytics_engine')}
                    >
                        Strategy & Auto-Trader Engine
                    </button>
                    <button
                        type='button'
                        className={clsx('autotrader-nav-tabs__btn', main_tab === '24h_bot' && 'active')}
                        onClick={() => setMainTab('24h_bot')}
                    >
                        24-Hour High Probability Bot
                    </button>
                </div>
            </div>

            {/* Main Content Sections */}
            {main_tab === 'analytics_engine' ? (
                <div className='autotrader-layout-grid'>
                    {/* Left Column: Multi-Market Scanner & Analytics */}
                    <div className='autotrader-col autotrader-col--left'>
                        {/* Market Selector Bar */}
                        <div className='autotrader-market-bar autotrader-card'>
                            <div className='autotrader-market-bar__left'>
                                <span className='autotrader-market-bar__label'>Active Market:</span>
                                <select
                                    className='autotrader-select'
                                    value={active_market.symbol}
                                    disabled={auto_switch_markets}
                                    onChange={e => setSelectedMarket(e.target.value)}
                                >
                                    {VOLATILITY_MARKETS.map(m => (
                                        <option key={m.symbol} value={m.symbol}>
                                            {m.display_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className='autotrader-market-bar__right'>
                                <label className='autotrader-toggle-label'>
                                    <input
                                        type='checkbox'
                                        checked={auto_switch_markets}
                                        onChange={e => setAutoSwitchMarkets(e.target.checked)}
                                    />
                                    <span>Auto-Alternate to Top Power Market</span>
                                </label>
                                <span className={clsx('autotrader-badge', active_market.is_safe ? 'autotrader-badge--safe' : 'autotrader-badge--choppy')}>
                                    {active_market.is_safe ? `SAFE ZONE (${active_market.power}% POWER)` : `CHOPPY ZONE (${active_market.power}% POWER)`}
                                </span>
                            </div>
                        </div>

                        {/* Visualizations: Last 7 Digits Cards */}
                        <LastSevenDigitsCards
                            digits={active_market.last_digits}
                            hottest_digit={active_market.hottest_digit}
                            coldest_digit={active_market.coldest_digit}
                        />

                        {/* Visualizations: Last Digit Movement Line Graph */}
                        <LastDigitLineGraph
                            digits={active_market.last_digits}
                            hottest_digit={active_market.hottest_digit}
                            coldest_digit={active_market.coldest_digit}
                        />

                        {/* Visualizations: Digit Distribution Meter */}
                        <DigitDistributionMeter
                            digits={active_market.last_digits}
                            hottest_digit={active_market.hottest_digit}
                            coldest_digit={active_market.coldest_digit}
                            selected_digit={typeof barrier === 'number' ? barrier : undefined}
                            onSelectDigit={d => setBarrier(d)}
                        />

                        {/* Strategy Analytics */}
                        <StrategyAnalytics
                            selected_strategy={selected_strategy}
                            onSelectStrategy={setSelectedStrategy}
                            active_market={active_market}
                            onApplySignal={handleApplySignal}
                        />
                    </div>

                    {/* Right Column: Execution Console & Ledger */}
                    <div className='autotrader-col autotrader-col--right'>
                        <TradingConsole
                            selected_market={active_market.symbol}
                            onSelectMarket={setSelectedMarket}
                            contract_type={contract_type}
                            onChangeContractType={setContractType}
                            barrier={barrier}
                            onChangeBarrier={setBarrier}
                            duration={duration}
                            onChangeDuration={setDuration}
                            current_tick={active_market.latest_tick}
                        />
                    </div>
                </div>
            ) : (
                <HighProbability24hBot markets={markets} />
            )}
        </div>
    );
});

export default AutoTrader;
