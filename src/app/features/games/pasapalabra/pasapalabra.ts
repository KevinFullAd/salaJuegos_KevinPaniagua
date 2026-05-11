import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { abc } from './letters';
import { rosco } from './rosco';

interface LetterState {
  letter: string;
  state: number;
}

@Component({
  selector: 'app-pasapalabra',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pasapalabra.html',
  styleUrls: ['./pasapalabra.css'],
})
export class Pasapalabra implements OnInit {
  letters: LetterState[] = [];
  currentIndex = 0;
  answer = '';
  score = 0;
  finished = false;

  ngOnInit() {
    this.newGame();
  }

  newGame() {
    this.letters = abc.map((item) => ({ ...item }));
    this.currentIndex = 0;
    this.answer = '';
    this.score = 0;
    this.finished = false;
  }

  get currentQuestion() {
    return rosco[this.currentIndex];
  }

  get currentLetter() {
    return this.letters[this.currentIndex]?.letter ?? '';
  }

  response() {
    const value = this.answer.trim().toUpperCase();
    if (!value) {
      return;
    }

    if (value === this.currentQuestion.answer) {
      this.letters[this.currentIndex].state = 1;
      this.score += 1;
    } else {
      this.letters[this.currentIndex].state = 2;
      this.score -= 1;
    }

    this.answer = '';
    this.advance();
  }

  pasapalabra() {
    this.letters[this.currentIndex].state = 3;
    this.answer = '';
    this.advance();
  }

  deleteChar() {
    this.answer = this.answer.slice(0, -1);
  }

  private advance() {
    if (this.letters.every((item) => item.state === 1 || item.state === 2)) {
      this.finished = true;
      return;
    }

    let nextIndex = this.currentIndex;
    do {
      nextIndex = nextIndex === this.letters.length - 1 ? 0 : nextIndex + 1;
    } while (this.letters[nextIndex].state === 1 || this.letters[nextIndex].state === 2);

    this.currentIndex = nextIndex;
  }
}
