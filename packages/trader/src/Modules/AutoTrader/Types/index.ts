export type TStrategyType =
    | 'over_under'
    | 'even_odd'
    | 'differs'
    | 'matches'
    | 'accumulators'
    | 'rise_fall'
    | 'high_low';

export type TMarketInfo = {
    symbol: string;
    display_name: string;
    power: number; // 0 to 100
    is_safe: boolean; // Safe zone vs Bad/Choppy zone
    under_percentage: number;
    over_percentage: number;
    even_percentage: number;
    odd_percentage: number;
    rise_percentage: number;
    fall_percentage: number;
    hottest_digit: number;
    coldest_digit: number;
    last_digits: number[];
    latest_quote?: number;
    latest_tick?: number;
    signal?: {
        action: string;
        prediction?: number | string;
        strength: number; // %
        entry_point?: number;
        suggested_ticks: number;
        reason: string;
    };
};

export type TTradeLog = {
    id: string;
    timestamp: number;
    symbol: string;
    strategy: string;
    contract_type: string;
    barrier?: number | string;
    stake: number;
    profit: number;
    status: 'won' | 'lost' | 'pending';
    entry_spot?: number;
    exit_spot?: number;
};

export type TTradeSummary = {
    total_runs: number;
    wins: number;
    losses: number;
    win_rate: number;
    total_stake: number;
    total_profit: number;
};
