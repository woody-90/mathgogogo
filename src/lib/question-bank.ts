// ============================================================
// MathGoGoGo - 题库引擎
// 为每个等级/题型组合生成参数化题目
// ============================================================

import { Level, QuestionType, Question, Choice, LEVEL_QUESTION_TYPES } from '@/types';

// ---- 工具函数 ----

/** 生成 [min, max] 范围内的随机整数 */
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** 随机打乱数组 */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 生成唯一 ID */
function uid(): string {
  return Math.random().toString(36).substring(2, 9);
}

/** 生成 4 个选项（包含正确答案 + 3 个干扰项） */
function generateChoices(correct: number, distractors: number[]): Choice[] {
  const all = [correct, ...distractors];
  // 去重
  const unique = [...new Set(all)];
  // 如果不够 4 个，补充
  while (unique.length < 4) {
    const extra = correct + randInt(-3, 3);
    if (extra >= 0 && !unique.includes(extra)) {
      unique.push(extra);
    }
  }
  return shuffle(unique.slice(0, 4).map((v) => ({ value: v, label: String(v) })));
}

/** 生成与正确答案相近的干扰项 */
function makeDistractors(correct: number, count: number = 3): number[] {
  const distractors: number[] = [];
  const offsets = shuffle([-3, -2, -1, 1, 2, 3, -4, 4]);
  for (const offset of offsets) {
    if (distractors.length >= count) break;
    const d = correct + offset;
    if (d >= 0 && d !== correct && !distractors.includes(d)) {
      distractors.push(d);
    }
  }
  return distractors;
}

// ---- 等级参数 ----

interface LevelParams {
  numberRange: [number, number];  // 数字范围
  addRange: [number, number];     // 加法结果范围
  subRange: [number, number];     // 减法被减数范围
  mulRange: [number, number];     // 乘法表范围
  divRange: [number, number];     // 除法被除数范围
}

const LEVEL_PARAMS: Record<Level, LevelParams> = {
  1: { numberRange: [1, 10], addRange: [1, 5], subRange: [1, 5], mulRange: [1, 1], divRange: [1, 1] },
  2: { numberRange: [1, 20], addRange: [1, 10], subRange: [1, 10], mulRange: [1, 1], divRange: [1, 1] },
  3: { numberRange: [1, 50], addRange: [1, 20], subRange: [1, 20], mulRange: [1, 2], divRange: [1, 1] },
  4: { numberRange: [1, 100], addRange: [1, 100], subRange: [1, 100], mulRange: [1, 5], divRange: [2, 5] },
  5: { numberRange: [1, 1000], addRange: [10, 999], subRange: [10, 999], mulRange: [1, 9], divRange: [2, 9] },
};

// ---- 各题型生成器 ----

function genCounting(level: Level): Question {
  const p = LEVEL_PARAMS[level];
  const count = randInt(p.numberRange[0], Math.min(p.numberRange[1], 20));
  // 用表情符号表示可数的物体
  const emojis = ['🌟', '🍎', '🌸', '🐱', '🎈', '⭐', '🐶', '🍪', '🦋', '🐟'];
  const emoji = emojis[randInt(0, emojis.length - 1)];
  const objects = Array(count).fill(emoji).join(' ');

  const correct = count;
  const distractors = makeDistractors(correct);

  return {
    id: uid(),
    type: 'counting',
    level,
    questionText: `数一数，下面一共有几个 ${emoji}？\n\n${objects}`,
    choices: generateChoices(correct, distractors),
    correctAnswer: correct,
  };
}

