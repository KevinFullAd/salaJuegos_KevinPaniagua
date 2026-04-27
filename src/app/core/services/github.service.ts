import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class GithubService {
    async getUser(username: string) {
        const res = await fetch(`https://api.github.com/users/${username}`);
        if (!res.ok) {
            throw new Error('User not found');
        }
        return await res.json();
    }
}