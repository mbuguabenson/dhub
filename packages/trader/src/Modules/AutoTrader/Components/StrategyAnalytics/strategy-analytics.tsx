import React from 'react';
import clsx from 'clsx';
import { TMarketInfo, TStrategyType } from '../../Types';
import OverUnderStrategy from './over-under-strategy';
import EvenOddStrategy from './even-odd-strategy';
import RiseFallStrategy from './rise-fall-strategy';
import DiffersMatchesStrategy from './differs-matches-strategy';

type TStrategyAnalyticsProps = {
    selected_strategy: TStrategyType;
    onSelectStrategy: (strategy: TStrategyType) => void;
    active_market: TMarketInfo;
    onApplySignal?: (signal: { contract_type: string; barrier: number; ticks: number }) => void;
};

const STRATEGY_TABS: { id: TStrategyType; label: string }[] = [
    { id: 'over_under', label: 'Over / Under' },
    { id: 'even_odd', label: 'Even / Odd' },
    { id: 'differs', label: 'Differs' },
    { id: 'matches', label: 'Matches' },
    { id: 'rise_fall', label: 'Rise / Fall' },
];

const StrategyAnalytics = ({
    selected_strategy,
    onSelectStrategy,
    active_market,
    onApplySignal,
}: TStrategyAnalyticsProps) => {
    return (
        <div className='autotrader-analytics-section'>
            {/* Strategy Selector Tabs */}
            <div className='autotrader-tabs'>
                {STRATEGY_TABS.map(tab => (
                    <button
                        key={tab.id}
                        type='button'
                        className={clsx('autotrader-tabs__item', {
                            'autotrader-tabs__item--active': selected_strategy === tab.id,
                        })}
                        onClick={() => onSelectStrategy(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Strategy Content */}
            <div className='autotrader-analytics-content'>
                {selected_strategy === 'over_under' && (
                    <OverUnderStrategy market={active_market} onApplySignal={onApplySignal} />
                )}
                {selected_strategy === 'even_odd' && (
                    <EvenOddStrategy market={active_market} onApplySignal={onApplySignal} />
                )}
                {selected_strategy === 'rise_fall' && (
                    <RiseFallStrategy market={active_market} onApplySignal={onApplySignal} />
                )}
                {selected_strategy === 'differs' && (
                    <DiffersMatchesStrategy market={active_market} strategy='differs' onApplySignal={onApplySignal} />
                )}
                {selected_strategy === 'matches' && (
                    <DiffersMatchesStrategy market={active_market} strategy='matches' onApplySignal={onApplySignal} />
                )}
            </div>
        </div>
    );
};

export default StrategyAnalytics;
