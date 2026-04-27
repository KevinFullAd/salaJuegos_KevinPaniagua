import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface ToastMessage {
    text: string;
    type: 'success' | 'error' | 'warning' | 'info';
}

@Injectable({
    providedIn: 'root'
})
export class ToastService {
    private toastSubject = new Subject<ToastMessage>();
    toast$ = this.toastSubject.asObservable();

    private messagesMap: Record<string, ToastMessage> = {
        LOGIN_SUCCESS: { text: 'Login exitoso', type: 'success' },
        LOGIN_ERROR: { text: 'Credenciales inválidas', type: 'error' },
        REGISTER_SUCCESS: { text: 'Registro exitoso', type: 'success' },
        REGISTER_ERROR: { text: 'No se pudo completar el registro', type: 'error' },
        LOGOUT_SUCCESS: { text: 'Sesión cerrada correctamente', type: 'info' },
        AUTH_REQUIRED: { text: 'Iniciá sesión para acceder', type: 'warning' },
        GITHUB_ERROR: { text: 'No se pudo cargar la información de GitHub', type: 'error' },
        FORM_INVALID: { text: 'Completa correctamente los campos', type: 'warning' }
    };

    show(code: string) {
        const message = this.messagesMap[code];
        if (message) {
            this.toastSubject.next(message);
        } else {
            this.toastSubject.next({
                text: 'Mensaje desconocido',
                type: 'info'
            })
        }
    }
}
