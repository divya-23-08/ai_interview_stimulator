import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-bg"></div>
      <div class="auth-container">
        <div class="auth-card glass-card">
          <!-- Brand -->
          <div class="auth-brand">
            <div class="brand-logo-lg">
              <svg width="36" height="36" viewBox="0 0 28 28" fill="none">
                <path d="M14 2C7.373 2 2 7.373 2 14s5.373 12 12 12 12-5.373 12-12S20.627 2 14 2z" fill="url(#ag)"/>
                <path d="M9 14l3 3 7-7" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <defs>
                  <linearGradient id="ag" x1="2" y1="2" x2="26" y2="26" gradientUnits="userSpaceOnUse">
                    <stop stop-color="#7C3AED"/><stop offset="1" stop-color="#06B6D4"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <h1 class="auth-app-name gradient-text">SkillUp</h1>
          </div>

          <!-- Tabs -->
          <div class="tabs auth-tabs">
            <button class="tab-btn" [class.active]="mode==='login'" (click)="mode='login'">Sign In</button>
            <button class="tab-btn" [class.active]="mode==='signup'" (click)="mode='signup'">Sign Up</button>
          </div>

          <!-- Login Form -->
          <form *ngIf="mode==='login'" (ngSubmit)="login()" class="auth-form">
            <h2 class="auth-title">Welcome back</h2>
            <p class="auth-subtitle">Sign in to continue your skill journey.</p>

            <div class="form-group">
              <label class="form-label" for="login-email">Email</label>
              <input id="login-email" type="email" class="form-control" [(ngModel)]="loginEmail" name="email" placeholder="you@example.com" required>
            </div>
            <div class="form-group">
              <label class="form-label" for="login-password">Password</label>
              <input id="login-password" type="password" class="form-control" [(ngModel)]="loginPassword" name="password" placeholder="••••••••" required>
            </div>

            <button type="submit" class="btn btn-primary auth-submit" [disabled]="loading">
              <span *ngIf="loading" class="spinner"></span>
              <span *ngIf="!loading">Sign In</span>
            </button>
          </form>

          <!-- Signup Form -->
          <form *ngIf="mode==='signup'" (ngSubmit)="signup()" class="auth-form">
            <h2 class="auth-title">Create account</h2>
            <p class="auth-subtitle">Join thousands of students on SkillUp.</p>

            <div class="form-grid">
              <div class="form-group">
                <label class="form-label" for="signup-name">Full Name</label>
                <input id="signup-name" type="text" class="form-control" [(ngModel)]="signupName" name="name" placeholder="Alex Chen" required>
              </div>
              <div class="form-group">
                <label class="form-label" for="signup-username">Username</label>
                <input id="signup-username" type="text" class="form-control" [(ngModel)]="signupUsername" name="username" placeholder="alexchen" required>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label" for="signup-email">Email</label>
              <input id="signup-email" type="email" class="form-control" [(ngModel)]="signupEmail" name="email" placeholder="you@example.com" required>
            </div>
            <div class="form-group">
              <label class="form-label" for="signup-password">Password</label>
              <input id="signup-password" type="password" class="form-control" [(ngModel)]="signupPassword" name="password" placeholder="Min. 8 characters" minlength="8" required>
            </div>

            <button type="submit" class="btn btn-primary auth-submit" [disabled]="loading">
              <span *ngIf="loading" class="spinner"></span>
              <span *ngIf="!loading">Create Account</span>
            </button>
          </form>

          <!-- Footer link -->
          <p class="auth-footer-text">
            <ng-container *ngIf="mode==='login'">
              Don't have an account?
              <button class="link-btn" (click)="mode='signup'">Sign up free</button>
            </ng-container>
            <ng-container *ngIf="mode==='signup'">
              Already have an account?
              <button class="link-btn" (click)="mode='login'">Sign in</button>
            </ng-container>
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }
    .auth-bg {
      position: absolute;
      inset: 0;
      background: var(--gradient-hero);
    }
    .auth-container {
      position: relative;
      z-index: 1;
      width: 100%;
      max-width: 460px;
      padding: 1rem;
    }
    .auth-card {
      padding: 2.5rem;
      animation: fadeInUp 0.4s ease;
    }
    .auth-brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 2rem;
      justify-content: center;
    }
    .brand-logo-lg {
      width: 52px; height: 52px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(124,58,237,0.15);
      border: 1px solid rgba(124,58,237,0.3);
    }
    .auth-app-name {
      font-family: var(--font-heading);
      font-size: 2rem;
      font-weight: 900;
    }
    .auth-tabs { margin-bottom: 2rem; }
    .auth-form { display: flex; flex-direction: column; }
    .auth-title {
      font-size: 1.5rem;
      font-weight: 800;
      margin-bottom: 0.4rem;
    }
    .auth-subtitle { color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 1.75rem; }
    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0 1rem;
    }
    .auth-submit {
      width: 100%;
      justify-content: center;
      padding: 0.8rem;
      font-size: 1rem;
      margin-top: 0.5rem;
    }
    .auth-footer-text {
      text-align: center;
      margin-top: 1.5rem;
      font-size: 0.875rem;
      color: var(--text-muted);
    }
    .link-btn {
      background: none;
      border: none;
      color: var(--brand-primary-light);
      cursor: pointer;
      font-size: inherit;
      font-family: inherit;
      font-weight: 600;
      padding: 0;
    }
    .link-btn:hover { color: var(--brand-secondary-light); }
    @media (max-width: 480px) {
      .auth-card { padding: 1.75rem 1.25rem; }
      .form-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class AuthComponent implements OnInit {
  mode: 'login' | 'signup' = 'login';
  loading = false;

  loginEmail = '';
  loginPassword = '';

  signupName = '';
  signupUsername = '';
  signupEmail = '';
  signupPassword = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(p => {
      if (p['mode'] === 'signup') this.mode = 'signup';
    });
    if (this.authService.isLoggedIn) {
      this.router.navigate(['/dashboard']);
    }
  }

  async login() {
    this.loading = true;
    try {
      await this.authService.signIn(this.loginEmail, this.loginPassword);
      this.toast.success('Welcome back! 🎉');
      this.router.navigate(['/dashboard']);
    } catch (e: any) {
      this.toast.error(e.message || 'Sign in failed');
    } finally {
      this.loading = false;
    }
  }

  async signup() {
    if (this.signupPassword.length < 8) {
      this.toast.error('Password must be at least 8 characters');
      return;
    }
    this.loading = true;
    try {
      await this.authService.signUp(this.signupEmail, this.signupPassword, this.signupName, this.signupUsername);
      this.toast.success('Account created! Check your email to verify. 🎉');
      this.mode = 'login';
    } catch (e: any) {
      this.toast.error(e.message || 'Sign up failed');
    } finally {
      this.loading = false;
    }
  }
}
