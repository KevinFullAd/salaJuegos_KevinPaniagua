import { Routes } from '@angular/router';

import { Home } from './features/home/home';
import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';
import { About} from './features/about/about';
import { MainLayout } from './core/layouts/main-layout/main-layout';


export const routes: Routes = [
    {
        path: '',
        component: MainLayout,
        children: [
            {path:"", component: Home},
            {path:"login", component: Login},
            {path:"register", component: Register},
            {path:"about", component: About},
        ]
    },
    {
        path: '**',
        redirectTo: ''
    }
];
