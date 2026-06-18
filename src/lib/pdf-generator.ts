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

/** 将 emoji 替换为纯文字描述（PDF 不能渲染彩色 emoji） */
function replaceEmoji(text: string): string {
  const map: Record<string, string> = {
    '🔴': '(红)', '🔵': '(蓝)', '🟡': '(黄)', '🟢': '(绿)', '❤️': '(红心)',
    '⭐': '★', '🌟': '★', '✨': '*',
    '🍎': '[苹果]', '🌸': '[花]', '🐱': '[猫]', '🎈': '[气球]',
    '🐶': '[狗]', '🍪': '[饼干]', '🦋': '[蝴蝶]', '🐟': '[鱼]', '🍬': '[糖]',
    '📦': '[盒子]', '⚽': '[球]', '🎲': '[骰子]', '📐': '[尺子]',
    '🥫': '[罐头]', '🥚': '[蛋]', '🌙': '[月亮]',
    '🧮': '', '📋': '', '📄': '', '📘': '', '📊': '', '📚': '',
    '🌱': '', '🌿': '', '🌳': '', '🚀': '', '☀️': '', '🌍': '',
  };
  let result = text;
  for (const [emoji, replacement] of Object.entries(map)) {
    result = result.split(emoji).join(replacement);
  }
  return result;
}

const FONT_NAME = 'STHeitiCN';
let fontLoaded = false;
let fontBase64: string | null = null;

/** 从当前 URL 自动检测 basePath（兼容 GitHub Pages 子路径） */
function getBasePath(): string {
  // 例如 /mathgogogo/worksheet → /mathgogogo
  // 例如 /worksheet → 空字符串
  const path = window.location.pathname;
  const match = path.match(/^(\/[^/]+)\//);
  // 如果子路径包含常见的 repo 名称模式，使用它；否则留空
  if (match && match[1] !== '') {
    // 排除常见的 Next.js 路由路径
    const knownRoutes = ['/assessment', '/result', '/worksheet', '/_next'];
    if (!knownRoutes.includes(match[1])) {
      return match[1];
    }
  }
  return '';
}

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
    const basePath = getBasePath();
    const fontUrl = `${basePath}/fonts/STHeiti-Subset.ttf`;
    const resp = await fetch(fontUrl);
    if (!resp.ok) throw new Error(`Font load failed: ${resp.status}`);
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
    const displayText = replaceEmoji(problem.questionText);
    doc.text(`${problem.index}. ${displayText} = _______`, x, y, { maxWidth: colW });
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
