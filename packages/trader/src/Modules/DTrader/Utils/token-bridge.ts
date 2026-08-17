/**
 * token-bridge.ts
 *
 * Utility for resolving active Deriv login tokens and account lists
 * from localStorage/sessionStorage for the embedded DTrader iframe.
 */

export const isInvalidBearerToken = (token: string | null | undefined): boolean =>
    !token || token === 'null' || token === 'undefined' || token.startsWith('ory_at_');

/** Returns the map of account ID to token from all available storage sources */
export const getAccountsList = (): Record<string, string> => {
    const map: Record<string, string> = {};

    try {
        // 1. Check client.accounts / clientAccounts
        const rawClientAccounts = localStorage.getItem('client.accounts') || localStorage.getItem('clientAccounts');
        if (rawClientAccounts) {
            const parsed = JSON.parse(rawClientAccounts);
            if (parsed && typeof parsed === 'object') {
                for (const k in parsed) {
                    const token = parsed[k]?.token || (typeof parsed[k] === 'string' ? parsed[k] : '');
                    if (token && !isInvalidBearerToken(token)) {
                        map[k] = token;
                    }
                }
            }
        }

        // 2. Check accountsList
        const rawAccountsList = localStorage.getItem('accountsList');
        if (rawAccountsList) {
            const parsed = JSON.parse(rawAccountsList);
            if (parsed && typeof parsed === 'object') {
                for (const k in parsed) {
                    if (parsed[k] && !isInvalidBearerToken(parsed[k])) {
                        map[k] = parsed[k];
                    }
                }
            }
        }

        // 3. Check deriv_accounts in session/local storage
        const rawDerivAccounts = sessionStorage.getItem('deriv_accounts') || localStorage.getItem('deriv_accounts');
        if (rawDerivAccounts) {
            const parsed = JSON.parse(rawDerivAccounts);
            if (Array.isArray(parsed)) {
                parsed.forEach((item: any) => {
                    const id = item?.account_id || item?.loginid;
                    const token = item?.token;
                    if (id && token && !isInvalidBearerToken(token)) {
                        map[id] = token;
                    }
                });
            }
        }

        // 4. Direct token fallback if mapped with active_loginid
        const activeId = localStorage.getItem('active_loginid') || localStorage.getItem('client.loginid');
        const directToken =
            localStorage.getItem('token') ||
            localStorage.getItem('active_token') ||
            localStorage.getItem('authToken') ||
            localStorage.getItem('token1') ||
            localStorage.getItem('deriv_api_token');
        if (activeId && directToken && !isInvalidBearerToken(directToken) && !map[activeId]) {
            map[activeId] = directToken;
        }
    } catch {
        // ignore JSON parse errors
    }

    return map;
};

/** Returns the active loginid (e.g. "CR123456" or "VRTC1234") */
export const getActiveLoginId = (): string =>
    localStorage.getItem('active_loginid') ||
    localStorage.getItem('client.loginid') ||
    '';

/** Synchronously checks if a valid token is available in storage or URL */
export const getActiveToken = (): string | null => {
    const list = getAccountsList();
    const id = getActiveLoginId();
    if (id && list[id] && !isInvalidBearerToken(list[id])) {
        return list[id];
    }
    for (const key in list) {
        if (!isInvalidBearerToken(list[key])) {
            return list[key];
        }
    }

    const storedToken =
        localStorage.getItem('token') ||
        localStorage.getItem('active_token') ||
        localStorage.getItem('authToken') ||
        localStorage.getItem('token1') ||
        localStorage.getItem('deriv_api_token') ||
        sessionStorage.getItem('token') ||
        sessionStorage.getItem('active_token') ||
        sessionStorage.getItem('token1');

    if (!isInvalidBearerToken(storedToken)) {
        return storedToken!;
    }
    return null;
};
