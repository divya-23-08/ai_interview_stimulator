import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { SkillSwapService, Profile, Match, ChatMessage, Session } from '../../services/skill-swap.service';
import { ToastService } from '../../services/toast.service';

type DashboardTab = 'matches' | 'chat' | 'sessions' | 'profile';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="dashboard">
      <div class="dashboard-header">
        <div class="container">
          <h1 class="page-title">Skill Swap <span class="gradient-text">Hub</span></h1>
          <p class="page-desc">Find your learning partners, chat, and schedule sessions.</p>
        </div>
      </div>

      <div class="container dashboard-body">
        <!-- Sidebar -->
        <aside class="sidebar">
          <!-- Profile Card -->
          <div class="profile-card glass-card" *ngIf="myProfile">
            <div class="avatar-placeholder profile-avatar">{{ myProfile.full_name.charAt(0) }}</div>
            <div class="profile-info">
              <div class="profile-name">{{ myProfile.full_name }}</div>
              <div class="profile-username">&#64;{{ myProfile.username }}</div>
              <div class="profile-rating">
                <span class="star filled">★</span>
                <span class="rating-val">{{ myProfile.avg_rating | number:'1.1-1' }}</span>
                <span class="rating-count">({{ myProfile.total_reviews }})</span>
              </div>
            </div>
          </div>

          <!-- Nav -->
          <nav class="sidebar-nav glass-card">
            <button class="sidebar-btn" [class.active]="activeTab==='matches'" (click)="activeTab='matches'">
              <span class="sb-icon">🔍</span> Find Matches
            </button>
            <button class="sidebar-btn" [class.active]="activeTab==='chat'" (click)="activeTab='chat'; loadMatchList()">
              <span class="sb-icon">💬</span> My Matches
              <span class="badge badge-primary" *ngIf="pendingCount">{{ pendingCount }}</span>
            </button>
            <button class="sidebar-btn" [class.active]="activeTab==='sessions'" (click)="activeTab='sessions'; loadSessions()">
              <span class="sb-icon">📅</span> Sessions
            </button>
            <button class="sidebar-btn" [class.active]="activeTab==='profile'" (click)="activeTab='profile'">
              <span class="sb-icon">👤</span> Edit Profile
            </button>
          </nav>

          <!-- Interview Shortcut -->
          <a routerLink="/interview" class="interview-shortcut glass-card">
            <span class="is-icon">🤖</span>
            <div>
              <div class="is-title">AI Interview Sim</div>
              <div class="is-sub">Practice & Improve →</div>
            </div>
          </a>
        </aside>

        <!-- Main Content -->
        <main class="main-content">
          <!-- Find Matches Tab -->
          <div *ngIf="activeTab==='matches'" class="tab-content animate-fadeInUp">
            <div class="content-header">
              <h2>Discover Your <span class="gradient-text">Skill Partners</span></h2>
              <p>Students who can teach what you want to learn — based on your profile.</p>
            </div>

            <!-- Pending Requests -->
            <div *ngIf="pendingRequests.length" class="pending-section">
              <h3 class="subsection-title">📬 Pending Requests ({{ pendingRequests.length }})</h3>
              <div class="requests-list">
                <div class="request-card glass-card" *ngFor="let req of pendingRequests">
                  <div class="avatar-placeholder" style="width:44px;height:44px;font-size:1.1rem">
                    {{ req.other_user?.full_name?.charAt(0) }}
                  </div>
                  <div class="request-info">
                    <div class="request-name">{{ req.other_user?.full_name }}</div>
                    <div class="request-detail">Wants to teach <strong>{{ req.skill_a_teaches }}</strong> | Wants to learn <strong>{{ req.skill_b_teaches }}</strong></div>
                  </div>
                  <div class="request-actions">
                    <button class="btn btn-primary btn-sm" (click)="respondMatch(req.id, 'accepted')">Accept</button>
                    <button class="btn btn-danger btn-sm" (click)="respondMatch(req.id, 'declined')">Decline</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Match list -->
            <div *ngIf="loadingMatches" class="loading-center">
              <div class="spinner spinner-lg"></div>
            </div>
            <div *ngIf="!loadingMatches && matchProfiles.length === 0" class="empty-state">
              <div class="empty-state-icon">🔍</div>
              <h3>No matches found yet</h3>
              <p>Update your profile with skills you want to learn to discover partners.</p>
              <button class="btn btn-primary" (click)="activeTab='profile'">Update Profile</button>
            </div>
            <div class="match-grid" *ngIf="!loadingMatches && matchProfiles.length">
              <div class="match-card glass-card" *ngFor="let p of matchProfiles">
                <div class="mc-header">
                  <div class="avatar-placeholder mc-avatar">{{ p.full_name.charAt(0) }}</div>
                  <div class="mc-info">
                    <div class="mc-name">{{ p.full_name }}</div>
                    <div class="mc-username">&#64;{{ p.username }}</div>
                    <div class="mc-rating">
                      <span class="star filled">★</span> {{ p.avg_rating | number:'1.1-1' }}
                      <span class="rating-count">({{ p.total_reviews }})</span>
                    </div>
                  </div>
                </div>
                <p class="mc-bio">{{ p.bio || 'No bio yet — but excited to swap skills!' }}</p>
                <div class="mc-skills">
                  <div class="skill-section">
                    <div class="skill-label">Teaches</div>
                    <div class="skill-tags">
                      <span class="badge badge-primary" *ngFor="let s of p.skills_teach.slice(0,3)">{{ s }}</span>
                    </div>
                  </div>
                  <div class="skill-section">
                    <div class="skill-label">Wants to Learn</div>
                    <div class="skill-tags">
                      <span class="badge badge-cyan" *ngFor="let s of p.skills_learn.slice(0,3)">{{ s }}</span>
                    </div>
                  </div>
                </div>
                <button class="btn btn-primary mc-connect" (click)="openConnectModal(p)">
                  Connect & Swap
                </button>
              </div>
            </div>
          </div>

          <!-- My Matches / Chat Tab -->
          <div *ngIf="activeTab==='chat'" class="tab-content animate-fadeInUp">
            <div *ngIf="!selectedMatch">
              <div class="content-header">
                <h2>My <span class="gradient-text">Connections</span></h2>
                <p>Your accepted skill-swap partners. Click one to start chatting.</p>
              </div>
              <div *ngIf="myMatches.length === 0" class="empty-state">
                <div class="empty-state-icon">💬</div>
                <p>No connections yet. Find matches and send requests!</p>
              </div>
              <div class="connections-list">
                <div class="connection-item glass-card" *ngFor="let m of myMatches" (click)="openChat(m)">
                  <div class="avatar-placeholder" style="width:48px;height:48px;font-size:1.2rem">
                    {{ m.other_user?.full_name?.charAt(0) }}
                  </div>
                  <div class="conn-info">
                    <div class="conn-name">{{ m.other_user?.full_name }}</div>
                    <div class="conn-swap">{{ m.skill_a_teaches }} ↔ {{ m.skill_b_teaches }}</div>
                  </div>
                  <div class="conn-arrow">→</div>
                </div>
              </div>
            </div>

            <!-- Chat Window -->
            <div *ngIf="selectedMatch" class="chat-window">
              <div class="chat-header glass-card">
                <button class="btn btn-ghost btn-sm" (click)="selectedMatch=null; unsubChat()">← Back</button>
                <div class="avatar-placeholder" style="width:40px;height:40px;font-size:1rem">
                  {{ selectedMatch.other_user?.full_name?.charAt(0) }}
                </div>
                <div class="chat-partner">
                  <div class="chat-name">{{ selectedMatch.other_user?.full_name }}</div>
                  <div class="chat-swap">{{ selectedMatch.skill_a_teaches }} ↔ {{ selectedMatch.skill_b_teaches }}</div>
                </div>
                <button class="btn btn-secondary btn-sm" (click)="openScheduleModal()">📅 Schedule</button>
              </div>

              <div class="chat-messages" #chatBox>
                <div *ngFor="let msg of chatMessages"
                     class="chat-msg"
                     [class.mine]="msg.sender_id === currentUserId">
                  <div class="msg-bubble">{{ msg.content }}</div>
                  <div class="msg-time">{{ msg.created_at | date:'shortTime' }}</div>
                </div>
              </div>

              <div class="chat-input-row">
                <input
                  class="form-control chat-input"
                  [(ngModel)]="chatInput"
                  placeholder="Type a message..."
                  (keyup.enter)="sendMessage()"
                >
                <button class="btn btn-primary" (click)="sendMessage()" [disabled]="!chatInput.trim()">Send</button>
              </div>
            </div>
          </div>

          <!-- Sessions Tab -->
          <div *ngIf="activeTab==='sessions'" class="tab-content animate-fadeInUp">
            <div class="content-header">
              <h2>My <span class="gradient-text">Sessions</span></h2>
            </div>
            <div *ngIf="sessions.length === 0" class="empty-state">
              <div class="empty-state-icon">📅</div>
              <p>No sessions yet. Open a chat with a match and schedule one!</p>
            </div>
            <div class="sessions-list">
              <div class="session-card glass-card" *ngFor="let s of sessions">
                <div class="session-info">
                  <div class="session-title">{{ s.title }}</div>
                  <div class="session-time">{{ s.scheduled_at | date:'medium' }} • {{ s.duration_mins }} min</div>
                  <a *ngIf="s.meeting_link" [href]="s.meeting_link" target="_blank" class="session-link">Join Meeting →</a>
                </div>
                <span class="badge" [ngClass]="{
                  'badge-success': s.status === 'scheduled',
                  'badge-warning': s.status === 'completed',
                  'badge-danger': s.status === 'cancelled'
                }">{{ s.status }}</span>
              </div>
            </div>
          </div>

          <!-- Profile Tab -->
          <div *ngIf="activeTab==='profile'" class="tab-content animate-fadeInUp">
            <div class="content-header">
              <h2>Edit <span class="gradient-text">Profile</span></h2>
            </div>
            <div class="profile-form glass-card" *ngIf="myProfile">
              <div class="form-group">
                <label class="form-label">Full Name</label>
                <input type="text" class="form-control" [(ngModel)]="editProfile.full_name">
              </div>
              <div class="form-group">
                <label class="form-label">Bio</label>
                <textarea class="form-control" [(ngModel)]="editProfile.bio" rows="3" placeholder="Tell others about yourself..."></textarea>
              </div>
              <div class="form-group">
                <label class="form-label">Skills I Can Teach (comma-separated)</label>
                <input type="text" class="form-control" [(ngModel)]="teachSkillsInput" placeholder="React, Python, Machine Learning">
              </div>
              <div class="form-group">
                <label class="form-label">Skills I Want to Learn (comma-separated)</label>
                <input type="text" class="form-control" [(ngModel)]="learnSkillsInput" placeholder="TypeScript, Docker, UI Design">
              </div>
              <button class="btn btn-primary" (click)="saveProfile()" [disabled]="savingProfile">
                <span *ngIf="savingProfile" class="spinner"></span>
                <span *ngIf="!savingProfile">Save Profile</span>
              </button>
            </div>
          </div>
        </main>
      </div>

      <!-- Connect Modal -->
      <div class="modal-overlay" *ngIf="connectModal" (click)="connectModal=false">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Connect with {{ connectTarget?.full_name }}</h3>
            <button class="btn btn-ghost btn-sm" (click)="connectModal=false">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Skill you'll teach them</label>
              <select class="form-control" [(ngModel)]="mySkillOffer">
                <option value="" disabled>Select a skill you teach</option>
                <option *ngFor="let s of myProfile?.skills_teach" [value]="s">{{ s }}</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Skill you want from them</label>
              <select class="form-control" [(ngModel)]="theirSkillWant">
                <option value="" disabled>Select a skill they teach</option>
                <option *ngFor="let s of connectTarget?.skills_teach" [value]="s">{{ s }}</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" (click)="connectModal=false">Cancel</button>
            <button class="btn btn-primary" (click)="sendConnectRequest()" [disabled]="!mySkillOffer || !theirSkillWant">Send Request</button>
          </div>
        </div>
      </div>

      <!-- Schedule Modal -->
      <div class="modal-overlay" *ngIf="scheduleModal" (click)="scheduleModal=false">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Schedule a Session</h3>
            <button class="btn btn-ghost btn-sm" (click)="scheduleModal=false">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Session Title</label>
              <input type="text" class="form-control" [(ngModel)]="schedTitle" placeholder="React Fundamentals Review">
            </div>
            <div class="form-group">
              <label class="form-label">Date & Time</label>
              <input type="datetime-local" class="form-control" [(ngModel)]="schedDate">
            </div>
            <div class="form-group">
              <label class="form-label">Duration (minutes)</label>
              <select class="form-control" [(ngModel)]="schedDuration">
                <option [value]="30">30 min</option>
                <option [value]="60">1 hour</option>
                <option [value]="90">1.5 hours</option>
                <option [value]="120">2 hours</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Meeting Link (optional)</label>
              <input type="url" class="form-control" [(ngModel)]="schedLink" placeholder="https://meet.google.com/...">
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" (click)="scheduleModal=false">Cancel</button>
            <button class="btn btn-primary" (click)="scheduleSession()" [disabled]="!schedTitle || !schedDate">Schedule</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-header {
      background: radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.15) 0%, transparent 70%);
      border-bottom: 1px solid var(--border-subtle);
      padding: 2rem 0 1.5rem;
    }
    .page-title { font-size: 2rem; font-weight: 800; }
    .page-desc { color: var(--text-secondary); margin-top: 0.25rem; }
    .dashboard-body {
      display: grid;
      grid-template-columns: 280px 1fr;
      gap: 2rem;
      padding-top: 2rem;
      padding-bottom: 3rem;
      align-items: start;
    }
    .sidebar { display: flex; flex-direction: column; gap: 1rem; position: sticky; top: 90px; }
    .profile-card {
      padding: 1.25rem;
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .profile-avatar { width: 52px; height: 52px; font-size: 1.3rem; flex-shrink: 0; }
    .profile-name { font-weight: 700; font-size: 0.95rem; }
    .profile-username { color: var(--text-muted); font-size: 0.8rem; }
    .profile-rating { display: flex; align-items: center; gap: 4px; font-size: 0.85rem; margin-top: 4px; }
    .rating-val { font-weight: 600; }
    .rating-count { color: var(--text-muted); font-size: 0.75rem; }
    .star.filled { color: var(--brand-accent); }

    .sidebar-nav { padding: 0.5rem; display: flex; flex-direction: column; gap: 2px; }
    .sidebar-btn {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      border: none;
      background: transparent;
      color: var(--text-secondary);
      border-radius: var(--radius-md);
      font-family: var(--font-body);
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      transition: all var(--transition-fast);
      width: 100%;
      text-align: left;
    }
    .sidebar-btn:hover { background: rgba(255,255,255,0.05); color: var(--text-primary); }
    .sidebar-btn.active { background: rgba(124,58,237,0.15); color: var(--brand-primary-light); }
    .sb-icon { font-size: 1rem; }

    .interview-shortcut {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.25rem;
      text-decoration: none;
      color: var(--text-primary);
      transition: all var(--transition-base);
      background: linear-gradient(135deg, rgba(6,182,212,0.1) 0%, rgba(124,58,237,0.1) 100%);
      border-color: rgba(6,182,212,0.2);
    }
    .interview-shortcut:hover { border-color: rgba(6,182,212,0.4); }
    .is-icon { font-size: 1.75rem; }
    .is-title { font-weight: 700; font-size: 0.9rem; }
    .is-sub { font-size: 0.8rem; color: var(--brand-secondary); }

    .main-content { min-height: 500px; }
    .content-header { margin-bottom: 1.75rem; }
    .content-header h2 { font-size: 1.5rem; font-weight: 800; margin-bottom: 0.3rem; }
    .content-header p { color: var(--text-secondary); font-size: 0.9rem; }
    .tab-content { animation: fadeInUp 0.3s ease; }

    /* Pending Requests */
    .pending-section { margin-bottom: 2rem; }
    .subsection-title { font-size: 1rem; font-weight: 700; margin-bottom: 1rem; color: var(--text-secondary); }
    .requests-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .request-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.25rem;
    }
    .request-info { flex: 1; }
    .request-name { font-weight: 700; font-size: 0.95rem; margin-bottom: 0.2rem; }
    .request-detail { font-size: 0.85rem; color: var(--text-secondary); }
    .request-actions { display: flex; gap: 0.5rem; }

    /* Match Grid */
    .match-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.25rem; }
    .match-card { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
    .mc-header { display: flex; gap: 1rem; align-items: flex-start; }
    .mc-avatar { width: 52px; height: 52px; font-size: 1.3rem; flex-shrink: 0; }
    .mc-name { font-weight: 700; }
    .mc-username { color: var(--text-muted); font-size: 0.8rem; }
    .mc-rating { display: flex; align-items: center; gap: 4px; font-size: 0.85rem; margin-top: 4px; }
    .mc-bio { font-size: 0.875rem; color: var(--text-secondary); line-height: 1.5; }
    .mc-skills { display: flex; flex-direction: column; gap: 0.5rem; }
    .skill-section { display: flex; flex-direction: column; gap: 0.35rem; }
    .skill-label { font-size: 0.75rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; }
    .skill-tags { display: flex; flex-wrap: wrap; gap: 0.35rem; }
    .mc-connect { width: 100%; justify-content: center; }

    /* Connections List */
    .connections-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .connection-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.25rem;
      cursor: pointer;
    }
    .connection-item:hover { border-color: var(--border-strong); }
    .conn-info { flex: 1; }
    .conn-name { font-weight: 700; }
    .conn-swap { font-size: 0.85rem; color: var(--text-muted); }
    .conn-arrow { color: var(--text-muted); }

    /* Chat */
    .chat-window { display: flex; flex-direction: column; height: 75vh; }
    .chat-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      margin-bottom: 1rem;
      border-radius: var(--radius-md);
    }
    .chat-name { font-weight: 700; font-size: 0.95rem; }
    .chat-swap { font-size: 0.8rem; color: var(--text-muted); }
    .chat-partner { flex: 1; }
    .chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 1rem;
      background: rgba(255,255,255,0.02);
      border-radius: var(--radius-md);
      border: 1px solid var(--border-subtle);
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }
    .chat-msg { display: flex; flex-direction: column; max-width: 70%; }
    .chat-msg.mine { align-self: flex-end; align-items: flex-end; }
    .msg-bubble {
      padding: 0.6rem 1rem;
      border-radius: 16px;
      font-size: 0.9rem;
      background: rgba(255,255,255,0.06);
      border: 1px solid var(--border-subtle);
    }
    .chat-msg.mine .msg-bubble {
      background: linear-gradient(135deg, rgba(124,58,237,0.4) 0%, rgba(6,182,212,0.3) 100%);
      border-color: rgba(124,58,237,0.4);
      color: white;
    }
    .msg-time { font-size: 0.7rem; color: var(--text-muted); margin-top: 2px; padding: 0 4px; }
    .chat-input-row { display: flex; gap: 0.75rem; }
    .chat-input { flex: 1; }

    /* Sessions */
    .sessions-list { display: flex; flex-direction: column; gap: 1rem; }
    .session-card { display: flex; align-items: center; justify-content: space-between; padding: 1.25rem 1.5rem; }
    .session-title { font-weight: 700; margin-bottom: 0.25rem; }
    .session-time { font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.25rem; }
    .session-link { font-size: 0.85rem; color: var(--brand-primary-light); }

    /* Profile Form */
    .profile-form { padding: 2rem; }

    /* Loading */
    .loading-center { display: flex; justify-content: center; padding: 4rem; }

    @media (max-width: 900px) {
      .dashboard-body { grid-template-columns: 1fr; }
      .sidebar { position: static; }
    }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  activeTab: DashboardTab = 'matches';
  myProfile: Profile | null = null;
  matchProfiles: Profile[] = [];
  myMatches: Match[] = [];
  pendingRequests: Match[] = [];
  chatMessages: ChatMessage[] = [];
  sessions: Session[] = [];
  selectedMatch: Match | null = null;
  currentUserId: string | null = null;
  loadingMatches = false;
  savingProfile = false;
  pendingCount = 0;
  chatInput = '';

  // Connect Modal
  connectModal = false;
  connectTarget: Profile | null = null;
  mySkillOffer = '';
  theirSkillWant = '';

  // Schedule Modal
  scheduleModal = false;
  schedTitle = '';
  schedDate = '';
  schedDuration = 60;
  schedLink = '';

  // Profile Edit
  editProfile = { full_name: '', bio: '' };
  teachSkillsInput = '';
  learnSkillsInput = '';

  private chatSub: any;

  constructor(
    private auth: AuthService,
    private skillSwap: SkillSwapService,
    private toast: ToastService
  ) {}

  async ngOnInit() {
    this.currentUserId = this.auth.currentUserId;
    await this.loadProfile();
    await this.loadMatchProfiles();
    await this.loadPendingRequests();
  }

  ngOnDestroy() {
    this.unsubChat();
  }

  async loadProfile() {
    try {
      this.myProfile = await this.auth.getProfile();
      if (this.myProfile) {
        this.editProfile = { full_name: this.myProfile.full_name, bio: this.myProfile.bio || '' };
        this.teachSkillsInput = this.myProfile.skills_teach.join(', ');
        this.learnSkillsInput = this.myProfile.skills_learn.join(', ');
      }
    } catch (e) {}
  }

  async loadMatchProfiles() {
    this.loadingMatches = true;
    try {
      this.matchProfiles = await this.skillSwap.findMatches();
    } catch (e) {}
    this.loadingMatches = false;
  }

  async loadPendingRequests() {
    try {
      this.pendingRequests = await this.skillSwap.getPendingRequests();
      this.pendingCount = this.pendingRequests.length;
    } catch (e) {}
  }

  async loadMatchList() {
    try {
      this.myMatches = await this.skillSwap.getMyMatches();
    } catch (e) {}
  }

  async loadSessions() {
    try {
      this.sessions = await this.skillSwap.getMySessions();
    } catch (e) {}
  }

  openConnectModal(profile: Profile) {
    this.connectTarget = profile;
    this.mySkillOffer = '';
    this.theirSkillWant = '';
    this.connectModal = true;
  }

  async sendConnectRequest() {
    if (!this.connectTarget || !this.mySkillOffer || !this.theirSkillWant) return;
    try {
      await this.skillSwap.sendMatchRequest(this.connectTarget.id, this.mySkillOffer, this.theirSkillWant);
      this.toast.success('Match request sent! 🎉');
      this.connectModal = false;
    } catch (e: any) {
      this.toast.error(e.message || 'Failed to send request');
    }
  }

  async respondMatch(matchId: string, status: 'accepted' | 'declined') {
    try {
      await this.skillSwap.respondToMatch(matchId, status);
      this.toast.success(status === 'accepted' ? 'Match accepted! 🎉' : 'Request declined');
      await this.loadPendingRequests();
      await this.loadMatchList();
    } catch (e: any) {
      this.toast.error(e.message);
    }
  }

  async openChat(match: Match) {
    this.selectedMatch = match;
    try {
      this.chatMessages = await this.skillSwap.getMessages(match.id);
    } catch (e) {}

    this.chatSub = this.skillSwap.subscribeToChat(match.id, (msg) => {
      this.chatMessages.push(msg);
    });
  }

  async sendMessage() {
    if (!this.chatInput.trim() || !this.selectedMatch) return;
    const content = this.chatInput.trim();
    this.chatInput = '';
    try {
      await this.skillSwap.sendMessage(this.selectedMatch.id, content);
    } catch (e: any) {
      this.toast.error('Failed to send message');
    }
  }

  unsubChat() {
    if (this.chatSub) { this.chatSub.unsubscribe?.(); this.chatSub = null; }
  }

  openScheduleModal() {
    this.schedTitle = '';
    this.schedDate = '';
    this.schedDuration = 60;
    this.schedLink = '';
    this.scheduleModal = true;
  }

  async scheduleSession() {
    if (!this.selectedMatch || !this.schedTitle || !this.schedDate) return;
    const guestId = this.selectedMatch.user_a_id === this.currentUserId
      ? this.selectedMatch.user_b_id
      : this.selectedMatch.user_a_id;
    try {
      await this.skillSwap.scheduleSession(
        this.selectedMatch.id, guestId, this.schedTitle,
        new Date(this.schedDate).toISOString(), this.schedDuration, this.schedLink || undefined
      );
      this.toast.success('Session scheduled! 📅');
      this.scheduleModal = false;
    } catch (e: any) {
      this.toast.error(e.message || 'Failed to schedule');
    }
  }

  async saveProfile() {
    this.savingProfile = true;
    try {
      await this.auth.updateProfile({
        full_name: this.editProfile.full_name,
        bio: this.editProfile.bio,
        skills_teach: this.teachSkillsInput.split(',').map(s => s.trim()).filter(Boolean),
        skills_learn: this.learnSkillsInput.split(',').map(s => s.trim()).filter(Boolean)
      });
      this.toast.success('Profile updated! ✓');
      await this.loadProfile();
      await this.loadMatchProfiles();
    } catch (e: any) {
      this.toast.error(e.message || 'Failed to save');
    } finally {
      this.savingProfile = false;
    }
  }
}
