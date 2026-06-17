// ============================================================
// MathGoGoGo - 题库引擎 (6级体系)
// 匹配 3-8 岁儿童发展标准
// ============================================================

import { Level, QuestionType, Question, Choice, LEVEL_QUESTION_TYPES } from '@/types';

// ---- 工具函数 ----

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function uid(): string {
  return Math.random().toString(36).substring(2, 9);
}

function generateChoices(correct: number, distractors: number[]): Choice[] {
  const all = [correct, ...distractors];
  const unique = [...new Set(all)];
  while (unique.length < 4) {
    const extra = correct + randInt(-3, 3);
    if (extra >= 0 && !unique.includes(extra)) unique.push(extra);
  }
  return shuffle(unique.slice(0, 4).map((v) => ({ value: v, label: String(v) })));
}

function makeDistractors(correct: number, count: number = 3): number[] {
  const distractors: number[] = [];
  const offsets = shuffle([-3, -2, -1, 1, 2, 3, -4, 4]);
  for (const o of offsets) {
    if (distractors.length >= count) break;
    const d = correct + o;
    if (d >= 0 && d !== correct && !distractors.includes(d)) distractors.push(d);
  }
  return distractors;
}

// ---- 等级参数 ----

interface LevelParams {
  numberRange: [number, number];
  addMax: number;
  subMax: number;
  mulMax: number;
}

const LP: Record<Level, LevelParams> = {
  1: { numberRange: [1, 5], addMax: 5, subMax: 5, mulMax: 1 },
  2: { numberRange: [1, 10], addMax: 10, subMax: 10, mulMax: 1 },
  3: { numberRange: [1, 20], addMax: 20, subMax: 20, mulMax: 2 },
  4: { numberRange: [1, 100], addMax: 100, subMax: 100, mulMax: 5 },
  5: { numberRange: [1, 1000], addMax: 999, subMax: 999, mulMax: 9 },
  6: { numberRange: [1, 10000], addMax: 9999, subMax: 9999, mulMax: 9 },
};

// ---- 各题型生成器 ----

function genCounting(level: Level): Question {
  const p = LP[level];
  const maxCount = level <= 2 ? p.numberRange[1] : Math.min(p.numberRange[1], 20);
  const count = randInt(p.numberRange[0], maxCount);
  const emojis = ['🌟', '🍎', '🌸', '🐱', '🎈', '⭐', '🐶', '🍪'];
  const emoji = emojis[randInt(0, emojis.length - 1)];
  const objects = Array(count).fill(emoji).join(' ');

  return {
    id: uid(), type: 'counting', level,
    questionText: `数一数，下面一共有几个 ${emoji}？\n\n${objects}`,
    choices: generateChoices(count, makeDistractors(count)),
    correctAnswer: count,
  };
}

