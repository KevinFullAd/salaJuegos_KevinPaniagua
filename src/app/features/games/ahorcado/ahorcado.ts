import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WORDS } from './words';
import { SupabaseService } from '@services/supabase';
import { ToastService } from '@services/toast.service';

@Component({
  selector: 'app-ahorcado',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ahorcado.html',
  styleUrls: ['./ahorcado.css'],
})
export class Ahorcado implements OnInit {
  letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  word = '';
  displayWord: string[] = [];
  guessedLetters = new Set<string>();
  attempts = 6;
  maxAttempts = 6;
  message = '';
  finished = false;
  score = 0;
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
    const randomIndex = Math.floor(Math.random() * WORDS.length);
    this.word = WORDS[randomIndex];
    this.displayWord = Array(this.word.length).fill('_');
    this.guessedLetters.clear();
    this.attempts = this.maxAttempts;
    this.finished = false;
    this.message = '';
    this.score = 0;
    this.startedAt = Date.now();
    this.resultSaved = false;
  }

  get displayedWord(): string {
    return this.displayWord.join(' ');
  }

  get imagePath(): string {
    return `/assets/ahorcado${this.maxAttempts - this.attempts}.png`;
  }

  get hasWon(): boolean {
    return this.finished && this.displayWord.join('') === this.word.toUpperCase();
  }

  get hasLost(): boolean {
    return this.finished && this.attempts === 0;
  }

  async onLetter(letter: string) {
    if (this.finished || this.guessedLetters.has(letter)) {
      return;
    }

    this.guessedLetters.add(letter);
    const lower = letter.toLowerCase();

    if (this.word.includes(lower)) {
      this.word.split('').forEach((char, index) => {
        if (char === lower) {
          this.displayWord[index] = char.toUpperCase();
        }
      });

      if (this.displayWord.join('') === this.word.toUpperCase()) {
        this.score = this.attempts * 2 + (26 - this.guessedLetters.size);
        this.message = 'Ganaste!';
        this.finished = true;
        await this.saveResult(true);
      }
    } else {
      this.attempts -= 1;
      if (this.attempts === 0) {
        this.finished = true;
        this.message = `Perdiste. La palabra era ${this.word.toUpperCase()}.`;
        await this.saveResult(false);
      }
    }
  }

  private async saveResult(won: boolean) {
    if (this.resultSaved) {
      return;
    }

    this.resultSaved = true;
    const timeSeconds = Math.max(1, Math.round((Date.now() - this.startedAt) / 1000));
    const { error } = await this.supabase.saveGameResult({
      slug: 'ahorcado',
      name: 'Ahorcado',
      score: this.score,
      timeSeconds,
      won,
      details: {
        word: this.word.toUpperCase(),
        selected_letters: Array.from(this.guessedLetters),
        selected_letters_count: this.guessedLetters.size,
        remaining_attempts: this.attempts,
        wrong_letters_count: this.maxAttempts - this.attempts,
      },
    });

    this.toastService.show(error ? 'GAME_RESULT_ERROR' : 'GAME_RESULT_SUCCESS');
  }
}
