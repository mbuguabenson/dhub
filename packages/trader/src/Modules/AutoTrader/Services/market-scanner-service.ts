import { WS } from '@deriv/shared';
import { TMarketInfo } from '../Types';

export const VOLATILITY_MARKETS = [
    { symbol: '1HZ100V', display_name: 'Volatility 100 (1s) Index' },
    { symbol: '1HZ10V', display_name: 'Volatility 10 (1s) Index' },
    { symbol: '1HZ25V', display_name: 'Volatility 25 (1s) Index' },
    { symbol: '1HZ50V', display_name: 'Volatility 50 (1s) Index' },
    { symbol: '1HZ75V', display_name: 'Volatility 75 (1s) Index' },
    { symbol: 'R_100', display_name: 'Volatility 100 Index' },
    { symbol: 'R_50', display_name: 'Volatility 50 Index' },
    { symbol: 'R_75', display_name: 'Volatility 75 Index' },
    { symbol: 'R_25', display_name: 'Volatility 25 Index' },
    { symbol: 'R_10', display_name: 'Volatility 10 Index' },
];

export class MarketScannerService {
    private subscribers: Map<string, string> = new Map(); // symbol -> stream_id
    private market_data: Map<string, { quotes: number[]; pip_size: number }> = new Map();
    private listeners: Set<(markets: TMarketInfo[]) => void> = new Set();
    private is_scanning = false;

    public subscribe(listener: (markets: TMarketInfo[]) => void) {
        this.listeners.add(listener);
        if (!this.is_scanning) {
            this.startScanning();
        } else {
            listener(this.getAllMarketInfo());
        }
        return () => {
            this.listeners.delete(listener);
            if (this.listeners.size === 0) {
                this.stopScanning();
            }
        };
    }

    public startScanning() {
        if (this.is_scanning) return;
        this.is_scanning = true;

        VOLATILITY_MARKETS.forEach(({ symbol }) => {
            try {
                const subscriber = WS.subscribeTicksHistory(
                    {
                        ticks_history: symbol,
                        count: 500,
                        end: 'latest',
                        style: 'ticks',
                        subscribe: 1,
                    },
                    (response: any) => {
                        this.handleTickResponse(symbol, response);
                    }
                );

                if (subscriber && typeof subscriber.then === 'function') {
                    subscriber.then((sub: any) => {
                        if (sub?.subscription?.id) {
                            this.subscribers.set(symbol, sub.subscription.id);
                        }
                    });
                }
            } catch (err) {
                console.warn(`[MarketScanner] Failed to subscribe to ${symbol}:`, err);
            }
        });
    }

    public stopScanning() {
        this.is_scanning = false;
        this.subscribers.forEach(stream_id => {
            try {
                WS.forgetStream(stream_id);
            } catch (e) {
                // ignore
            }
        });
        this.subscribers.clear();
        this.market_data.clear();
    }

    private handleTickResponse(symbol: string, response: any) {
        if (response.history?.prices) {
            const pip_size = response.pip_size || 2;
            const quotes = response.history.prices.map((p: string | number) => Number(p));
            this.market_data.set(symbol, { quotes, pip_size });
            this.notifyListeners();
        } else if (response.tick) {
            const current = this.market_data.get(symbol) || { quotes: [], pip_size: response.tick.pip_size || 2 };
            const next_quotes = [...current.quotes, Number(response.tick.quote)].slice(-500);
            this.market_data.set(symbol, { quotes: next_quotes, pip_size: response.tick.pip_size || current.pip_size });
            this.notifyListeners();
        }
    }

