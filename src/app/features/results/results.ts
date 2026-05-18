import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { GameResultWithUserRow, SupabaseService } from '@services/supabase';
import { AuthService } from '@services/auth.service';
import { Card } from '@components/ui/card/card';

type GameResultRow = {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  score: number;
  time_seconds: number;
  won: boolean;
  details: Record<string, unknown> | null;
  created_at: string;
  game_slug: string;
  game_name: string;
};

type PlayerStanding = {
  userId: string;
  name: string;
  email: string;
  totalScore: number;
  gamesPlayed: number;
  wins: number;
  bestScore: number;
};

@Component({
  selector: 'app-results',
  standalone: true,
  imports: [CommonModule, RouterLink, Card],
  templateUrl: './results.html',
  styleUrl: './results.css',
})
export class Results implements OnInit, OnDestroy {
  private supabase = inject(SupabaseService);
  private authService = inject(AuthService);
  private userSub?: Subscription;

  gameSections = [
    { slug: 'ahorcado', name: 'Ahorcado' },
    { slug: 'mayor-menor', name: 'Mayor o Menor' },
    { slug: 'preguntados', name: 'Preguntados' },
    { slug: 'firewall-breach', name: 'Firewall Breach' },
  ];
  loading = signal(true);
  errorMessage = signal('');
  results = signal<GameResultRow[]>([]);
  showFullHistory = signal(false);
  playerStandings = computed(() => this.buildPlayerStandings());

  ngOnInit() {
    this.userSub = this.authService.currentUser$.subscribe(() => {
      void this.loadResults();
    });
  }

  ngOnDestroy() {
    this.userSub?.unsubscribe();
  }

  private async loadResults() {
    this.loading.set(true);
    this.errorMessage.set('');

    const { data, error } = await this.supabase.getGameResults();

    if (error) {
      this.errorMessage.set(error.message);
    } else {
      this.results.set((data ?? []) as GameResultWithUserRow[]);
    }

    this.loading.set(false);
  }

  formatDate(value: string) {
    return new Intl.DateTimeFormat('es-AR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(value));
  }

  resultsByGame(slug: string) {
    return this.results().filter((result) => result.game_slug === slug);
  }

  visibleResultsByGame(slug: string) {
    const rows = this.resultsByGame(slug);
    return this.showFullHistory() ? rows : rows.slice(0, 3);
  }

  resultPlaceholders(slug: string) {
    if (this.showFullHistory()) {
      return [];
    }

    return Array.from({ length: Math.max(0, 3 - this.visibleResultsByGame(slug).length) });
  }

  visiblePlayerStandings() {
    const standings = this.playerStandings();
    return this.showFullHistory() ? standings : standings.slice(0, 3);
  }

  playerPlaceholders() {
    if (this.showFullHistory()) {
      return [];
    }

    return Array.from({ length: Math.max(0, 3 - this.visiblePlayerStandings().length) });
  }

  toggleHistoryView() {
    this.showFullHistory.update((value) => !value);
  }

  getUserName(result: GameResultRow) {
    const fullName = `${result.first_name ?? ''} ${result.last_name ?? ''}`.trim();
    return fullName || result.email || 'Usuario';
  }

  getMetric(result: GameResultRow) {
    if (result.game_slug === 'ahorcado') {
      return `${result.details?.['selected_letters_count'] ?? 0} letras`;
    }

    if (result.game_slug === 'mayor-menor') {
      return `${result.details?.['correct_cards'] ?? result.score} aciertos`;
    }

    return '-';
  }

  private buildPlayerStandings(): PlayerStanding[] {
    const standings = new Map<string, PlayerStanding>();

    for (const result of this.results()) {
      const current = standings.get(result.user_id) ?? {
        userId: result.user_id,
        name: this.getUserName(result),
        email: result.email ?? '',
        totalScore: 0,
        gamesPlayed: 0,
        wins: 0,
        bestScore: 0,
      };

      current.totalScore += result.score;
      current.gamesPlayed += 1;
      current.wins += result.won ? 1 : 0;
      current.bestScore = Math.max(current.bestScore, result.score);
      standings.set(result.user_id, current);
    }

    return Array.from(standings.values()).sort((a, b) => {
      if (b.totalScore !== a.totalScore) {
        return b.totalScore - a.totalScore;
      }

      if (b.wins !== a.wins) {
        return b.wins - a.wins;
      }

      return b.bestScore - a.bestScore;
    });
  }
}
