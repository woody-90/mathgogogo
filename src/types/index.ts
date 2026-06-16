// ============================================================
// MathGoGoGo - 类型定义
// ============================================================

/** 数学水平等级 (1-5) */
export type Level = 1 | 2 | 3 | 4 | 5;

/** 等级名称映射（中文，用于网页显示） */
export const LEVEL_NAMES: Record<Level, string> = {
  1: '幼儿园小班',
  2: '幼儿园中/大班',
  3: '一年级',
  4: '二年级',
  5: '三年级',
};

/** 等级名称映射（英文，用于 PDF，因为 jsPDF 不支持中文字体） */
export const LEVEL_LABELS_EN: Record<Level, string> = {
  1: 'Pre-K',
  2: 'Kindergarten',
  3: 'Grade 1',
  4: 'Grade 2',
  5: 'Grade 3',
};

/** 等级描述 */
export const LEVEL_DESCRIPTIONS: Record<Level, string> = {
  1: '认识数字 1-10，会比较大小和多少，认识基本图形',
  2: '掌握 1-20 数字，简单规律排序，10 以内加减法',
  3: '20 以内加减法，认识个位十位，比较数字大小',
  4: '100 以内加减法，乘法口诀（1-5），简单应用题',
  5: '乘除法运算，多位数加减，分数初步认识',
};

/** 题型 */
export type QuestionType =
  | 'counting'      // 数数题
  | 'comparison'    // 比较题
  | 'addition'      // 加法题
  | 'subtraction'   // 减法题
  | 'multiplication' // 乘法题
  | 'division'      // 除法题
  | 'fill_blank'    // 填空题
  | 'word_problem'; // 应用题

/** 题型名称（中文） */
export const QUESTION_TYPE_NAMES: Record<QuestionType, string> = {
  counting: '数数',
  comparison: '比大小',
  addition: '加法',
  subtraction: '减法',
  multiplication: '乘法',
  division: '除法',
  fill_blank: '填空',
  word_problem: '应用题',
};

/** 每个等级适用的题型 */
export const LEVEL_QUESTION_TYPES: Record<Level, QuestionType[]> = {
  1: ['counting', 'comparison'],
  2: ['counting', 'comparison', 'addition', 'subtraction'],
  3: ['comparison', 'addition', 'subtraction', 'fill_blank'],
  4: ['addition', 'subtraction', 'multiplication', 'fill_blank', 'word_problem'],
  5: ['addition', 'subtraction', 'multiplication', 'division', 'fill_blank', 'word_problem'],
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
  questionText: string;    // 题目文字
  choices: Choice[];       // 选项（4个）
  correctAnswer: number;  // 正确答案
  explanation?: string;    // 解析（可选）
}

/** 用户的一次作答记录 */
export interface AnswerRecord {
  question: Question;
  selectedAnswer: number | null; // null 表示未作答
  isCorrect: boolean;
  timeSpentMs: number;  // 答题耗时
}

/** 评估状态 */
export interface AssessmentState {
  currentLevel: number;         // 当前测试难度（允许小数，用于平滑调整）
  currentQuestionIndex: number; // 当前第几题
  totalQuestions: number;       // 总题数
  answerHistory: AnswerRecord[];// 答题历史
  isComplete: boolean;          // 测试是否完成
  streakCorrect: number;        // 连续答对数
  streakWrong: number;          // 连续答错数
}

/** 评估结果 */
export interface AssessmentResult {
  finalLevel: Level;            // 最终等级
  score: number;                // 总正确率 (0-100)
  totalCorrect: number;
  totalQuestions: number;
  levelScores: Record<Level, { correct: number; total: number }>; // 各等级正确率
  answerHistory: AnswerRecord[];
  suggestion: string;           // 学习建议
}

/** 练习题配置 */
export interface WorksheetConfig {
  level: Level;
  questionCount: number;        // 题目数量 (10-50)
  questionTypes: QuestionType[]; // 选中的题型
  includeAnswerSheet: boolean;  // 是否附带答案页
  title?: string;               // 自定义标题
}

/** 练习题 */
export interface WorksheetProblem {
  index: number;
  type: QuestionType;
  questionText: string;
  answer: number;
  showWorkSpace?: boolean; // 是否显示答题区
}

/** API 响应格式 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
