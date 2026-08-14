import React from 'react';
import clsx from 'clsx';
import { TMarketInfo } from '../../Types';

type TRiseFallStrategyProps = {
    market: TMarketInfo;
    onApplySignal?: (signal: { contract_type: string; barrier: number; ticks: number }) => void;
};

const RiseFallStrategy = ({ market, onApplySignal }: TRiseFallStrategyProps) => {
    const { rise_percentage, fall_percentage } = market;
    const directional_deviation = Math.abs(rise_percentage - fall_percentage);
    const is_trend_triggered = directional_deviation >= 8;

    const trend_side = rise_percentage > fall_percentage ? 'CALL' : 'PUT';

    return (
        <div className='autotrader-strategy-view'>
            <div className='autotrader-card'>
                <div className='autotrader-card__header'>
                    <span className='autotrader-card__title'>Tick-by-Tick Directional Velocity</span>
                    <span className='autotrader-card__badge'>Trigger: ≥8% Deviation</span>
                </div>

                <div className='autotrader-power-meter'>
                    {/* Rise */}
                    <div
                        className={clsx('autotrader-power-meter__side', {
                            'autotrader-power-meter__side--glowing': rise_percentage >= 54,
                            'autotrader-power-meter__side--super-glowing': rise_percentage >= 58,
                        })}
                    >
                        <div className='autotrader-power-meter__header'>
                            <span className='autotrader-power-meter__label'>RISE (Price Up)</span>
                            <span className='autotrader-power-meter__val'>{rise_percentage}%</span>
                        </div>
                        <div className='autotrader-power-meter__bar-track'>
                            <div
                                className='autotrader-power-meter__bar-fill autotrader-power-meter__bar-fill--under'
                                style={{ width: `${rise_percentage}%` }}
                            />
                        </div>
                    </div>

                    {/* Fall */}
                    <div
                        className={clsx('autotrader-power-meter__side', {
                            'autotrader-power-meter__side--glowing': fall_percentage >= 54,
                            'autotrader-power-meter__side--super-glowing': fall_percentage >= 58,
                        })}
                    >
                        <div className='autotrader-power-meter__header'>
                            <span className='autotrader-power-meter__label'>FALL (Price Down)</span>
                            <span className='autotrader-power-meter__val'>{fall_percentage}%</span>
                        </div>
                        <div className='autotrader-power-meter__bar-track'>
                            <div
                                className='autotrader-power-meter__bar-fill autotrader-power-meter__bar-fill--over'
                                style={{ width: `${fall_percentage}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Signal Box */}
            <div className={clsx('autotrader-signal-card', {
                'autotrader-signal-card--strong': is_trend_triggered,
            })}>
                <div className='autotrader-signal-card__header'>
                    <span className='autotrader-signal-card__tag'>
                        {is_trend_triggered ? `TREND CONFIRMED (+${directional_deviation.toFixed(1)}%)` : 'CHOPPY / SCANNING'}
                    </span>
                    <span className='autotrader-signal-card__market'>{market.display_name}</span>
                </div>

                <div className='autotrader-signal-card__body'>
                    <div className='autotrader-signal-card__metric'>
                        <span className='autotrader-signal-card__label'>Action</span>
                        <span className='autotrader-signal-card__val text-emerald'>
                            {is_trend_triggered ? `BUY ${trend_side === 'CALL' ? 'RISE' : 'FALL'}` : 'WAIT FOR TREND'}
                        </span>
                    </div>

                    <div className='autotrader-signal-card__metric'>
                        <span className='autotrader-signal-card__label'>Velocity Power</span>
                        <span className='autotrader-signal-card__val'>{Math.max(rise_percentage, fall_percentage)}%</span>
                    </div>
                </div>

                {is_trend_triggered && (
                    <button
                        type='button'
                        className='autotrader-btn autotrader-btn--primary autotrader-btn--block'
                        onClick={() =>
                            onApplySignal?.({
                                contract_type: trend_side,
                                barrier: 0,
                                ticks: 5,
                            })
                        }
                    >
                        Apply {trend_side === 'CALL' ? 'Rise' : 'Fall'} Signal to Console
                    </button>
                )}
            </div>
        </div>
    );
};

export default RiseFallStrategy;
