import {
  ChangeDetectionStrategy,
  Component,
  computed,
  Input,
  OnDestroy,
  OnInit,
  Output,
  EventEmitter,
  signal,
} from '@angular/core';
import { interval, Subscription } from 'rxjs';
import { takeWhile } from 'rxjs/operators';

@Component({
  selector: 'app-timer-bar',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './timer-bar.component.html',
  styleUrls: ['./timer-bar.component.css'],
})
export class TimerBarComponent implements OnInit, OnDestroy {
  @Input() maxTime = 30;
  @Input() autoStart = false;

  @Output() timesUp = new EventEmitter<void>();
  @Output() tick = new EventEmitter<number>();

  readonly timeLeft = signal(30);
  readonly pct = computed(() => (this.timeLeft() / this.maxTime) * 100);
  readonly barColor = computed(() => {
    const t = this.timeLeft();
    if (t > this.maxTime * 0.5) return 'var(--color-success)';
    if (t > this.maxTime * 0.25) return 'var(--color-warning)';
    return 'var(--color-danger)';
  });

  private sub?: Subscription;

  ngOnInit(): void {
    this.timeLeft.set(this.maxTime);
    if (this.autoStart) this.start();
  }

  start(): void {
    this.stop();
    this.timeLeft.set(this.maxTime);
    this.sub = interval(1000)
      .pipe(takeWhile(() => this.timeLeft() > 0))
      .subscribe(() => {
        this.timeLeft.update(t => t - 1);
        this.tick.emit(this.timeLeft());
        if (this.timeLeft() === 0) {
          this.timesUp.emit();
        }
      });
  }

  stop(): void {
    this.sub?.unsubscribe();
    this.sub = undefined;
  }

  reset(): void {
    this.stop();
    this.timeLeft.set(this.maxTime);
  }

  ngOnDestroy(): void {
    this.stop();
  }
}