function genComparison(level: Level): Question {
  const p = LEVEL_PARAMS[level];
  const a = randInt(p.numberRange[0], p.numberRange[1]);
  let b: number;
  // 确保 a 和 b 不同，且差值适中
  const diff = randInt(1, Math.max(1, Math.floor((p.numberRange[1] - p.numberRange[0]) / 4)));
  if (Math.random() > 0.5) {
    b = a - diff;
    if (b < 0) b = a + diff;
  } else {
    b = a + diff;
  }

  const symbol = a > b ? '>' : a < b ? '<' : '=';
  const correct = symbol === '>' ? 0 : symbol === '<' ? 1 : 2;

  return {
    id: uid(),
    type: 'comparison',
    level,
    questionText: `比较大小：${a} ○ ${b}，○ 里应该填什么？`,
    choices: [
      { value: 0, label: '>' },
      { value: 1, label: '<' },
      { value: 2, label: '=' },
    ],
    correctAnswer: correct,
    explanation: `${a} ${symbol} ${b}，所以填 "${symbol}"`,
  };
}

function genAddition(level: Level): Question {
  const p = LEVEL_PARAMS[level];
  const maxResult = p.addRange[1];
  const a = randInt(p.addRange[0], maxResult - 1);
  const b = randInt(1, maxResult - a);
  const correct = a + b;

  return {
    id: uid(),
    type: 'addition',
    level,
    questionText: `${a} + ${b} = ？`,
    choices: generateChoices(correct, makeDistractors(correct)),
    correctAnswer: correct,
    explanation: `${a} + ${b} = ${correct}`,
  };
}

function genSubtraction(level: Level): Question {
  const p = LEVEL_PARAMS[level];
  const a = randInt(Math.max(p.subRange[0], 2), p.subRange[1]);
  const b = randInt(1, a);
  const correct = a - b;

  return {
    id: uid(),
    type: 'subtraction',
    level,
    questionText: `${a} - ${b} = ？`,
    choices: generateChoices(correct, makeDistractors(correct)),
    correctAnswer: correct,
    explanation: `${a} - ${b} = ${correct}`,
  };
}

function genMultiplication(level: Level): Question {
  const p = LEVEL_PARAMS[level];
  const a = randInt(p.mulRange[0], p.mulRange[1]);
  const b = randInt(1, p.mulRange[1]);
  const correct = a * b;

  return {
    id: uid(),
    type: 'multiplication',
    level,
    questionText: `${a} × ${b} = ？`,
    choices: generateChoices(correct, makeDistractors(correct)),
    correctAnswer: correct,
    explanation: `${a} × ${b} = ${correct}`,
  };
}

function genDivision(level: Level): Question {
  const p = LEVEL_PARAMS[level];
  const b = randInt(p.divRange[0], Math.min(p.divRange[1], 9));
  const quotient = randInt(1, 9);
  const a = b * quotient;
  const correct = quotient;

  return {
    id: uid(),
    type: 'division',
    level,
    questionText: `${a} ÷ ${b} = ？`,
    choices: generateChoices(correct, makeDistractors(correct)),
    correctAnswer: correct,
    explanation: `${a} ÷ ${b} = ${correct}`,
  };
}

function genFillBlank(level: Level): Question {
  const p = LEVEL_PARAMS[level];

  // 随机选择加法或减法填空题
  if (Math.random() > 0.5) {
    // 加法填空：? + b = c 或 a + ? = c
    const b = randInt(1, p.addRange[1] - 1);
    const correct = randInt(1, p.addRange[1] - b);
    const c = correct + b;
    return {
      id: uid(),
      type: 'fill_blank',
      level,
      questionText: `? + ${b} = ${c}，问号处应该填几？`,
      choices: generateChoices(correct, makeDistractors(correct)),
      correctAnswer: correct,
      explanation: `${correct} + ${b} = ${c}`,
    };
  } else {
    // 减法填空：? - b = c 或 a - ? = c
    const b = randInt(1, Math.floor(p.subRange[1] / 2));
    const correct = randInt(b + 1, p.subRange[1]);
    const c = correct - b;
    return {
      id: uid(),
      type: 'fill_blank',
      level,
      questionText: `? - ${b} = ${c}，问号处应该填几？`,
      choices: generateChoices(correct, makeDistractors(correct)),
      correctAnswer: correct,
      explanation: `${correct} - ${b} = ${c}`,
    };
  }
}

