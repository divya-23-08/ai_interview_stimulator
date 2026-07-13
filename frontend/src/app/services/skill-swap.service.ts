import { Injectable } from '@angular/core';
import { supabase } from '../supabase.client';
import { AuthService } from './auth.service';

export interface Profile {
  id: string;
  full_name: string;
  username: string;
  avatar_url?: string;
  bio?: string;
  skills_teach: string[];
  skills_learn: string[];
  avg_rating: number;
  total_reviews: number;
}

export interface Match {
  id: string;
  user_a_id: string;
  user_b_id: string;
  skill_a_teaches: string;
  skill_b_teaches: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  other_user?: Profile;
}

export interface ChatMessage {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export interface Session {
  id: string;
  match_id: string;
  host_id: string;
  guest_id: string;
  title: string;
  scheduled_at: string;
  duration_mins: number;
  status: 'scheduled' | 'completed' | 'cancelled';
  meeting_link?: string;
}

@Injectable({ providedIn: 'root' })
export class SkillSwapService {
  constructor(private auth: AuthService) {}

  /** Find all profiles that can teach skills the current user wants to learn */
  async findMatches(): Promise<Profile[]> {
    const myId = this.auth.currentUserId;
    if (!myId) throw new Error('Not authenticated');

    const myProfile = await this.auth.getProfile();
    const wantToLearn: string[] = myProfile.skills_learn ?? [];

    if (!wantToLearn.length) return [];

    // Find profiles who teach at least one skill the user wants to learn
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', myId)
      .overlaps('skills_teach', wantToLearn);

    if (error) throw error;
    return data ?? [];
  }

  /** Get all accepted matches for the current user */
  async getMyMatches(): Promise<Match[]> {
    const myId = this.auth.currentUserId;
    if (!myId) return [];

    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .or(`user_a_id.eq.${myId},user_b_id.eq.${myId}`)
      .eq('status', 'accepted')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Fetch other user's profile for each match
    const matches = data ?? [];
    const enriched = await Promise.all(matches.map(async (m: any) => {
      const otherId = m.user_a_id === myId ? m.user_b_id : m.user_a_id;
      const { data: otherProfile } = await supabase.from('profiles').select('*').eq('id', otherId).single();
      return { ...m, other_user: otherProfile };
    }));

    return enriched;
  }

  /** Send a match request */
  async sendMatchRequest(targetUserId: string, mySkill: string, theirSkill: string): Promise<void> {
    const myId = this.auth.currentUserId;
    if (!myId) throw new Error('Not authenticated');

    const { error } = await supabase.from('matches').insert({
      user_a_id: myId,
      user_b_id: targetUserId,
      skill_a_teaches: mySkill,
      skill_b_teaches: theirSkill,
      status: 'pending'
    });
    if (error) throw error;
  }

  /** Accept or decline a match */
  async respondToMatch(matchId: string, status: 'accepted' | 'declined'): Promise<void> {
    const { error } = await supabase
      .from('matches')
      .update({ status })
      .eq('id', matchId);
    if (error) throw error;
  }

  /** Get pending match requests for current user */
  async getPendingRequests(): Promise<Match[]> {
    const myId = this.auth.currentUserId;
    if (!myId) return [];

    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('user_b_id', myId)
      .eq('status', 'pending');

    if (error) throw error;

    const enriched = await Promise.all((data ?? []).map(async (m: any) => {
      const { data: otherProfile } = await supabase.from('profiles').select('*').eq('id', m.user_a_id).single();
      return { ...m, other_user: otherProfile };
    }));
    return enriched;
  }

  /** Fetch messages for a match */
  async getMessages(matchId: string): Promise<ChatMessage[]> {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data ?? [];
  }

  /** Send a chat message */
  async sendMessage(matchId: string, content: string): Promise<void> {
    const senderId = this.auth.currentUserId;
    if (!senderId) throw new Error('Not authenticated');
    const { error } = await supabase.from('chat_messages').insert({ match_id: matchId, sender_id: senderId, content });
    if (error) throw error;
  }

  /** Subscribe to real-time chat messages for a match */
  subscribeToChat(matchId: string, callback: (msg: ChatMessage) => void) {
    return supabase.channel(`chat:${matchId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `match_id=eq.${matchId}`
      }, (payload) => callback(payload.new as ChatMessage))
      .subscribe();
  }

  /** Schedule a session */
  async scheduleSession(matchId: string, guestId: string, title: string, scheduledAt: string, durationMins = 60, meetingLink?: string): Promise<void> {
    const hostId = this.auth.currentUserId;
    if (!hostId) throw new Error('Not authenticated');
    const { error } = await supabase.from('sessions').insert({ match_id: matchId, host_id: hostId, guest_id: guestId, title, scheduled_at: scheduledAt, duration_mins: durationMins, meeting_link: meetingLink });
    if (error) throw error;
  }

  /** Get sessions for current user */
  async getMySessions(): Promise<Session[]> {
    const myId = this.auth.currentUserId;
    if (!myId) return [];
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .or(`host_id.eq.${myId},guest_id.eq.${myId}`)
      .order('scheduled_at', { ascending: true });
    if (error) throw error;
    return data ?? [];
  }

  /** Submit a review for a completed session */
  async submitReview(sessionId: string, revieweeId: string, rating: number, comment: string): Promise<void> {
    const reviewerId = this.auth.currentUserId;
    if (!reviewerId) throw new Error('Not authenticated');
    const { error } = await supabase.from('session_reviews').insert({ session_id: sessionId, reviewer_id: reviewerId, reviewee_id: revieweeId, rating, comment });
    if (error) throw error;
  }
}
