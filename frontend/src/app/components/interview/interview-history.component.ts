import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { InterviewService, InterviewSession } from '../../services/interview.service';

@Component({
  selector: 'app-interview-history',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="history-page">
      <div class="container">
        <!-- Header -->
        <div class="history-header">
          <div>
            <h1>Performance <span class="gradient-text">Analytics</span></h1>
            <p>Track your interview practice progress over time.</p>
          </div>
          <a routerLink="/interview" class="btn btn-primary">+ New Interview</a>
        </div>

        <!-- Stats Overview -->
        <div class="stats-grid" *ngIf="sessions.length > 0">
          <div class="stat-card glass-card">
            <div class="sc-icon">📋</div>
            <div class="sc-value">{{ sessions.length }}</div>
            <div class="sc-label">Total Sessions</div>
          </div>
          <div class="stat-card glass-card">
            <div class="sc-icon">⭐</div>
            <div class="sc-value">{{ avgScore | number:'1.1-1' }}%</div>
            <div class="sc-label">Average Score</div>
          </div>
          <div class="stat-card glass-card">
            <div class="sc-icon">🏆</div>
            <div class="sc-value">{{ bestScore | number:'1.0-0' }}%</div>
            <div class="sc-label">Best Score</div>
          </div>
          <div class="stat-card glass-card">
            <div class="sc-icon">📈</div>
            <div class="sc-value" [style.color]="trend >= 0 ? '#10B981' : '#EF4444'">{{ trend >= 0 ? '+' : '' }}{{ trend | number:'1.0-0' }}%</div>
            <div class="sc-label">Trend (last 3)</div>
          </div>
        </div>

        <!-- Chart-like Progress Bars -->
        <div class="progress-section glass-card" *ngIf="sessions.length > 1">
          <h3 class="ps-title">Score History</h3>
          <div class="score-history">
            <div class="sh-item" *ngFor="let s of sessions.slice(0, 10).reverse(); let i = index">
              <div class="shi-label">{{ s.topic }}</div>
              <div class="shi-bar-wrap">
                <div class="progress-bar">
                  <div class="progress-fill" [style.width]="s.percentage + '%'" [style.background]="getBarColor(s.percentage)"></div>
                </div>
                <span class="shi-val" [style.color]="getBarColor(s.percentage)">{{ s.percentage }}%</span>
              </div>
              <div class="shi-date">{{ s.completed_at | date:'MMM d' }}</div>
            </div>
          </div>
        </div>

        <!-- Topic Breakdown -->
        <div class="topic-breakdown" *ngIf="topicStats.length">
          <h3 class="tb-title">Performance by Topic</h3>
          <div class="topic-grid">
            <div class="topic-card glass-card" *ngFor="let t of topicStats">
              <div class="tc-header">
                <span class="tc-topic">{{ t.topic }}</span>
                <span class="badge" [ngClass]="getBadgeClass(t.avg)">{{ t.avg | number:'1.0-0' }}%</span>
              </div>
              <div class="tc-detail">{{ t.count }} session{{ t.count !== 1 ? 's' : '' }}</div>
              <div class="progress-bar" style="margin-top:0.5rem">
                <div class="progress-fill" [style.width]="t.avg + '%'" [style.background]="getBarColor(t.avg)"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Session History Table -->
        <div class="sessions-table glass-card" *ngIf="sessions.length">
          <h3 class="st-title">Session History</h3>
          <div class="table-wrapper">
            <table class="history-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Topic</th>
                  <th>Subtopic</th>
                  <th>Difficulty</th>
                  <th>Score</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let s of sessions">
                  <td class="td-date">{{ s.completed_at | date:'MMM d, y' }}</td>
                  <td><span class="badge badge-primary">{{ s.topic }}</span></td>
                  <td class="td-sub">{{ s.subtopic || '—' }}</td>
                  <td>
                    <span class="badge" [ngClass]="s.difficulty==='Easy'?'badge-success':s.difficulty==='Hard'?'badge-danger':'badge-warning'">
                      {{ s.difficulty }}
                    </span>
                  </td>
                  <td class="td-score" [style.color]="getBarColor(s.percentage)">{{ s.percentage }}%</td>
                  <td><span class="badge badge-success">{{ s.status }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Empty State -->
        <div class="empty-state" *ngIf="sessions.length === 0 && !loading">
          <div class="empty-state-icon">📊</div>
          <h3>No interviews yet</h3>
          <p>Start your first AI interview session to see your performance analytics here.</p>
          <a routerLink="/interview" class="btn btn-primary">Start First Interview</a>
        </div>

        <!-- Loading -->
        <div class="loading-center" *ngIf="loading">
          <div class="spinner spinner-lg"></div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .history-page { padding: 2rem 0 4rem; }
    .history-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 2rem;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .history-header h1 { font-size: 2rem; font-weight: 800; }
    .history-header p { color: var(--text-secondary); margin-top: 0.25rem; }

    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
    .stat-card { padding: 1.5rem; text-align: center; }
    .sc-icon { font-size: 1.75rem; margin-bottom: 0.5rem; }
    .sc-value { font-size: 2rem; font-weight: 900; font-family: var(--font-heading); }
    .sc-label { font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.07em; margin-top: 0.25rem; }

    .progress-section { padding: 1.75rem; margin-bottom: 1.5rem; }
    .ps-title { font-size: 1rem; font-weight: 700; margin-bottom: 1.25rem; }
    .score-history { display: flex; flex-direction: column; gap: 0.75rem; }
    .sh-item { display: flex; align-items: center; gap: 0.75rem; }
    .shi-label { font-size: 0.8rem; color: var(--text-muted); width: 80px; flex-shrink: 0; }
    .shi-bar-wrap { flex: 1; display: flex; align-items: center; gap: 0.75rem; }
    .shi-bar-wrap .progress-bar { flex: 1; }
    .shi-val { font-size: 0.85rem; font-weight: 700; width: 40px; text-align: right; }
    .shi-date { font-size: 0.75rem; color: var(--text-muted); width: 50px; text-align: right; }

    .topic-breakdown { margin-bottom: 1.5rem; }
    .tb-title { font-size: 1rem; font-weight: 700; margin-bottom: 1rem; }
    .topic-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; }
    .topic-card { padding: 1.25rem; }
    .tc-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.3rem; }
    .tc-topic { font-weight: 700; font-size: 0.9rem; }
    .tc-detail { font-size: 0.8rem; color: var(--text-muted); }

    .sessions-table { padding: 1.75rem; }
    .st-title { font-size: 1rem; font-weight: 700; margin-bottom: 1.25rem; }
    .table-wrapper { overflow-x: auto; }
    .history-table { width: 100%; border-collapse: collapse; }
    .history-table th {
      text-align: left;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      color: var(--text-muted);
      padding: 0.5rem 1rem;
      border-bottom: 1px solid var(--border-subtle);
    }
    .history-table td {
      padding: 0.75rem 1rem;
      font-size: 0.875rem;
      border-bottom: 1px solid rgba(255,255,255,0.04);
    }
    .td-date, .td-sub { color: var(--text-secondary); }
    .td-score { font-weight: 700; }
    .loading-center { display: flex; justify-content: center; padding: 4rem; }

    @media (max-width: 768px) {
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
      .history-header { flex-direction: column; align-items: flex-start; }
    }
    @media (max-width: 480px) { .stats-grid { grid-template-columns: 1fr; } }
  `]
})
export class InterviewHistoryComponent implements OnInit {
  sessions: InterviewSession[] = [];
  loading = true;

  get avgScore(): number {
    if (!this.sessions.length) return 0;
    return this.sessions.reduce((s, i) => s + i.percentage, 0) / this.sessions.length;
  }

  get bestScore(): number {
    return Math.max(...this.sessions.map(s => s.percentage), 0);
  }

  get trend(): number {
    if (this.sessions.length < 3) return 0;
    const last3 = this.sessions.slice(0, 3);
    const first3 = this.sessions.slice(-3);
    return (last3.reduce((s, i) => s + i.percentage, 0) / 3) - (first3.reduce((s, i) => s + i.percentage, 0) / 3);
  }

  get topicStats(): { topic: string; count: number; avg: number }[] {
    const map: { [t: string]: number[] } = {};
    for (const s of this.sessions) {
      if (!map[s.topic]) map[s.topic] = [];
      map[s.topic].push(s.percentage);
    }
    return Object.entries(map).map(([topic, scores]) => ({
      topic,
      count: scores.length,
      avg: scores.reduce((a, b) => a + b, 0) / scores.length
    }));
  }

  constructor(private interviewService: InterviewService) {}

  async ngOnInit() {
    try {
      this.sessions = await this.interviewService.getInterviewHistory();
    } catch (e) {}
    this.loading = false;
  }

  getBarColor(pct: number): string {
    if (pct >= 80) return '#10B981';
    if (pct >= 60) return '#7C3AED';
    if (pct >= 40) return '#F59E0B';
    return '#EF4444';
  }

  getBadgeClass(pct: number): string {
    if (pct >= 80) return 'badge-success';
    if (pct >= 60) return 'badge-primary';
    if (pct >= 40) return 'badge-warning';
    return 'badge-danger';
  }
}
