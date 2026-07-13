import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AsyncPipe, NgIf } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, AsyncPipe, NgIf],
  template: `
    <nav class="navbar">
      <div class="navbar-inner container">
        <a routerLink="/" class="navbar-brand">
          <div class="brand-logo">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M14 2C7.373 2 2 7.373 2 14s5.373 12 12 12 12-5.373 12-12S20.627 2 14 2z" fill="url(#g1)"/>
              <path d="M9 14l3 3 7-7" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <defs>
                <linearGradient id="g1" x1="2" y1="2" x2="26" y2="26" gradientUnits="userSpaceOnUse">
                  <stop stop-color="#7C3AED"/>
                  <stop offset="1" stop-color="#06B6D4"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span class="brand-name">SkillUp</span>
        </a>

        <div class="navbar-links" *ngIf="auth.user$ | async as user; else guestLinks">
          <a routerLink="/dashboard" routerLinkActive="active" class="nav-link">Skill Swap</a>
          <a routerLink="/interview" routerLinkActive="active" class="nav-link">Interview Sim</a>
          <a routerLink="/interview/history" routerLinkActive="active" class="nav-link">Analytics</a>
          <button class="btn btn-ghost btn-sm" (click)="logout()">Sign Out</button>
        </div>

        <ng-template #guestLinks>
          <div class="navbar-links">
            <a routerLink="/auth" class="nav-link">Sign In</a>
            <a routerLink="/auth" [queryParams]="{mode: 'signup'}" class="btn btn-primary btn-sm">Get Started</a>
          </div>
        </ng-template>

        <!-- Mobile menu toggle -->
        <button class="mobile-menu-btn" (click)="mobileOpen = !mobileOpen" aria-label="Toggle menu">
          <span></span><span></span><span></span>
        </button>
      </div>

      <!-- Mobile Dropdown -->
      <div class="mobile-menu" [class.open]="mobileOpen" *ngIf="mobileOpen">
        <ng-container *ngIf="auth.user$ | async; else mobileGuest">
          <a routerLink="/dashboard" class="mobile-link" (click)="mobileOpen=false">Skill Swap</a>
          <a routerLink="/interview" class="mobile-link" (click)="mobileOpen=false">AI Interview</a>
          <a routerLink="/interview/history" class="mobile-link" (click)="mobileOpen=false">Analytics</a>
          <button class="btn btn-ghost mobile-link" (click)="logout()">Sign Out</button>
        </ng-container>
        <ng-template #mobileGuest>
          <a routerLink="/auth" class="mobile-link" (click)="mobileOpen=false">Sign In</a>
          <a routerLink="/auth" [queryParams]="{mode:'signup'}" class="mobile-link" (click)="mobileOpen=false">Sign Up</a>
        </ng-template>
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      position: fixed;
      top: 0; left: 0; right: 0;
      height: var(--navbar-height);
      background: rgba(10, 10, 15, 0.85);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-bottom: 1px solid var(--border-subtle);
      z-index: 100;
    }
    .navbar-inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 100%;
    }
    .navbar-brand {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      text-decoration: none;
    }
    .brand-logo {
      width: 36px; height: 36px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(124, 58, 237, 0.15);
      border: 1px solid rgba(124, 58, 237, 0.3);
    }
    .brand-name {
      font-family: var(--font-heading);
      font-size: 1.3rem;
      font-weight: 800;
      background: var(--gradient-brand);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .navbar-links {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .nav-link {
      color: var(--text-secondary);
      text-decoration: none;
      font-size: 0.9rem;
      font-weight: 500;
      padding: 0.45rem 0.9rem;
      border-radius: var(--radius-full);
      transition: all var(--transition-fast);
    }
    .nav-link:hover, .nav-link.active {
      color: var(--text-primary);
      background: rgba(255,255,255,0.07);
    }
    .mobile-menu-btn {
      display: none;
      flex-direction: column;
      gap: 5px;
      background: none;
      border: none;
      cursor: pointer;
      padding: 8px;
    }
    .mobile-menu-btn span {
      display: block;
      width: 22px;
      height: 2px;
      background: var(--text-secondary);
      border-radius: 2px;
      transition: all var(--transition-fast);
    }
    .mobile-menu {
      background: var(--bg-secondary);
      border-top: 1px solid var(--border-subtle);
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .mobile-link {
      color: var(--text-secondary);
      text-decoration: none;
      font-size: 1rem;
      font-weight: 500;
      padding: 0.75rem 1rem;
      border-radius: var(--radius-md);
      display: block;
      transition: all var(--transition-fast);
    }
    .mobile-link:hover { color: var(--text-primary); background: rgba(255,255,255,0.05); }
    @media (max-width: 768px) {
      .navbar-links { display: none; }
      .mobile-menu-btn { display: flex; }
    }
  `]
})
export class NavbarComponent {
  mobileOpen = false;

  constructor(public auth: AuthService, private router: Router, private toast: ToastService) {}

  async logout() {
    await this.auth.signOut();
    this.toast.success('Signed out successfully');
    this.router.navigate(['/']);
    this.mobileOpen = false;
  }
}
