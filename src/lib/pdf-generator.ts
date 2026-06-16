// ============================================================
// MathGoGoGo - PDF 练习题生成器
// 使用 jsPDF 生成 A4 可打印练习题
// 注：jsPDF 默认字体不支持中文，PDF 使用英文标签/数字，
//     数学内容（数字、运算符）可用，网页界面本身是中文的
// ============================================================

import jsPDF from 'jspdf';
import { Level, QuestionType, LEVEL_NAMES } from '@/types';
import { generateWorksheetProblems } from './question-bank';

interface WorksheetConfig {
  level: Level;
  questionCount: number;
  questionTypes: QuestionType[];
  includeAnswerSheet: boolean;
  title?: string;
}

// 等级对应的英文标签
const LEVEL_LABELS: Record<Level, string> = {
  1: 'Pre-K',
  2: 'Kindergarten',
  3: 'Grade 1',
  4: 'Grade 2',
  5: 'Grade 3',
};

/**
 * 清理文本中的中文标点符号，替换为英文/通用符号
 * Math symbols (digits, +, -, x, /, =, <, >) are universal and preserved
 */
function cleanMathText(text: string): string {
  return text
    .replace(/？/g, '?')
    .replace(/！/g, '!')
    .replace(/，/g, ', ')
    .replace(/。/g, '. ')
    .replace(/（/g, '(')
    .replace(/）/g, ')')
    .replace(/×/g, 'x')
    .replace(/÷/g, '/')
    // Replace CJK characters with empty string (keep digits, basic punctuation, math symbols)
    .replace(/[一-鿿　-〿＀-￯]/g, '')
    // Clean up multiple spaces
    .replace(/\s{2,}/g, ' ')
    .trim();
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
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  // ---- Header Bar ----
  doc.setFillColor(74, 144, 226);
  doc.rect(0, 0, pageWidth, 18, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  const headerTitle = config.title || `Math Worksheet - ${LEVEL_LABELS[config.level]}`;
  doc.text(headerTitle, pageWidth / 2, 12, { align: 'center' });

  // ---- Info Fields ----
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const infoY = 25;
  doc.text('Name: ____________________', margin, infoY);
  doc.text('Date: ____________________', margin + 80, infoY);
  doc.text('Score: __________', margin + 140, infoY);

  // ---- Separator ----
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(margin, infoY + 5, pageWidth - margin, infoY + 5);

  // ---- Generate Problems ----
  const problems = generateWorksheetProblems(
    config.level,
    config.questionCount,
    config.questionTypes
  );

  // ---- Layout: 2 columns ----
  const cols = 2;
  const colWidth = contentWidth / cols - 8;
  const startY = infoY + 14;
  const rowHeight = 13;
  const problemsPerColumn = Math.ceil(problems.length / cols);

  problems.forEach((problem, index) => {
    const col = index < problemsPerColumn ? 0 : 1;
    const row = index < problemsPerColumn ? index : index - problemsPerColumn;
    const x = margin + col * (colWidth + 14);
    const y = startY + row * rowHeight;

    // Page overflow check - add new page if needed
    if (y > pageHeight - 25) {
      doc.addPage();
      // Continue on new page
      const newY = 22 + (row - Math.floor((pageHeight - 25 - startY) / rowHeight)) * rowHeight;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`${problem.index}.`, x, newY);
      doc.setFont('helvetica', 'normal');
      const cleanText = cleanMathText(problem.questionText);
      doc.text(`${cleanText} = ___________`, x + 8, newY);
      return;
    }

    // Problem number + text
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`${problem.index}.`, x, y);

    doc.setFont('helvetica', 'normal');
    const cleanText = cleanMathText(problem.questionText);
    // Limit text length to fit in column
    const maxChars = 40;
    const displayText = cleanText.length > maxChars
      ? cleanText.substring(0, maxChars - 3) + '...'
      : cleanText;

    // Add blank for answer
    doc.text(`${displayText} = ___________`, x + 8, y);
  });

  // ---- Footer ----
  const footerY = pageHeight - 12;
  doc.setFontSize(8);
  doc.setTextColor(160, 160, 160);
  doc.setFont('helvetica', 'normal');
  doc.text('MathGoGoGo - Practice Worksheet', pageWidth / 2, footerY, { align: 'center' });

  // ---- Optional Answer Sheet ----
  if (config.includeAnswerSheet) {
    doc.addPage();

    // Answer header
    doc.setFillColor(231, 76, 60);
    doc.rect(0, 0, pageWidth, 18, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Answer Key (For Parents)', pageWidth / 2, 12, { align: 'center' });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const answerStartY = 25;
    const answerRowHeight = 8;

    // 3 columns for answers to fit more
    const answerCols = 3;
    const answerColWidth = contentWidth / answerCols - 5;
    const answersPerColumn = Math.ceil(problems.length / answerCols);

    problems.forEach((problem, index) => {
      const col = Math.floor(index / answersPerColumn);
      const row = index % answersPerColumn;
      const x = margin + col * (answerColWidth + 8);
      const y = answerStartY + row * answerRowHeight;

      if (y > pageHeight - 20) return; // Skip if overflows

      doc.setFont('helvetica', 'bold');
      doc.text(`${problem.index}.`, x, y);
      doc.setFont('helvetica', 'normal');
      doc.text(`${problem.answer}`, x + 10, y);
    });

    // Answer footer
    doc.setFontSize(8);
    doc.setTextColor(160, 160, 160);
    doc.text('MathGoGoGo - Answer Key', pageWidth / 2, footerY, { align: 'center' });
  }

  // Return PDF as Buffer
  const buffer = Buffer.from(doc.output('arraybuffer'));
  return buffer;
}
