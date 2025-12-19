import { z } from 'zod';

/**
 * Schema for suggested action buttons
 */
export const suggestedActionSchema = z.object({
  label: z.string().describe('Button label text (short, actionable)'),
  action: z.enum(['ask_question', 'watch_video', 'explore_topic', 'answer_quiz']).describe('Type of action'),
  value: z.string().describe('The query or action payload'),
  video_id: z.string().optional().describe('YouTube video ID if action is watch_video'),
});

/**
 * Schema for video selection options
 */
export const videoSelectionSchema = z.object({
  video_id: z.string().describe('YouTube video ID'),
  title: z.string().describe('Video title'),
  topic: z.string().optional().describe('Video category'),
  subtopic: z.string().optional().describe('Specific technique'),
  reason: z.string().describe('Why this video is relevant to the user'),
  timestamp: z.number().optional().describe('Specific timestamp in seconds to start at'),
});

/**
 * Schema for multiple choice questions
 */
export const multipleChoiceSchema = z.object({
  question: z.string().describe('The quiz/assessment question'),
  options: z.array(z.object({
    id: z.string().describe('Option identifier (A, B, C, D)'),
    text: z.string().describe('Option text'),
    is_correct: z.boolean().optional().describe('Whether this is the correct answer'),
  })).min(2).max(4).describe('Answer options'),
  explanation: z.string().optional().describe('Explanation shown after answering'),
});

/**
 * Main structured response schema for AI coaching
 */
export const coachingResponseSchema = z.object({
  response: z.string().describe('The main coaching response text from Matt'),
  
  suggested_actions: z.array(suggestedActionSchema)
    .max(4)
    .optional()
    .describe('2-4 suggested follow-up actions as clickable buttons'),
  
  video_selections: z.array(videoSelectionSchema)
    .max(3)
    .optional()
    .describe('Videos the user can choose to watch'),
  
  quiz: multipleChoiceSchema
    .optional()
    .describe('Optional quiz question to test understanding'),
});

export type SuggestedAction = z.infer<typeof suggestedActionSchema>;
export type VideoSelection = z.infer<typeof videoSelectionSchema>;
export type MultipleChoice = z.infer<typeof multipleChoiceSchema>;
export type CoachingResponse = z.infer<typeof coachingResponseSchema>;

