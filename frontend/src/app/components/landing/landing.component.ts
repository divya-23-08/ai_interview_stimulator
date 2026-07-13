import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-bg"></div>
      <div class="hero-particles">
        <div class="particle" *ngFor="let p of particles" [style]="p"></div>
      </div>
      <div class="container hero-content">
        <div class="hero-badge animate-fadeInUp">
          <span class="badge badge-primary">✦ Now with AI-Powered Interview Practice</span>
        </div>
        <h1 class="hero-title animate-fadeInUp stagger-1">
          Learn Skills.<br>
          <span class="gradient-text">Swap Knowledge.</span><br>
          Ace Interviews.
        </h1>
        <p class="hero-subtitle animate-fadeInUp stagger-2">
          SkillUp is where ambitious students exchange expertise, collaborate in real-time,
          and use AI to master technical and HR interviews — all in one place.
        </p>
        <div class="hero-cta animate-fadeInUp stagger-3">
          <a routerLink="/auth" [queryParams]="{mode:'signup'}" class="btn btn-primary btn-lg">
            Start for Free →
          </a>
          <a routerLink="/auth" class="btn btn-secondary btn-lg">
            Sign In
          </a>
        </div>
        <div class="hero-stats animate-fadeInUp stagger-4">
          <div class="stat">
            <span class="stat-number">10K+</span>
            <span class="stat-label">Students</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat">
            <span class="stat-number">500+</span>
            <span class="stat-label">Skills</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat">
            <span class="stat-number">98%</span>
            <span class="stat-label">Success Rate</span>
          </div>
        </div>
      </div>
      <div class="hero-graphic animate-float">
        <div class="graphic-card card-1 glass-card">
          <div class="graphic-icon">🤖</div>
          <div class="graphic-text">
            <div class="graphic-title">AI Feedback</div>
            <div class="graphic-sub">Score: 8.5/10</div>
          </div>
        </div>
        <div class="graphic-card card-2 glass-card">
          <div class="graphic-icon">💬</div>
          <div class="graphic-text">
            <div class="graphic-title">Match Found!</div>
            <div class="graphic-sub">React ↔ Python</div>
          </div>
        </div>
        <div class="graphic-card card-3 glass-card">
          <div class="graphic-icon">⭐</div>
          <div class="graphic-text">
            <div class="graphic-title">Session Rated</div>
            <div class="graphic-sub">★★★★★</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="features section">
      <div class="container">
        <div class="section-header text-center">
          <h2 class="section-title">Everything You Need to <span class="gradient-text">Level Up</span></h2>
          <p class="section-subtitle">Two powerful tools, one unified platform for student success.</p>
        </div>
        <div class="features-grid">
          <div class="feature-card glass-card" *ngFor="let f of features; let i = index" [class]="'stagger-' + (i+1) + ' animate-fadeInUp'">
            <div class="feature-icon" [style.background]="f.bg">{{ f.icon }}</div>
            <h3 class="feature-title">{{ f.title }}</h3>
            <p class="feature-desc">{{ f.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Skill Swap Section -->
    <section class="section how-it-works">
      <div class="container">
        <div class="hiw-grid">
          <div class="hiw-content">
            <div class="badge badge-primary hiw-badge">Skill Swap Platform</div>
            <h2 class="section-title mt-lg">Teach One, Learn One.<br><span class="gradient-text">Free Forever.</span></h2>
            <p class="section-subtitle" style="margin-bottom: 1.5rem">No subscription. No payment. Just mutual skill exchange between students who want to grow together.</p>
            <div class="steps">
              <div class="step" *ngFor="let s of swapSteps; let i = index">
                <div class="step-num">{{ i + 1 }}</div>
                <div class="step-content">
                  <div class="step-title">{{ s.title }}</div>
                  <div class="step-desc">{{ s.desc }}</div>
                </div>
              </div>
            </div>
            <a routerLink="/auth" [queryParams]="{mode:'signup'}" class="btn btn-primary mt-xl">Start Swapping →</a>
          </div>
          <div class="hiw-visual">
            <div class="match-preview glass-card">
              <div class="match-header">
                <div class="avatar-placeholder" style="width:48px;height:48px;font-size:1.2rem">A</div>
                <div class="match-info">
                  <div class="match-name">Alex Chen</div>
                  <div class="match-skills">
                    <span class="badge badge-primary">Teaches: React</span>
                    <span class="badge badge-cyan">Learns: Python</span>
                  </div>
                </div>
                <button class="btn btn-primary btn-sm">Connect</button>
              </div>
              <div class="match-bio">Full-stack dev student. Let's swap skills and grow together! 🚀</div>
              <div class="match-rating">
                <span class="star filled">★</span><span class="star filled">★</span>
                <span class="star filled">★</span><span class="star filled">★</span>
                <span class="star filled">★</span>
                <span style="color:var(--text-muted); font-size:0.8rem; margin-left:0.5rem">4.9 (23 reviews)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Interview Section -->
    <section class="section interview-section">
      <div class="container">
        <div class="hiw-grid reverse">
          <div class="interview-visual">
            <div class="interview-preview glass-card">
              <div class="ip-header">
                <span class="badge badge-primary">Technical Interview</span>
                <span class="badge badge-success">🎙 Listening...</span>
              </div>
              <div class="ip-question">
                "Explain the difference between useEffect and useLayoutEffect in React."
              </div>
              <div class="voice-indicator ip-voice">
                <span></span><span></span><span></span><span></span><span></span>
              </div>
              <div class="ip-score-row">
                <div class="ip-score">
                  <div class="score-label">Last Answer</div>
                  <div class="score-value">8.5<span>/10</span></div>
                </div>
                <div class="ip-feedback">
                  <div class="score-label">AI Feedback</div>
                  <div class="feedback-text">"Great explanation! Add useLayoutEffect's synchronous nature."</div>
                </div>
              </div>
            </div>
          </div>
          <div class="hiw-content">
            <div class="badge badge-cyan hiw-badge">AI Interview Simulator</div>
            <h2 class="section-title mt-lg"><span class="gradient-text">AI-Powered</span><br>Interview Practice</h2>
            <p class="section-subtitle" style="margin-bottom: 1.5rem">Practice Technical and HR interviews with voice-to-text, get instant AI feedback, and track your performance over time.</p>
            <div class="interview-features">
              <div class="if-item" *ngFor="let f of interviewFeatures">
                <span class="if-icon">{{ f.icon }}</span>
                <span class="if-text">{{ f.text }}</span>
              </div>
            </div>
            <a routerLink="/interview" class="btn btn-primary mt-xl">Practice Now →</a>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="cta-section">
      <div class="container">
        <div class="cta-card glass-card">
          <h2 class="cta-title">Ready to <span class="gradient-text">Transform</span> Your Career?</h2>
          <p class="cta-subtitle">Join thousands of students already swapping skills and acing interviews on SkillUp.</p>
          <a routerLink="/auth" [queryParams]="{mode:'signup'}" class="btn btn-primary btn-lg">Get Started — It's Free</a>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <div class="container footer-inner">
        <div class="footer-brand">
          <span class="brand-name gradient-text">SkillUp</span>
          <p>Learn. Teach. Interview. Grow.</p>
        </div>
        <div class="footer-links">
          <a routerLink="/">Home</a>
          <a routerLink="/dashboard">Skill Swap</a>
          <a routerLink="/interview">Interview Sim</a>
        </div>
        <div class="footer-copy">© 2026 SkillUp. Built for students, by students.</div>
      </div>
    </footer>
  `,
  styles: [`
    /* Hero */
    .hero {
      min-height: 100vh;
      display: flex;
      align-items: center;
      position: relative;
      overflow: hidden;
    }
    .hero-bg {
      position: absolute;
      inset: 0;
      background: var(--gradient-hero);
    }
    .hero-particles {
      position: absolute;
      inset: 0;
      overflow: hidden;
    }
    .hero-content {
      position: relative;
      z-index: 2;
      max-width: 700px;
      padding-top: 4rem;
    }
    .hero-badge { margin-bottom: 1.5rem; }
    .hero-title {
      font-size: clamp(2.5rem, 6vw, 4rem);
      font-weight: 900;
      line-height: 1.1;
      margin-bottom: 1.5rem;
      letter-spacing: -0.03em;
    }
    .hero-subtitle {
      font-size: 1.15rem;
      line-height: 1.7;
      color: var(--text-secondary);
      margin-bottom: 2rem;
      max-width: 560px;
    }
    .hero-cta {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      margin-bottom: 3rem;
    }
    .hero-stats {
      display: flex;
      align-items: center;
      gap: 2rem;
    }
    .stat { text-align: center; }
    .stat-number {
      display: block;
      font-family: var(--font-heading);
      font-size: 1.75rem;
      font-weight: 800;
      background: var(--gradient-brand);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .stat-label {
      font-size: 0.8rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .stat-divider {
      width: 1px;
      height: 40px;
      background: var(--border-subtle);
    }

    /* Hero Floating Cards */
    .hero-graphic {
      position: absolute;
      right: 5%;
      top: 50%;
      transform: translateY(-50%);
      display: flex;
      flex-direction: column;
      gap: 1rem;
      z-index: 2;
    }
    .graphic-card {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem 1.25rem;
      min-width: 220px;
    }
    .graphic-icon { font-size: 1.5rem; }
    .graphic-title { font-weight: 600; font-size: 0.9rem; }
    .graphic-sub { color: var(--text-muted); font-size: 0.8rem; }
    .card-1 { animation: float 4s ease-in-out infinite; }
    .card-2 { animation: float 4s ease-in-out infinite 1s; }
    .card-3 { animation: float 4s ease-in-out infinite 2s; }

    /* Features Grid */
    .features { padding: 6rem 0; }
    .section-header { margin-bottom: 3rem; }
    .text-center { text-align: center; }
    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
    }
    .feature-card { padding: 2rem; }
    .feature-icon {
      width: 56px; height: 56px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      margin-bottom: 1.25rem;
    }
    .feature-title {
      font-size: 1.1rem;
      font-weight: 700;
      margin-bottom: 0.6rem;
      color: var(--text-primary);
    }
    .feature-desc { font-size: 0.9rem; color: var(--text-secondary); line-height: 1.6; }

    /* How It Works */
    .section { padding: 6rem 0; }
    .how-it-works { background: radial-gradient(ellipse at 0% 50%, rgba(124,58,237,0.08) 0%, transparent 60%); }
    .interview-section { background: radial-gradient(ellipse at 100% 50%, rgba(6,182,212,0.08) 0%, transparent 60%); }
    .hiw-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4rem;
      align-items: center;
    }
    .hiw-grid.reverse { }
    .hiw-badge { margin-bottom: 1rem; display: inline-flex; }
    .mt-lg { margin-top: 1rem; }
    .mt-xl { margin-top: 2rem; display: inline-flex; }
    .steps { display: flex; flex-direction: column; gap: 1.25rem; }
    .step {
      display: flex;
      gap: 1rem;
      align-items: flex-start;
    }
    .step-num {
      width: 32px; height: 32px;
      border-radius: 50%;
      background: var(--gradient-brand);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.85rem;
      flex-shrink: 0;
      color: white;
    }
    .step-title { font-weight: 600; margin-bottom: 0.25rem; }
    .step-desc { font-size: 0.875rem; color: var(--text-secondary); }

    /* Match Preview Card */
    .match-preview { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
    .match-header { display: flex; align-items: center; gap: 1rem; }
    .match-info { flex: 1; }
    .match-name { font-weight: 700; margin-bottom: 0.4rem; }
    .match-skills { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .match-bio { font-size: 0.875rem; color: var(--text-secondary); }
    .match-rating { display: flex; align-items: center; }

    /* Interview Preview */
    .interview-preview { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.25rem; }
    .ip-header { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .ip-question {
      font-size: 1rem;
      font-weight: 500;
      color: var(--text-primary);
      padding: 1rem;
      background: rgba(255,255,255,0.04);
      border-radius: var(--radius-md);
      border: 1px solid var(--border-subtle);
      font-style: italic;
    }
    .ip-voice { justify-content: center; padding: 0.5rem; }
    .ip-score-row { display: grid; grid-template-columns: auto 1fr; gap: 1rem; align-items: start; }
    .score-label { font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.25rem; }
    .score-value { font-size: 1.75rem; font-weight: 800; color: #6EE7B7; }
    .score-value span { font-size: 1rem; color: var(--text-muted); }
    .feedback-text { font-size: 0.85rem; color: var(--text-secondary); font-style: italic; }
    .interview-features { display: flex; flex-direction: column; gap: 0.75rem; }
    .if-item { display: flex; align-items: center; gap: 0.75rem; }
    .if-icon { font-size: 1.2rem; width: 28px; text-align: center; }
    .if-text { font-size: 0.95rem; color: var(--text-secondary); }

    /* CTA */
    .cta-section { padding: 5rem 0; }
    .cta-card {
      padding: 4rem;
      text-align: center;
      background: linear-gradient(135deg, rgba(124,58,237,0.1) 0%, rgba(6,182,212,0.1) 100%);
      border-color: rgba(124,58,237,0.2);
    }
    .cta-title { font-size: 2.5rem; margin-bottom: 1rem; }
    .cta-subtitle { color: var(--text-secondary); margin-bottom: 2rem; font-size: 1.1rem; }

    /* Footer */
    .footer {
      border-top: 1px solid var(--border-subtle);
      padding: 2rem 0;
    }
    .footer-inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .footer-brand p { font-size: 0.875rem; color: var(--text-muted); }
    .footer-links { display: flex; gap: 1.5rem; }
    .footer-links a { font-size: 0.875rem; color: var(--text-muted); text-decoration: none; }
    .footer-links a:hover { color: var(--text-primary); }
    .footer-copy { font-size: 0.8rem; color: var(--text-muted); }
    .brand-name {
      font-family: var(--font-heading);
      font-size: 1.3rem;
      font-weight: 800;
    }

    @media (max-width: 900px) {
      .hero-graphic { display: none; }
      .hiw-grid { grid-template-columns: 1fr; gap: 2rem; }
    }
    @media (max-width: 600px) {
      .hero-stats { gap: 1rem; }
      .cta-card { padding: 2rem 1.5rem; }
      .cta-title { font-size: 1.75rem; }
    }
  `]
})
export class LandingComponent {
  particles = Array.from({ length: 20 }, (_, i) => {
    const size = Math.random() * 4 + 2;
    return `
      left: ${Math.random() * 100}%;
      top: ${Math.random() * 100}%;
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      background: rgba(124,58,237,${Math.random() * 0.4 + 0.1});
      position: absolute;
      animation: float ${3 + Math.random() * 4}s ease-in-out infinite;
      animation-delay: ${Math.random() * 4}s;
    `;
  });

  features = [
    { icon: '🔄', title: 'Skill Swap Matching', desc: 'Our smart algorithm pairs you with students who teach what you want to learn — and learn what you can teach.', bg: 'rgba(124,58,237,0.15)' },
    { icon: '💬', title: 'Real-Time Chat', desc: 'Instant messaging powered by Supabase Realtime. Coordinate sessions, share resources, and build relationships.', bg: 'rgba(6,182,212,0.15)' },
    { icon: '🤖', title: 'AI Interview Practice', desc: 'Generate personalized Technical and HR interview questions. Get instant AI scoring and actionable feedback.', bg: 'rgba(245,158,11,0.15)' },
    { icon: '🎙️', title: 'Voice-to-Text Input', desc: 'Answer interview questions naturally using your voice. Our browser-based Speech API transcribes in real-time.', bg: 'rgba(16,185,129,0.15)' },
    { icon: '📅', title: 'Session Scheduling', desc: 'Schedule your skill-swap sessions directly in the platform. Set a meeting link and track upcoming sessions.', bg: 'rgba(239,68,68,0.15)' },
    { icon: '📊', title: 'Performance Analytics', desc: 'Track your interview performance over time. See trends, identify weak areas, and measure your progress.', bg: 'rgba(124,58,237,0.15)' }
  ];

  swapSteps = [
    { title: 'Create Your Profile', desc: 'List the skills you can teach and the ones you want to learn.' },
    { title: 'Find Your Match', desc: 'Browse students who match your learning goals. Filter by skill and rating.' },
    { title: 'Connect & Chat', desc: 'Send a swap request, chat in real-time, and schedule your first session.' },
    { title: 'Rate & Grow', desc: 'After each session, leave a review to build your reputation on the platform.' }
  ];

  interviewFeatures = [
    { icon: '🎯', text: 'Technical & HR interview modes' },
    { icon: '🎙️', text: 'Voice-to-text answer input' },
    { icon: '⚡', text: 'Real-time AI evaluation & scoring' },
    { icon: '💡', text: 'Detailed feedback with model answers' },
    { icon: '📈', text: 'Performance tracking over time' },
    { icon: '🏆', text: 'Interview readiness level assessment' }
  ];
}
