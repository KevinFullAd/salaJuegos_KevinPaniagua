import { CommonModule } from '@angular/common';
import { AfterViewChecked, Component, ElementRef, OnDestroy, OnInit, ViewChild, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AuthService, AppUser } from '@services/auth.service';
import { ChatMessageRow, SupabaseService } from '@services/supabase';
import { ToastService } from '@services/toast.service';

interface ChatMessage {
  id: string;
  userId: string | null;
  userName: string;
  text: string;
  createdAt: string;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './chat.html',
  styleUrl: './chat.css',
})
export class Chat implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesList') private messagesList?: ElementRef<HTMLElement>;

  messageControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(280)],
  });

  messages = signal<ChatMessage[]>([]);
  loading = signal(true);
  sending = signal(false);
  errorMessage = signal('');
  latestMessageId = signal('');
  hasNewMessages = signal(false);

  private currentUser: AppUser | null = null;
  private userSubscription?: Subscription;
  private unsubscribeRealtime?: () => void;
  private shouldScrollToLatest = false;

  constructor(
    private authService: AuthService,
    private supabase: SupabaseService,
    private toastService: ToastService
  ) {}

  async ngOnInit() {
    this.userSubscription = this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
    });

    await this.loadMessages();
    this.unsubscribeRealtime = this.supabase.subscribeToChat((row) => {
      void this.addRealtimeMessage(row);
    });
  }

  ngOnDestroy() {
    this.userSubscription?.unsubscribe();
    this.unsubscribeRealtime?.();
  }

  ngAfterViewChecked() {
    if (this.shouldScrollToLatest) {
      this.scrollMessagesToTop();
      this.shouldScrollToLatest = false;
    }
  }

  submitMessage(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    void this.sendMessage();
  }

  showNewMessages() {
    this.hasNewMessages.set(false);
    this.focusLatestMessage();
  }

  onMessagesScroll() {
    const element = this.messagesList?.nativeElement;

    if (element && element.scrollTop <= 8) {
      this.hasNewMessages.set(false);
    }
  }

  async sendMessage() {
    const text = this.messageControl.value.trim();

    if (!text || this.messageControl.invalid || this.sending()) {
      this.messageControl.markAsTouched();
      return;
    }

    this.sending.set(true);
    try {
      const { data, error } = await this.supabase.createChatMessage(text);

      if (error) {
        this.toastService.show('CHAT_ERROR');
      } else if (data) {
        const messageId = (data as ChatMessageRow).id;
        const message = messageId
          ? await this.supabase.getChatMessageById(String(messageId))
          : { data, error: null };
        this.addMessage(this.normalizeMessage((message.data ?? data) as ChatMessageRow), true);
        this.messageControl.reset('');
      }
    } catch {
      this.toastService.show('CHAT_ERROR');
    } finally {
      this.sending.set(false);
    }
  }

  isOwnMessage(message: ChatMessage) {
    return Boolean(this.currentUser?.id && message.userId === this.currentUser.id);
  }

  formatTime(value: string) {
    return new Intl.DateTimeFormat('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  }

  private async loadMessages() {
    const { data, error } = await this.supabase.getChatMessages();

    if (error) {
      this.errorMessage.set(error.message);
    } else {
      this.messages.set(((data ?? []) as ChatMessageRow[]).map((row) => this.normalizeMessage(row)));
    }

    this.loading.set(false);
    this.focusLatestMessage();
  }

  private addMessage(message: ChatMessage, shouldFocus = false) {
    const alreadyExists = this.messages().some((item) => item.id === message.id);

    if (!alreadyExists) {
      this.messages.update((items) => [message, ...items]);
      this.latestMessageId.set(message.id);

      if (shouldFocus) {
        this.hasNewMessages.set(false);
        this.focusLatestMessage();
      } else {
        this.hasNewMessages.set(true);
      }
    }
  }

  private focusLatestMessage() {
    const latestMessage = this.messages()[0];
    this.latestMessageId.set(latestMessage?.id ?? '');
    this.shouldScrollToLatest = true;
  }

  private scrollMessagesToTop() {
    const element = this.messagesList?.nativeElement;

    if (!element) {
      return;
    }

    element.scrollTop = 0;
  }

  private normalizeMessage(row: ChatMessageRow): ChatMessage {
    const fallbackId = `${row.created_at ?? Date.now()}-${row.user_id ?? 'user'}`;
    const fullName = `${row.first_name ?? ''} ${row.last_name ?? ''}`.trim();

    return {
      id: String(row.id ?? fallbackId),
      userId: row.user_id ?? null,
      userName: fullName || 'Usuario',
      text: row.message ?? '',
      createdAt: row.created_at ?? new Date().toISOString(),
    };
  }

  private async addRealtimeMessage(row: ChatMessageRow) {
    if (!row.id) {
      const message = this.normalizeMessage(row);
      this.addMessage(message, this.isOwnMessage(message));
      return;
    }

    const { data } = await this.supabase.getChatMessageById(String(row.id));
    const message = this.normalizeMessage((data ?? row) as ChatMessageRow);
    this.addMessage(message, this.isOwnMessage(message));
  }
}
