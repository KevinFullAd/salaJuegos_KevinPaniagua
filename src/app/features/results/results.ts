import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SupabaseService } from '@services/supabase';
import { Card } from '@components/ui/card/card';

type GameResultRow = {
  id: string;
  score: number;
  time_seconds: number;
  won: boolean;
  created_at: string;
  games: {
    slug: string;
    name: string;
  } | null;
};

type SupabaseGameResultRow = Omit<GameResultRow, 'games'> & {
  games:
    | {
        slug: string;
        name: string;
      }
    | {
        slug: string;
        name: string;
      }[]
    | null;
};

@Component({
  selector: 'app-results',
  standalone: true,
  imports: [CommonModule, RouterLink, Card],
  templateUrl: './results.html',
  styleUrl: './results.css',
})
export class Results {
  private supabase = inject(SupabaseService);

  gameSections = [
    { slug: 'ahorcado', name: 'Ahorcado' },
    { slug: 'mayor-menor', name: 'Mayor o Menor' },
    { slug: 'preguntados', name: 'Preguntados' },
    { slug: 'firewall-breach', name: 'Firewall Breach' },
  ];
  loading = signal(true);
  errorMessage = signal('');
  results = signal<GameResultRow[]>([]);

  async ngOnInit() {
    const { data, error } = await this.supabase.getGameResults();

    if (error) {
      this.errorMessage.set(error.message);
    } else {
      const rows = (data ?? []) as SupabaseGameResultRow[];
      this.results.set(rows.map((row) => ({
        ...row,
        games: Array.isArray(row.games) ? row.games[0] ?? null : row.games,
      })));
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
    return this.results().filter((result) => result.games?.slug === slug);
  }
}
