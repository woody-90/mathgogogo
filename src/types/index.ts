// ============================================================
// MathGoGoGo - 类型定义
// 6 级体系：匹配 3-8 岁儿童发展标准
// ============================================================

/** 数学水平等级 (1-6)，对应 3-8 岁 */
export type Level = 1 | 2 | 3 | 4 | 5 | 6;

/** 等级名称（中文） */
export const LEVEL_NAMES: Record<Level, string> = {
  1: '小班（3岁）',
  2: '中班（4岁）',
  3: '大班（5岁）',
  4: '一年级（6-7岁）',
  5: '二年级（7-8岁）',
  6: '三年级（8岁）',
};

/** 等级描述 */
export const LEVEL_DESCRIPTIONS: Record<Level, string> = {
  1: '点数1-5、认识圆形/正方形/三角形、比大小长短、简单AB规律',
  2: '点数1-10、数字0-10对应、10以内实物加减、认识长方形/椭圆',
  3: '1-100顺数倒数、20以内进退位加减、认识钟表钱币、简单应用题',
  4: '100以内加减法、连加连减混合运算、人民币购物找零、时分秒',
  5: '万以内数读写、乘法口诀表内乘除法、两步应用题、长度重量',
  6: '大数运算、分数小数初步、四则混合运算、周长面积、多步骤应用',
};

/** 等级名称（英文，PDF用） */
export const LEVEL_LABELS_EN: Record<Level, string> = {
  1: 'Pre-K (Age 3)',
  2: 'K-4 (Age 4)',
  3: 'K-5 (Age 5)',
  4: 'Grade 1 (Age 6-7)',
  5: 'Grade 2 (Age 7-8)',
  6: 'Grade 3 (Age 8)',
};

/** 题型 */
export type QuestionType =
  | 'counting'       // 数数
  | 'comparison'     // 比较大小/长短/高矮
  | 'addition'       // 加法
  | 'subtraction'    // 减法
  | 'multiplication' // 乘法
  | 'division'       // 除法
  | 'fill_blank'     // 填空
  | 'word_problem'   // 应用题
  | 'shapes'         // 图形识别
  | 'patterns';      // 规律推理

/** 题型名称（中文） */
export const QUESTION_TYPE_NAMES: Record<QuestionType, string> = {
  counting: '数数',
  comparison: '比较',
  addition: '加法',
  subtraction: '减法',
  multiplication: '乘法',
  division: '除法',
  fill_blank: '填空',
  word_problem: '应用题',
  shapes: '图形',
  patterns: '规律',
};

/** 每个等级适用的题型 */
export const LEVEL_QUESTION_TYPES: Record<Level, QuestionType[]> = {
  1: ['counting', 'comparison', 'shapes', 'patterns'],
  2: ['counting', 'comparison', 'shapes', 'patterns', 'addition', 'subtraction'],
  3: ['counting', 'comparison', 'addition', 'subtraction', 'fill_blank', 'word_problem'],
  4: ['comparison', 'addition', 'subtraction', 'fill_blank', 'word_problem'],
  5: ['addition', 'subtraction', 'multiplication', 'division', 'fill_blank', 'word_problem'],
  6: ['addition', 'subtraction', 'multiplication', 'division', 'fill_blank', 'word_problem'],
};

/** 题目选项 */
export interface Choice {
  value: number;
  label: string;
}

/** 一道题目 */
export interface Question {
  id: string;
  type: QuestionType;
  level: Level;
  questionText: string;
  choices: Choice[];
  correctAnswer: number;
  explanation?: string;
}

/** 用户的一次作答记录 */
export interface AnswerRecord {
  question: Question;
  selectedAnswer: number | null;
  isCorrect: boolean;
  timeSpentMs: number;
}

/** 评估状态 */
export interface AssessmentState {
  currentLevel: number;
  currentQuestionIndex: number;
  totalQuestions: number;
  answerHistory: AnswerRecord[];
  isComplete: boolean;
  streakCorrect: number;
  streakWrong: number;
}

/** 评估结果 */
export interface AssessmentResult {
  finalLevel: Level;
  score: number;
  totalCorrect: number;
  totalQuestions: number;
  levelScores: Record<Level, { correct: number; total: number }>;
  answerHistory: AnswerRecord[];
  suggestion: string;
}

/** 练习题配置 */
export interface WorksheetConfig {
  level: Level;
  questionCount: number;
  questionTypes: QuestionType[];
  includeAnswerSheet: boolean;
  title?: string;
}

/** 练习题 */
export interface WorksheetProblem {
  index: number;
  type: QuestionType;
  questionText: string;
  answer: number;
  showWorkSpace?: boolean;
}

/** API 响应格式 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
