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

  // 高等级增加乘除法填空
  if (level >= 5 && Math.random() < 0.3) {
    // 乘除法填空
    const a = randInt(2, p.mulMax);
    const b = randInt(2, level <= 5 ? 5 : 9);
    const result = a * b;
    if (Math.random() > 0.5) {
      return {
        id: uid(), type: 'fill_blank', level,
        questionText: `? × ${a} = ${result}，问号处应该填几？`,
        choices: generateChoices(b, makeDistractors(b)),
        correctAnswer: b,
      };
    } else {
      return {
        id: uid(), type: 'fill_blank', level,
        questionText: `${result} ÷ ${a} = ？，问号处应该填几？`,
        choices: generateChoices(b, makeDistractors(b)),
        correctAnswer: b,
      };
    }
  }

  // 加减法填空
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
  // 比多比少（一年级重点）
  const grade1Templates = [
    () => {
      const a = randInt(30, 80);
      const b = randInt(10, a - 5);
      return {
        text: `图书馆有故事书 ${a} 本，科技书 ${b} 本。故事书比科技书多多少本？`,
        answer: a - b,
      };
    },
    () => {
      const a = randInt(20, 70);
      const b = randInt(10, a - 3);
      return {
        text: `小红做了 ${a} 道口算题，小华做了 ${b} 道。小红比小华多做了几道？`,
        answer: a - b,
      };
    },
    () => {
      const a = randInt(20, 60);
      const b = randInt(10, 40);
      const items = ['个苹果', '本书', '支铅笔', '块糖'];
      const item = items[randInt(0, items.length - 1)];
      return {
        text: `妈妈买了 ${a} ${item}，吃了 ${b} 个，还剩多少个？`,
        answer: a - b,
      };
    },
  ];

  // 归一归总（二三年级重点）
  const grade2Templates = [
    () => {
      const unitPrice = randInt(3, 8);
      const qty1 = randInt(3, 6);
      const qty2 = randInt(4, 8);
      return {
        text: `买 ${qty1} 个同样的笔记本花了 ${unitPrice * qty1} 元，买 ${qty2} 个需要多少钱？`,
        answer: unitPrice * qty2,
      };
    },
    () => {
      const perDay = randInt(6, 12);
      const days = randInt(4, 8);
      const newDays = randInt(3, 7);
      return {
        text: `每天看 ${perDay} 页书，${days} 天看完。如果每天看 ${newDays + 3} 页，几天看完？`,
        answer: Math.round(perDay * days / (newDays + 3)),
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
  ];

  // 行程、搭配（三年级）
  const grade3Templates = [
    () => {
      const distance = randInt(120, 500);
      const speed = randInt(40, 80);
      return {
        text: `两地相距 ${distance} 千米，一辆汽车每小时行 ${speed} 千米，几小时到达？`,
        answer: Math.round(distance / speed),
      };
    },
    () => {
      const tops = randInt(3, 5);
      const pants = randInt(2, 4);
      return {
        text: `有 ${tops} 件上衣和 ${pants} 条裤子，一共有多少种不同的搭配？`,
        answer: tops * pants,
      };
    },
    () => {
      const total = randInt(200, 600);
      const hours = randInt(3, 6);
      return {
        text: `一台机器 ${hours} 小时生产 ${total} 个零件，每小时生产多少个？`,
        answer: Math.round(total / hours),
      };
    },
  ];

  let templates;
  if (level <= 3) {
    templates = easyTemplates;
  } else if (level === 4) {
    templates = [...grade1Templates, ...easyTemplates.slice(0, 2)];
  } else if (level === 5) {
    templates = grade2Templates;
  } else {
    templates = [...grade3Templates, ...grade2Templates];
  }
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
  // 当前等级可用的图形（仅符号，用于选项显示）
  const symbols = level <= 2
    ? ['○', '□', '△']
    : ['○', '□', '△', '▭', '⬭'];

  const names = level <= 2
    ? ['圆形', '正方形', '三角形']
    : ['圆形', '正方形', '三角形', '长方形', '椭圆形'];

  const correctIdx = randInt(0, names.length - 1);
  const correctSymbol = symbols[correctIdx];
  const correctName = names[correctIdx];

  // 从当前等级的其他图形中选干扰项（不重复）
  const otherSymbols = symbols.filter((_, i) => i !== correctIdx);
  const shuffledOthers = shuffle(otherSymbols);
  const optionCount = Math.min(shuffledOthers.length + 1, symbols.length);

  const optionSymbols = [correctSymbol, ...shuffledOthers.slice(0, optionCount - 1)];

  // 先打乱，再重新编号 value，确保 correctAnswer 与点击值一致
  const shuffled = shuffle(
    optionSymbols.map((s) => ({ value: 0, label: s }))
  );
  const choices: Choice[] = shuffled.map((c, i) => ({ value: i, label: c.label }));
  const correctValue = choices.findIndex((c) => c.label === correctSymbol);

  return {
    id: uid(), type: 'shapes', level,
    questionText: `下面哪个是 ${correctName}？`,
    choices,
    correctAnswer: correctValue,
    explanation: `${correctSymbol} 就是 ${correctName}`,
  };
}

/** 规律推理题 */
function genPatterns(level: Level): Question {
  const emojis = ['🔴', '🔵', '🟡', '🟢'];

  // 不同等级可用的规律类型
  const typesLv1 = ['AB'];
  const typesLv2 = ['AB', 'AAB', 'ABB'];
  const typesLv3 = ['AB', 'AAB', 'ABB', 'ABA', 'ABC'];

  const pool = level <= 1 ? typesLv1 : level === 2 ? typesLv2 : typesLv3;
  const patternType = pool[randInt(0, pool.length - 1)];

  // 生成规律序列的函数
  function pickTwo(): [string, string] {
    const a = emojis[randInt(0, 3)];
    let b = emojis[randInt(0, 3)];
    while (b === a) b = emojis[randInt(0, 3)];
    return [a, b];
  }
  function pickThree(): [string, string, string] {
    const a = emojis[randInt(0, 3)];
    let b = emojis[randInt(0, 3)];
    while (b === a) b = emojis[randInt(0, 3)];
    let c = emojis[randInt(0, 3)];
    while (c === a || c === b) c = emojis[randInt(0, 3)];
    return [a, b, c];
  }

  let sequence: string[];
  let nextItem: string;
  const uniqueItems = new Set<string>();

  switch (patternType) {
    case 'AB': {
      const [a, b] = pickTwo();
      sequence = [a, b, a, b, a]; nextItem = b;
      uniqueItems.add(a); uniqueItems.add(b);
      break;
    }
    case 'AAB': {
      const [a, b] = pickTwo();
      sequence = [a, a, b, a, a]; nextItem = b;
      uniqueItems.add(a); uniqueItems.add(b);
      break;
    }
    case 'ABB': {
      const [a, b] = pickTwo();
      sequence = [a, b, b, a, b]; nextItem = b;
      uniqueItems.add(a); uniqueItems.add(b);
      break;
    }
    case 'ABA': {
      const [a, b] = pickTwo();
      sequence = [a, b, a, a, b]; nextItem = a;
      uniqueItems.add(a); uniqueItems.add(b);
      break;
    }
    default: { // ABC
      const [a, b, c] = pickThree();
      sequence = [a, b, c, a, b]; nextItem = c;
      uniqueItems.add(a); uniqueItems.add(b); uniqueItems.add(c);
      break;
    }
  }

  const seqStr = sequence.join(' ');

  // 根据独立图案数量决定选项个数
  const distinctCount = uniqueItems.size;
  const optionCount = distinctCount <= 2 ? 2 : Math.min(4, distinctCount + 1);

  // 构建不重复选项
  const options: string[] = [nextItem];
  const distractors = shuffle(emojis.filter((e) => e !== nextItem));
  for (const d of distractors) {
    if (options.length >= optionCount) break;
    if (!options.includes(d)) options.push(d);
  }

  // 先打乱再重新编号 value，确保 correctAnswer 与点击值一致
  const shuffled = shuffle(
    options.map((label) => ({ value: 0, label }))
  );
  const choices: Choice[] = shuffled.map((c, i) => ({ value: i, label: c.label }));
  const correctValue = choices.findIndex((c) => c.label === nextItem);

  return {
    id: uid(), type: 'patterns', level,
    questionText: `找规律：${seqStr} ？\n接下来应该是哪个？`,
    choices,
    correctAnswer: correctValue,
    explanation: `规律是 ${patternType}，接下来应选 ${nextItem}`,
  };
}

/** 时钟题 */
function genTime(level: Level): Question {
  // 整点列表
  const hours = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  if (level <= 3) {
    // 大班：认识整点和半点
    if (Math.random() > 0.5) {
      // 整点
      const h = hours[randInt(0, 11)];
      const correct = h;
      return {
        id: uid(), type: 'time', level,
        questionText: `钟面上，时针指向 ${h}，分针指向 12，是几时？`,
        choices: generateChoices(correct, makeDistractors(correct)),
        correctAnswer: correct,
        explanation: `时针指向 ${h}，分针指向 12，就是 ${h} 时（${h}:00）`,
      };
    } else {
      // 半点
      const h = hours[randInt(0, 11)];
      const correct = h; // 答案仍是几时
      return {
        id: uid(), type: 'time', level,
        questionText: `钟面上，时针在 ${h} 和 ${h === 12 ? 1 : h + 1} 中间，分针指向 6，是几时半？`,
        choices: generateChoices(correct, makeDistractors(correct)),
        correctAnswer: correct,
        explanation: `分针指向 6 就是半点，时针在 ${h} 和 ${h + 1} 中间，是 ${h} 时半（${h}:30）`,
      };
    }
  } else if (level === 4) {
    // 一年级：认识几时几分（5分钟一档）
    const h = hours[randInt(0, 11)];
    const m = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55][randInt(0, 11)];
    if (m === 0) {
      return {
        id: uid(), type: 'time', level,
        questionText: `钟面上，时针指向 ${h}，分针指向 12，是几时？`,
        choices: generateChoices(h, makeDistractors(h)),
        correctAnswer: h,
      };
    }
    return {
      id: uid(), type: 'time', level,
      questionText: `钟面上，时针走过 ${h}，分针指向 ${m / 5}（即 ${m} 分钟），是几时几分？`,
      choices: [
        { value: 0, label: `${h}:${String(m).padStart(2, '0')}` },
        { value: 1, label: `${h === 12 ? 1 : h + 1}:${String(m).padStart(2, '0')}` },
        { value: 2, label: `${h}:${String((m + 5) % 60).padStart(2, '0')}` },
        { value: 3, label: `${h === 1 ? 12 : h - 1}:${String(m).padStart(2, '0')}` },
      ],
      correctAnswer: 0,
      explanation: `时针走过 ${h}，分针指向 ${m / 5}（${m} 分），就是 ${h}:${String(m).padStart(2, '0')}`,
    };
  } else {
    // 二年级+：时间换算和经过时间
    const template = randInt(0, 3);
    if (template === 0) {
      // 单位换算
      const hours = randInt(1, 3);
      const correct = hours * 60;
      return {
        id: uid(), type: 'time', level,
        questionText: `${hours} 小时 = ？分钟`,
        choices: generateChoices(correct, makeDistractors(correct)),
        correctAnswer: correct,
        explanation: `1 小时 = 60 分钟，${hours} 小时 = ${correct} 分钟`,
      };
    } else if (template === 1) {
      const mins = [60, 120, 180, 90, 150][randInt(0, 4)];
      const correct = mins / 60;
      return {
        id: uid(), type: 'time', level,
        questionText: `${mins} 分钟 = ？小时`,
        choices: generateChoices(correct, makeDistractors(correct)),
        correctAnswer: correct,
        explanation: `60 分钟 = 1 小时，${mins} 分钟 = ${correct} 小时`,
      };
    } else if (template === 2) {
      // 经过时间
      const startH = randInt(8, 10);
      const startM = [0, 15, 30, 45][randInt(0, 3)];
      const duration = randInt(1, 3) * 30 + randInt(0, 1) * 15;
      const endTotal = startH * 60 + startM + duration;
      const endH = Math.floor(endTotal / 60);
      const endM = endTotal % 60;
      const correct = duration;
      return {
        id: uid(), type: 'time', level,
        questionText: `从 ${startH}:${String(startM).padStart(2, '0')} 到 ${endH}:${String(endM).padStart(2, '0')}，经过了多长时间（分钟）？`,
        choices: generateChoices(correct, [correct + 15, correct + 30, correct - 15].filter((n) => n > 0)),
        correctAnswer: correct,
        explanation: `${endH}:${String(endM).padStart(2, '0')} - ${startH}:${String(startM).padStart(2, '0')} = ${duration} 分钟`,
      };
    } else {
      // 1分钟 = 60秒
      const mins = randInt(1, 5);
      const correct = mins * 60;
      return {
        id: uid(), type: 'time', level,
        questionText: `${mins} 分钟 = ？秒`,
        choices: generateChoices(correct, makeDistractors(correct)),
        correctAnswer: correct,
        explanation: `1 分钟 = 60 秒，${mins} 分钟 = ${correct} 秒`,
      };
    }
  }
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
    case 'time': return genTime(level);
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

    if (type === 'shapes') {
      // PDF 练习题中用绘图指令替代选择题
      const shapes = ['圆形', '正方形', '三角形'];
      if (level >= 2) shapes.push('长方形', '椭圆形');
      const shape = shapes[randInt(0, shapes.length - 1)];
      problems.push({
        index: i + 1,
        type: 'shapes',
        questionText: `请在空白处画一个 ${shape}：`,
        answer: 0,
      });
    } else {
      const q = generateQuestion(level, [type]);
      problems.push({ index: i + 1, type: q.type, questionText: q.questionText, answer: q.correctAnswer });
    }
  }
  return problems;
}
