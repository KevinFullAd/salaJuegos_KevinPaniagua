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
            {path:"games/ahorcado", loadComponent: () => import('@features/games/ahorcado/ahorcado').then((module) => module.Ahorcado)},
            {path:"games/mayor-menor", loadComponent: () => import('@features/games/higher-or-lower/higher-or-lower').then((module) => module.HigherOrLower)},
            {path:"games/preguntados", loadComponent: () => import('@features/games/preguntados/preguntados').then((module) => module.Preguntados)},
            {path:"games/pasapalabra", loadComponent: () => import('@features/games/pasapalabra/pasapalabra').then((module) => module.Pasapalabra)},
            {path:"games/:slug", component: GamePlaceholder},
            {path:"about", component: About},
            
        ]
    },
    {
        path: '**',
        redirectTo: ''
    }
];