function genWordProblem(level: Level): Question {
  // 应用题模板
  const templates = [
    // 加法场景
    () => {
      const a = randInt(3, 30);
      const b = randInt(2, 20);
      const items = ['苹果', '糖果', '铅笔', '书本', '气球', '贴纸'];
      const item = items[randInt(0, items.length - 1)];
      return {
        text: `小明有 ${a} 个${item}，妈妈又给了他 ${b} 个。小明现在一共有几个${item}？`,
        answer: a + b,
      };
    },
    // 减法场景
    () => {
      const a = randInt(10, 50);
      const b = randInt(1, a - 1);
      const items = ['苹果', '糖果', '饼干', '弹珠', '卡片', '巧克力'];
      const item = items[randInt(0, items.length - 1)];
      return {
        text: `小华有 ${a} 个${item}，吃了 ${b} 个，还剩几个？`,
        answer: a - b,
      };
    },
    // 乘法场景
    () => {
      const a = randInt(2, 9);
      const b = randInt(2, 5);
      return {
        text: `教室里有 ${a} 排桌子，每排有 ${b} 张桌子。教室里一共有多少张桌子？`,
        answer: a * b,
      };
    },
    // 除法场景
    () => {
      const b = randInt(2, 6);
      const quotient = randInt(2, 8);
      const a = b * quotient;
      const items = ['糖果', '铅笔', '饼干', '贴纸', '卡片'];
      const item = items[randInt(0, items.length - 1)];
      return {
        text: `老师把 ${a} 个${item}平均分给 ${b} 个小朋友，每个小朋友分到几个？`,
        answer: quotient,
      };
    },
    // 混合运算
    () => {
      const a = randInt(3, 15);
      const b = randInt(1, a);
      const c = randInt(1, 10);
      return {
        text: `小红有 ${a} 块钱，买文具花了 ${b} 块钱，奶奶又给了她 ${c} 块钱。小红现在有多少钱？`,
        answer: a - b + c,
      };
    },
  ];

  // 根据等级选择合适的模板
  let availableTemplates = templates;
  if (level <= 3) {
    availableTemplates = templates.slice(0, 2); // 只用加减法
  } else if (level === 4) {
    availableTemplates = templates.slice(0, 4); // 加减乘除
  }

  const template = availableTemplates[randInt(0, availableTemplates.length - 1)];
  const { text, answer } = template();

  return {
    id: uid(),
    type: 'word_problem',
    level,
    questionText: text,
    choices: generateChoices(answer, makeDistractors(answer)),
    correctAnswer: answer,
    explanation: text.replace('？', `？答案是 ${answer}`),
  };
}

// ---- 主生成函数 ----

/** 生成一道随机题目（根据等级和可选题型） */
export function generateQuestion(level: Level, allowedTypes?: QuestionType[]): Question {
  const availableTypes = allowedTypes || LEVEL_QUESTION_TYPES[level];
  const type = availableTypes[randInt(0, availableTypes.length - 1)];

  switch (type) {
    case 'counting': return genCounting(level);
    case 'comparison': return genComparison(level);
    case 'addition': return genAddition(level);
    case 'subtraction': return genSubtraction(level);
    case 'multiplication': return genMultiplication(level);
    case 'division': return genDivision(level);
    case 'fill_blank': return genFillBlank(level);
    case 'word_problem': return genWordProblem(level);
    default: return genAddition(level);
  }
}

/** 生成一批练习题 */
export function generateWorksheetProblems(
  level: Level,
  count: number,
  types: QuestionType[]
): { index: number; type: QuestionType; questionText: string; answer: number }[] {
  const problems: { index: number; type: QuestionType; questionText: string; answer: number }[] = [];
  const availableTypes = types.length > 0 ? types : LEVEL_QUESTION_TYPES[level];

  for (let i = 0; i < count; i++) {
    const type = availableTypes[randInt(0, availableTypes.length - 1)];
    const q = generateQuestion(level, [type]);
    problems.push({
      index: i + 1,
      type: q.type,
      questionText: q.questionText,
      answer: q.correctAnswer,
    });
  }

  return problems;
}
