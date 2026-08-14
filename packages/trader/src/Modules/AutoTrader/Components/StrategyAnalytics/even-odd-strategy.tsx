import React from 'react';
import clsx from 'clsx';
import { TMarketInfo } from '../../Types';

type TEvenOddStrategyProps = {
    market: TMarketInfo;
    onApplySignal?: (signal: { contract_type: string; barrier: number; ticks: number }) => void;
};

const EvenOddStrategy = ({ market, onApplySignal }: TEvenOddStrategyProps) => {
    const { even_percentage, odd_percentage } = market;
    const deviation = Math.abs(even_percentage - odd_percentage);
    const is_signal_triggered = deviation >= 7;

    const dominant_side = even_percentage > odd_percentage ? 'DIGITEVEN' : 'DIGITODD';
    const dominant_pct = Math.max(even_percentage, odd_percentage);

    return (
        <div className='autotrader-strategy-view'>
            <div className='autotrader-card'>
                <div className='autotrader-card__header'>
                    <span className='autotrader-card__title'>Even / Odd Parity Meter</span>
                    <span className='autotrader-card__badge'>Trigger: ≥7% Deviation</span>
                </div>

                <div className='autotrader-power-meter'>
                    {/* Even Side */}
                    <div
                        className={clsx('autotrader-power-meter__side', {
                            'autotrader-power-meter__side--glowing': even_percentage >= 54,
                            'autotrader-power-meter__side--super-glowing': even_percentage >= 57,
                        })}
                    >
                        <div className='autotrader-power-meter__header'>
                            <span className='autotrader-power-meter__label'>EVEN (0,2,4,6,8)</span>
                            <span className='autotrader-power-meter__val'>{even_percentage}%</span>
                        </div>
                        <div className='autotrader-power-meter__bar-track'>
                            <div
                                className='autotrader-power-meter__bar-fill autotrader-power-meter__bar-fill--even'
                                style={{ width: `${even_percentage}%` }}
                            />
                        </div>
                    </div>

                    {/* Odd Side */}
                    <div
                        className={clsx('autotrader-power-meter__side', {
                            'autotrader-power-meter__side--glowing': odd_percentage >= 54,
                            'autotrader-power-meter__side--super-glowing': odd_percentage >= 57,
                        })}
                    >
                        <div className='autotrader-power-meter__header'>
                            <span className='autotrader-power-meter__label'>ODD (1,3,5,7,9)</span>
                            <span className='autotrader-power-meter__val'>{odd_percentage}%</span>
                        </div>
                        <div className='autotrader-power-meter__bar-track'>
                            <div
                                className='autotrader-power-meter__bar-fill autotrader-power-meter__bar-fill--odd'
                                style={{ width: `${odd_percentage}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Signal Box */}
            <div className={clsx('autotrader-signal-card', {
                'autotrader-signal-card--strong': is_signal_triggered,
            })}>
                <div className='autotrader-signal-card__header'>
                    <span className='autotrader-signal-card__tag'>
                        {is_signal_triggered ? `DEVIATION TRIGGERED (+${deviation.toFixed(1)}%)` : 'SCANNING (DEVIATION < 7%)'}
                    </span>
                    <span className='autotrader-signal-card__market'>{market.display_name}</span>
                </div>

                <div className='autotrader-signal-card__body'>
                    <div className='autotrader-signal-card__metric'>
                        <span className='autotrader-signal-card__label'>Action</span>
                        <span className='autotrader-signal-card__val text-emerald'>
                            {is_signal_triggered ? `BUY ${dominant_side === 'DIGITEVEN' ? 'EVEN' : 'ODD'}` : 'WAIT FOR DEVIATION'}
                        </span>
                    </div>

                    <div className='autotrader-signal-card__metric'>
                        <span className='autotrader-signal-card__label'>Dominance Score</span>
                        <span className='autotrader-signal-card__val'>{dominant_pct}%</span>
                    </div>
                </div>

                {is_signal_triggered && (
                    <button
                        type='button'
                        className='autotrader-btn autotrader-btn--primary autotrader-btn--block'
                        onClick={() =>
                            onApplySignal?.({
                                contract_type: dominant_side,
                                barrier: 0,
                                ticks: 1,
                            })
                        }
                    >
                        Apply {dominant_side === 'DIGITEVEN' ? 'Even' : 'Odd'} Signal to Console
                    </button>
                )}
            </div>
        </div>
    );
};

export default EvenOddStrategy;
