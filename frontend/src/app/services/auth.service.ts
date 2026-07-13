import { Injectable } from '@angular/core';
import { supabase } from '../supabase.client';
import { BehaviorSubject } from 'rxjs';
import type { User, Session } from '@supabase/supabase-js';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUser = new BehaviorSubject<User | null>(null);
  user$ = this.currentUser.asObservable();

  constructor() {
    // Initialize auth state from existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      this.currentUser.next(session?.user ?? null);
    });

    // Listen for auth state changes
    supabase.auth.onAuthStateChange((_event, session) => {
      this.currentUser.next(session?.user ?? null);
    });
  }

  get currentUserId(): string | null {
    return this.currentUser.value?.id ?? null;
  }

  get isLoggedIn(): boolean {
    return !!this.currentUser.value;
  }

  async signUp(email: string, password: string, fullName: string, username: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, username }
      }
    });
    if (error) throw error;
    return data;
  }

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  async getProfile(userId?: string) {
    const id = userId ?? this.currentUserId;
    if (!id) throw new Error('Not authenticated');
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  }

  async updateProfile(updates: Partial<{ full_name: string; bio: string; skills_teach: string[]; skills_learn: string[]; avatar_url: string }>) {
    const id = this.currentUserId;
    if (!id) throw new Error('Not authenticated');
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}
