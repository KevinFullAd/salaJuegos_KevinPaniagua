import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WORDS } from './words';

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

  onLetter(letter: string) {
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
      }
    } else {
      this.attempts -= 1;
      if (this.attempts === 0) {
        this.finished = true;
        this.message = `Perdiste. La palabra era ${this.word.toUpperCase()}.`;
      }
    }
  }
}
