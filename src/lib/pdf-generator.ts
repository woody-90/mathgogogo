// ============================================================
// MathGoGoGo - PDF 练习题生成器
// 使用 jsPDF 生成 A4 可打印练习题
// 注：jsPDF 默认字体不支持中文，PDF 使用英文/数字，
//     中文 UI 在网页端，打印内容以数字和数学符号为主
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
 * 清理文本，移除中文字符但保留结构和语义
 */
function cleanMathText(text: string): string {
  return text
    // Replace Chinese punctuation
    .replace(/？/g, '?')
    .replace(/！/g, '!')
    .replace(/，/g, ', ')
    .replace(/。/g, '. ')
    .replace(/（/g, '(')
    .replace(/）/g, ')')
    .replace(/×/g, 'x')
    .replace(/÷/g, '/')
    .replace(/○/g, '__')
    // Strip remaining CJK characters
    .replace(/[一-鿿　-〿＀-￯]/g, '')
    // Clean up whitespace
    .replace(/\s{2,}/g, ' ')
    .replace(/\s*\?\s*/g, '? ')
    .trim();
}

/**
 * Build a display-friendly equation string from a math problem
 */
function formatProblem(text: string, answer: number, isAnswerKey: boolean): string {
  const cleaned = cleanMathText(text);

  if (isAnswerKey) {
    // Answer key: show the answer
    if (cleaned.includes('?')) {
      return cleaned.replace(/\?/g, String(answer));
    }
    return `${cleaned} = ${answer}`;
  }

  // Worksheet: show blank for answer
  if (cleaned.includes('?')) {
    return cleaned.replace(/\?/g, '_____');
  }
  return `${cleaned} = _____`;
}

