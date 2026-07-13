import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./components/landing/landing.component').then(m => m.LandingComponent) },
  { path: 'auth', loadComponent: () => import('./components/auth/auth.component').then(m => m.AuthComponent) },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./components/skill-swap/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'interview',
    canActivate: [authGuard],
    loadComponent: () => import('./components/interview/interview-home.component').then(m => m.InterviewHomeComponent)
  },
  {
    path: 'interview/session',
    canActivate: [authGuard],
    loadComponent: () => import('./components/interview/interview-session.component').then(m => m.InterviewSessionComponent)
  },
  {
    path: 'interview/history',
    canActivate: [authGuard],
    loadComponent: () => import('./components/interview/interview-history.component').then(m => m.InterviewHistoryComponent)
  },
  { path: '**', redirectTo: '' }
];
