import { lazy } from 'react';

import { routes } from '@deriv/shared';

import { TRouteConfig } from 'Types';

import ContractDetailsSwitch from './ContractDetailsSwitch';

// Lazy load route components for better code splitting
const Trade = lazy(() => import(/* webpackChunkName: "trader-trade" */ 'AppV2/Containers/Trade'));
const Positions = lazy(() => import(/* webpackChunkName: "trader-positions" */ 'AppV2/Containers/Positions'));
const AutoTrader = lazy(() => import(/* webpackChunkName: "trader-autotrader" */ 'Modules/AutoTrader'));
const DTrader = lazy(() => import(/* webpackChunkName: "trader-dtrader" */ 'Modules/DTrader'));

type TRouteConfigExtended = Omit<TRouteConfig, 'routes'> & {
    path: string;
    component: React.ComponentType;
    default: boolean;
};

const traderRoutes: TRouteConfigExtended[] = [
    {
        path: routes.index,
        component: Trade,
        exact: true,
        default: false,
    },
    {
        path: routes.autotrader,
        component: AutoTrader,
        exact: true,
        default: false,
    },
    {
        path: routes.dtrader,
        component: DTrader,
        exact: true,
        default: false,
    },
    {
        path: routes.trader_positions,
        component: Positions,
        is_authenticated: true,
        default: false,
    },
    {
        path: routes.contract,
        component: ContractDetailsSwitch,
        is_authenticated: true,
        default: false,
    },
    {
        // default route
        path: '/*',
        component: lazy(() => import('Modules/Page404')),
        default: false,
    },
];

export default traderRoutes;
