import {
  ChangeDetectionStrategy,
  Component,
  computed,
  HostListener,
  inject,
  OnDestroy,
  signal,
  ViewChild,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { SupabaseService } from '@services/supabase';
import { ToastService } from '@services/toast.service';
import { TimerBarComponent } from '@components/timer-bar/timer-bar.component';

interface Question {
  question: string;
  correctAnswer: string;
  options: string[]; // shuffled
}

interface ApiResponse {
  response_code: number;
  results: Array<{
    question: string;
    correct_answer: string;
    incorrect_answers: string[];
    difficulty: string;
  }>;
}

type GameState = 'idle' | 'loading' | 'playing' | 'feedback' | 'finished';

const TOTAL_QUESTIONS = 5;
const TOTAL_LIVES = 3;
const TOTAL_TIME = 60;
const OPTION_KEYS = ['A', 'B', 'C', 'D'];

@Component({
  selector: 'app-preguntados',
  standalone: true,
  imports: [TimerBarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './preguntados.html',
  styleUrls: ['./preguntados.css'],
})
export class Preguntados implements OnDestroy {
  private http = inject(HttpClient);
  private supabase = inject(SupabaseService);
  private toastService = inject(ToastService);

  @ViewChild(TimerBarComponent) timerBar!: TimerBarComponent;

  readonly gameState = signal<GameState>('idle');
  readonly questions = signal<Question[]>([]);
  readonly currentIndex = signal(0);
  readonly score = signal(0);
  readonly lives = signal(TOTAL_LIVES);
  readonly timeLeft = signal(TOTAL_TIME);
  readonly selectedAnswer = signal<string | null>(null);
  readonly errorMsg = signal('');

  readonly isIdle = computed(() => this.gameState() === 'idle');
  readonly isLoading = computed(() => this.gameState() === 'loading');
  readonly isPlaying = computed(() => this.gameState() === 'playing');
  readonly isFeedback = computed(() => this.gameState() === 'feedback');
  readonly isFinished = computed(() => this.gameState() === 'finished');

  readonly currentQuestion = computed(() => this.questions()[this.currentIndex()] ?? null);
  readonly questionNum = computed(() => Math.min(this.currentIndex() + 1, TOTAL_QUESTIONS));
  readonly livesArray = computed(() =>
    Array.from({ length: TOTAL_LIVES }, (_, i) => i < this.lives())
  );
  readonly accuracy = computed(() => {
    const answered = this.currentIndex() + (this.isFinished() ? 0 : 0);
    const correct = this.score() > 0 ? Math.round(this.score() / 20) : 0;
    return answered === 0 ? 0 : Math.round((correct / TOTAL_QUESTIONS) * 100);
  });

  readonly optionKeys = OPTION_KEYS;

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
    const keyMap: Record<string, number> = {
      '1': 0, '2': 1, '3': 2, '4': 3,
      'a': 0, 'b': 1, 'c': 2, 'd': 3,
    };
    const idx = keyMap[e.key.toLowerCase()];
    if (idx !== undefined) {
      const q = this.currentQuestion();
      if (q?.options[idx] !== undefined) this.selectAnswer(q.options[idx]);
    }
  }

  async startGame(): Promise<void> {
    clearTimeout(this.feedbackTimer);
    this.gameState.set('loading');
    this.questions.set([]);
    this.currentIndex.set(0);
    this.score.set(0);
    this.lives.set(TOTAL_LIVES);
    this.timeLeft.set(TOTAL_TIME);
    this.selectedAnswer.set(null);
    this.errorMsg.set('');
    this.startedAt = Date.now();
    this.resultSaved = false;

    const qs = await this.fetchQuestions();
    this.questions.set(qs);
    this.gameState.set('playing');
    this.timerBar.start();
  }

  selectAnswer(option: string): void {
    if (!this.isPlaying()) return;
    const q = this.currentQuestion();
    if (!q) return;

    const correct = option === q.correctAnswer;
    this.selectedAnswer.set(option);
    this.gameState.set('feedback');

    if (correct) {
      // Score: 15 base + up to 5 speed bonus (based on time remaining at moment of answer)
      const points = Math.round(15 + (this.timeLeft() / TOTAL_TIME) * 5);
      this.score.update(s => s + points);
    } else {
      this.lives.update(l => l - 1);
    }

    this.feedbackTimer = setTimeout(() => {
      if (this.lives() === 0) {
        this.timerBar.stop();
        this.gameState.set('finished');
        void this.saveResult();
        return;
      }
      const nextIdx = this.currentIndex() + 1;
      if (nextIdx >= TOTAL_QUESTIONS) {
        this.timerBar.stop();
        this.gameState.set('finished');
        void this.saveResult();
      } else {
        this.currentIndex.set(nextIdx);
        this.selectedAnswer.set(null);
        this.gameState.set('playing');
      }
    }, 1200);
  }

  onTimesUp(): void {
    if (!this.isPlaying() && !this.isFeedback()) return;
    clearTimeout(this.feedbackTimer);
    this.gameState.set('finished');
    void this.saveResult();
  }

  private async fetchQuestions(): Promise<Question[]> {
    try {
      const res = await firstValueFrom(
        this.http.get<ApiResponse>(
          'https://opentdb.com/api.php?amount=5&type=multiple'
        )
      );
      if (res.response_code !== 0 || !res.results?.length) throw new Error();
      return res.results.slice(0, TOTAL_QUESTIONS).map(r => ({
        question: this.decode(r.question),
        correctAnswer: this.decode(r.correct_answer),
        options: this.shuffle([r.correct_answer, ...r.incorrect_answers]).map(o => this.decode(o)),
      }));
    } catch {
      this.errorMsg.set('API no disponible — usando preguntas de respaldo.');
      return this.fallback();
    }
  }

  private decode(text: string): string {
    return text
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&apos;/g, "'")
      .replace(/&rsquo;/g, "'").replace(/&lsquo;/g, "'")
      .replace(/&ldquo;/g, '"').replace(/&rdquo;/g, '"')
      .replace(/&hellip;/g, '…').replace(/&mdash;/g, '—').replace(/&ndash;/g, '–')
      .replace(/&nbsp;/g, ' ').replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n));
  }

  private shuffle<T>(arr: T[]): T[] {
    return arr.slice().sort(() => Math.random() - 0.5);
  }

  private async saveResult(): Promise<void> {
    if (this.resultSaved) return;
    this.resultSaved = true;
    const timeSeconds = Math.max(1, Math.round((Date.now() - this.startedAt) / 1000));
    const { error } = await this.supabase.saveGameResult({
      slug: 'preguntados',
      name: 'Preguntados',
      score: this.score(),
      timeSeconds,
      won: this.score() >= 60,
      details: {
        score: this.score(),
        lives_remaining: this.lives(),
        time_remaining: this.timeLeft(),
        questions_answered: this.currentIndex() + (this.isFinished() ? 1 : 0),
      },
    });
    this.toastService.show(error ? 'GAME_RESULT_ERROR' : 'GAME_RESULT_SUCCESS');
  }

  private fallback(): Question[] {
    const raw = [
      { q: '¿Cuál es el planeta más cercano al Sol?', a: 'Mercurio', w: ['Venus', 'Marte', 'Júpiter'] },
      { q: '¿En qué continente está Argentina?', a: 'América del Sur', w: ['Europa', 'Asia', 'África'] },
      { q: '¿Qué gas respiramos principalmente?', a: 'Oxígeno', w: ['Nitrógeno', 'Dióxido de carbono', 'Helio'] },
      { q: '¿Cuántos lados tiene un triángulo?', a: 'Tres', w: ['Cuatro', 'Cinco', 'Seis'] },
      { q: '¿Qué color se obtiene al mezclar azul y amarillo?', a: 'Verde', w: ['Rojo', 'Violeta', 'Naranja'] },
    ];
    return raw.map(r => ({
      question: r.q,
      correctAnswer: r.a,
      options: this.shuffle([r.a, ...r.w]),
    }));
  }

  ngOnDestroy(): void {
    clearTimeout(this.feedbackTimer);
  }
}
