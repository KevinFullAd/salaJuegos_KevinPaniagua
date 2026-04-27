import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, ToastMessage } from '@services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.html',
  styleUrl: './toast.css'
})
export class ToastComponent {

  toasts: ToastMessage[] = [];

  constructor(private toastService: ToastService) {
    this.toastService.toast$.subscribe(msg => {
      this.toasts.push(msg);

      setTimeout(() => {
        this.toasts.shift();
      }, 3000);
    });
  }

}