    public analyzeMarket(symbol: string): TMarketInfo {
        const market_info = VOLATILITY_MARKETS.find(m => m.symbol === symbol) || {
            symbol,
            display_name: symbol,
        };
        const data = this.market_data.get(symbol);
        const quotes = data?.quotes || [];
        const pip_size = data?.pip_size || 2;

        if (quotes.length === 0) {
            return {
                symbol,
                display_name: market_info.display_name,
                power: 50,
                is_safe: false,
                under_percentage: 50,
                over_percentage: 50,
                even_percentage: 50,
                odd_percentage: 50,
                rise_percentage: 50,
                fall_percentage: 50,
                hottest_digit: 0,
                coldest_digit: 0,
                last_digits: [],
            };
        }

        // Extract last digits
        const last_digits = quotes.map(q => {
            const formatted = q.toFixed(pip_size);
            return parseInt(formatted.slice(-1), 10);
        });

        // Compute Digit Frequencies (0-9)
        const digit_counts = Array(10).fill(0);
        last_digits.forEach(d => {
            if (!isNaN(d) && d >= 0 && d <= 9) digit_counts[d]++;
        });

        const total_ticks = last_digits.length || 1;
        let under_count = 0; // 0-4
        let over_count = 0; // 5-9
        let even_count = 0;
        let odd_count = 0;

        last_digits.forEach(d => {
            if (d <= 4) under_count++;
            else over_count++;

            if (d % 2 === 0) even_count++;
            else odd_count++;
        });

        const under_percentage = parseFloat(((under_count / total_ticks) * 100).toFixed(1));
        const over_percentage = parseFloat(((over_count / total_ticks) * 100).toFixed(1));
        const even_percentage = parseFloat(((even_count / total_ticks) * 100).toFixed(1));
        const odd_percentage = parseFloat(((odd_count / total_ticks) * 100).toFixed(1));

        // Rise / Fall analysis from consecutive price delta
        let rise_count = 0;
        let fall_count = 0;
        for (let i = 1; i < quotes.length; i++) {
            if (quotes[i] > quotes[i - 1]) rise_count++;
            else if (quotes[i] < quotes[i - 1]) fall_count++;
        }
        const delta_total = rise_count + fall_count || 1;
        const rise_percentage = parseFloat(((rise_count / delta_total) * 100).toFixed(1));
        const fall_percentage = parseFloat(((fall_count / delta_total) * 100).toFixed(1));

        // Hottest & Coldest Digits
        let hottest_digit = 0;
        let coldest_digit = 0;
        let max_count = -1;
        let min_count = Infinity;

        digit_counts.forEach((count, d) => {
            if (count > max_count) {
                max_count = count;
                hottest_digit = d;
            }
            if (count < min_count) {
                min_count = count;
                coldest_digit = d;
            }
        });

        // Market Power Score (0-100%)
        const max_dominance = Math.max(
            Math.abs(under_percentage - 50),
            Math.abs(even_percentage - 50),
            Math.abs(rise_percentage - 50)
        );
        const power = Math.min(100, Math.round(50 + max_dominance * 3.5));
        const is_safe = power >= 65; // Clear dominant trend zone

        // Generate Suggested Signal
        let signal: TMarketInfo['signal'] = undefined;
        if (under_percentage >= 55) {
            signal = {
                action: 'UNDER',
                prediction: 5,
                strength: under_percentage,
                entry_point: hottest_digit <= 4 ? hottest_digit : 4,
                suggested_ticks: 1,
                reason: `Strong Under dominance (${under_percentage}%) with high frequency on digit ${hottest_digit}`,
            };
        } else if (over_percentage >= 55) {
            signal = {
                action: 'OVER',
                prediction: 4,
                strength: over_percentage,
                entry_point: hottest_digit >= 5 ? hottest_digit : 5,
                suggested_ticks: 1,
                reason: `Strong Over dominance (${over_percentage}%) with high frequency on digit ${hottest_digit}`,
            };
        } else if (even_percentage >= 57) {
            signal = {
                action: 'EVEN',
                strength: even_percentage,
                suggested_ticks: 1,
                reason: `Even dominance (${even_percentage}%) with +${(even_percentage - odd_percentage).toFixed(1)}% deviation`,
            };
        } else if (odd_percentage >= 57) {
            signal = {
                action: 'ODD',
                strength: odd_percentage,
                suggested_ticks: 1,
                reason: `Odd dominance (${odd_percentage}%) with +${(odd_percentage - even_percentage).toFixed(1)}% deviation`,
            };
        }

        return {
            symbol,
            display_name: market_info.display_name,
            power,
            is_safe,
            under_percentage,
            over_percentage,
            even_percentage,
            odd_percentage,
            rise_percentage,
            fall_percentage,
            hottest_digit,
            coldest_digit,
            last_digits: last_digits.slice(-60),
            latest_quote: quotes[quotes.length - 1],
            latest_tick: last_digits[last_digits.length - 1],
            signal,
        };
    }

    public getAllMarketInfo(): TMarketInfo[] {
        return VOLATILITY_MARKETS.map(m => this.analyzeMarket(m.symbol));
    }

    private notifyListeners() {
        const markets = this.getAllMarketInfo();
        this.listeners.forEach(cb => cb(markets));
    }
}

export const marketScanner = new MarketScannerService();
