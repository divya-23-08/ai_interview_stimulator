import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-interview-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="interview-home">
      <div class="ih-bg"></div>
      <div class="container ih-content">
        <!-- Header -->
        <div class="ih-header animate-fadeInUp">
          <div class="badge badge-cyan">AI Interview Simulator</div>
          <h1 class="ih-title">Practice. <span class="gradient-text">Improve.</span> Succeed.</h1>
          <p class="ih-subtitle">Simulate real interviews with AI-generated questions, voice-to-text answers, and instant expert feedback.</p>
        </div>

        <!-- Setup Card -->
        <div class="setup-card glass-card animate-fadeInUp stagger-2">
          <h2 class="setup-title">Configure Your Interview</h2>

          <!-- Topic Selection -->
          <div class="option-section">
            <label class="option-label">Interview Type</label>
            <div class="option-grid">
              <button class="option-btn" [class.selected]="topic==='Technical'" (click)="topic='Technical'; subtopic=''">
                <span class="ob-icon">💻</span>
                <span class="ob-title">Technical</span>
                <span class="ob-desc">DSA, System Design, Frameworks</span>
              </button>
              <button class="option-btn" [class.selected]="topic==='HR'" (click)="topic='HR'; subtopic=''">
                <span class="ob-icon">🤝</span>
                <span class="ob-title">HR / Behavioral</span>
                <span class="ob-desc">Situational, Culture, Experience</span>
              </button>
              <button class="option-btn" [class.selected]="topic==='Mixed'" (click)="topic='Mixed'; subtopic=''">
                <span class="ob-icon">⚡</span>
                <span class="ob-title">Mixed</span>
                <span class="ob-desc">Both Technical & HR questions</span>
              </button>
            </div>
          </div>

          <!-- Subtopic -->
          <div class="option-section" *ngIf="topic">
            <label class="option-label">Subtopic / Focus Area</label>
            <div class="subtopic-grid">
              <button
                *ngFor="let s of getSubtopics()"
                class="subtopic-btn"
                [class.selected]="subtopic===s"
                (click)="subtopic=s"
              >{{ s }}</button>
            </div>
          </div>

          <!-- Difficulty -->
          <div class="option-section">
            <label class="option-label">Difficulty Level</label>
            <div class="difficulty-grid">
              <button class="diff-btn easy" [class.selected]="difficulty==='Easy'" (click)="difficulty='Easy'">
                <span>🟢</span> Easy
              </button>
              <button class="diff-btn medium" [class.selected]="difficulty==='Medium'" (click)="difficulty='Medium'">
                <span>🟡</span> Medium
              </button>
              <button class="diff-btn hard" [class.selected]="difficulty==='Hard'" (click)="difficulty='Hard'">
                <span>🔴</span> Hard
              </button>
            </div>
          </div>

          <!-- Questions Count -->
          <div class="option-section">
            <label class="option-label">Number of Questions: <strong>{{ numQuestions }}</strong></label>
            <input type="range" min="3" max="10" [(ngModel)]="numQuestions" class="range-slider">
            <div class="range-labels"><span>3</span><span>10</span></div>
          </div>

          <!-- Start Button -->
          <button class="btn btn-primary start-btn" (click)="startInterview()" [disabled]="!topic || !difficulty">
            <span>🚀</span> Start Interview
          </button>
        </div>

        <!-- Info Cards -->
        <div class="info-cards animate-fadeInUp stagger-3">
          <div class="info-card glass-card" *ngFor="let card of infoCards">
            <div class="ic-icon">{{ card.icon }}</div>
            <div class="ic-title">{{ card.title }}</div>
            <div class="ic-desc">{{ card.desc }}</div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .interview-home { min-height: 100vh; position: relative; }
    .ih-bg {
      position: fixed;
      inset: 0;
      background: radial-gradient(ellipse at 70% 30%, rgba(6,182,212,0.12) 0%, transparent 50%),
                  radial-gradient(ellipse at 30% 70%, rgba(124,58,237,0.12) 0%, transparent 50%);
      pointer-events: none;
    }
    .ih-content { position: relative; padding-top: 3rem; padding-bottom: 4rem; max-width: 760px; }
    .ih-header { text-align: center; margin-bottom: 2.5rem; }
    .ih-title { font-size: clamp(2rem, 4vw, 2.75rem); font-weight: 900; margin: 1rem 0 0.75rem; }
    .ih-subtitle { color: var(--text-secondary); font-size: 1.05rem; }

    .setup-card { padding: 2.5rem; }
    .setup-title { font-size: 1.35rem; font-weight: 800; margin-bottom: 2rem; }
    .option-section { margin-bottom: 1.75rem; }
    .option-label { font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.07em; display: block; margin-bottom: 0.75rem; }

    .option-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; }
    .option-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.35rem;
      padding: 1.25rem 0.75rem;
      border: 2px solid var(--border-subtle);
      border-radius: var(--radius-md);
      background: transparent;
      cursor: pointer;
      transition: all var(--transition-base);
      color: var(--text-primary);
      font-family: var(--font-body);
      text-align: center;
    }
    .option-btn:hover { border-color: var(--border-medium); background: rgba(255,255,255,0.04); }
    .option-btn.selected { border-color: var(--brand-primary); background: rgba(124,58,237,0.12); }
    .ob-icon { font-size: 1.5rem; }
    .ob-title { font-weight: 700; font-size: 0.9rem; }
    .ob-desc { font-size: 0.75rem; color: var(--text-muted); }

    .subtopic-grid { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .subtopic-btn {
      padding: 0.45rem 1rem;
      border: 1px solid var(--border-medium);
      border-radius: var(--radius-full);
      background: transparent;
      color: var(--text-secondary);
      font-family: var(--font-body);
      font-size: 0.875rem;
      cursor: pointer;
      transition: all var(--transition-fast);
    }
    .subtopic-btn:hover { color: var(--text-primary); border-color: var(--border-strong); }
    .subtopic-btn.selected { background: rgba(124,58,237,0.2); border-color: var(--brand-primary); color: var(--brand-primary-light); }

    .difficulty-grid { display: flex; gap: 0.75rem; }
    .diff-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.7rem;
      border-radius: var(--radius-md);
      border: 2px solid var(--border-subtle);
      background: transparent;
      color: var(--text-secondary);
      font-family: var(--font-body);
      font-weight: 600;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all var(--transition-base);
    }
    .diff-btn.easy.selected { border-color: #10B981; background: rgba(16,185,129,0.12); color: #6EE7B7; }
    .diff-btn.medium.selected { border-color: #F59E0B; background: rgba(245,158,11,0.12); color: #FCD34D; }
    .diff-btn.hard.selected { border-color: #EF4444; background: rgba(239,68,68,0.12); color: #FCA5A5; }
    .diff-btn:hover { border-color: var(--border-medium); }

    .range-slider {
      width: 100%;
      -webkit-appearance: none;
      appearance: none;
      height: 6px;
      border-radius: 3px;
      background: rgba(255,255,255,0.1);
      outline: none;
      margin-bottom: 0.25rem;
    }
    .range-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: var(--brand-primary);
      cursor: pointer;
      box-shadow: 0 0 10px rgba(124,58,237,0.5);
    }
    .range-labels { display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-muted); }

    .start-btn { width: 100%; justify-content: center; padding: 1rem; font-size: 1.05rem; margin-top: 0.5rem; }

    .info-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-top: 2rem; }
    .info-card { padding: 1.5rem; text-align: center; }
    .ic-icon { font-size: 2rem; margin-bottom: 0.75rem; }
    .ic-title { font-weight: 700; margin-bottom: 0.35rem; font-size: 0.95rem; }
    .ic-desc { font-size: 0.8rem; color: var(--text-secondary); }

    @media (max-width: 600px) {
      .option-grid { grid-template-columns: 1fr; }
      .info-cards { grid-template-columns: 1fr; }
      .difficulty-grid { flex-direction: column; }
    }
  `]
})
export class InterviewHomeComponent {
  topic = '';
  subtopic = '';
  difficulty = 'Medium';
  numQuestions = 5;

  infoCards = [
    { icon: '🎙️', title: 'Voice-to-Text', desc: 'Answer naturally using your microphone. No typing needed.' },
    { icon: '🤖', title: 'AI Evaluation', desc: 'GPT-powered scoring with detailed feedback on every answer.' },
    { icon: '📊', title: 'Track Progress', desc: 'See your scores over time and identify weak areas.' }
  ];

  technicalSubtopics = ['JavaScript', 'TypeScript', 'React', 'Angular', 'Node.js', 'Python', 'Java', 'Data Structures', 'Algorithms', 'System Design', 'Databases', 'Docker/K8s', 'Machine Learning', 'REST APIs'];
  hrSubtopics = ['Leadership', 'Teamwork', 'Conflict Resolution', 'Time Management', 'Career Goals', 'Strengths & Weaknesses', 'Problem Solving'];
  mixedSubtopics = ['Frontend Dev', 'Backend Dev', 'Full Stack', 'Data Science', 'DevOps', 'Product Management'];

  constructor(private router: Router) {}

  getSubtopics() {
    if (this.topic === 'Technical') return this.technicalSubtopics;
    if (this.topic === 'HR') return this.hrSubtopics;
    return this.mixedSubtopics;
  }

  startInterview() {
    if (!this.topic || !this.difficulty) return;
    this.router.navigate(['/interview/session'], {
      queryParams: { topic: this.topic, subtopic: this.subtopic || '', difficulty: this.difficulty, num: this.numQuestions }
    });
  }
}
