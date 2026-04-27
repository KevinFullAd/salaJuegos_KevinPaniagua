import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
    providedIn: 'root'
})
export class StorageService {

    constructor(@Inject(PLATFORM_ID) private platformId: Object) { }

    private isBrowser(): boolean {
        return isPlatformBrowser(this.platformId);
    }

    set(key: string, value: any) {
        if (this.isBrowser()) {
            localStorage.setItem(key, JSON.stringify(value));
        }
    }

    get(key: string) {
        if (this.isBrowser()) {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        }
        return null;
    }

    remove(key: string) {
        if (this.isBrowser()) {
            localStorage.removeItem(key);
        }
    }

}