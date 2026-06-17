// ============================================================
// MathGoGoGo - PDF 练习题生成器
// 使用 jsPDF 生成 A4 可打印练习题
// PDF 内容全部使用数字和符号，不依赖中文字体
// ============================================================

import jsPDF from 'jspdf';
import { Level, QuestionType, LEVEL_LABELS_EN } from '@/types';
import { generateWorksheetProblems } from './question-bank';

interface WorksheetConfig {
  level: Level;
  questionCount: number;
  questionTypes: QuestionType[];
  includeAnswerSheet: boolean;
  title?: string;
}

/**
 * 根据题型生成 PDF 友好的纯数字/符号题目文本
 */
function formatProblemForPDF(
  type: QuestionType,
  answer: number,
  index: number
): string {
  // 根据题型和答案反推一个干净的算式
  // （避免使用原始中文题目文本）
  switch (type) {
    case 'counting':
      return `Count and write the number = ___`;
    case 'comparison':
      return `___ (fill in: >, <, or =)`;
    case 'addition': {
      const b = Math.floor(Math.random() * Math.min(answer, 20)) + 1;
      const a = answer - b;
      return `${a} + ${b} = ___`;
    }
    case 'subtraction': {
      const b = Math.floor(Math.random() * 10) + 1;
      const a = answer + b;
      return `${a} - ${b} = ___`;
    }
    case 'multiplication': {
      // Find a factor pair
      const factors = [];
      for (let i = 2; i <= 9; i++) {
        if (answer % i === 0 && answer / i <= 9) {
          factors.push(i);
        }
      }
      const b = factors.length > 0 ? factors[Math.floor(Math.random() * factors.length)] : 3;
      const a = answer / b;
      return `${a} x ${b} = ___`;
    }
    case 'division': {
      const b = Math.floor(Math.random() * 6) + 2;
      const a = answer * b;
      return `${a} / ${b} = ___`;
    }
    case 'fill_blank': {
      const b = Math.floor(Math.random() * Math.min(answer, 9)) + 1;
      return `___ + ${b} = ${answer + b}`;
    }
    case 'word_problem':
      return `Solve: ___`;
    default:
      return `Problem ${index}: ___`;
  }
}

/** 生成练习题 PDF 并返回 Buffer */
export async function generateWorksheetPDF(config: WorksheetConfig): Promise<Buffer> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // 打印机安全边距
  const ml = 18;
  const mr = 18;
  const mt = 18;
  const mb = 18;
  const cw = pageWidth - ml - mr;

  // ---- 辅助 ----
  function hLine(y: number) {
    doc.setDrawColor(74, 144, 226);
    doc.setLineWidth(1);
    doc.line(ml, y, pageWidth - mr, y);
  }

  function thinLine(y: number) {
    doc.setDrawColor(210, 210, 210);
    doc.setLineWidth(0.3);
    doc.line(ml, y, pageWidth - mr, y);
  }

  // ---- 生成题目 ----
  const problems = generateWorksheetProblems(
    config.level,
    config.questionCount,
    config.questionTypes
  );

  // ---- 标题区 ----
  const titleY = mt + 6;
  doc.setFontSize(16);
  doc.setTextColor(74, 144, 226);
  doc.setFont('helvetica', 'bold');
  const title = config.title || `Math Worksheet - ${LEVEL_LABELS_EN[config.level]}`;
  doc.text(title, pageWidth / 2, titleY, { align: 'center' });

  // ---- 信息栏 ----
  const infoY = titleY + 8;
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.setFont('helvetica', 'normal');
  doc.text('Name: _________________________', ml, infoY);
  doc.text('Date: ____________', ml + 95, infoY);
  doc.text('Score: _______', ml + 150, infoY);

  hLine(infoY + 5);

  // ---- 题目区 ----
  const startY = infoY + 13;
  // 题量不多时一行一题，多时两栏
  const useTwoCols = config.questionCount > 20;
  const cols = useTwoCols ? 2 : 1;
  const colGap = useTwoCols ? 12 : 0;
  const colW = (cw - colGap * (cols - 1)) / cols;

  // 根据题量动态调整行高
  const rowH = config.questionCount <= 10 ? 16
    : config.questionCount <= 20 ? 13
    : config.questionCount <= 35 ? 11
    : 9;
  const fontSize = config.questionCount <= 10 ? 13
    : config.questionCount <= 20 ? 11
    : config.questionCount <= 35 ? 10
    : 9;

  const perCol = Math.ceil(problems.length / cols);

  problems.forEach((problem, i) => {
    const col = Math.floor(i / perCol);
    const row = i % perCol;
    const x = ml + col * (colW + colGap);
    const y = startY + row * rowH;

    // 超出页面则跳过
    if (y > pageHeight - mb - 5) return;

    doc.setFontSize(fontSize);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(60, 60, 60);
    doc.text(`${problem.index}.`, x, y);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);

    const text = formatProblemForPDF(problem.type, problem.answer, problem.index);
    doc.text(text, x + 8, y);
  });

  // ---- 页脚 ----
  const footerY = pageHeight - mb + 8;
  doc.setFontSize(7);
  doc.setTextColor(180, 180, 180);
  doc.setFont('helvetica', 'normal');
  doc.text('MathGoGoGo - Practice Worksheet', pageWidth / 2, footerY, { align: 'center' });
  thinLine(pageHeight - mb + 3);

  // ---- 答案页 ----
  if (config.includeAnswerSheet) {
    doc.addPage();

    const atY = mt + 6;
    doc.setFontSize(16);
    doc.setTextColor(231, 76, 60);
    doc.setFont('helvetica', 'bold');
    doc.text('Answer Key (For Parents Only)', pageWidth / 2, atY, { align: 'center' });

    thinLine(atY + 6);

    const aStartY = atY + 13;
    const aPerCol = Math.ceil(problems.length / 3);
    const aColW = cw / 3;

    problems.forEach((problem, i) => {
      const col = Math.floor(i / aPerCol);
      const row = i % aPerCol;
      const x = ml + col * aColW;
      const y = aStartY + row * 7;

      if (y > pageHeight - mb - 5) return;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(60, 60, 60);
      doc.text(`${problem.index}.`, x, y);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(50, 50, 50);
      doc.text(`${problem.answer}`, x + 10, y);
    });

    doc.setFontSize(7);
    doc.setTextColor(180, 180, 180);
    doc.text('MathGoGoGo - Answer Key', pageWidth / 2, footerY, { align: 'center' });
    thinLine(pageHeight - mb + 3);
  }

  return Buffer.from(doc.output('arraybuffer'));
}
