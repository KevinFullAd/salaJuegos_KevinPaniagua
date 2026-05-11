import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { User } from '@supabase/supabase-js';
import { SupabaseService } from '@core/services/supabase';

export interface AppUser {
    id: string;
    email: string;
    nombre: string;
    apellido?: string;
    edad?: number;
    avatarUrl?: string | null;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {

    private currentUserSubject = new BehaviorSubject<AppUser | null>(null);
    currentUser$ = this.currentUserSubject.asObservable();

    constructor(private supabase: SupabaseService) {
        this.loadUser();
        this.supabase.client.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                void this.setCurrentUser(session.user);
            } else {
                this.currentUserSubject.next(null);
            }
        });
    }

    async login(email: string, password: string) {
        const { data, error } = await this.supabase.signIn(email, password);

        if (error) {
            throw error;
        }

        if (data.user) {
            await this.setCurrentUser(data.user);
        }
    }

    async register(data: any) {
        const { data: authData, error } = await this.supabase.signUp(data.email, data.password, {
            first_name: data.nombre,
            last_name: data.apellido,
            age: Number(data.edad),
        });

        if (error) {
            throw error;
        }

        if (!authData.user) {
            return;
        }

        const { error: profileError } = await this.supabase.createProfile({
            id: authData.user.id,
            email: data.email,
            first_name: data.nombre,
            last_name: data.apellido,
            age: Number(data.edad),
        });

        if (profileError) {
            throw profileError;
        }

        await this.setCurrentUser(authData.user);
    }

    async logout() {
        await this.supabase.signOut();
        this.currentUserSubject.next(null);
    }

    isLogged() {
        return this.currentUserSubject.value !== null;
    }

    async loadUser() {
        const { data } = await this.supabase.getSession();

        if (data.session?.user) {
            await this.setCurrentUser(data.session.user);
        } else {
            this.currentUserSubject.next(null);
        }
    }

    private async setCurrentUser(user: User) {
        const { data: profile } = await this.supabase.getProfile(user.id);

        this.currentUserSubject.next({
            id: user.id,
            email: user.email ?? profile?.email ?? '',
            nombre: profile?.first_name ?? user.user_metadata?.['first_name'] ?? user.email ?? 'Usuario',
            apellido: profile?.last_name ?? user.user_metadata?.['last_name'],
            edad: profile?.age ?? user.user_metadata?.['age'],
            avatarUrl: profile?.avatar_url ?? null,
        });
    }

    get currentUser() {
        return this.currentUserSubject.value;
    }

    async hasSession() {
        if (this.isLogged()) {
            return true;
        }

        await this.loadUser();
        return this.isLogged();
    }

}
