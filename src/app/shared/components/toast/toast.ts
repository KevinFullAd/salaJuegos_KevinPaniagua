import { Component, DestroyRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, ToastMessage } from '@services/toast.service';

interface ToastItem extends ToastMessage {
  id: number;
}

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.html',
  styleUrl: './toast.css'
})
export class ToastComponent {

  toasts = signal<ToastItem[]>([]);
  private nextId = 0;

  constructor(
    private toastService: ToastService,
    private destroyRef: DestroyRef
  ) {
    const subscription = this.toastService.toast$.subscribe(msg => {
      queueMicrotask(() => this.addToast(msg));
    });

    this.destroyRef.onDestroy(() => {
      subscription.unsubscribe();
    });
  }

  private addToast(message: ToastMessage) {
    const toast = { ...message, id: this.nextId++ };
    this.toasts.update(items => [...items, toast]);

    setTimeout(() => {
      this.toasts.update(items => items.filter(item => item.id !== toast.id));
    }, 3000);
  }

}