function genComparison(level: Level): Question {
  const p = LP[level];
  const a = randInt(p.numberRange[0], p.numberRange[1]);
  let b: number;
  const diff = randInt(1, Math.max(1, Math.floor(p.numberRange[1] / 4)));
  if (Math.random() > 0.5) {
    b = Math.max(0, a - diff);
  } else {
    b = a + diff;
  }
  // 30% 概率出相等题
  if (level >= 2 && Math.random() < 0.3) b = a;

  const symbol = a > b ? '>' : a < b ? '<' : '=';
  const correct = symbol === '>' ? 0 : symbol === '<' ? 1 : 2;

  return {
    id: uid(), type: 'comparison', level,
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
  const p = LP[level];
  const max = p.addMax;
  const a = randInt(1, max - 1);
  const b = randInt(1, max - a);
  const correct = a + b;

  return {
    id: uid(), type: 'addition', level,
    questionText: `${a} + ${b} = ？`,
    choices: generateChoices(correct, makeDistractors(correct)),
    correctAnswer: correct,
    explanation: `${a} + ${b} = ${correct}`,
  };
}

function genSubtraction(level: Level): Question {
  const p = LP[level];
  const max = p.subMax;
  const a = randInt(Math.max(2, Math.floor(max / 4)), max);
  const b = randInt(1, a);
  const correct = a - b;

  return {
    id: uid(), type: 'subtraction', level,
    questionText: `${a} - ${b} = ？`,
    choices: generateChoices(correct, makeDistractors(correct)),
    correctAnswer: correct,
    explanation: `${a} - ${b} = ${correct}`,
  };
}

function genMultiplication(level: Level): Question {
  const p = LP[level];
  const a = randInt(2, p.mulMax);
  const b = randInt(2, level <= 5 ? 5 : 9);
  const correct = a * b;

  return {
    id: uid(), type: 'multiplication', level,
    questionText: `${a} × ${b} = ？`,
    choices: generateChoices(correct, makeDistractors(correct)),
    correctAnswer: correct,
  };
}

function genDivision(level: Level): Question {
  const b = randInt(2, level <= 5 ? 5 : 9);
  const quotient = randInt(2, level <= 5 ? 5 : 9);
  const a = b * quotient;

  return {
    id: uid(), type: 'division', level,
    questionText: `${a} ÷ ${b} = ？`,
    choices: generateChoices(quotient, makeDistractors(quotient)),
    correctAnswer: quotient,
  };
}

function genFillBlank(level: Level): Question {
  const p = LP[level];

  if (Math.random() > 0.5) {
    const b = randInt(1, Math.min(20, p.addMax - 1));
    const correct = randInt(1, Math.min(20, p.addMax - b));
    const c = correct + b;
    return {
      id: uid(), type: 'fill_blank', level,
      questionText: `? + ${b} = ${c}，问号处应该填几？`,
      choices: generateChoices(correct, makeDistractors(correct)),
      correctAnswer: correct,
    };
  } else {
    const b = randInt(1, Math.min(10, Math.floor(p.subMax / 2)));
    const correct = randInt(b + 1, Math.min(30, p.subMax));
    const c = correct - b;
    return {
      id: uid(), type: 'fill_blank', level,
      questionText: `? - ${b} = ${c}，问号处应该填几？`,
      choices: generateChoices(correct, makeDistractors(correct)),
      correctAnswer: correct,
    };
  }
}

function genWordProblem(level: Level): Question {
  // ---- 简单应用题（等级 1-3）----
  const easyTemplates = [
    () => {
      const a = randInt(2, level <= 2 ? 5 : 10);
      const b = randInt(1, level <= 2 ? 3 : 8);
      const items = ['苹果', '糖果', '铅笔', '气球', '饼干'];
      const item = items[randInt(0, items.length - 1)];
      return {
        text: `小明有 ${a} 个${item}，妈妈又给了他 ${b} 个，现在一共有几个？`,
        answer: a + b,
      };
    },
    () => {
      const a = randInt(level <= 2 ? 3 : 5, level <= 2 ? 10 : 20);
      const b = randInt(1, a - 1);
      const items = ['苹果', '糖果', '饼干', '弹珠'];
      const item = items[randInt(0, items.length - 1)];
      return {
        text: `小华有 ${a} 个${item}，吃了 ${b} 个，还剩几个？`,
        answer: a - b,
      };
    },
    () => {
      const a = randInt(3, level <= 2 ? 8 : 15);
      const b = randInt(1, Math.min(8, a));
      return {
        text: `哥哥有 ${a} 颗糖，弟弟有 ${b} 颗糖，哥哥比弟弟多几颗？`,
        answer: a - b,
      };
    },
    () => {
      const a = randInt(2, level <= 2 ? 5 : 8);
      const b = randInt(2, level <= 2 ? 3 : 6);
      return {
        text: `树上有 ${a} 只小鸟，又飞来 ${b} 只，现在一共有几只？`,
        answer: a + b,
      };
    },
  ];

  // ---- 进阶应用题（等级 4-6）----
  const hardTemplates = [
    () => {
      const a = randInt(10, 50);
      const b = randInt(5, 30);
      const items = ['苹果', '糖果', '铅笔', '书本'];
      const item = items[randInt(0, items.length - 1)];
      return {
        text: `小明有 ${a} 个${item}，妈妈又给了他 ${b} 个，现在一共有几个？`,
        answer: a + b,
      };
    },
    () => {
      const a = randInt(20, 100);
      const b = randInt(5, a - 1);
      const items = ['苹果', '糖果', '饼干', '弹珠'];
      const item = items[randInt(0, items.length - 1)];
      return {
        text: `小华有 ${a} 个${item}，吃了 ${b} 个，还剩几个？`,
        answer: a - b,
      };
    },
    () => {
      const a = randInt(2, 9);
      const b = randInt(2, 5);
      return {
        text: `教室里有 ${a} 排桌子，每排 ${b} 张，一共有多少张？`,
        answer: a * b,
      };
    },
    () => {
      const b = randInt(2, 6);
      const q = randInt(2, 8);
      const items = ['糖果', '铅笔', '饼干', '贴纸'];
      const item = items[randInt(0, items.length - 1)];
      return {
        text: `老师把 ${b * q} 个${item}平均分给 ${b} 个小朋友，每人几个？`,
        answer: q,
      };
    },
    () => {
      const a = randInt(10, 50);
      const b = randInt(1, Math.min(20, a));
      const c = randInt(5, 20);
      return {
        text: `小红有 ${a} 元，买文具花了 ${b} 元，奶奶又给了 ${c} 元，现在有多少元？`,
        answer: a - b + c,
      };
    },
  ];

  const templates = level <= 3 ? easyTemplates : hardTemplates;
  const t = templates[randInt(0, templates.length - 1)];
  const { text, answer } = t();

  return {
    id: uid(), type: 'word_problem', level,
    questionText: text,
    choices: generateChoices(answer, makeDistractors(answer)),
    correctAnswer: answer,
    explanation: text.replace('？', `？答案是 ${answer}`),
  };
}

/** 图形识别题 */
function genShapes(level: Level): Question {
  const shapes = level <= 2
    ? ['圆形 ○', '正方形 □', '三角形 △']
    : ['圆形 ○', '正方形 □', '三角形 △', '长方形 ▭', '椭圆形 ⬭'];

  const names = level <= 2
    ? ['圆形', '正方形', '三角形']
    : ['圆形', '正方形', '三角形', '长方形', '椭圆形'];

  const correctIdx = randInt(0, names.length - 1);

  // 生成选项：用不同的 shape 名称
  const allShapes = ['圆形', '正方形', '三角形', '长方形', '椭圆形'];
  const distractors = allShapes.filter((_, i) => i !== correctIdx || i >= names.length);
  const choices: Choice[] = [
    { value: correctIdx, label: shapes[correctIdx] },
    ...shuffle(
      distractors.slice(0, 3).map((name, i) => {
        const shapeText = shapes[allShapes.indexOf(name)] || name;
        return { value: 99, label: shapeText };
      })
    ),
  ];
  // 修正：所有选项的 value 重新编排
  const finalChoices = shuffle(
    choices.map((c, i) => ({ ...c, value: i }))
  );
  const correctValue = finalChoices.findIndex((c) => c.label === shapes[correctIdx]);

  return {
    id: uid(), type: 'shapes', level,
    questionText: `下面哪个是 ${names[correctIdx]}？`,
    choices: finalChoices,
    correctAnswer: correctValue,
    explanation: `${shapes[correctIdx]} 就是 ${names[correctIdx]}`,
  };
}

/** 规律推理题 */
function genPatterns(level: Level): Question {
  // 生成规律序列
  const emojis = ['🔴', '🔵', '🟡', '🟢', '⭐', '❤️'];
  const patternType = level <= 1
    ? 'AB'  // 小班只做 AB
    : level === 2
    ? ['AB', 'AAB'][randInt(0, 1)]  // 中班 AB / AAB
    : ['AB', 'AAB', 'ABC'][randInt(0, 2)];  // 大班及以上 ABC

  let sequence: string[];
  let nextItem: string;

  if (patternType === 'AB') {
    const a = emojis[randInt(0, 3)];
    const b = emojis[randInt(0, 3)];
    sequence = [a, b, a, b, a];
    nextItem = b;
  } else if (patternType === 'AAB') {
    const a = emojis[randInt(0, 3)];
    const b = emojis[randInt(0, 3)];
    sequence = [a, a, b, a, a];
    nextItem = b;
  } else {
    const a = emojis[randInt(0, 3)];
    const b = emojis[randInt(0, 3)];
    const c = emojis[randInt(0, 3)];
    sequence = [a, b, c, a, b];
    nextItem = c;
  }

  const seqStr = sequence.join(' ');
  const choices = shuffle([
    { value: 0, label: nextItem },
    { value: 1, label: sequence[0] },
    { value: 2, label: sequence[1] },
    { value: 3, label: sequence.length > 2 ? sequence[2] : sequence[0] },
  ]);
  const correctValue = choices.findIndex((c) => c.label === nextItem);

  return {
    id: uid(), type: 'patterns', level,
    questionText: `找规律：${seqStr} ？\n接下来应该是哪个？`,
    choices,
    correctAnswer: correctValue,
    explanation: `规律是 ${patternType}，接下来应选 ${nextItem}`,
  };
}

// ---- 主生成函数 ----

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
    case 'shapes': return genShapes(level);
    case 'patterns': return genPatterns(level);
    default: return genAddition(level);
  }
}

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
    problems.push({ index: i + 1, type: q.type, questionText: q.questionText, answer: q.correctAnswer });
  }
  return problems;
}
