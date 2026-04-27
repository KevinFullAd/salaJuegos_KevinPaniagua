import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { StorageService } from '@core/services/storage.service';

@Injectable({
    providedIn: 'root'
})
export class AuthService {

    private currentUserSubject = new BehaviorSubject<any>(null);
    currentUser$ = this.currentUserSubject.asObservable();

    constructor(private storage: StorageService) {
        this.loadUser();
    }

    login(email: string, password: string) {

        const user = {
            email,
            nombre: 'Usuario Demo'
        };

        this.storage.set('user', user);
        this.currentUserSubject.next(user);
    }

    register(data: any) {
        this.storage.set('user', data);
        this.currentUserSubject.next(data);
    }

    logout() {
        this.storage.remove('user');
        this.currentUserSubject.next(null);
    }

    isLogged() {
        return this.currentUserSubject.value !== null;
    }

    private loadUser() {
        const user = this.storage.get('user');
        if (user) {
            this.currentUserSubject.next(user);
        }
    }

}