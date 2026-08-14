import React from 'react';
import clsx from 'clsx';
import { TMarketInfo } from '../../Types';

type TDiffersMatchesStrategyProps = {
    market: TMarketInfo;
    strategy: 'differs' | 'matches';
    onApplySignal?: (signal: { contract_type: string; barrier: number; ticks: number }) => void;
};

const DiffersMatchesStrategy = ({ market, strategy, onApplySignal }: TDiffersMatchesStrategyProps) => {
    const { hottest_digit, coldest_digit, last_digits = [] } = market;

    // Calculate Frequencies
    const counts = Array(10).fill(0);
    last_digits.forEach(d => {
        if (!isNaN(d) && d >= 0 && d <= 9) counts[d]++;
    });

    const total = last_digits.length || 1;
    const hot_pct = parseFloat(((counts[hottest_digit] / total) * 100).toFixed(1));
    const cold_pct = parseFloat(((counts[coldest_digit] / total) * 100).toFixed(1));

    const is_differs = strategy === 'differs';
    const target_digit = is_differs ? coldest_digit : hottest_digit;
    const target_pct = is_differs ? cold_pct : hot_pct;
    const is_strong = is_differs ? cold_pct <= 7.5 : hot_pct >= 13.5;

    return (
        <div className='autotrader-strategy-view'>
            <div className='autotrader-card'>
                <div className='autotrader-card__header'>
                    <span className='autotrader-card__title'>
                        {is_differs ? 'Differs Cold Digit Analysis (<10% Target)' : 'Matches Hot Digit Power (High Frequency)'}
                    </span>
                    <span className='autotrader-card__badge'>500 Ticks Scope</span>
                </div>

                <div className='autotrader-digit-highlight-grid'>
                    {/* Coldest Digit Card */}
                    <div className='autotrader-stat-box autotrader-stat-box--cold'>
                        <span className='autotrader-stat-box__label'>COLDEST DIGIT (Least Frequent)</span>
                        <div className='autotrader-stat-box__number-row'>
                            <span className='autotrader-stat-box__big-digit text-red'>{coldest_digit}</span>
                            <span className='autotrader-stat-box__pct'>{cold_pct}% Frequency</span>
                        </div>
                        <span className='autotrader-stat-box__desc'>
                            {cold_pct < 10
                                ? `Drops ${(10 - cold_pct).toFixed(1)}% below mathematical average`
                                : 'Near theoretical equilibrium'}
                        </span>
                    </div>

                    {/* Hottest Digit Card */}
                    <div className='autotrader-stat-box autotrader-stat-box--hot'>
                        <span className='autotrader-stat-box__label'>HOTTEST DIGIT (Most Frequent)</span>
                        <div className='autotrader-stat-box__number-row'>
                            <span className='autotrader-stat-box__big-digit text-emerald'>{hottest_digit}</span>
                            <span className='autotrader-stat-box__pct'>{hot_pct}% Frequency</span>
                        </div>
                        <span className='autotrader-stat-box__desc'>
                            {hot_pct > 10
                                ? `Exceeds average by +${(hot_pct - 10).toFixed(1)}% recurring momentum`
                                : 'Neutral state'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Signal Box */}
            <div className={clsx('autotrader-signal-card', {
                'autotrader-signal-card--strong': is_strong,
            })}>
                <div className='autotrader-signal-card__header'>
                    <span className='autotrader-signal-card__tag'>
                        {is_strong ? 'HIGH PROBABILITY SIGNAL' : 'FAIR PROBABILITY'}
                    </span>
                    <span className='autotrader-signal-card__market'>{market.display_name}</span>
                </div>

                <div className='autotrader-signal-card__body'>
                    <div className='autotrader-signal-card__metric'>
                        <span className='autotrader-signal-card__label'>Action</span>
                        <span className='autotrader-signal-card__val text-emerald'>
                            {is_differs ? `BUY DIFFERS ON DIGIT ${coldest_digit}` : `BUY MATCHES ON DIGIT ${hottest_digit}`}
                        </span>
                    </div>

                    <div className='autotrader-signal-card__metric'>
                        <span className='autotrader-signal-card__label'>Expected Edge</span>
                        <span className='autotrader-signal-card__val'>{target_pct}%</span>
                    </div>
                </div>

                <button
                    type='button'
                    className='autotrader-btn autotrader-btn--primary autotrader-btn--block'
                    onClick={() =>
                        onApplySignal?.({
                            contract_type: is_differs ? 'DIGITDIFF' : 'DIGITMATCH',
                            barrier: target_digit,
                            ticks: 1,
                        })
                    }
                >
                    Apply {is_differs ? `Differs (${coldest_digit})` : `Matches (${hottest_digit})`} Signal to Console
                </button>
            </div>
        </div>
    );
};

export default DiffersMatchesStrategy;
