// ============================================================
// MathGoGoGo - PDF 练习题生成器
// 支持浏览器端运行（通过 fetch 加载字体）
// ============================================================

import jsPDF from 'jspdf';
import { Level, QuestionType, LEVEL_NAMES } from '@/types';
import { generateWorksheetProblems } from './question-bank';

interface WorksheetConfig {
  level: Level;
  questionCount: number;
  questionTypes: QuestionType[];
  title?: string;
}

const FONT_NAME = 'STHeitiCN';
let fontLoaded = false;
let fontBase64: string | null = null;

/** 加载中文字体（浏览器端通过 fetch 加载） */
async function ensureFont(doc: jsPDF): Promise<void> {
  if (fontLoaded) {
    try {
      doc.addFileToVFS('STHeiti-Subset.ttf', fontBase64!);
      doc.addFont('STHeiti-Subset.ttf', FONT_NAME, 'normal');
      return;
    } catch { /* already registered */ }
  }

  if (!fontBase64) {
    // 获取 basePath（兼容 GitHub Pages 子路径部署）
    const baseEl = document.querySelector('base');
    const basePath = baseEl?.getAttribute('href') || '/';
    const fontUrl = `${basePath}fonts/STHeiti-Subset.ttf`.replace('//', '/');
    const resp = await fetch(fontUrl);
    const blob = await resp.blob();
    fontBase64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.readAsDataURL(blob);
    });
  }

  doc.addFileToVFS('STHeiti-Subset.ttf', fontBase64);
  doc.addFont('STHeiti-Subset.ttf', FONT_NAME, 'normal');
  fontLoaded = true;
}

/** 生成练习题 PDF 并返回 Blob（浏览器端直接下载用） */
export async function generateWorksheetPDF(config: WorksheetConfig): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  await ensureFont(doc);

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const ml = 18, mr = 18, mt = 18, mb = 18;
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

  const problems = generateWorksheetProblems(config.level, config.questionCount, config.questionTypes);

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
  const cols = config.questionCount > 20 ? 2 : 1;
  const colGap = cols === 2 ? 10 : 0;
  const colW = (cw - colGap * (cols - 1)) / cols;
  const rowH = config.questionCount <= 10 ? 16 : config.questionCount <= 20 ? 13 : 11;
  const fontSize = config.questionCount <= 10 ? 13 : config.questionCount <= 20 ? 11 : 10;
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
    doc.text(`${problem.index}. ${problem.questionText} = _______`, x, y, { maxWidth: colW });
  });

  // ---- 页脚 ----
  const footerY = pageHeight - mb + 8;
  doc.setFontSize(8);
  doc.setTextColor(170, 170, 170);
  doc.text('MathGoGoGo · 快乐学数学', pageWidth / 2, footerY, { align: 'center' });
  thinLine(pageHeight - mb + 3);

  return doc.output('blob');
}

/** 生成并触发下载 */
export async function downloadWorksheet(config: WorksheetConfig): Promise<void> {
  const blob = await generateWorksheetPDF(config);
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `math-worksheet-level-${config.level}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
