// ============================================================
// MathGoGoGo - PDF 练习题生成器
// 嵌入中文字体，完美支持中文题目
// ============================================================

import jsPDF from 'jspdf';
import fs from 'fs';
import path from 'path';
import { Level, QuestionType, LEVEL_NAMES } from '@/types';
import { generateWorksheetProblems } from './question-bank';

interface WorksheetConfig {
  level: Level;
  questionCount: number;
  questionTypes: QuestionType[];
  includeAnswerSheet: boolean;
  title?: string;
}

// 预加载中文字体（模块加载时执行一次）
const fontPath = path.join(process.cwd(), 'public/fonts/STHeiti-Subset.ttf');
const fontBase64 = fs.readFileSync(fontPath).toString('base64');
const FONT_NAME = 'STHeitiCN';

function registerFont(doc: jsPDF) {
  // 只在第一次调用时注册
  try {
    doc.addFileToVFS('STHeiti-Subset.ttf', fontBase64);
    doc.addFont('STHeiti-Subset.ttf', FONT_NAME, 'normal');
  } catch {
    // 字体已注册则忽略
  }
}

/** 生成练习题 PDF 并返回 Buffer */
export async function generateWorksheetPDF(config: WorksheetConfig): Promise<Buffer> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // 注册中文字体
  registerFont(doc);

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const ml = 18;
  const mr = 18;
  const mt = 18;
  const mb = 18;
  const cw = pageWidth - ml - mr;

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

  // ---- 标题 ----
  const titleY = mt + 6;
  doc.setFontSize(18);
  doc.setTextColor(74, 144, 226);
  doc.setFont(FONT_NAME, 'normal');
  const title = config.title || `🧮 数学练习题 - ${LEVEL_NAMES[config.level]}`;
  doc.text(title, pageWidth / 2, titleY, { align: 'center' });

  // ---- 信息栏 ----
  const infoY = titleY + 9;
  doc.setFontSize(11);
  doc.setTextColor(80, 80, 80);
  doc.text('姓名：______________  日期：______________  用时：______________', ml, infoY);
  hLine(infoY + 6);

  // ---- 题目区 ----
  const startY = infoY + 14;
  const useTwoCols = config.questionCount > 20;
  const cols = useTwoCols ? 2 : 1;
  const colGap = useTwoCols ? 10 : 0;
  const colW = (cw - colGap * (cols - 1)) / cols;

  // 动态调整字号和行距
  const rowH =
    config.questionCount <= 10 ? 16
    : config.questionCount <= 20 ? 13
    : config.questionCount <= 35 ? 11
    : 9;
  const fontSize =
    config.questionCount <= 10 ? 13
    : config.questionCount <= 20 ? 11
    : config.questionCount <= 35 ? 10
    : 8;

  const perCol = Math.ceil(problems.length / cols);

  doc.setFont(FONT_NAME, 'normal');
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(fontSize);

  problems.forEach((problem, i) => {
    const col = Math.floor(i / perCol);
    const row = i % perCol;
    const x = ml + col * (colW + colGap);
    const y = startY + row * rowH;

    if (y > pageHeight - mb - 5) return;

    // 题号加粗
    doc.setFont(FONT_NAME, 'normal');
    doc.text(`${problem.index}. ${problem.questionText} = _______`, x, y, {
      maxWidth: colW,
    });
  });

  // ---- 页脚 ----
  const footerY = pageHeight - mb + 8;
  doc.setFontSize(8);
  doc.setTextColor(170, 170, 170);
  doc.text('MathGoGoGo · 快乐学数学', pageWidth / 2, footerY, { align: 'center' });
  thinLine(pageHeight - mb + 3);

  return Buffer.from(doc.output('arraybuffer'));
}
