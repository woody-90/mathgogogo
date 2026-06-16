// ============================================================
// MathGoGoGo - 自适应测试引擎
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

const TOTAL_QUESTIONS = 12;
const START_LEVEL: Level = 1;
const STREAK_THRESHOLD = 2;   // 连对/连错多少题调整难度
const LEVEL_STEP = 0.5;       // 每次调整半级

// ---- 初始化评估 ----

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

  // 将 currentLevel 四舍五入到最近的整数等级
  const roundedLevel = Math.round(state.currentLevel) as Level;
  const baseLevel = Math.max(1, Math.min(5, roundedLevel)) as Level;

  // 每 4 题插入一道"探索题"（来自更高等级），探测小朋友的上限
  // 这样可以确保乘除法等高等级题型有机会被测试到
  const isProbeQuestion = state.currentQuestionIndex > 0
    && state.currentQuestionIndex % 4 === 3
    && baseLevel < 5;

  if (isProbeQuestion) {
    const probeLevel = Math.min(5, baseLevel + 1) as Level;
    // 优先选择当前等级没有的新题型
    const currentTypes = LEVEL_QUESTION_TYPES[baseLevel];
    const probeTypes = LEVEL_QUESTION_TYPES[probeLevel];
    const newTypes = probeTypes.filter((t) => !currentTypes.includes(t));

    if (newTypes.length > 0) {
      // 有新的题型，从新题型中随机选
      return generateQuestion(probeLevel, newTypes);
    }
    // 没有新题型，从探索等级随机出题
    return generateQuestion(probeLevel);
  }

  return generateQuestion(baseLevel);
}

// ---- 提交答案并更新状态 ----

export function submitAnswer(
  state: AssessmentState,
  question: Question,
  selectedAnswer: number,
  timeSpentMs: number
): AssessmentState {
  const isCorrect = selectedAnswer === question.correctAnswer;

  // 创建答题记录
  const record: AnswerRecord = {
    question,
    selectedAnswer,
    isCorrect,
    timeSpentMs,
  };

  const newHistory = [...state.answerHistory, record];
  const newIndex = state.currentQuestionIndex + 1;
  const isComplete = newIndex >= TOTAL_QUESTIONS;

  // 更新连续对错计数
  let streakCorrect = isCorrect ? state.streakCorrect + 1 : 0;
  let streakWrong = !isCorrect ? state.streakWrong + 1 : 0;

  // 自适应难度调整
  let newLevel = state.currentLevel;

  if (streakCorrect >= STREAK_THRESHOLD) {
    // 连续答对，提升难度
    newLevel = Math.min(5, state.currentLevel + LEVEL_STEP);
    streakCorrect = 0; // 重置连对计数
  }

  if (streakWrong >= STREAK_THRESHOLD) {
    // 连续答错，降低难度
    newLevel = Math.max(1, state.currentLevel - LEVEL_STEP);
    streakWrong = 0; // 重置连错计数
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

// ---- 生成最终评估结果 ----

export function generateResult(state: AssessmentState): AssessmentResult {
  const history = state.answerHistory;
  const totalCorrect = history.filter((r) => r.isCorrect).length;
  const score = Math.round((totalCorrect / history.length) * 100);

  // 统计各等级表现 + 收集已测试的题型
  const levelScores: Record<Level, { correct: number; total: number }> = {
    1: { correct: 0, total: 0 },
    2: { correct: 0, total: 0 },
    3: { correct: 0, total: 0 },
    4: { correct: 0, total: 0 },
    5: { correct: 0, total: 0 },
  };
  const testedTypes = new Set<QuestionType>();

  for (const record of history) {
    const lv = record.question.level;
    levelScores[lv].total++;
    if (record.isCorrect) {
      levelScores[lv].correct++;
    }
    testedTypes.add(record.question.type);
  }

  // 确定最终等级
  // 算法：找到答对率 >= 60% 且至少有 2 题的最高等级
  // （至少 2 题防止单道探索题误判等级）
  let finalLevel: Level = 1;
  for (let lv = 1; lv <= 5; lv++) {
    const ls = levelScores[lv as Level];
    if (ls.total >= 2) {
      const rate = ls.correct / ls.total;
      if (rate >= 0.6) {
        finalLevel = lv as Level;
      }
    }
  }

  // 从当前难度推测等级
  const roundedFinal = Math.round(state.currentLevel) as Level;
  if (roundedFinal > finalLevel && score >= 50) {
    finalLevel = Math.max(finalLevel, Math.min(roundedFinal, 5) as Level) as Level;
  }

  // 安全检查：不能推荐到未测试过核心题型的等级
  // 等级 4 的核心题型是乘法，如果没测过乘法，不能超过等级 3
  if (finalLevel >= 4 && !testedTypes.has('multiplication')) {
    finalLevel = 3;
  }
  // 等级 5 的核心题型是除法，如果没测过除法，不能超过等级 4
  if (finalLevel >= 5 && !testedTypes.has('division')) {
    finalLevel = 4;
  }

  // 生成建议
  const suggestions: Record<Level, string> = {
    1: '小朋友正在建立数字概念，建议从数数和比较大小开始练习，多用实物帮助理解。',
    2: '基础不错！继续巩固 10 以内加减法，可以开始认识更大的数字了。',
    3: '已经掌握基本加减法，建议多做 20 以内口算练习，培养数感。',
    4: '数学能力很棒！继续练习 100 以内加减法和乘法口诀，多接触应用题。',
    5: '非常厉害！可以挑战乘除法和多位数运算，尝试解决更复杂的实际问题。',
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

/** 获取鼓励语 */
export function getEncouragement(score: number): string {
  if (score >= 90) return '太棒了！你真是数学小天才！🌟';
  if (score >= 70) return '非常好！继续加油！👏';
  if (score >= 50) return '不错哦！再加把劲！💪';
  return '没关系，多练习就会越来越好！🌈';
}
