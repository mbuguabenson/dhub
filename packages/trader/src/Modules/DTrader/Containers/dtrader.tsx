import React, { useEffect, useState, useRef, useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import { getAppId } from '@deriv/shared';
import { useStore } from '@deriv/stores';
import { useTranslations } from '@deriv-com/translations';
import { getAccountsList, getActiveLoginId, getActiveToken } from '../Utils/token-bridge';
import './dtrader.scss';

const DTrader: React.FC = observer(() => {
    const { client, common } = useStore();
    const { currentLang } = useTranslations();
    const iframeRef = useRef<HTMLIFrameElement | null>(null);

    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [hasError, setHasError] = useState<boolean>(false);
    const [reloadKey, setReloadKey] = useState<number>(0);

    const activeLoginId = client?.loginid || getActiveLoginId();
    const authToken = getActiveToken() || '';
    const currency = client?.currency || 'USD';
    const isDemo = activeLoginId.startsWith('VR') || activeLoginId.startsWith('VRT') || activeLoginId.startsWith('DEM');

    const appId = String(getAppId() || '121856');
    const rawBaseUrl = process.env.DTRADER_URL || 'https://dtraderhub-mu.vercel.app';
    const baseUrl = rawBaseUrl.replace(/\/+$/, '');

    // Build URL query params for seamless authentication & terminal configuration
    const queryParams = new URLSearchParams({
        api_version: 'v2',
        chart_type: 'area',
        interval: '1t',
        symbol: '1HZ100V',
        trade_type: 'accumulator',
        app_id: appId,
        lang: currentLang || 'EN',
        theme: 'dark',
        hide_header_login: 'true',
        is_mobile_app: 'true',
    });

    if (activeLoginId) {
        queryParams.set('acct1', activeLoginId);
        queryParams.set('cur1', currency);
    }

    if (authToken && authToken !== 'a1-guest' && authToken !== 'dummy_token') {
        queryParams.set('token1', authToken);
    }

    // Populate all accounts so child iframe receives multi-account token mapping
    try {
        const accountsList = getAccountsList();
        let index = 1;
        for (const accId in accountsList) {
            const accToken = accountsList[accId];
            if (accToken && !accToken.startsWith('ory_at_')) {
                if (accId !== activeLoginId) {
                    index++;
                    queryParams.set(`acct${index}`, accId);
                    queryParams.set(`token${index}`, accToken);
                    queryParams.set(`cur${index}`, currency);
                }
            }
        }
    } catch {
        // ignore
    }

    const embedUrl = `${baseUrl}?${queryParams.toString()}`;

    // PostMessage auth broadcasting to iframe
    const handleBroadcastAuth = useCallback(() => {
        const iframe = iframeRef.current;
        if (!iframe || !iframe.contentWindow) return;

        try {
            const accountsList = getAccountsList();
            const accounts = Object.keys(accountsList).length > 0
                ? Object.entries(accountsList).map(([id]) => ({
                      account_id: id,
                      account_type: (id.startsWith('VR') || id.startsWith('VRT') || id.startsWith('DEM') ? 'demo' : 'real') as 'demo' | 'real',
                      currency: currency || 'USD',
                      balance: '10000.00',
                      status: 'active',
                  }))
                : [{
                      account_id: activeLoginId || 'CR100000',
                      account_type: isDemo ? ('demo' as const) : ('real' as const),
                      currency: currency || 'USD',
                      balance: '10000.00',
                      status: 'active',
                  }];

            const authPayload = {
                type: 'DERIV_AUTH_PAYLOAD',
                active_loginid: activeLoginId,
                token: authToken,
                accounts: accountsList,
            };

            const v2AuthMsg = {
                type: 'deriv:dtrader:auth',
                version: 'v2',
                auth: {
                    access_token: authToken,
                    token_type: 'Bearer',
                    expires_at: Date.now() + 86400000,
                },
                activeAccountId: activeLoginId,
                accounts,
                clientId: appId,
            };

            iframe.contentWindow.postMessage(authPayload, '*');
            iframe.contentWindow.postMessage(v2AuthMsg, '*');
            iframe.contentWindow.postMessage({ type: 'NEWDTRADER_BRIDGE_AUTH', token: authToken, loginid: activeLoginId, currency }, '*');
        } catch {
            // ignore cross-origin postMessage errors
        }
    }, [activeLoginId, authToken, currency, isDemo, appId]);

    // Set up message listener for child requests
    useEffect(() => {
        const handleMessage = (e: MessageEvent) => {
            if (!e.data) return;
            if (
                e.data.type === 'REQUEST_DERIV_AUTH' ||
                e.data.type === 'REQUEST_SESSION' ||
                e.data.type === 'BRIDGE_READY' ||
                e.data.action === 'REQUEST_AUTH'
            ) {
                handleBroadcastAuth();
            }
        };

        window.addEventListener('message', handleMessage);
        const timer = setTimeout(handleBroadcastAuth, 1500);

        return () => {
            window.removeEventListener('message', handleMessage);
            clearTimeout(timer);
        };
    }, [handleBroadcastAuth]);

    const handleIframeLoad = () => {
        setIsLoading(false);
        setHasError(false);
        handleBroadcastAuth();
    };

    const handleIframeError = () => {
        setIsLoading(false);
        setHasError(true);
    };

    const handleReload = () => {
        setIsLoading(true);
        setHasError(false);
        setReloadKey(prev => prev + 1);
    };

    return (
        <div className='dtrader-page-container'>
            {/* Top Toolbar */}
            <div className='dtrader-header-bar'>
                <div className='dtrader-header-bar__left'>
                    <div className='dtrader-title-badge'>
                        <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                            <polyline points='22 12 18 12 15 21 9 3 6 12 2 12' />
                        </svg>
                        <span className='dtrader-title-text'>DTrader Terminal</span>
                    </div>

                    {activeLoginId && (
                        <div className={`account-badge account-badge--${isDemo ? 'demo' : 'real'}`}>
                            <span>{isDemo ? 'DEMO' : 'REAL'}:</span>
                            <span>{activeLoginId}</span>
                            <span>({currency})</span>
                        </div>
                    )}
                </div>

                <div className='dtrader-header-bar__right'>
                    <button
                        type='button'
                        className='dtrader-btn'
                        onClick={handleReload}
                        title='Reload Terminal'
                    >
                        <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                            <path d='M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67' />
                        </svg>
                        <span>Reload</span>
                    </button>

                    <a
                        href={embedUrl}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='dtrader-btn dtrader-btn--primary'
                        title='Open in new tab'
                    >
                        <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                            <path d='M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6' />
                            <polyline points='15 3 21 3 21 9' />
                            <line x1='10' y1='14' x2='21' y2='3' />
                        </svg>
                        <span>Open Full Screen</span>
                    </a>
                </div>
            </div>

            {/* Iframe Viewport */}
            <div className='dtrader-iframe-wrapper'>
                {isLoading && (
                    <div className='dtrader-loading-overlay'>
                        <div className='spinner' />
                        <span>Loading DTrader Terminal...</span>
                    </div>
                )}

                {hasError && (
                    <div className='dtrader-error-overlay'>
                        <h3>Failed to load DTrader Terminal</h3>
                        <p>The external terminal could not be embedded or is temporarily unavailable.</p>
                        <a
                            href={embedUrl}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='dtrader-btn dtrader-btn--primary'
                        >
                            Open in New Tab
                        </a>
                    </div>
                )}

                <iframe
                    key={reloadKey}
                    ref={iframeRef}
                    src={embedUrl}
                    title='DTrader Terminal'
                    className='dtrader-iframe'
                    frameBorder='0'
                    allowFullScreen
                    loading='eager'
                    allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen; display-capture'
                    sandbox='allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads'
                    referrerPolicy='no-referrer-when-downgrade'
                    onLoad={handleIframeLoad}
                    onError={handleIframeError}
                />
            </div>
        </div>
    );
});

export default DTrader;
