import { Component, HostListener, OnInit, signal, ViewChild } from '@angular/core';
import { WORDS } from './words';
import { SupabaseService } from '@services/supabase';
import { ToastService } from '@services/toast.service';
import { TimerBarComponent } from '@components/timer-bar/timer-bar.component';

@Component({
  selector: 'app-ahorcado',
  standalone: true,
  imports: [TimerBarComponent],
  templateUrl: './ahorcado.html',
  styleUrls: ['./ahorcado.css'],
})
export class Ahorcado implements OnInit {

  // Solo acepta letras A-Z, ignora cualquier otra tecla del teclado físico
  private static readonly VALID_KEYS = new Set('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''));

  // Layout QWERTY del teclado en pantalla, dividido en 3 filas
  readonly keyRows = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
  ];

  // Referencia al componente hijo TimerBar para poder llamar start() y stop() desde el padre
  @ViewChild(TimerBarComponent) timer!: TimerBarComponent;

  // Controla qué pantalla se muestra: portada, juego activo o pantalla de resultado
  gameState: 'idle' | 'playing' | 'finished' = 'idle';

  word = '';
  // Array de caracteres visibles: '_' para letras no adivinadas, letra mayúscula para las acertadas
  displayWord: string[] = [];
  // Registro de todas las letras que el jugador ya presionó, para deshabilitar su botón
  guessedLetters = new Set<string>();

  attempts = 6;
  maxAttempts = 6;
  message = '';
  score = 0;

  // Signal para que el template y saveResult() lean siempre el valor actualizado por el timer
  readonly timeLeft = signal(30);
  readonly maxTime = 30;

  // Marca el momento exacto en que arranca la partida, para calcular el tiempo total jugado al guardar
  private startedAt = Date.now();
  // Bandera que evita guardar el resultado dos veces si se disparan dos eventos de fin al mismo tiempo
  private resultSaved = false;

  constructor(
    private supabase: SupabaseService,
    private toastService: ToastService,
  ) {}

  ngOnInit(): void {
    this.prepareGame();
  }

  // Escucha el teclado físico globalmente: Enter arranca/reinicia, las letras juegan igual que los botones en pantalla
  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.startGame();
      return;
    }
    if (this.gameState !== 'playing') return;
    const key = event.key.toUpperCase();
    if (Ahorcado.VALID_KEYS.has(key) && !this.guessedLetters.has(key)) {
      event.preventDefault();
      void this.onLetter(key);
    }
  }

  startGame(): void {
    this.prepareGame();
    this.gameState = 'playing';
    // Arranca el countdown en el componente timer; no empieza solo para no correr en la portada
    this.timer.start();
  }

  private prepareGame(): void {
    // Reinicia todos los parámetros para una nueva partida
    const idx = Math.floor(Math.random() * WORDS.length);
    this.word = WORDS[idx];
    this.displayWord = Array(this.word.length).fill('_');
    this.guessedLetters.clear();
    this.attempts = this.maxAttempts;
    this.message = '';
    this.score = 0;
    this.timeLeft.set(this.maxTime);
    this.startedAt = Date.now();
    this.resultSaved = false;
  }

  get imagePath(): string {
    // Va alternando entre ahorcado0.png … ahorcado6.png según los intentos fallidos acumulados
    return `/assets/ahorcado${this.maxAttempts - this.attempts}.png`;
  }

  get hasWon(): boolean {
    return this.gameState === 'finished' && this.displayWord.join('') === this.word.toUpperCase();
  }

  get hasLost(): boolean {
    return this.gameState === 'finished' && !this.hasWon;
  }

  // Devuelve true si la letra fue presionada y existe en la palabra — se usa para pintar el botón de verde
  isCorrectGuess(letter: string): boolean {
    return this.guessedLetters.has(letter) && this.word.includes(letter.toLowerCase());
  }

  // Devuelve true si la letra fue presionada y NO existe en la palabra — se usa para pintar el botón de rojo
  isWrongGuess(letter: string): boolean {
    return this.guessedLetters.has(letter) && !this.word.includes(letter.toLowerCase());
  }

  async onLetter(letter: string): Promise<void> {
    if (this.gameState !== 'playing' || this.guessedLetters.has(letter)) return;

    this.guessedLetters.add(letter);
    const lower = letter.toLowerCase();

    if (this.word.includes(lower)) {
      // Revela todas las posiciones de la letra acertada en el displayWord
      this.word.split('').forEach((char, i) => {
        if (char === lower) this.displayWord[i] = char.toUpperCase();
      });

      // Si no quedan '_' en el display, el jugador completó la palabra
      if (this.displayWord.join('') === this.word.toUpperCase()) {
        this.timer.stop();
        // El puntaje premia tener vidas restantes y tiempo sobrante
        this.score = this.attempts * 10 + this.timeLeft();
        this.message = '¡Ganaste!';
        this.gameState = 'finished';
        await this.saveResult(true);
      }
    } else {
      this.attempts -= 1;
      if (this.attempts === 0) {
        this.timer.stop();
        this.score = 0;
        this.gameState = 'finished';
        this.message = `¡Sin vidas! Era: ${this.word.toUpperCase()}`;
        await this.saveResult(false);
      }
    }
  }

  // Callback que dispara el TimerBar cuando el countdown llega a cero
  onTimesUp(): void {
    if (this.gameState !== 'playing') return;
    this.gameState = 'finished';
    this.score = 0;
    this.message = `¡Tiempo! Era: ${this.word.toUpperCase()}`;
    void this.saveResult(false);
  }

  private async saveResult(won: boolean): Promise<void> {
    // Previene una doble escritura si por alguna razón se llama dos veces seguidas
    if (this.resultSaved) return;
    this.resultSaved = true;

    // Tiempo real jugado en segundos, con mínimo de 1 para evitar guardar 0
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
        time_remaining: this.timeLeft(),
      },
    });

    this.toastService.show(error ? 'GAME_RESULT_ERROR' : 'GAME_RESULT_SUCCESS');
  }
}