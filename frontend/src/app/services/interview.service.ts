import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { supabase } from '../supabase.client';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';
import { firstValueFrom } from 'rxjs';

export interface InterviewQuestion {
  question: string;
  type: string;
  hints: string;
}

export interface EvaluationResult {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  modelAnswer: string;
}

export interface InterviewReport {
  overallFeedback: string;
  keyStrengths: string[];
  areasForImprovement: string[];
  recommendedResources: string[];
  nextSteps: string;
  readinessLevel: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
}

export interface InterviewSession {
  id: string;
  topic: string;
  subtopic?: string;
  difficulty: string;
  total_score: number;
  max_score: number;
  percentage: number;
  status: string;
  started_at: string;
  completed_at?: string;
}

@Injectable({ providedIn: 'root' })
export class InterviewService {
  private backendUrl = environment.backendUrl;

  constructor(private http: HttpClient, private auth: AuthService) {}

  /** Generate interview questions via backend OpenAI API */
  async startInterview(topic: string, subtopic: string, difficulty: string, numQuestions = 5): Promise<InterviewQuestion[]> {
    const result = await firstValueFrom(
      this.http.post<{ questions: InterviewQuestion[] }>(`${this.backendUrl}/api/interview/start`, {
        topic, subtopic, difficulty, numQuestions
      })
    );
    return result.questions;
  }

  /** Save an interview session to Supabase */
  async createInterviewSession(topic: string, subtopic: string, difficulty: string): Promise<string> {
    const userId = this.auth.currentUserId;
    if (!userId) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('interviews')
      .insert({ user_id: userId, topic, subtopic, difficulty, status: 'in_progress' })
      .select('id')
      .single();
    if (error) throw error;
    return data.id;
  }

  /** Save a question to the database */
  async saveQuestion(interviewId: string, question: string, type: string, orderNum: number): Promise<string> {
    const { data, error } = await supabase
      .from('interview_questions')
      .insert({ interview_id: interviewId, question_text: question, question_type: type, order_num: orderNum })
      .select('id')
      .single();
    if (error) throw error;
    return data.id;
  }

  /** Evaluate an answer via backend OpenAI API */
  async evaluateAnswer(question: string, answer: string, topic: string, difficulty: string): Promise<EvaluationResult> {
    return firstValueFrom(
      this.http.post<EvaluationResult>(`${this.backendUrl}/api/interview/evaluate`, {
        question, answer, topic, difficulty
      })
    );
  }

  /** Save evaluation result to DB */
  async saveEvaluation(questionId: string, answer: string, evaluation: EvaluationResult): Promise<void> {
    const { error } = await supabase
      .from('interview_questions')
      .update({
        user_answer: answer,
        ai_feedback: evaluation.feedback,
        score: evaluation.score,
        model_answer: evaluation.modelAnswer
      })
      .eq('id', questionId);
    if (error) throw error;
  }

  /** Complete an interview session */
  async completeInterview(interviewId: string, totalScore: number, maxScore: number): Promise<void> {
    const percentage = Math.round((totalScore / maxScore) * 100);
    const { error } = await supabase
      .from('interviews')
      .update({ status: 'completed', total_score: totalScore, max_score: maxScore, percentage, completed_at: new Date().toISOString() })
      .eq('id', interviewId);
    if (error) throw error;
  }

  /** Generate a final report via backend */
  async generateReport(questions: any[], topic: string, difficulty: string): Promise<InterviewReport> {
    return firstValueFrom(
      this.http.post<InterviewReport>(`${this.backendUrl}/api/interview/report`, {
        questions, topic, difficulty
      })
    );
  }

  /** Get all past interview sessions for the current user */
  async getInterviewHistory(): Promise<InterviewSession[]> {
    const userId = this.auth.currentUserId;
    if (!userId) return [];
    const { data, error } = await supabase
      .from('interviews')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  }

  /** Get questions for a specific interview */
  async getInterviewQuestions(interviewId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('interview_questions')
      .select('*')
      .eq('interview_id', interviewId)
      .order('order_num', { ascending: true });
    if (error) throw error;
    return data ?? [];
  }
}
