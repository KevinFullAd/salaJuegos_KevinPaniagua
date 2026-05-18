import { Routes } from '@angular/router';

import { Home } from '@features/home/home';
import { Login } from '@features/auth/login/login';
import { Register } from '@features/auth/register/register';
import { About} from '@features/about/about';
import { Results } from '@features/results/results';
import { GamePlaceholder } from '@features/games/game-placeholder/game-placeholder';
import { MainLayout } from '@core/layouts/main-layout/main-layout';
import { authGuard } from '@core/guards/auth-guard';


export const routes: Routes = [
    {
        path: '',
        component: MainLayout,
        children: [
            {path:"", component: Home},
            {path:"login", component: Login},
            {path:"register", component: Register},
            {path:"results", component: Results, canActivate: [authGuard]},
            {path:"chat", loadComponent: () => import('@features/chat/chat').then((module) => module.Chat), canActivate: [authGuard]},
            {path:"games/ahorcado", loadComponent: () => import('@features/games/ahorcado/ahorcado').then((module) => module.Ahorcado), canActivate: [authGuard]},
            {path:"games/mayor-menor", loadComponent: () => import('@features/games/higher-or-lower/higher-or-lower').then((module) => module.HigherOrLower), canActivate: [authGuard]},
            {path:"games/preguntados", loadComponent: () => import('@features/games/preguntados/preguntados').then((module) => module.Preguntados), canActivate: [authGuard]},
            {path:"games/firewall-breach", loadComponent: () => import('@features/games/firewall-breach/firewall-breach').then((m) => m.FirewallBreachComponent), canActivate: [authGuard]},
            // {path:"games/pasapalabra", loadComponent: () => import('@features/games/pasapalabra/pasapalabra').then((module) => module.Pasapalabra)},
            {path:"games/:slug", component: GamePlaceholder, canActivate: [authGuard]},
            {path:"about", component: About},
            
        ]
    },
    {
        path: '**',
        redirectTo: ''
    }
];
