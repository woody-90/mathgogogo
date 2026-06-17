'use client';

// ============================================================
// MathGoGoGo - 评估状态管理（纯客户端，无需 API）
// ============================================================

import React, { createContext, useContext, useReducer, useCallback } from 'react';
import {
  AssessmentState,
  AssessmentResult,
  Question,
} from '@/types';
import {
  initAssessment,
  getNextQuestion,
  submitAnswer,
  generateResult,
  getEncouragement,
} from '@/lib/assessment';

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
  | { type: 'RESET' };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'START_ASSESSMENT':
      return { ...state, assessmentState: action.state, currentQuestion: action.question, result: null, encouragement: '', isLoading: false, lastAnswerCorrect: null, error: null };
    case 'ANSWER_QUESTION':
      return { ...state, assessmentState: action.state, currentQuestion: action.question, lastAnswerCorrect: action.isCorrect, isLoading: false, error: null };
    case 'ASSESSMENT_COMPLETE':
      return { ...state, assessmentState: action.state, currentQuestion: null, result: action.result, encouragement: action.encouragement, isLoading: false, error: null };
    case 'SET_LOADING':
      return { ...state, isLoading: action.isLoading };
    case 'SET_ERROR':
      return { ...state, error: action.error, isLoading: false };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

// ---- Context ----

interface AssessmentContextValue {
  state: AppState;
  startAssessment: () => void;
  answerQuestion: (selectedAnswer: number, timeSpentMs: number) => void;
  reset: () => void;
}

const AssessmentContext = createContext<AssessmentContextValue | null>(null);

export function AssessmentProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const startAssessment = useCallback(() => {
    const newState = initAssessment();
    const question = getNextQuestion(newState);
    if (!question) {
      dispatch({ type: 'SET_ERROR', error: '无法生成题目，请重试' });
      return;
    }
    dispatch({ type: 'START_ASSESSMENT', state: newState, question });
  }, []);

  const answer = useCallback(
    (selectedAnswer: number, timeSpentMs: number) => {
      if (!state.assessmentState || !state.currentQuestion) return;

      const updatedState = submitAnswer(
        state.assessmentState,
        state.currentQuestion,
        selectedAnswer,
        timeSpentMs
      );

      if (updatedState.isComplete) {
        const result = generateResult(updatedState);
        const encouragement = getEncouragement(result.score);
        dispatch({ type: 'ASSESSMENT_COMPLETE', state: updatedState, result, encouragement });
      } else {
        const nextQuestion = getNextQuestion(updatedState);
        if (!nextQuestion) {
          dispatch({ type: 'SET_ERROR', error: '无法生成下一题' });
          return;
        }
        const isCorrect = selectedAnswer === state.currentQuestion.correctAnswer;
        dispatch({ type: 'ANSWER_QUESTION', state: updatedState, question: nextQuestion, isCorrect });
      }
    },
    [state.assessmentState, state.currentQuestion]
  );

  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);

  return (
    <AssessmentContext.Provider value={{ state, startAssessment, answerQuestion: answer, reset }}>
      {children}
    </AssessmentContext.Provider>
  );
}

export function useAssessment() {
  const ctx = useContext(AssessmentContext);
  if (!ctx) throw new Error('useAssessment must be used within AssessmentProvider');
  return ctx;
}
