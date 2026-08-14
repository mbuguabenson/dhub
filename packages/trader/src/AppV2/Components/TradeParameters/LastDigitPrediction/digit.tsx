import React from 'react';
import clsx from 'clsx';
import { CaptionText, Skeleton, Text } from '@deriv-com/quill-ui';
import { useDevice } from '@deriv-com/ui';

type TDigitsProps = {
    is_active?: boolean;
    is_disabled?: boolean;
    is_max?: boolean;
    is_min?: boolean;
    digit: number;
    digit_stats: number[];
    onClick?: (digit: number) => void;
};

const Digit = ({ digit, digit_stats = [], is_active, is_disabled, is_max, is_min, onClick }: TDigitsProps) => {
    const { isDesktop } = useDevice();
    const stats = digit_stats.length ? digit_stats[digit] : null;
    const percentage = stats ? (stats * 100) / 1000 : null;
    const display_percentage = percentage && !isNaN(percentage) ? parseFloat(percentage.toFixed(1)) : null;

    if (digit === undefined || digit === null || isNaN(digit)) return null;

    // SVG Circular Progress math (radius = 20, circumference = 2 * PI * 20 ≈ 125.66)
    const radius = 20;
    const circumference = 2 * Math.PI * radius;
    // Map percentage (typically 5% to 15%) to progress arc length
    const progress = display_percentage ? Math.min(Math.max((display_percentage - 5) / 10, 0.1), 1) : 0;
    const strokeDashoffset = circumference - progress * circumference;

    const strokeColor = is_max ? '#10B981' : is_min ? '#EF4444' : is_active ? 'var(--brand-primary, #118e1c)' : 'rgba(128, 128, 128, 0.3)';

    return (
        <div
            key={digit}
            className={clsx('digit-bubble', {
                'digit-bubble--active': is_active,
                'digit-bubble--max': is_max,
                'digit-bubble--min': is_min,
                'digit-bubble--disabled': is_disabled,
            })}
        >
            <div className='digit-bubble__circle-wrapper'>
                {/* SVG Progress Ring */}
                <svg className='digit-bubble__ring' width='48' height='48' viewBox='0 0 48 48'>
                    <circle
                        className='digit-bubble__ring-bg'
                        cx='24'
                        cy='24'
                        r={radius}
                        fill='none'
                        stroke='currentColor'
                        strokeWidth='3'
                    />
                    {display_percentage !== null && (
                        <circle
                            className='digit-bubble__ring-val'
                            cx='24'
                            cy='24'
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
                                transition: 'stroke-dashoffset 0.4s ease, stroke 0.3s ease',
                            }}
                        />
                    )}
                </svg>

                {/* Center Circular Button */}
                <button
                    type='button'
                    className={clsx('digit-bubble__btn', is_active && 'active')}
                    disabled={is_disabled}
                    onClick={() => onClick?.(digit)}
                    name='last_digit'
                >
                    <Text
                        size={isDesktop ? 'md' : 'lg'}
                        bold
                        className='digit-bubble__number'
                    >
                        {digit}
                    </Text>
                </button>
            </div>

            {/* Percentage Badge */}
            {display_percentage !== null ? (
                <CaptionText
                    size='sm'
                    className={clsx(
                        'digit-bubble__percentage',
                        is_max && 'digit-bubble__percentage--max',
                        is_min && 'digit-bubble__percentage--min'
                    )}
                    data-testid='dt_digit_stats_percentage'
                >
                    {display_percentage}%
                </CaptionText>
            ) : (
                <Skeleton.Square width={32} height={12} rounded />
            )}
        </div>
    );
};

export default Digit;
