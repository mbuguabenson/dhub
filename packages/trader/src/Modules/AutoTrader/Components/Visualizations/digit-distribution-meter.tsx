import React from 'react';
import clsx from 'clsx';

type TDigitDistributionMeterProps = {
    digits: number[];
    hottest_digit?: number;
    coldest_digit?: number;
    onSelectDigit?: (digit: number) => void;
    selected_digit?: number;
};

const DigitDistributionMeter = ({
    digits = [],
    hottest_digit,
    coldest_digit,
    onSelectDigit,
    selected_digit,
}: TDigitDistributionMeterProps) => {
    // Calculate frequencies 0-9
    const counts = Array(10).fill(0);
    digits.forEach(d => {
        if (!isNaN(d) && d >= 0 && d <= 9) counts[d]++;
    });

    const total = digits.length || 1;
    const stats = counts.map(c => parseFloat(((c / total) * 100).toFixed(1)));
    const max_stat = Math.max(...stats);
    const min_stat = Math.min(...stats);

    const radius = 18;
    const circumference = 2 * Math.PI * radius;

    return (
        <div className='autotrader-distribution autotrader-card'>
            <div className='autotrader-card__header'>
                <span className='autotrader-card__title'>Digit Distribution Gauges (0 - 9)</span>
                <span className='autotrader-card__badge'>500 Ticks Analytics</span>
            </div>

            <div className='autotrader-distribution__grid'>
                {Array.from({ length: 10 }).map((_, digit) => {
                    const percentage = stats[digit] || 0;
                    const is_max = percentage === max_stat && max_stat > 0;
                    const is_min = percentage === min_stat && min_stat > 0;
                    const is_active = selected_digit === digit;

                    const progress = Math.min(Math.max((percentage - 5) / 10, 0.1), 1);
                    const strokeDashoffset = circumference - progress * circumference;
                    const strokeColor = is_max ? '#10B981' : is_min ? '#EF4444' : is_active ? '#3B82F6' : 'rgba(128, 128, 128, 0.3)';

                    return (
                        <div
                            key={digit}
                            className={clsx('autotrader-gauge-bubble', {
                                'autotrader-gauge-bubble--max': is_max,
                                'autotrader-gauge-bubble--min': is_min,
                                'autotrader-gauge-bubble--active': is_active,
                            })}
                            onClick={() => onSelectDigit?.(digit)}
                        >
                            <div className='autotrader-gauge-bubble__ring-container'>
                                <svg width='44' height='44' viewBox='0 0 44 44'>
                                    <circle
                                        cx='22'
                                        cy='22'
                                        r={radius}
                                        fill='none'
                                        stroke='rgba(128, 128, 128, 0.15)'
                                        strokeWidth='3'
                                    />
                                    <circle
                                        cx='22'
                                        cy='22'
                                        r={radius}
                                        fill='none'
                                        stroke={strokeColor}
                                        strokeWidth='3.5'
                                        strokeDasharray={circumference}
                                        strokeDashoffset={strokeDashoffset}
                                        strokeLinecap='round'
                                        style={{
                                            transform: 'rotate(-90deg)',
                                            transformOrigin: 'center',
                                            transition: 'stroke-dashoffset 0.3s ease',
                                        }}
                                    />
                                </svg>
                                <span className='autotrader-gauge-bubble__digit'>{digit}</span>
                            </div>
                            <span
                                className={clsx('autotrader-gauge-bubble__pct', {
                                    'autotrader-gauge-bubble__pct--max': is_max,
                                    'autotrader-gauge-bubble__pct--min': is_min,
                                })}
                            >
                                {percentage}%
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default DigitDistributionMeter;
