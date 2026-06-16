'use client';

// ============================================================
// MathGoGoGo - 评估状态管理
// ============================================================

import React, { createContext, useContext, useReducer, useCallback } from 'react';
import {
  AssessmentState,
  AssessmentResult,
  Question,
  AnswerRecord,
} from '@/types';

// ---- State ----

interface AppState {
  assessmentState: AssessmentState | null;
  currentQuestion: Question | null;
  result: AssessmentResult | null;
  encouragement: string;
  isLoading: boolean;
  lastAnswerCorrect: boolean | null;
  error: string | null;
}

const initialState: AppState = {
  assessmentState: null,
  currentQuestion: null,
  result: null,
  encouragement: '',
  isLoading: false,
  lastAnswerCorrect: null,
  error: null,
};

// ---- Actions ----

type Action =
  | { type: 'START_ASSESSMENT'; state: AssessmentState; question: Question }
  | { type: 'ANSWER_QUESTION'; state: AssessmentState; question: Question; isCorrect: boolean }
  | { type: 'ASSESSMENT_COMPLETE'; state: AssessmentState; result: AssessmentResult; encouragement: string }
  | { type: 'SET_LOADING'; isLoading: boolean }
  | { type: 'SET_ERROR'; error: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'RESET' };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'START_ASSESSMENT':
      return {
        ...state,
        assessmentState: action.state,
        currentQuestion: action.question,
        result: null,
        encouragement: '',
        isLoading: false,
        lastAnswerCorrect: null,
        error: null,
      };
    case 'ANSWER_QUESTION':
      return {
        ...state,
        assessmentState: action.state,
        currentQuestion: action.question,
        lastAnswerCorrect: action.isCorrect,
        isLoading: false,
        error: null,
      };
    case 'ASSESSMENT_COMPLETE':
      return {
        ...state,
        assessmentState: action.state,
        currentQuestion: null,
        result: action.result,
        encouragement: action.encouragement,
        isLoading: false,
        error: null,
      };
    case 'SET_LOADING':
      return { ...state, isLoading: action.isLoading };
    case 'SET_ERROR':
      return { ...state, error: action.error, isLoading: false };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

// ---- Context ----

interface AssessmentContextValue {
  state: AppState;
  startAssessment: () => Promise<void>;
  answerQuestion: (selectedAnswer: number, timeSpentMs: number) => Promise<void>;
  reset: () => void;
}

const AssessmentContext = createContext<AssessmentContextValue | null>(null);

export function AssessmentProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const startAssessment = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', isLoading: true });
    try {
      const res = await fetch('/api/assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' }),
      });

      const json = await res.json();
      if (!json.success) {
        dispatch({ type: 'SET_ERROR', error: json.error || '启动测试失败' });
        return;
      }

      const { state: newState, question } = json.data;
      dispatch({ type: 'START_ASSESSMENT', state: newState, question });
    } catch {
      dispatch({ type: 'SET_ERROR', error: '网络错误，请检查网络连接后重试' });
    }
  }, []);

  const answerQuestion = useCallback(
    async (selectedAnswer: number, timeSpentMs: number) => {
      if (!state.assessmentState || !state.currentQuestion) return;

      dispatch({ type: 'SET_LOADING', isLoading: true });
      try {
        const res = await fetch('/api/assessment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'answer',
            state: state.assessmentState,
            question: state.currentQuestion,
            selectedAnswer,
            timeSpentMs,
          }),
        });

        const json = await res.json();
        if (!json.success) {
          dispatch({ type: 'SET_ERROR', error: json.error || '提交失败' });
          return;
        }

        if (json.data.isComplete) {
          dispatch({
            type: 'ASSESSMENT_COMPLETE',
            state: json.data.state,
            result: json.data.result,
            encouragement: json.data.encouragement,
          });
        } else {
          dispatch({
            type: 'ANSWER_QUESTION',
            state: json.data.state,
            question: json.data.question,
            isCorrect: json.data.isCorrect,
          });
        }
      } catch {
        dispatch({ type: 'SET_ERROR', error: '网络错误，请检查网络连接后重试' });
      }
    },
    [state.assessmentState, state.currentQuestion]
  );

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  return (
    <AssessmentContext.Provider value={{ state, startAssessment, answerQuestion, reset }}>
      {children}
    </AssessmentContext.Provider>
  );
}

export function useAssessment() {
  const ctx = useContext(AssessmentContext);
  if (!ctx) {
    throw new Error('useAssessment must be used within AssessmentProvider');
  }
  return ctx;
}
