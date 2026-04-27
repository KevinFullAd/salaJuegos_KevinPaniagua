import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from '@shared/components/navbar/navbar';
import { ToastComponent } from '@shared/components/toast/toast';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, Navbar, ToastComponent],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css',
})
export class MainLayout {}
