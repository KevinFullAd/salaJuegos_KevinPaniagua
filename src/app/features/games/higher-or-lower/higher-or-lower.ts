import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-higher-or-lower',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './higher-or-lower.html',
  styleUrls: ['./higher-or-lower.css'],
})
export class HigherOrLower implements OnInit {
  deck: number[] = [];
  currentIndex = 0;
  score = 0;
  finished = false;
  message = 'Elige mayor o menor para comenzar.';

  ngOnInit() {
    this.newGame();
  }

  newGame() {
    this.deck = this.shuffle(Array.from({ length: 12 }, (_, index) => index + 1));
    this.currentIndex = 0;
    this.score = 0;
    this.finished = false;
    this.message = 'Elige mayor o menor para comenzar.';
  }

  get currentNumber(): number {
    return this.deck[this.currentIndex] ?? 0;
  }

  get hasNext(): boolean {
    return this.currentIndex < this.deck.length - 1;
  }

  get nextNumber(): number {
    return this.deck[this.currentIndex + 1] ?? 0;
  }

  chooseHigher() {
    this.makeGuess(true);
  }

  chooseLower() {
    this.makeGuess(false);
  }

  private makeGuess(isHigher: boolean) {
    if (this.finished || !this.hasNext) {
      return;
    }

    const current = this.currentNumber;
    const next = this.nextNumber;
    const isCorrect = isHigher ? next > current : next < current;

    if (isCorrect) {
      this.score += 1;
      this.message = `Correcto: ${next} ${isHigher ? 'es mayor' : 'es menor'} que ${current}.`;
    } else {
      this.message = `Incorrecto: ${next} no es ${isHigher ? 'mayor' : 'menor'} que ${current}.`;
    }

    this.currentIndex += 1;

    if (!this.hasNext) {
      this.finished = true;
      this.message += ` Juego terminado. Puntaje: ${this.score}.`;
    }
  }

  private shuffle(items: number[]) {
    return items.sort(() => Math.random() - 0.5);
  }
}
