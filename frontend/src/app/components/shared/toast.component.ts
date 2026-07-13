import { Component } from '@angular/core';
import { AsyncPipe, NgClass, NgFor, NgIf } from '@angular/common';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [AsyncPipe, NgFor, NgIf, NgClass],
  template: `
    <div class="toast-container">
      <div
        *ngFor="let toast of (toastService.toasts$ | async)"
        class="toast"
        [ngClass]="'toast-' + toast.type"
      >
        <span class="toast-icon">
          {{ toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : 'ℹ' }}
        </span>
        <span class="toast-message">{{ toast.message }}</span>
        <button class="toast-close" (click)="toastService.dismiss(toast.id)">×</button>
      </div>
    </div>
  `,
  styles: [`
    .toast-icon {
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.8rem;
      border-radius: 50%;
      background: rgba(255,255,255,0.15);
      flex-shrink: 0;
    }
    .toast-message { flex: 1; font-size: 0.9rem; font-weight: 500; }
    .toast-close {
      background: none;
      border: none;
      color: inherit;
      cursor: pointer;
      font-size: 1.2rem;
      opacity: 0.7;
      padding: 0;
      line-height: 1;
    }
    .toast-close:hover { opacity: 1; }
  `]
})
export class ToastComponent {
  constructor(public toastService: ToastService) {}
}
