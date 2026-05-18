// src/app/services/supabase.ts
import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

export interface SaveGameResultPayload {
  slug: string;
  name: string;
  score: number;
  timeSeconds: number;
  won: boolean;
  details: Record<string, unknown>;
}

export interface ChatMessageRow {
  id?: string | number;
  user_id?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  message?: string | null;
  created_at?: string;
}

export interface GameResultWithUserRow {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  game_id: string;
  game_slug: string;
  game_name: string;
  score: number;
  time_seconds: number;
  won: boolean;
  details: Record<string, unknown> | null;
  created_at: string;
}

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  readonly client: SupabaseClient<any>;

  constructor(@Inject(PLATFORM_ID) platformId: object) {
    this.client = createClient<any>(
      environment.supabaseUrl,
      environment.supabasePublishableKey,
      isPlatformBrowser(platformId) ? {} : {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      }
    );
  }

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
      .from('game_results_with_user')
      .select('*')
      .order('score', { ascending: false })
      .order('time_seconds', { ascending: true });
  }

  async saveGameResult(payload: SaveGameResultPayload) {
    const { data: sessionData, error: sessionError } = await this.getSession();

    if (sessionError) {
      return { data: null, error: sessionError };
    }

    const user = sessionData.session?.user;

    if (!user) {
      return {
        data: null,
        error: new Error('No hay un usuario autenticado para guardar la partida.'),
      };
    }

    const { data: game, error: gameError } = await this.ensureGame(payload.slug, payload.name);

    if (gameError) {
      return { data: null, error: gameError };
    }

    if (!game) {
      return {
        data: null,
        error: new Error('No se pudo encontrar o crear el juego para guardar la partida.'),
      };
    }

    return this.client
      .from('game_results')
      .insert({
        user_id: user.id,
        game_id: game.id,
        score: payload.score,
        time_seconds: payload.timeSeconds,
        won: payload.won,
        details: {
          ...payload.details,
          user_email: user.email,
          user_name: this.getUserDisplayName(user),
          finished_at: new Date().toISOString(),
        },
      })
      .select()
      .single();
  }

  getChatMessages() {
    return this.client
      .from('chat_messages_with_user')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
  }

  getChatMessageById(messageId: string) {
    return this.client
      .from('chat_messages_with_user')
      .select('*')
      .eq('id', messageId)
      .maybeSingle();
  }

  async createChatMessage(message: string) {
    const { data: sessionData, error: sessionError } = await this.getSession();

    if (sessionError) {
      return { data: null, error: sessionError };
    }

    const user = sessionData.session?.user;

    if (!user) {
      return {
        data: null,
        error: new Error('No hay un usuario autenticado para enviar mensajes.'),
      };
    }

    return this.client
      .from('chat_messages')
      .insert({
        user_id: user.id,
        message,
      })
      .select()
      .single();
  }

  subscribeToChat(onMessage: (message: ChatMessageRow) => void) {
    const channel = this.client
      .channel('chat-room')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        (payload) => onMessage(payload.new as ChatMessageRow)
      )
      .subscribe();

    return () => {
      void this.client.removeChannel(channel);
    };
  }

  private async ensureGame(slug: string, name: string) {
    const existing = await this.client
      .from('games')
      .select('id, slug, name')
      .eq('slug', slug)
      .maybeSingle();

    if (existing.error || existing.data) {
      return existing;
    }

    return this.client
      .from('games')
      .insert({ slug, name })
      .select('id, slug, name')
      .single();
  }

  private getUserDisplayName(user: { email?: string; user_metadata?: Record<string, unknown> }) {
    const firstName = user.user_metadata?.['first_name'] ?? user.user_metadata?.['name'];
    const lastName = user.user_metadata?.['last_name'] ?? user.user_metadata?.['lastName'];
    const fullName = `${firstName ?? ''} ${lastName ?? ''}`.trim();

    return fullName || user.email || 'Usuario';
  }
}
