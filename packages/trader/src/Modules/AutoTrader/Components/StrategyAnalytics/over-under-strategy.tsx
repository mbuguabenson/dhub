import React from 'react';
import clsx from 'clsx';
import { TMarketInfo } from '../../Types';

type TOverUnderStrategyProps = {
    market: TMarketInfo;
    onApplySignal?: (signal: { contract_type: string; barrier: number; ticks: number }) => void;
};

const OverUnderStrategy = ({ market, onApplySignal }: TOverUnderStrategyProps) => {
    const { under_percentage, over_percentage, last_digits = [], hottest_digit, coldest_digit } = market;

    // Analyze Last 15 Ticks for Short-term Momentum
    const last_15 = last_digits.slice(-15);
    const last_15_under = last_15.filter(d => d <= 4).length;
    const last_15_over = last_15.filter(d => d >= 5).length;
    const last_15_under_pct = Math.round((last_15_under / (last_15.length || 1)) * 100);
    const last_15_over_pct = Math.round((last_15_over / (last_15.length || 1)) * 100);

    // Analyze Last 60 Ticks for Medium-term Guide
    const last_60 = last_digits.slice(-60);
    const last_60_under = last_60.filter(d => d <= 4).length;
    const last_60_under_pct = Math.round((last_60_under / (last_60.length || 1)) * 100);

    // Identify Highest Digit in Under (0-4) and in Over (5-9)
    const counts = Array(10).fill(0);
    last_digits.forEach(d => {
        if (!isNaN(d) && d >= 0 && d <= 9) counts[d]++;
    });

    let highest_under_digit = 0;
    let max_under_count = -1;
    for (let i = 0; i <= 4; i++) {
        if (counts[i] > max_under_count) {
            max_under_count = counts[i];
            highest_under_digit = i;
        }
    }

    let highest_over_digit = 5;
    let max_over_count = -1;
    for (let i = 5; i <= 9; i++) {
        if (counts[i] > max_over_count) {
            max_over_count = counts[i];
            highest_over_digit = i;
        }
    }

    // Disturbance Detection: Is opposite power rising in the last 7 ticks?
    const last_7 = last_digits.slice(-7);
    const is_under_dominant = under_percentage >= 55;
    const is_over_dominant = over_percentage >= 55;

    let has_disturbance_warning = false;
    let disturbance_message = '';
    let suggested_skip_ticks = 1;

    if (is_under_dominant) {
        const recent_over_spikes = last_7.filter(d => d >= 5).length;
        if (recent_over_spikes >= 3) {
            has_disturbance_warning = true;
            suggested_skip_ticks = Math.min(recent_over_spikes + 1, 5);
            disturbance_message = `Warning: Over digits (5-9) detected in last ${last_7.length} ticks. Skip ${suggested_skip_ticks} ticks to avoid reversal.`;
        }
    } else if (is_over_dominant) {
        const recent_under_spikes = last_7.filter(d => d <= 4).length;
        if (recent_under_spikes >= 3) {
            has_disturbance_warning = true;
            suggested_skip_ticks = Math.min(recent_under_spikes + 1, 5);
            disturbance_message = `Warning: Under digits (0-4) detected in last ${last_7.length} ticks. Skip ${suggested_skip_ticks} ticks to avoid reversal.`;
        }
    }

    // Signal Determination
    const has_strong_signal = under_percentage >= 60 || over_percentage >= 60;
    const has_moderate_signal = under_percentage >= 55 || over_percentage >= 55;

    const signal_action = under_percentage >= 55 ? 'DIGITUNDER' : over_percentage >= 55 ? 'DIGITOVER' : null;
    const signal_barrier = signal_action === 'DIGITUNDER' ? 5 : 4;
    const entry_point_digit = signal_action === 'DIGITUNDER' ? highest_under_digit : highest_over_digit;

    return (
        <div className='autotrader-strategy-view'>
            {/* Progress Bars for Under 0-4 vs Over 5-9 */}
            <div className='autotrader-card'>
                <div className='autotrader-card__header'>
                    <span className='autotrader-card__title'>Over / Under Dominance Meter</span>
                    <span className='autotrader-card__badge'>500 Ticks Scope</span>
                </div>

                <div className='autotrader-power-meter'>
                    {/* Under Section */}
                    <div
                        className={clsx('autotrader-power-meter__side', {
                            'autotrader-power-meter__side--glowing': under_percentage >= 55,
                            'autotrader-power-meter__side--super-glowing': under_percentage >= 60,
                        })}
                    >
                        <div className='autotrader-power-meter__header'>
                            <span className='autotrader-power-meter__label'>UNDER (0 - 4)</span>
                            <span className='autotrader-power-meter__val'>{under_percentage}%</span>
                        </div>
                        <div className='autotrader-power-meter__bar-track'>
                            <div
                                className='autotrader-power-meter__bar-fill autotrader-power-meter__bar-fill--under'
                                style={{ width: `${under_percentage}%` }}
                            />
                        </div>
                        <div className='autotrader-power-meter__footer'>
                            <span>Top Under Digit: <strong>{highest_under_digit}</strong></span>
                            <span>15T Momentum: <strong>{last_15_under_pct}%</strong></span>
                        </div>
                    </div>

                    {/* Over Section */}
                    <div
                        className={clsx('autotrader-power-meter__side', {
                            'autotrader-power-meter__side--glowing': over_percentage >= 55,
                            'autotrader-power-meter__side--super-glowing': over_percentage >= 60,
                        })}
                    >
                        <div className='autotrader-power-meter__header'>
                            <span className='autotrader-power-meter__label'>OVER (5 - 9)</span>
                            <span className='autotrader-power-meter__val'>{over_percentage}%</span>
                        </div>
                        <div className='autotrader-power-meter__bar-track'>
                            <div
                                className='autotrader-power-meter__bar-fill autotrader-power-meter__bar-fill--over'
                                style={{ width: `${over_percentage}%` }}
                            />
                        </div>
                        <div className='autotrader-power-meter__footer'>
                            <span>Top Over Digit: <strong>{highest_over_digit}</strong></span>
                            <span>15T Momentum: <strong>{last_15_over_pct}%</strong></span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Disturbance / Reversal Warning */}
            {has_disturbance_warning && (
                <div className='autotrader-alert autotrader-alert--warning'>
                    <div className='autotrader-alert__icon'>⚠️</div>
                    <div className='autotrader-alert__content'>
                        <div className='autotrader-alert__title'>Market Disturbance Detected</div>
                        <div className='autotrader-alert__desc'>{disturbance_message}</div>
                    </div>
                </div>
            )}

            {/* Suggestive Strategy Signal Card */}
            <div className={clsx('autotrader-signal-card', {
                'autotrader-signal-card--strong': has_strong_signal,
                'autotrader-signal-card--active': has_moderate_signal,
            })}>
                <div className='autotrader-signal-card__header'>
                    <span className='autotrader-signal-card__tag'>
                        {has_strong_signal ? 'STRONG SIGNAL (≥60%)' : has_moderate_signal ? 'VALID SIGNAL (≥55%)' : 'NEUTRAL / SCANNING'}
                    </span>
                    <span className='autotrader-signal-card__market'>{market.display_name}</span>
                </div>

                <div className='autotrader-signal-card__body'>
                    <div className='autotrader-signal-card__metric'>
                        <span className='autotrader-signal-card__label'>Action</span>
                        <span className={clsx('autotrader-signal-card__val', signal_action === 'DIGITUNDER' ? 'text-cyan' : 'text-purple')}>
                            {signal_action === 'DIGITUNDER' ? 'BUY UNDER 5' : signal_action === 'DIGITOVER' ? 'BUY OVER 4' : 'WAIT FOR TREND'}
                        </span>
                    </div>

                    <div className='autotrader-signal-card__metric'>
                        <span className='autotrader-signal-card__label'>Entry Trigger Digit</span>
                        <span className='autotrader-signal-card__val text-emerald'>
                            Spot ends with <strong>{entry_point_digit}</strong>
                        </span>
                    </div>

                    <div className='autotrader-signal-card__metric'>
                        <span className='autotrader-signal-card__label'>Suggested Ticks</span>
                        <span className='autotrader-signal-card__val'>{suggested_skip_ticks} Ticks</span>
                    </div>
                </div>

                {signal_action && (
                    <button
                        type='button'
                        className='autotrader-btn autotrader-btn--primary autotrader-btn--block'
                        onClick={() =>
                            onApplySignal?.({
                                contract_type: signal_action,
                                barrier: signal_barrier,
                                ticks: suggested_skip_ticks,
                            })
                        }
                    >
                        Apply Signal to Trading Console
                    </button>
                )}
            </div>
        </div>
    );
};

export default OverUnderStrategy;
