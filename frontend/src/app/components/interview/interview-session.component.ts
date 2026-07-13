import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { InterviewService, InterviewQuestion, EvaluationResult, InterviewReport } from '../../services/interview.service';
import { ToastService } from '../../services/toast.service';

type SessionState = 'loading' | 'active' | 'evaluating' | 'result' | 'report';

interface QuestionResult {
  question: string;
  type: string;
  answer: string;
  evaluation: EvaluationResult | null;
  questionId: string;
}

@Component({
  selector: 'app-interview-session',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Loading State -->
    <div class="session-page" *ngIf="state === 'loading'">
      <div class="loading-screen">
        <div class="spinner spinner-lg"></div>
        <h2>Generating your questions...</h2>
        <p>AI is crafting personalized {{ topic }} questions at {{ difficulty }} difficulty.</p>
      </div>
    </div>

    <!-- Active Interview -->
    <div class="session-page" *ngIf="state === 'active'">
      <div class="container session-container">
        <!-- Header bar -->
        <div class="session-header glass-card">
          <div class="sh-left">
            <span class="badge badge-primary">{{ topic }}</span>
            <span class="badge badge-warning" *ngIf="subtopic">{{ subtopic }}</span>
            <span class="badge" [ngClass]="difficulty==='Easy'?'badge-success':difficulty==='Hard'?'badge-danger':'badge-warning'">{{ difficulty }}</span>
          </div>
          <div class="sh-progress">
            <span class="progress-label">{{ currentIndex + 1 }} / {{ questions.length }}</span>
            <div class="progress-bar" style="width:160px">
              <div class="progress-fill" [style.width]="((currentIndex) / questions.length * 100) + '%'"></div>
            </div>
          </div>
          <div class="sh-timer" [class.warning]="timer < 60">⏱ {{ formatTime(timer) }}</div>
        </div>

        <!-- Question Card -->
        <div class="question-card glass-card animate-fadeInUp">
          <div class="qc-meta">
            <span class="badge badge-cyan">Q{{ currentIndex + 1 }}</span>
            <span class="badge badge-primary">{{ currentQuestion?.type }}</span>
            <span class="qc-hint" *ngIf="showHint">💡 {{ currentQuestion?.hints }}</span>
          </div>

          <div class="question-text">{{ currentQuestion?.question }}</div>

          <!-- Hint Toggle -->
          <button class="btn btn-ghost btn-sm hint-btn" (click)="showHint = !showHint">
            {{ showHint ? 'Hide hint' : '💡 Show hint' }}
          </button>

          <!-- Answer Area -->
          <div class="answer-section">
            <div class="answer-toolbar">
              <span class="answer-label">Your Answer</span>
              <div class="toolbar-right">
                <!-- Voice Button -->
                <button
                  class="btn voice-btn"
                  [class.recording]="isRecording"
                  (click)="toggleVoice()"
                  [title]="isRecording ? 'Stop recording' : 'Start voice input'"
                >
                  <span *ngIf="!isRecording">🎙️ Voice</span>
                  <span *ngIf="isRecording" class="recording-label">
                    <span class="voice-indicator">
                      <span></span><span></span><span></span><span></span><span></span>
                    </span>
                    Stop
                  </span>
                </button>
                <span class="word-count">{{ wordCount }} words</span>
              </div>
            </div>
            <textarea
              class="form-control answer-area"
              [(ngModel)]="currentAnswer"
              placeholder="Type your answer or use the 🎙️ Voice button to speak..."
              rows="6"
              [disabled]="isRecording"
            ></textarea>
          </div>

          <!-- Actions -->
          <div class="question-actions">
            <button class="btn btn-ghost" (click)="skipQuestion()">Skip →</button>
            <button
              class="btn btn-primary"
              (click)="submitAnswer()"
              [disabled]="!currentAnswer.trim() || evaluating"
            >
              <span *ngIf="evaluating" class="spinner"></span>
              <span *ngIf="!evaluating">Submit Answer</span>
            </button>
          </div>
        </div>

        <!-- Previous Results Preview -->
        <div class="prev-results" *ngIf="results.length > 0">
          <h3 class="prev-title">Previous Answers</h3>
          <div class="prev-list">
            <div class="prev-item" *ngFor="let r of results; let i = index">
              <span class="prev-q">Q{{ i+1 }}: {{ r.question | slice:0:60 }}...</span>
              <span class="prev-score" [style.color]="getScoreColor(r.evaluation?.score)">
                {{ r.evaluation?.score | number:'1.1-1' }}/10
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Evaluation Display (after submitting) -->
    <div class="session-page" *ngIf="state === 'evaluating'">
      <div class="loading-screen">
        <div class="spinner spinner-lg" style="border-top-color: #06B6D4"></div>
        <h2>AI is evaluating your answer...</h2>
        <p>Analyzing clarity, depth, accuracy, and completeness.</p>
      </div>
    </div>

    <!-- Per-Answer Result -->
    <div class="session-page" *ngIf="state === 'result'">
      <div class="container result-container">
        <div class="result-card glass-card animate-fadeInUp">
          <div class="result-header">
            <div class="result-q">Q{{ currentIndex }} / {{ questions.length }}</div>
            <div class="score-display" [ngClass]="getScoreClass(lastEval?.score)">
              <div class="sd-score">{{ lastEval?.score | number:'1.1-1' }}</div>
              <div class="sd-label">out of 10</div>
            </div>
          </div>

          <div class="result-question">{{ results[results.length-1]?.question }}</div>

          <!-- Your answer -->
          <div class="result-section">
            <div class="rs-label">Your Answer</div>
            <div class="rs-content answer-display">{{ results[results.length-1]?.answer }}</div>
          </div>

          <!-- AI Feedback -->
          <div class="result-section">
            <div class="rs-label">AI Feedback</div>
            <div class="rs-content">{{ lastEval?.feedback }}</div>
          </div>

          <!-- Strengths & Improvements -->
          <div class="strengths-grid">
            <div class="sg-section">
              <div class="rs-label">✅ Strengths</div>
              <ul class="feedback-list">
                <li *ngFor="let s of lastEval?.strengths">{{ s }}</li>
              </ul>
            </div>
            <div class="sg-section">
              <div class="rs-label">🎯 Improvements</div>
              <ul class="feedback-list improve">
                <li *ngFor="let i of lastEval?.improvements">{{ i }}</li>
              </ul>
            </div>
          </div>

          <!-- Model Answer -->
          <div class="result-section">
            <div class="rs-label">💡 Model Answer</div>
            <div class="rs-content model-answer">{{ lastEval?.modelAnswer }}</div>
          </div>

          <!-- Next / Finish -->
          <div class="result-actions">
            <button class="btn btn-primary result-next" (click)="nextQuestion()">
              {{ currentIndex >= questions.length ? '📊 See Final Report' : 'Next Question →' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Final Report -->
    <div class="session-page" *ngIf="state === 'report'">
      <div class="container report-container">
        <div class="report-card glass-card animate-fadeInUp" *ngIf="report">
          <!-- Score Overview -->
          <div class="report-hero">
            <h1 class="report-title">Interview Complete! 🎉</h1>
            <div class="report-scores">
              <div class="rs-circle" [ngClass]="getScoreClass(report.percentage / 10)">
                <div class="rsc-num">{{ report.percentage }}%</div>
                <div class="rsc-label">Overall</div>
              </div>
              <div class="rs-details">
                <div class="rsd-item">
                  <span class="rsd-label">Score</span>
                  <span class="rsd-val">{{ report.totalScore | number:'1.1-1' }} / {{ report.maxScore }}</span>
                </div>
                <div class="rsd-item">
                  <span class="rsd-label">Topic</span>
                  <span class="rsd-val">{{ topic }}</span>
                </div>
                <div class="rsd-item">
                  <span class="rsd-label">Difficulty</span>
                  <span class="rsd-val">{{ difficulty }}</span>
                </div>
                <div class="rsd-item">
                  <span class="rsd-label">Readiness</span>
                  <span class="rsd-val badge" [ngClass]="getReadinessClass(report.readinessLevel)">{{ report.readinessLevel }}</span>
                </div>
              </div>
            </div>
            <div class="report-overall">{{ report.overallFeedback }}</div>
          </div>

          <!-- Per-question breakdown -->
          <div class="qa-breakdown">
            <h3>Question Breakdown</h3>
            <div class="qa-item" *ngFor="let r of results; let i = index">
              <div class="qa-header">
                <span class="qa-num">Q{{ i+1 }}</span>
                <span class="qa-q">{{ r.question }}</span>
                <span class="qa-score" [style.color]="getScoreColor(r.evaluation?.score)">{{ r.evaluation?.score | number:'1.1-1' }}/10</span>
              </div>
              <div class="qa-feedback">{{ r.evaluation?.feedback }}</div>
            </div>
          </div>

          <!-- Strengths & Improvements -->
          <div class="report-section-grid">
            <div class="rsg-col">
              <h3>💪 Key Strengths</h3>
              <ul class="report-list">
                <li *ngFor="let s of report.keyStrengths">{{ s }}</li>
              </ul>
            </div>
            <div class="rsg-col">
              <h3>📈 Areas to Improve</h3>
              <ul class="report-list improve">
                <li *ngFor="let a of report.areasForImprovement">{{ a }}</li>
              </ul>
            </div>
          </div>

          <!-- Resources & Next Steps -->
          <div class="report-resources">
            <h3>📚 Recommended Resources</h3>
            <ul class="report-list">
              <li *ngFor="let r of report.recommendedResources">{{ r }}</li>
            </ul>
          </div>
          <div class="report-next">
            <h3>🎯 Next Steps</h3>
            <p>{{ report.nextSteps }}</p>
          </div>

          <!-- Actions -->
          <div class="report-actions">
            <button class="btn btn-secondary" (click)="goHome()">← New Interview</button>
            <button class="btn btn-primary" (click)="goHistory()">View All History</button>
          </div>
        </div>

        <!-- Report Loading -->
        <div class="loading-screen" *ngIf="!report">
          <div class="spinner spinner-lg"></div>
          <h2>Generating your report...</h2>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .session-page { min-height: 100vh; }
    .loading-screen {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 70vh;
      gap: 1.25rem;
      text-align: center;
      padding: 2rem;
    }
    .loading-screen h2 { font-size: 1.5rem; font-weight: 700; }
    .loading-screen p { color: var(--text-secondary); }

    /* Session Container */
    .session-container { padding: 2rem 0; display: flex; flex-direction: column; gap: 1.5rem; max-width: 800px; }
    .session-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.875rem 1.25rem;
      flex-wrap: wrap;
      gap: 0.75rem;
    }
    .sh-left { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .sh-progress { display: flex; align-items: center; gap: 0.75rem; }
    .progress-label { font-size: 0.85rem; color: var(--text-muted); white-space: nowrap; }
    .sh-timer { font-family: var(--font-mono); font-size: 0.95rem; font-weight: 600; color: var(--text-secondary); }
    .sh-timer.warning { color: #FCA5A5; animation: pulse-glow 1s infinite; }

    /* Question Card */
    .question-card { padding: 2rem; display: flex; flex-direction: column; gap: 1.25rem; }
    .qc-meta { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
    .qc-hint { font-size: 0.85rem; color: var(--brand-accent); font-style: italic; margin-left: auto; }
    .question-text {
      font-size: 1.2rem;
      font-weight: 600;
      color: var(--text-primary);
      line-height: 1.5;
      padding: 1.25rem;
      background: rgba(124,58,237,0.06);
      border-radius: var(--radius-md);
      border-left: 3px solid var(--brand-primary);
    }
    .hint-btn { align-self: flex-start; }

    /* Answer Area */
    .answer-section { display: flex; flex-direction: column; gap: 0.5rem; }
    .answer-toolbar { display: flex; align-items: center; justify-content: space-between; }
    .answer-label { font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.07em; }
    .toolbar-right { display: flex; align-items: center; gap: 0.75rem; }
    .word-count { font-size: 0.8rem; color: var(--text-muted); }
    .voice-btn {
      display: flex; align-items: center; gap: 0.4rem;
      background: rgba(124,58,237,0.1);
      border: 1px solid rgba(124,58,237,0.3);
      color: var(--brand-primary-light);
      padding: 0.4rem 0.85rem;
      font-size: 0.85rem;
      border-radius: var(--radius-full);
      cursor: pointer;
      font-family: var(--font-body);
      font-weight: 500;
      transition: all var(--transition-base);
    }
    .voice-btn.recording {
      background: rgba(239,68,68,0.15);
      border-color: rgba(239,68,68,0.4);
      color: #FCA5A5;
      animation: pulse-glow 1.5s infinite;
    }
    .recording-label { display: flex; align-items: center; gap: 0.5rem; }
    .answer-area { min-height: 160px; font-size: 0.95rem; resize: vertical; }
    .question-actions { display: flex; justify-content: space-between; align-items: center; }

    /* Previous Results */
    .prev-results { background: rgba(255,255,255,0.02); border-radius: var(--radius-md); padding: 1.25rem; border: 1px solid var(--border-subtle); }
    .prev-title { font-size: 0.9rem; font-weight: 700; color: var(--text-secondary); margin-bottom: 0.75rem; text-transform: uppercase; letter-spacing: 0.07em; }
    .prev-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .prev-item { display: flex; justify-content: space-between; align-items: center; }
    .prev-q { font-size: 0.85rem; color: var(--text-secondary); flex: 1; }
    .prev-score { font-weight: 700; font-size: 0.9rem; margin-left: 1rem; white-space: nowrap; }

    /* Result State */
    .result-container { padding: 2rem 0; max-width: 800px; }
    .result-card { padding: 2.5rem; display: flex; flex-direction: column; gap: 1.5rem; }
    .result-header { display: flex; align-items: center; justify-content: space-between; }
    .result-q { font-size: 0.9rem; color: var(--text-muted); }
    .score-display {
      display: flex; flex-direction: column; align-items: center;
      padding: 1rem 1.5rem;
      border-radius: var(--radius-md);
      border: 2px solid;
    }
    .score-display.excellent { border-color: #10B981; }
    .score-display.good { border-color: var(--brand-primary); }
    .score-display.average { border-color: #F59E0B; }
    .score-display.poor { border-color: #EF4444; }
    .sd-score { font-size: 2rem; font-weight: 900; }
    .sd-label { font-size: 0.75rem; color: var(--text-muted); }
    .result-question {
      font-size: 1rem;
      font-weight: 600;
      padding: 1rem;
      background: rgba(255,255,255,0.04);
      border-radius: var(--radius-md);
    }
    .result-section { display: flex; flex-direction: column; gap: 0.5rem; }
    .rs-label { font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); }
    .rs-content { font-size: 0.95rem; color: var(--text-secondary); line-height: 1.7; padding: 0.75rem 1rem; background: rgba(255,255,255,0.03); border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); }
    .answer-display { color: var(--text-primary); }
    .model-answer { border-left: 3px solid var(--brand-secondary); background: rgba(6,182,212,0.05); }
    .strengths-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .feedback-list { list-style: none; display: flex; flex-direction: column; gap: 0.5rem; margin-top: 0.5rem; }
    .feedback-list li {
      font-size: 0.875rem;
      color: var(--text-secondary);
      padding: 0.4rem 0.6rem;
      border-radius: var(--radius-sm);
      background: rgba(16,185,129,0.07);
      border: 1px solid rgba(16,185,129,0.15);
    }
    .feedback-list.improve li { background: rgba(245,158,11,0.07); border-color: rgba(245,158,11,0.15); }
    .result-actions { display: flex; justify-content: center; }
    .result-next { padding: 0.9rem 2rem; font-size: 1rem; }

    /* Report */
    .report-container { padding: 2rem 0; max-width: 900px; }
    .report-card { padding: 2.5rem; display: flex; flex-direction: column; gap: 2rem; }
    .report-hero { text-align: center; }
    .report-title { font-size: 2rem; font-weight: 900; margin-bottom: 1.5rem; }
    .report-scores { display: flex; align-items: center; justify-content: center; gap: 2rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
    .rs-circle {
      width: 110px; height: 110px;
      border-radius: 50%;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      border: 4px solid;
    }
    .rs-circle.excellent { border-color: #10B981; }
    .rs-circle.good { border-color: var(--brand-primary); }
    .rs-circle.average { border-color: #F59E0B; }
    .rs-circle.poor { border-color: #EF4444; }
    .rsc-num { font-size: 1.75rem; font-weight: 900; }
    .rsc-label { font-size: 0.75rem; color: var(--text-muted); }
    .rs-details { display: flex; flex-direction: column; gap: 0.5rem; }
    .rsd-item { display: flex; align-items: center; gap: 1rem; }
    .rsd-label { font-size: 0.8rem; color: var(--text-muted); width: 80px; }
    .rsd-val { font-weight: 600; }
    .report-overall { color: var(--text-secondary); font-size: 1rem; line-height: 1.7; max-width: 600px; margin: 0 auto; }
    .qa-breakdown h3, .report-resources h3, .report-next h3 { font-size: 1.1rem; font-weight: 700; margin-bottom: 1rem; }
    .qa-item { padding: 1rem; background: rgba(255,255,255,0.03); border-radius: var(--radius-md); border: 1px solid var(--border-subtle); margin-bottom: 0.75rem; }
    .qa-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem; flex-wrap: wrap; }
    .qa-num { font-weight: 700; font-size: 0.85rem; color: var(--text-muted); }
    .qa-q { flex: 1; font-size: 0.9rem; font-weight: 600; }
    .qa-score { font-weight: 700; }
    .qa-feedback { font-size: 0.85rem; color: var(--text-secondary); }
    .report-section-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
    .rsg-col h3 { font-size: 1rem; font-weight: 700; margin-bottom: 0.75rem; }
    .report-list { list-style: none; display: flex; flex-direction: column; gap: 0.5rem; }
    .report-list li {
      font-size: 0.875rem;
      color: var(--text-secondary);
      padding: 0.5rem 0.75rem;
      border-radius: var(--radius-sm);
      background: rgba(16,185,129,0.07);
      border: 1px solid rgba(16,185,129,0.15);
    }
    .report-list.improve li { background: rgba(245,158,11,0.07); border-color: rgba(245,158,11,0.15); }
    .report-resources, .report-next { padding: 1.25rem; background: rgba(255,255,255,0.03); border-radius: var(--radius-md); border: 1px solid var(--border-subtle); }
    .report-next p { color: var(--text-secondary); font-size: 0.95rem; line-height: 1.6; }
    .report-actions { display: flex; gap: 1rem; justify-content: center; }
    .getReadinessClass-badge-success { background: rgba(16,185,129,0.15); color: #6EE7B7; }

    @media (max-width: 600px) {
      .session-header { flex-direction: column; align-items: flex-start; }
      .strengths-grid { grid-template-columns: 1fr; }
      .report-section-grid { grid-template-columns: 1fr; }
      .report-actions { flex-direction: column; }
    }
  `]
})
export class InterviewSessionComponent implements OnInit, OnDestroy {
  state: SessionState = 'loading';
  topic = '';
  subtopic = '';
  difficulty = '';
  questions: InterviewQuestion[] = [];
  results: QuestionResult[] = [];
  currentIndex = 0;
  currentAnswer = '';
  showHint = false;
  isRecording = false;
  evaluating = false;
  timer = 120; // 2 min per question
  timerInterval: any;
  lastEval: EvaluationResult | null = null;
  report: InterviewReport | null = null;
  interviewId = '';
  questionIds: string[] = [];

  // Speech Recognition
  private recognition: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private interviewService: InterviewService,
    private toast: ToastService,
    private zone: NgZone
  ) {}

  async ngOnInit() {
    this.route.queryParams.subscribe(async (params) => {
      this.topic = params['topic'] || 'Technical';
      this.subtopic = params['subtopic'] || '';
      this.difficulty = params['difficulty'] || 'Medium';
      const num = parseInt(params['num']) || 5;
      await this.loadQuestions(num);
    });
  }

  ngOnDestroy() {
    clearInterval(this.timerInterval);
    if (this.recognition) this.recognition.abort();
  }

  async loadQuestions(num: number) {
    try {
      this.questions = await this.interviewService.startInterview(this.topic, this.subtopic, this.difficulty, num);
      this.interviewId = await this.interviewService.createInterviewSession(this.topic, this.subtopic, this.difficulty);

      // Save questions to DB
      for (let i = 0; i < this.questions.length; i++) {
        const qid = await this.interviewService.saveQuestion(this.interviewId, this.questions[i].question, this.questions[i].type, i + 1);
        this.questionIds.push(qid);
      }

      this.state = 'active';
      this.startTimer();
    } catch (e: any) {
      this.toast.error('Failed to load questions: ' + e.message);
      this.router.navigate(['/interview']);
    }
  }

  get currentQuestion(): InterviewQuestion | null {
    return this.questions[this.currentIndex] ?? null;
  }

  get wordCount(): number {
    return this.currentAnswer.trim().split(/\s+/).filter(Boolean).length;
  }

  startTimer() {
    this.timer = 120;
    clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      this.timer--;
      if (this.timer <= 0) {
        clearInterval(this.timerInterval);
        this.toast.info('Time up! Auto-submitting...');
        this.submitAnswer();
      }
    }, 1000);
  }

  formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  toggleVoice() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      this.toast.error('Voice input not supported in your browser. Please type your answer.');
      return;
    }

    if (this.isRecording) {
      this.recognition?.stop();
      this.isRecording = false;
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.lang = 'en-US';
    this.recognition.interimResults = true;
    this.recognition.continuous = true;

    this.recognition.onresult = (event: any) => {
      this.zone.run(() => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        this.currentAnswer = transcript;
      });
    };

    this.recognition.onerror = () => {
      this.zone.run(() => { this.isRecording = false; });
    };

    this.recognition.onend = () => {
      this.zone.run(() => { this.isRecording = false; });
    };

    this.recognition.start();
    this.isRecording = true;
  }

  async submitAnswer() {
    clearInterval(this.timerInterval);
    if (this.isRecording) { this.recognition?.stop(); this.isRecording = false; }
    const answer = this.currentAnswer.trim() || '(No answer provided)';
    this.state = 'evaluating';
    this.evaluating = true;

    try {
      const evaluation = await this.interviewService.evaluateAnswer(
        this.currentQuestion?.question || '',
        answer,
        this.topic,
        this.difficulty
      );

      await this.interviewService.saveEvaluation(this.questionIds[this.currentIndex], answer, evaluation);

      this.results.push({
        question: this.currentQuestion?.question || '',
        type: this.currentQuestion?.type || '',
        answer,
        evaluation,
        questionId: this.questionIds[this.currentIndex]
      });

      this.lastEval = evaluation;
      this.state = 'result';
    } catch (e: any) {
      this.toast.error('Evaluation failed: ' + e.message);
      this.state = 'active';
    }
    this.evaluating = false;
  }

  skipQuestion() {
    this.results.push({
      question: this.currentQuestion?.question || '',
      type: this.currentQuestion?.type || '',
      answer: '(Skipped)',
      evaluation: { score: 0, feedback: 'Skipped', strengths: [], improvements: ['Practice this type'], modelAnswer: '' },
      questionId: this.questionIds[this.currentIndex]
    });
    this.nextQuestion();
  }

  nextQuestion() {
    this.currentIndex++;
    this.currentAnswer = '';
    this.showHint = false;
    this.lastEval = null;

    if (this.currentIndex >= this.questions.length) {
      this.finishInterview();
    } else {
      this.state = 'active';
      this.startTimer();
    }
  }

  async finishInterview() {
    this.state = 'report';
    const totalScore = this.results.reduce((sum, r) => sum + (r.evaluation?.score || 0), 0);
    const maxScore = this.questions.length * 10;

    await this.interviewService.completeInterview(this.interviewId, totalScore, maxScore);

    try {
      this.report = await this.interviewService.generateReport(
        this.results.map(r => ({ question: r.question, answer: r.answer, score: r.evaluation?.score || 0, feedback: r.evaluation?.feedback || '' })),
        this.topic, this.difficulty
      );
    } catch (e: any) {
      this.toast.error('Report generation failed');
    }
  }

  getScoreColor(score?: number): string {
    if (!score && score !== 0) return 'var(--text-muted)';
    if (score >= 8) return '#10B981';
    if (score >= 6) return '#7C3AED';
    if (score >= 4) return '#F59E0B';
    return '#EF4444';
  }

  getScoreClass(score?: number): string {
    if (!score && score !== 0) return 'average';
    if (score >= 8) return 'excellent';
    if (score >= 6) return 'good';
    if (score >= 4) return 'average';
    return 'poor';
  }

  getReadinessClass(level: string): string {
    const map: { [k: string]: string } = {
      'Excellent': 'badge-success',
      'Ready': 'badge-primary',
      'Almost Ready': 'badge-cyan',
      'Needs Improvement': 'badge-warning',
      'Not Ready': 'badge-danger'
    };
    return map[level] || 'badge-primary';
  }

  goHome() { this.router.navigate(['/interview']); }
  goHistory() { this.router.navigate(['/interview/history']); }
}
