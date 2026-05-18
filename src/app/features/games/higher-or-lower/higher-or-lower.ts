import {
  ChangeDetectionStrategy,
  Component,
  computed,
  HostListener,
  inject,
  OnDestroy,
  signal,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { SupabaseService } from '@services/supabase';
import { ToastService } from '@services/toast.service';

interface DeckCard {
  code: string;
  image: string;
  value: string;
  suit: string;
  numericValue: number;
}

interface DeckResponse {
  deck_id: string;
  remaining: number;
}

interface DrawResponse {
  cards: Array<{ code: string; image: string; value: string; suit: string }>;
  remaining: number;
}

type GameState = 'idle' | 'loading' | 'playing' | 'feedback' | 'finished';

const VALUE_MAP: Record<string, number> = {
  ACE: 1, '2': 2, '3': 3, '4': 4, '5': 5,
  '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
  JACK: 11, QUEEN: 12, KING: 13,
};

const API = 'https://deckofcardsapi.com/api/deck';

@Component({
  selector: 'app-higher-or-lower',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './higher-or-lower.html',
  styleUrls: ['./higher-or-lower.css'],
})
export class HigherOrLower implements OnDestroy {
  private http = inject(HttpClient);
  private supabase = inject(SupabaseService);
  private toastService = inject(ToastService);

  readonly gameState = signal<GameState>('idle');
  readonly currentCard = signal<DeckCard | null>(null);
  readonly nextCard = signal<DeckCard | null>(null);
  readonly score = signal(0);
  readonly guesses = signal(0);
  readonly lastCorrect = signal<boolean | null>(null);
  readonly cardsRemaining = signal(0);
  readonly errorMsg = signal('');

  readonly isIdle = computed(() => this.gameState() === 'idle');
  readonly isLoading = computed(() => this.gameState() === 'loading');
  readonly isPlaying = computed(() => this.gameState() === 'playing');
  readonly isFeedback = computed(() => this.gameState() === 'feedback');
  readonly isFinished = computed(() => this.gameState() === 'finished');
  readonly accuracy = computed(() => {
    const g = this.guesses();
    return g === 0 ? 0 : Math.round((this.score() / g) * 100);
  });

  private deckId = '';
  private startedAt = Date.now();
  private resultSaved = false;
  private feedbackTimer?: ReturnType<typeof setTimeout>;

  @HostListener('window:keydown', ['$event'])
  onKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Enter') {
      if (this.isIdle() || this.isFinished()) void this.startGame();
      return;
    }
    if (!this.isPlaying()) return;
    if (e.key === 'ArrowUp') { e.preventDefault(); void this.guess(true); }
    if (e.key === 'ArrowDown') { e.preventDefault(); void this.guess(false); }
  }

  async startGame(): Promise<void> {
    clearTimeout(this.feedbackTimer);
    this.gameState.set('loading');
    this.score.set(0);
    this.guesses.set(0);
    this.lastCorrect.set(null);
    this.currentCard.set(null);
    this.nextCard.set(null);
    this.errorMsg.set('');
    this.startedAt = Date.now();
    this.resultSaved = false;

    try {
      const deck = await firstValueFrom(
        this.http.get<DeckResponse>(`${API}/new/shuffle/?deck_count=1`)
      );
      this.deckId = deck.deck_id;
      this.cardsRemaining.set(deck.remaining);
      this.currentCard.set(await this.drawOne());
      this.gameState.set('playing');
    } catch {
      this.errorMsg.set('No se pudo conectar con la API. Intenta de nuevo.');
      this.gameState.set('idle');
    }
  }

  async guess(isHigher: boolean): Promise<void> {
    if (!this.isPlaying() || this.cardsRemaining() === 0) return;

    try {
      const next = await this.drawNext();
      const current = this.currentCard()!;
      const correct = isHigher
        ? next.numericValue > current.numericValue
        : next.numericValue < current.numericValue;

      this.nextCard.set(next);
      this.guesses.update(g => g + 1);
      if (correct) this.score.update(s => s + 1);
      this.lastCorrect.set(correct);
      this.gameState.set('feedback');

      this.feedbackTimer = setTimeout(() => {
        if (this.cardsRemaining() === 0) {
          this.gameState.set('finished');
          void this.saveResult();
        } else {
          this.currentCard.set(next);
          this.nextCard.set(null);
          this.lastCorrect.set(null);
          this.gameState.set('playing');
        }
      }, 1400);
    } catch {
      this.errorMsg.set('Error al obtener la siguiente carta.');
      this.gameState.set('playing');
    }
  }

  private async drawOne(): Promise<DeckCard> {
    const res = await firstValueFrom(
      this.http.get<DrawResponse>(`${API}/${this.deckId}/draw/?count=1`)
    );
    this.cardsRemaining.set(res.remaining);
    const raw = res.cards[0];
    return { ...raw, numericValue: VALUE_MAP[raw.value] ?? 0 };
  }

  // Redraws if same value as current (up to 3 retries) to guarantee strict comparison
  private async drawNext(): Promise<DeckCard> {
    const current = this.currentCard();
    let card = await this.drawOne();
    let attempts = 0;
    while (
      current &&
      card.numericValue === current.numericValue &&
      this.cardsRemaining() > 0 &&
      attempts < 3
    ) {
      card = await this.drawOne();
      attempts++;
    }
    return card;
  }

  private async saveResult(): Promise<void> {
    if (this.resultSaved) return;
    this.resultSaved = true;
    const timeSeconds = Math.max(1, Math.round((Date.now() - this.startedAt) / 1000));
    const { error } = await this.supabase.saveGameResult({
      slug: 'mayor-menor',
      name: 'Mayor o Menor',
      score: this.score(),
      timeSeconds,
      won: this.accuracy() >= 50,
      details: {
        correct: this.score(),
        total: this.guesses(),
        accuracy: this.accuracy(),
      },
    });
    this.toastService.show(error ? 'GAME_RESULT_ERROR' : 'GAME_RESULT_SUCCESS');
  }

  ngOnDestroy(): void {
    clearTimeout(this.feedbackTimer);
  }
}
