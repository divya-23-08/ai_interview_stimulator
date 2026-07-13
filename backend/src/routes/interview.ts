import { Router, Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'mock-key-to-prevent-startup-crash');
const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  generationConfig: {
    responseMimeType: 'application/json',
  },
});

// ─── Types ───────────────────────────────────────────────────────────────────

interface StartInterviewBody {
  topic: 'Technical' | 'HR' | 'Mixed';
  subtopic?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  numQuestions?: number;
}

interface EvaluateAnswerBody {
  question: string;
  answer: string;
  topic: string;
  difficulty: string;
}

interface ReportBody {
  questions: Array<{
    question: string;
    answer: string;
    score: number;
    feedback: string;
  }>;
  topic: string;
  difficulty: string;
}

// ─── POST /api/interview/start ────────────────────────────────────────────────
// Generates a list of interview questions using Google Gemini API
router.post('/start', async (req: Request, res: Response) => {
  try {
    const { topic, subtopic, difficulty, numQuestions = 5 }: StartInterviewBody = req.body;

    if (!topic || !difficulty) {
      return res.status(400).json({ error: 'topic and difficulty are required' });
    }

    const topicContext = subtopic ? `${topic} (specifically ${subtopic})` : topic;

    const prompt = `You are an expert interviewer. Generate exactly ${numQuestions} interview questions for a ${difficulty} difficulty ${topicContext} interview.

Return ONLY a valid JSON array of objects. Each object must have:
- "question": the interview question text
- "type": one of "behavioral", "technical", "situational", or "conceptual"
- "hints": a short hint string (max 15 words) to guide the candidate

Do not include any explanation or markdown, just the raw JSON array.`;

    const result = await model.generateContent(prompt);
    const content = result.response.text().trim();
    
    // Parse and validate JSON
    let questions;
    try {
      questions = JSON.parse(content);
    } catch {
      // Attempt to extract JSON array from the content
      const match = content.match(/\[[\s\S]*\]/);
      questions = match ? JSON.parse(match[0]) : [];
    }

    return res.json({ questions, topic, subtopic, difficulty });
  } catch (error: any) {
    console.error('Interview start error:', error);
    return res.status(500).json({ error: error.message || 'Failed to generate questions' });
  }
});

// ─── POST /api/interview/evaluate ────────────────────────────────────────────
// Evaluates a single answer and returns structured AI feedback
router.post('/evaluate', async (req: Request, res: Response) => {
  try {
    const { question, answer, topic, difficulty }: EvaluateAnswerBody = req.body;

    if (!question || !answer) {
      return res.status(400).json({ error: 'question and answer are required' });
    }

    if (!answer.trim() || answer.trim().length < 5) {
      return res.json({
        score: 0,
        feedback: 'No meaningful answer was provided.',
        strengths: [],
        improvements: ['Please provide a detailed answer.'],
        modelAnswer: 'A complete answer would be provided here based on the question context.',
      });
    }

    const prompt = `You are an expert ${topic || 'interview'} evaluator. Evaluate the following interview answer.

Question: ${question}
Difficulty: ${difficulty || 'Medium'}
Candidate's Answer: ${answer}

Return ONLY a valid JSON object with these exact fields:
{
  "score": <number from 0 to 10, decimals allowed>,
  "feedback": "<2-3 sentence overall assessment>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<improvement 1>", "<improvement 2>"],
  "modelAnswer": "<a comprehensive model answer in 3-5 sentences>"
}

Be fair but thorough. Do not include any explanation or markdown outside the JSON.`;

    const result = await model.generateContent(prompt);
    const content = result.response.text().trim();

    let evaluation;
    try {
      evaluation = JSON.parse(content);
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      evaluation = match ? JSON.parse(match[0]) : { score: 5, feedback: content, strengths: [], improvements: [], modelAnswer: '' };
    }

    return res.json(evaluation);
  } catch (error: any) {
    console.error('Evaluate error:', error);
    return res.status(500).json({ error: error.message || 'Failed to evaluate answer' });
  }
});

// ─── POST /api/interview/report ───────────────────────────────────────────────
// Generates a final comprehensive report for the interview session
router.post('/report', async (req: Request, res: Response) => {
  try {
    const { questions, topic, difficulty }: ReportBody = req.body;

    if (!questions || !questions.length) {
      return res.status(400).json({ error: 'questions array is required' });
    }

    const totalScore = questions.reduce((sum, q) => sum + q.score, 0);
    const maxScore = questions.length * 10;
    const percentage = Math.round((totalScore / maxScore) * 100);

    const questionsContext = questions
      .map((q, i) => `Q${i + 1}: ${q.question}\nScore: ${q.score}/10\nFeedback: ${q.feedback}`)
      .join('\n\n');

    const prompt = `You are an expert career coach. Based on the following ${topic} interview performance, provide a comprehensive overall report.

${questionsContext}

Overall Score: ${totalScore}/${maxScore} (${percentage}%)
Difficulty: ${difficulty}

Return ONLY a valid JSON object:
{
  "overallFeedback": "<3-4 sentence overall performance summary>",
  "keyStrengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "areasForImprovement": ["<area 1>", "<area 2>", "<area 3>"],
  "recommendedResources": ["<resource 1>", "<resource 2>"],
  "nextSteps": "<1-2 sentences on what to focus on next>",
  "readinessLevel": "<one of: 'Not Ready', 'Needs Improvement', 'Almost Ready', 'Ready', 'Excellent'>"
}`;

    const result = await model.generateContent(prompt);
    const content = result.response.text().trim();
    
    let report;
    try {
      report = JSON.parse(content);
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      report = match ? JSON.parse(match[0]) : {};
    }

    return res.json({ ...report, totalScore, maxScore, percentage });
  } catch (error: any) {
    console.error('Report error:', error);
    return res.status(500).json({ error: error.message || 'Failed to generate report' });
  }
});

export default router;
