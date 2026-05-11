import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { QuestionService, TriviaQuestion } from './question.service';

@Component({
  selector: 'app-preguntados',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './preguntados.html',
  styleUrls: ['./preguntados.css'],
})
export class Preguntados implements OnInit {
  questions: TriviaQuestion[] = [];
  currentIndex = 0;
  score = 0;
  answers: string[] = [];
  finished = false;
  loading = false;
  error = '';
  selectedAnswer = '';
  private questionService = inject(QuestionService);

  ngOnInit() {
    this.loadQuestions();
  }

  async loadQuestions() {
    this.loading = true;
    this.error = '';
    this.finished = false;
    this.currentIndex = 0;
    this.score = 0;
    this.selectedAnswer = '';

    try {
      const data = await firstValueFrom(this.questionService.getQuestions());
      this.questions = data;
      if (!this.questions.length) {
        this.error = 'No se encontraron preguntas. Intenta nuevamente.';
      } else {
        this.prepareAnswers();
      }
    } catch (error) {
      this.error = 'Error cargando preguntas. Intenta nuevamente.';
    } finally {
      this.loading = false;
    }
  }

  get currentQuestion() {
    return this.questions[this.currentIndex];
  }

  prepareAnswers() {
    if (!this.currentQuestion) {
      this.answers = [];
      return;
    }
    const options = [
      ...this.currentQuestion.incorrect_answers,
      this.currentQuestion.correct_answer,
    ];
    this.answers = this.shuffle(options);
  }

  selectAnswer(answer: string) {
    if (this.finished || this.selectedAnswer) {
      return;
    }

    this.selectedAnswer = answer;
    const isCorrect = answer === this.currentQuestion.correct_answer;
    if (isCorrect) {
      this.score += 1;
    }

    setTimeout(() => {
      if (this.currentIndex < this.questions.length - 1) {
        this.currentIndex += 1;
        this.selectedAnswer = '';
        this.prepareAnswers();
      } else {
        this.finished = true;
      }
    }, 1000);
  }

  restart() {
    this.loadQuestions();
  }

  private shuffle(items: string[]) {
    return items.slice().sort(() => Math.random() - 0.5);
  }
}
