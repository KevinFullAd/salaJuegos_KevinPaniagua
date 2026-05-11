// src/app/services/supabase.ts
import { Injectable } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  readonly client = createClient(
    environment.supabaseUrl,
    environment.supabasePublishableKey
  );

  signIn(email: string, password: string) {
    return this.client.auth.signInWithPassword({ email, password });
  }

  signUp(email: string, password: string, metadata: Record<string, unknown>) {
    return this.client.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });
  }

  signOut() {
    return this.client.auth.signOut();
  }

  getSession() {
    return this.client.auth.getSession();
  }

  getProfile(userId: string) {
    return this.client
      .from('profiles')
      .select('id, email, first_name, last_name, age, avatar_url, created_at, updated_at')
      .eq('id', userId)
      .maybeSingle();
  }

  createProfile(profile: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    age: number;
  }) {
    return this.client.from('profiles').insert(profile).select().single();
  }

  getTodos() {
    return this.client.from('todos').select();
  }

  getGameResults() {
    return this.client
      .from('game_results')
      .select(`
        id,
        score,
        time_seconds,
        won,
        details,
        created_at,
        games (
          slug,
          name
        )
      `)
      .order('score', { ascending: false })
      .order('time_seconds', { ascending: true });
  }
}
