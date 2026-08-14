import React from 'react';
import clsx from 'clsx';

type TLastSevenDigitsCardsProps = {
    digits: number[];
    hottest_digit?: number;
    coldest_digit?: number;
};

const LastSevenDigitsCards = ({ digits = [], hottest_digit, coldest_digit }: TLastSevenDigitsCardsProps) => {
    const last_7 = digits.slice(-7);

    return (
        <div className='autotrader-seven-digits autotrader-card'>
            <div className='autotrader-card__header'>
                <span className='autotrader-card__title'>Recent 7 Digits Stream</span>
                <span className='autotrader-card__sub'>Live incoming tick sequence</span>
            </div>

            <div className='autotrader-seven-digits__grid'>
                {last_7.map((digit, index) => {
                    const is_latest = index === last_7.length - 1;
                    const is_under = digit <= 4;
                    const is_even = digit % 2 === 0;
                    const is_hot = digit === hottest_digit;
                    const is_cold = digit === coldest_digit;

                    return (
                        <div
                            key={index}
                            className={clsx('autotrader-digit-card', {
                                'autotrader-digit-card--latest': is_latest,
                                'autotrader-digit-card--hot': is_hot,
                                'autotrader-digit-card--cold': is_cold,
                                'autotrader-digit-card--under': is_under,
                                'autotrader-digit-card--over': !is_under,
                            })}
                        >
                            <span className='autotrader-digit-card__tick-label'>
                                {is_latest ? 'NOW' : `T-${last_7.length - 1 - index}`}
                            </span>
                            <span className='autotrader-digit-card__number'>{digit}</span>
                            <div className='autotrader-digit-card__tags'>
                                <span className={clsx('autotrader-tag', is_under ? 'autotrader-tag--under' : 'autotrader-tag--over')}>
                                    {is_under ? 'U' : 'O'}
                                </span>
                                <span className={clsx('autotrader-tag', is_even ? 'autotrader-tag--even' : 'autotrader-tag--odd')}>
                                    {is_even ? 'E' : 'D'}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default LastSevenDigitsCards;
