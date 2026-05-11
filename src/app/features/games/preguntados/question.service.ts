import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';

export interface TriviaQuestion {
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
}

@Injectable({ providedIn: 'root' })
export class QuestionService {
  private readonly API_URL = 'https://opentdb.com/api.php';

  constructor(private http: HttpClient) {}

  getQuestions(): Observable<TriviaQuestion[]> {
    const params = new HttpParams()
      .set('amount', '10')
      .set('category', '15')
      .set('difficulty', 'easy')
      .set('type', 'multiple');

    return this.http
      .get<{ results?: unknown[] }>(this.API_URL, { params })
      .pipe(
        map((response) => (response.results || []).map((item) => this.normalize(item))),
        catchError(() => of(this.fallbackQuestions()))
      );
  }

  private normalize(item: unknown): TriviaQuestion {
    const question = item as {
      question: string;
      correct_answer: string;
      incorrect_answers: string[];
    };

    return {
      question: this.decodeHtml(question.question),
      correct_answer: this.decodeHtml(question.correct_answer),
      incorrect_answers: question.incorrect_answers.map((answer) => this.decodeHtml(answer)),
    };
  }

  private decodeHtml(value: string): string {
    return value
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&amp;/g, '&')
      .replace(/&rsquo;/g, "'")
      .replace(/&ldquo;/g, '"')
      .replace(/&rdquo;/g, '"')
      .replace(/&uuml;/g, 'u');
  }

  private fallbackQuestions(): TriviaQuestion[] {
    return [
      {
        question: 'Cual es el planeta mas cercano al sol?',
        correct_answer: 'Mercurio',
        incorrect_answers: ['Venus', 'Marte', 'Jupiter'],
      },
      {
        question: 'Cuantos dias tiene una semana?',
        correct_answer: 'Siete',
        incorrect_answers: ['Cinco', 'Ocho', 'Seis'],
      },
      {
        question: 'Que instrumento musical tiene teclas blancas y negras?',
        correct_answer: 'Piano',
        incorrect_answers: ['Guitarra', 'Flauta', 'Bateria'],
      },
      {
        question: 'Cual es la capital de Espana?',
        correct_answer: 'Madrid',
        incorrect_answers: ['Barcelona', 'Sevilla', 'Valencia'],
      },
      {
        question: 'Que gas respiramos principalmente?',
        correct_answer: 'Oxigeno',
        incorrect_answers: ['Nitrogeno', 'Dioxido de carbono', 'Helio'],
      },
      {
        question: 'Que color se obtiene al mezclar azul y amarillo?',
        correct_answer: 'Verde',
        incorrect_answers: ['Rojo', 'Violeta', 'Naranja'],
      },
      {
        question: 'Que animal es conocido como el rey de la selva?',
        correct_answer: 'Leon',
        incorrect_answers: ['Tigre', 'Elefante', 'Lobo'],
      },
      {
        question: 'Cuantos lados tiene un triangulo?',
        correct_answer: 'Tres',
        incorrect_answers: ['Cuatro', 'Cinco', 'Seis'],
      },
      {
        question: 'En que continente esta Argentina?',
        correct_answer: 'America del Sur',
        incorrect_answers: ['Europa', 'Asia', 'Africa'],
      },
      {
        question: 'Que oceano separa America de Europa?',
        correct_answer: 'Atlantico',
        incorrect_answers: ['Pacifico', 'Indico', 'Artico'],
      },
    ];
  }
}
