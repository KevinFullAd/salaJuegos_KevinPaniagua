import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '@services/supabase';
import { ToastService } from '@services/toast.service';

interface PlayingCard {
  value: number;
  rank: string;
  suit: string;
}

@Component({
  selector: 'app-higher-or-lower',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './higher-or-lower.html',
  styleUrls: ['./higher-or-lower.css'],
})
export class HigherOrLower implements OnInit {
  deck: PlayingCard[] = [];
  currentIndex = 0;
  score = 0;
  guesses = 0;
  finished = false;
  message = 'Elige mayor o menor para comenzar.';
  startedAt = Date.now();
  resultSaved = false;

  constructor(
    private supabase: SupabaseService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.newGame();
  }

  newGame() {
    this.deck = this.shuffle(this.createDeck());
    this.currentIndex = 0;
    this.score = 0;
    this.guesses = 0;
    this.finished = false;
    this.message = 'Elige mayor o menor para comenzar.';
    this.startedAt = Date.now();
    this.resultSaved = false;
  }

  get currentCard(): PlayingCard {
    return this.deck[this.currentIndex] ?? { value: 0, rank: '-', suit: '-' };
  }

  get hasNext(): boolean {
    return this.currentIndex < this.deck.length - 1;
  }

  get progressText(): string {
    return `${this.currentIndex + 1} / ${this.deck.length}`;
  }

  get cardLabel(): string {
    return `${this.currentCard.rank} de ${this.currentCard.suit}`;
  }

  chooseHigher() {
    void this.makeGuess(true);
  }

  chooseLower() {
    void this.makeGuess(false);
  }

  private async makeGuess(isHigher: boolean) {
    if (this.finished || !this.hasNext) {
      return;
    }

    const current = this.currentCard;
    const next = this.deck[this.currentIndex + 1];
    const isCorrect = isHigher ? next.value > current.value : next.value < current.value;
    this.guesses += 1;

    if (isCorrect) {
      this.score += 1;
      this.message = `Correcto: ${next.rank} es ${isHigher ? 'mayor' : 'menor'} que ${current.rank}.`;
    } else {
      this.message = `Incorrecto: ${next.rank} no es ${isHigher ? 'mayor' : 'menor'} que ${current.rank}.`;
    }

    this.currentIndex += 1;

    if (!this.hasNext) {
      this.finished = true;
      this.message += ` Juego terminado. Puntaje: ${this.score}.`;
      await this.saveResult();
    }
  }

  private createDeck() {
    const suits = ['Espadas', 'Copas', 'Oros', 'Bastos'];
    const ranks = Array.from({ length: 12 }, (_, index) => index + 1);

    return suits.flatMap((suit) =>
      ranks.map((value) => ({
        value,
        rank: value.toString(),
        suit,
      }))
    );
  }

  private shuffle(items: PlayingCard[]) {
    return items.sort(() => Math.random() - 0.5);
  }

  private async saveResult() {
    if (this.resultSaved) {
      return;
    }

    this.resultSaved = true;
    const timeSeconds = Math.max(1, Math.round((Date.now() - this.startedAt) / 1000));
    const { error } = await this.supabase.saveGameResult({
      slug: 'mayor-menor',
      name: 'Mayor o Menor',
      score: this.score,
      timeSeconds,
      won: this.score >= Math.ceil(this.guesses / 2),
      details: {
        correct_cards: this.score,
        guessed_cards: this.guesses,
        total_cards: this.deck.length,
        last_card: this.cardLabel,
      },
    });

    this.toastService.show(error ? 'GAME_RESULT_ERROR' : 'GAME_RESULT_SUCCESS');
  }
}