/** 生成练习题 PDF 并返回 Buffer */
export async function generateWorksheetPDF(config: WorksheetConfig): Promise<Buffer> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();   // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm

  // 打印机安全边距 (留出足够空间避免内容被裁切)
  const marginLeft = 20;
  const marginRight = 20;
  const marginTop = 20;
  const marginBottom = 20;
  const contentWidth = pageWidth - marginLeft - marginRight;
  const contentHeight = pageHeight - marginTop - marginBottom;

  // ---- 辅助函数 ----
  function drawLine(y: number, color: [number, number, number] = [220, 220, 220]) {
    doc.setDrawColor(...color);
    doc.setLineWidth(0.3);
    doc.line(marginLeft, y, pageWidth - marginRight, y);
  }

  function drawHeader(pageNum: number, totalPages?: number) {
    // 顶部细线
    doc.setDrawColor(74, 144, 226);
    doc.setLineWidth(1.2);
    doc.line(marginLeft, marginTop, pageWidth - marginRight, marginTop);

    // 标题
    doc.setFontSize(13);
    doc.setTextColor(74, 144, 226);
    doc.setFont('helvetica', 'bold');
    const headerTitle = config.title || `Math Worksheet - ${LEVEL_LABELS_EN[config.level]}`;
    doc.text(headerTitle, pageWidth / 2, marginTop - 7, { align: 'center' });

    // 页码
    if (totalPages) {
      doc.setFontSize(7);
      doc.setTextColor(160, 160, 160);
      doc.setFont('helvetica', 'normal');
      doc.text(`${pageNum} / ${totalPages}`, pageWidth - marginRight, marginTop - 7, { align: 'right' });
    }
  }

  function drawFooter(text: string) {
    const footerY = pageHeight - marginBottom + 12;
    doc.setFontSize(7);
    doc.setTextColor(180, 180, 180);
    doc.setFont('helvetica', 'normal');
    doc.text(text, pageWidth / 2, footerY, { align: 'center' });
    // 底部分隔线
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.line(marginLeft, pageHeight - marginBottom + 6, pageWidth - marginRight, pageHeight - marginBottom + 6);
  }

  // ---- 生成题目 ----
  const problems = generateWorksheetProblems(
    config.level,
    config.questionCount,
    config.questionTypes
  );

  // ---- 分页计算 ----
  const totalPages = config.includeAnswerSheet ? 2 : 1;
  // 练习题页最多放多少题 (2列布局)
  const infoBlockHeight = 18;  // 姓名日期栏
  const headerSpace = 10;       // 标题下方留白
  const problemRowHeight = 12;  // 每行高度
  const maxProblemsPerPage = Math.floor((contentHeight - infoBlockHeight - headerSpace) / problemRowHeight) * 2;

  // ---- 第 1 页：练习题 ----
  drawHeader(1, totalPages);

  // 信息栏
  const infoY = marginTop + 10;
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.setFont('helvetica', 'normal');
  doc.text('Name: _________________________', marginLeft, infoY);
  doc.text('Date: ____________', marginLeft + 100, infoY);
  doc.text('Score: _______', marginLeft + 150, infoY);

  drawLine(infoY + 5);

  // 题目区域 - 2 列网格布局
  const problemStartY = infoY + 12;
  const cols = 2;
  const colGap = 10;
  const colWidth = (contentWidth - colGap) / cols;

  problems.forEach((problem, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    const x = marginLeft + col * (colWidth + colGap);
    const y = problemStartY + row * problemRowHeight;

    // 检查是否需要新页
    if (y > pageHeight - marginBottom) {
      doc.addPage();
      // 新页不重复画 header 上的标题，但保留简单标识
      const newY = marginTop + 5;
      // 在新页继续 (简化处理：重新开始排版)
      const remainingIndex = index;
      const newCol = remainingIndex % cols;
      const newRow = Math.floor((remainingIndex - (index - 1)) / cols);
      const nx = marginLeft + newCol * (colWidth + colGap);
      const ny = newY + newRow * problemRowHeight;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(60, 60, 60);
      doc.text(`${problem.index}.`, nx, ny);

      doc.setFont('helvetica', 'normal');
      const formatted = formatProblem(problem.questionText, problem.answer, false);
      doc.text(formatted, nx + 8, ny);
      return;
    }

    // 题目编号
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(60, 60, 60);
    doc.text(`${problem.index}.`, x, y);

    // 题目内容
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    const formatted = formatProblem(problem.questionText, problem.answer, false);
    // 截断过长的文本
    const maxChars = Math.floor(colWidth / 3.5);
    const displayText = formatted.length > maxChars
      ? formatted.substring(0, maxChars - 2) + '..'
      : formatted;
    doc.text(displayText, x + 8, y);
  });

  drawFooter('MathGoGoGo - Practice Worksheet');

  // ---- 第 2 页：答案页（可选） ----
  if (config.includeAnswerSheet) {
    doc.addPage();
    drawHeader(2, totalPages);

    // 答案页标题
    const answerTitleY = marginTop + 8;
    doc.setFontSize(12);
    doc.setTextColor(231, 76, 60);
    doc.setFont('helvetica', 'bold');
    doc.text('Answer Key (For Parents Only)', pageWidth / 2, answerTitleY, { align: 'center' });

    drawLine(answerTitleY + 5, [240, 200, 200]);

    // 答案内容 - 3 列布局
    const answerStartY = answerTitleY + 12;
    const answerCols = 3;
    const answerColGap = 6;
    const answerColWidth = (contentWidth - answerColGap * (answerCols - 1)) / answerCols;
    const answerRowHeight = 8;

    problems.forEach((problem, index) => {
      const col = index % answerCols;
      const row = Math.floor(index / answerCols);
      const x = marginLeft + col * (answerColWidth + answerColGap);
      const y = answerStartY + row * answerRowHeight;

      if (y > pageHeight - marginBottom) return;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(60, 60, 60);
      doc.text(`${problem.index}.`, x, y);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(50, 50, 50);
      doc.text(`${problem.answer}`, x + 10, y);
    });

    drawFooter('MathGoGoGo - Answer Key');
  }

  // 返回 PDF Buffer
  return Buffer.from(doc.output('arraybuffer'));
}
