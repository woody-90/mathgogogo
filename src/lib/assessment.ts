// ============================================================
// MathGoGoGo - 自适应测试引擎 (6级体系)
// ============================================================

import {
  Level,
  AssessmentState,
  AssessmentResult,
  AnswerRecord,
  Question,
  QuestionType,
  LEVEL_NAMES,
  LEVEL_DESCRIPTIONS,
  LEVEL_QUESTION_TYPES,
} from '@/types';
import { generateQuestion } from './question-bank';

// ---- 常量 ----

const TOTAL_QUESTIONS = 15;
const START_LEVEL: Level = 1;
const STREAK_THRESHOLD = 2;
const LEVEL_STEP = 0.5;

// ---- 初始化 ----

export function initAssessment(): AssessmentState {
  return {
    currentLevel: START_LEVEL,
    currentQuestionIndex: 0,
    totalQuestions: TOTAL_QUESTIONS,
    answerHistory: [],
    isComplete: false,
    streakCorrect: 0,
    streakWrong: 0,
  };
}

// ---- 获取下一题 ----

export function getNextQuestion(state: AssessmentState): Question | null {
  if (state.isComplete || state.currentQuestionIndex >= TOTAL_QUESTIONS) {
    return null;
  }

  const roundedLevel = Math.round(state.currentLevel) as Level;
  const baseLevel = Math.max(1, Math.min(6, roundedLevel)) as Level;

  // 每 3-4 题插入一道"探索题"探测上限
  const probeIdx = state.currentQuestionIndex > 0 && state.currentQuestionIndex <= 12
    ? (state.currentQuestionIndex % 4 === 3)
    : false;

  if (probeIdx && baseLevel < 6) {
    const probeLevel = Math.min(6, baseLevel + 1) as Level;
    const currentTypes = LEVEL_QUESTION_TYPES[baseLevel];
    const probeTypes = LEVEL_QUESTION_TYPES[probeLevel];
    const newTypes = probeTypes.filter((t) => !currentTypes.includes(t));

    if (newTypes.length > 0) {
      return generateQuestion(probeLevel, newTypes);
    }
    return generateQuestion(probeLevel);
  }

  return generateQuestion(baseLevel);
}

// ---- 提交答案 ----

export function submitAnswer(
  state: AssessmentState,
  question: Question,
  selectedAnswer: number,
  timeSpentMs: number
): AssessmentState {
  const isCorrect = selectedAnswer === question.correctAnswer;

  const record: AnswerRecord = { question, selectedAnswer, isCorrect, timeSpentMs };
  const newHistory = [...state.answerHistory, record];
  const newIndex = state.currentQuestionIndex + 1;
  const isComplete = newIndex >= TOTAL_QUESTIONS;

  let streakCorrect = isCorrect ? state.streakCorrect + 1 : 0;
  let streakWrong = !isCorrect ? state.streakWrong + 1 : 0;
  let newLevel = state.currentLevel;

  if (streakCorrect >= STREAK_THRESHOLD) {
    newLevel = Math.min(6, state.currentLevel + LEVEL_STEP);
    streakCorrect = 0;
  }
  if (streakWrong >= STREAK_THRESHOLD) {
    newLevel = Math.max(1, state.currentLevel - LEVEL_STEP);
    streakWrong = 0;
  }

  return {
    currentLevel: newLevel,
    currentQuestionIndex: newIndex,
    totalQuestions: TOTAL_QUESTIONS,
    answerHistory: newHistory,
    isComplete,
    streakCorrect,
    streakWrong,
  };
}

// ---- 生成结果 ----

export function generateResult(state: AssessmentState): AssessmentResult {
  const history = state.answerHistory;
  const totalCorrect = history.filter((r) => r.isCorrect).length;
  const score = Math.round((totalCorrect / history.length) * 100);

  const levelScores: Record<Level, { correct: number; total: number }> = {
    1: { correct: 0, total: 0 },
    2: { correct: 0, total: 0 },
    3: { correct: 0, total: 0 },
    4: { correct: 0, total: 0 },
    5: { correct: 0, total: 0 },
    6: { correct: 0, total: 0 },
  };
  const testedTypes = new Set<QuestionType>();

  for (const record of history) {
    const lv = record.question.level;
    levelScores[lv].total++;
    if (record.isCorrect) levelScores[lv].correct++;
    testedTypes.add(record.question.type);
  }

  // 确定最终等级：找到答对率 >= 60% 且至少 2 题的最高等级
  let finalLevel: Level = 1;
  for (let lv = 1; lv <= 6; lv++) {
    const ls = levelScores[lv as Level];
    if (ls.total >= 2) {
      const rate = ls.correct / ls.total;
      if (rate >= 0.6) finalLevel = lv as Level;
    }
  }

  // 从当前难度补正
  const roundedFinal = Math.round(state.currentLevel) as Level;
  if (roundedFinal > finalLevel && score >= 50) {
    finalLevel = Math.max(finalLevel, Math.min(roundedFinal, 6) as Level) as Level;
  }

  // 安全阀：高等级要测过对应题型
  if (finalLevel >= 5 && !testedTypes.has('multiplication')) finalLevel = 4;
  if (finalLevel >= 6 && !testedTypes.has('division')) finalLevel = 5;

  const suggestions: Record<Level, string> = {
    1: '小朋友正在建立数字概念，建议从 1-5 数数和简单图形开始，多用实物帮助理解。',
    2: '数感不错！巩固 10 以内点数、认识数字符号，可以开始 10 以内实物加减练习。',
    3: '基础扎实！重点练习 20 以内进退位加减法，可接触简单应用题和钟表钱币认知。',
    4: '已具备小学入学水平！继续训练 100 以内加减法、连加连减，加强应用题理解。',
    5: '数学能力很强！熟练掌握乘法口诀，练习两步应用题和长度重量单位换算。',
    6: '非常出色！可以挑战大数运算、分数小数入门，以及周长面积和复杂应用题。',
  };

  return {
    finalLevel,
    score,
    totalCorrect,
    totalQuestions: history.length,
    levelScores,
    answerHistory: history,
    suggestion: suggestions[finalLevel],
  };
}

export function getEncouragement(score: number): string {
  if (score >= 90) return '太棒了！你真是数学小天才！🌟';
  if (score >= 70) return '非常好！继续加油！👏';
  if (score >= 50) return '不错哦！再加把劲！💪';
  return '没关系，多练习就会越来越好！🌈';
}
