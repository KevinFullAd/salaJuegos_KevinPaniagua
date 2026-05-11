import { Component, inject, signal } from '@angular/core';
import { SupabaseService } from '@app/core/services/supabase';

type Todo = {
  id: number | string;
  name: string;
};

@Component({
  selector: 'app-test',
  standalone: true,
  templateUrl: './test.html',
})
export class TestComponent {
  private supabase = inject(SupabaseService);

  todos = signal<Todo[]>([]);
  loading = signal(true);
  errorMessage = signal('');

  async ngOnInit() {
    const { data, error } = await this.supabase.getTodos();

    if (error) {
      this.errorMessage.set(error.message);
    } else {
      this.todos.set((data ?? []) as Todo[]);
    }

    this.loading.set(false);
  }
}
