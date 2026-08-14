import React from 'react';
import classNames from 'classnames';

type TLastDigitStat = {
    is_max: boolean | null;
    is_min: boolean | null;
    is_selected?: boolean;
    percentage: number | null;
};

const LastDigitStat = ({ is_max, is_min, is_selected, percentage }: TLastDigitStat) => {
    // interpolate color opacity within 7.5 to 12.5 range
    let opacity = ((percentage ?? 0) - 10) / 4;
    opacity = Math.min(Math.max(opacity, -1), +1);
    opacity = ((opacity + 1) / 2) * 0.85 + 0.15;
    const w = 339.292;
    let p = (20 * (percentage ?? 0) - 102) / 3 / 100;
    p = Math.max(Math.min(p, 0.66), 0.06);

    const gradient_id = `digit_gradient_${is_max ? 'max' : is_min ? 'min' : is_selected ? 'selected' : 'default'}`;

    return (
        <div
            className={classNames('digits__pie-container', {
                'digits__pie-container--selected': is_selected,
                'digits__pie-container--max': is_max,
                'digits__pie-container--min': is_min,
            })}
        >
            <svg className='digits__pie-progress' width='120' height='120' viewBox='0 0 120 120'>
                <defs>
                    <linearGradient id='gradient-max' x1='0%' y1='0%' x2='100%' y2='100%'>
                        <stop offset='0%' stopColor='#10B981' />
                        <stop offset='100%' stopColor='#059669' />
                    </linearGradient>
                    <linearGradient id='gradient-min' x1='0%' y1='0%' x2='100%' y2='100%'>
                        <stop offset='0%' stopColor='#EF4444' />
                        <stop offset='100%' stopColor='#DC2626' />
                    </linearGradient>
                    <linearGradient id='gradient-selected' x1='0%' y1='0%' x2='100%' y2='100%'>
                        <stop offset='0%' stopColor='#3B82F6' />
                        <stop offset='100%' stopColor='#1D4ED8' />
                    </linearGradient>
                    <linearGradient id='gradient-default' x1='0%' y1='0%' x2='100%' y2='100%'>
                        <stop offset='0%' stopColor='var(--brand-primary, #118e1c)' />
                        <stop offset='100%' stopColor='var(--brand-secondary, #85acb0)' />
                    </linearGradient>
                </defs>
                <circle
                    className='progress__bg'
                    cx='60'
                    cy='60'
                    r='54'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='10'
                    data-testid='dt_progress_bg'
                />
                {percentage !== null && percentage !== undefined && (
                    <circle
                        className={classNames('progress__value', {
                            'progress__value--is-max': is_max,
                            'progress__value--is-min': is_min,
                            'progress__value--is-selected': is_selected,
                        })}
                        cx='60'
                        cy='60'
                        r='54'
                        fill='none'
                        stroke={
                            is_max
                                ? 'url(#gradient-max)'
                                : is_min
                                  ? 'url(#gradient-min)'
                                  : is_selected
                                    ? 'url(#gradient-selected)'
                                    : 'url(#gradient-default)'
                        }
                        strokeOpacity={is_max || is_min || is_selected ? 1 : opacity}
                        strokeWidth='10'
                        strokeLinecap='round'
                        strokeDasharray={[w * p, w * (1 - p)].join(' ')}
                        strokeDashoffset={w * ((p + 1) / 2)}
                        data-testid='dt_progress_value'
                    />
                )}
            </svg>
        </div>
    );
};

export default LastDigitStat;
