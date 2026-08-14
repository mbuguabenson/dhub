import React from 'react';

type TLastDigitLineGraphProps = {
    digits: number[];
    hottest_digit?: number;
    coldest_digit?: number;
};

const LastDigitLineGraph = ({ digits = [], hottest_digit, coldest_digit }: TLastDigitLineGraphProps) => {
    const displayed_digits = digits.slice(-30);
    const width = 600;
    const height = 140;
    const padding = 20;

    if (displayed_digits.length < 2) {
        return (
            <div className='autotrader-line-graph autotrader-card autotrader-card--empty'>
                <div className='autotrader-card__title'>Last Digit Movement Chart</div>
                <div className='autotrader-card__sub'>Waiting for live tick stream...</div>
            </div>
        );
    }

    const points = displayed_digits.map((digit, idx) => {
        const x = padding + (idx / (displayed_digits.length - 1)) * (width - 2 * padding);
        const y = height - padding - (digit / 9) * (height - 2 * padding);
        return { x, y, digit };
    });

    const pathString = points.reduce((acc, point, idx) => {
        return idx === 0 ? `M ${point.x} ${point.y}` : `${acc} L ${point.x} ${point.y}`;
    }, '');

    return (
        <div className='autotrader-line-graph autotrader-card'>
            <div className='autotrader-card__header'>
                <span className='autotrader-card__title'>Last Digit Trend Line</span>
                <span className='autotrader-card__badge'>Last {displayed_digits.length} Ticks</span>
            </div>
            <div className='autotrader-line-graph__canvas-wrapper'>
                <svg viewBox={`0 0 ${width} ${height}`} className='autotrader-line-graph__svg'>
                    <defs>
                        <linearGradient id='lineGradient' x1='0%' y1='0%' x2='100%' y2='0%'>
                            <stop offset='0%' stopColor='#3B82F6' />
                            <stop offset='50%' stopColor='#10B981' />
                            <stop offset='100%' stopColor='#8B5CF6' />
                        </linearGradient>
                    </defs>

                    {/* Horizontal Grid lines 0 to 9 */}
                    {[0, 3, 6, 9].map(d => {
                        const y = height - padding - (d / 9) * (height - 2 * padding);
                        return (
                            <g key={d} opacity='0.25'>
                                <line x1={padding} y1={y} x2={width - padding} y2={y} stroke='currentColor' strokeDasharray='3,3' />
                                <text x={padding - 6} y={y + 3} fontSize='10' fill='currentColor' textAnchor='end'>
                                    {d}
                                </text>
                            </g>
                        );
                    })}

                    {/* Trend line */}
                    <path
                        d={pathString}
                        fill='none'
                        stroke='url(#lineGradient)'
                        strokeWidth='2.5'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                    />

                    {/* Data Points */}
                    {points.map((pt, idx) => {
                        const is_latest = idx === points.length - 1;
                        const is_hot = pt.digit === hottest_digit;
                        const is_cold = pt.digit === coldest_digit;
                        const fill = is_hot ? '#10B981' : is_cold ? '#EF4444' : is_latest ? '#3B82F6' : '#94A3B8';

                        return (
                            <g key={idx}>
                                <circle
                                    cx={pt.x}
                                    cy={pt.y}
                                    r={is_latest ? 5 : 3.5}
                                    fill={fill}
                                    stroke='#1E293B'
                                    strokeWidth='1.5'
                                />
                                {is_latest && (
                                    <circle
                                        cx={pt.x}
                                        cy={pt.y}
                                        r='8'
                                        fill='none'
                                        stroke='#3B82F6'
                                        strokeWidth='1.5'
                                        opacity='0.6'
                                        className='autotrader-pulse'
                                    />
                                )}
                            </g>
                        );
                    })}
                </svg>
            </div>
        </div>
    );
};

export default LastDigitLineGraph;
