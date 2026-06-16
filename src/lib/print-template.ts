// ============================================================
// MathGoGoGo - 打印模板生成器
// 生成浏览器原生打印用 HTML，完美支持中文
// ============================================================

import { Level, QuestionType, LEVEL_NAMES, QUESTION_TYPE_NAMES } from '@/types';
import { generateWorksheetProblems } from './question-bank';

interface PrintConfig {
  level: Level;
  questionCount: number;
  questionTypes: QuestionType[];
  includeAnswerSheet: boolean;
}

/**
 * 根据题量计算合适的字号和间距
 */
function getLayoutParams(questionCount: number) {
  // 统一大号单栏排版，适合小朋友阅读
  if (questionCount <= 15) {
    return { fontSize: 22, lineHeight: 48, cols: 1 };
  } else if (questionCount <= 30) {
    return { fontSize: 18, lineHeight: 40, cols: 1 };
  } else {
    return { fontSize: 16, lineHeight: 36, cols: 1 };
  }
}

/**
 * 生成打印用 HTML 字符串
 */
export function generatePrintHTML(config: PrintConfig): string {
  const problems = generateWorksheetProblems(
    config.level,
    config.questionCount,
    config.questionTypes
  );

  const { fontSize, lineHeight, cols } = getLayoutParams(config.questionCount);
  const problemsPerCol = Math.ceil(problems.length / cols);

  const today = new Date().toLocaleDateString('zh-CN');

  const problemsHTML = Array.from({ length: cols }, (_, col) => {
    const colProblems = problems.slice(col * problemsPerCol, (col + 1) * problemsPerCol);
    return `
      <div class="column">
        ${colProblems
          .map(
            (p) => `
          <div class="problem" style="font-size:${fontSize}px; line-height:${lineHeight}px;">
            <span class="index">${p.index}.</span>
            <span class="text">${escapeHTML(p.questionText)} = ___________</span>
          </div>
        `
          )
          .join('')}
      </div>
    `;
  }).join('');

  const answersHTML = config.includeAnswerSheet
    ? `
    <div class="page-break"></div>
    <div class="answer-page">
      <h2>📋 答案页（家长版）</h2>
      <div class="answer-grid" style="font-size:14px;">
        ${problems
          .map(
            (p) =>
              `<span class="answer-item">${p.index}. <strong>${p.answer}</strong></span>`
          )
          .join('')}
      </div>
      <p class="footer-note">MathGoGoGo - 答案仅供参考</p>
    </div>
  `
    : '';

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>数学练习题 - ${LEVEL_NAMES[config.level]}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: "PingFang SC", "Microsoft YaHei", "Hiragino Sans GB", sans-serif;
      color: #333;
      padding: 20px 25px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .header {
      text-align: center;
      margin-bottom: 15px;
      padding-bottom: 12px;
      border-bottom: 3px double #4a90d9;
    }
    .header h1 {
      font-size: 24px;
      color: #4a90d9;
      margin-bottom: 8px;
    }
    .header .info {
      display: flex;
      justify-content: center;
      gap: 40px;
      font-size: 14px;
      color: #666;
    }
    .header .info span {
      border-bottom: 1px solid #ccc;
      padding: 0 20px 4px;
      min-width: 120px;
    }
    .problems {
      display: flex;
      gap: 30px;
    }
    .column {
      flex: 1;
    }
    .problem {
      display: flex;
      align-items: baseline;
      gap: 6px;
      padding: 2px 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .problem .index {
      font-weight: bold;
      color: #4a90d9;
      min-width: 28px;
      text-align: right;
      flex-shrink: 0;
    }
    .problem .text {
      flex: 1;
    }
    .footer-note {
      text-align: center;
      color: #bbb;
      font-size: 11px;
      margin-top: 20px;
      padding-top: 10px;
      border-top: 1px solid #eee;
    }

    /* 答案页 */
    .answer-page { padding-top: 10px; }
    .answer-page h2 {
      text-align: center;
      font-size: 20px;
      color: #e74c3c;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 2px solid #f5c6cb;
    }
    .answer-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 4px 16px;
    }
    .answer-item {
      min-width: 80px;
      line-height: 24px;
    }
    .answer-item strong {
      color: #e74c3c;
    }

    /* 屏幕专用：按钮栏悬浮在顶部 */
    @media screen {
      .no-print {
        position: fixed;
        top: 0; left: 0; right: 0;
        z-index: 100;
        background: rgba(255,255,255,0.95);
        backdrop-filter: blur(8px);
        text-align: center;
        padding: 12px;
        border-bottom: 1px solid #e0e0e0;
      }
      .no-print button {
        font-size: 16px;
        padding: 10px 30px;
        border-radius: 8px;
        border: none;
        background: #4a90d9;
        color: white;
        cursor: pointer;
        margin: 0 8px;
      }
      .no-print button:hover { background: #357abd; }
      .no-print button.secondary { background: #95a5a6; }
      .no-print button.secondary:hover { background: #7f8c8d; }
      .no-print p { margin: 6px 0 0; }
      /* 给内容留出按钮栏的空间 */
      .print-area { padding-top: 80px; }
    }

    /* 打印样式：完全隐藏按钮栏 */
    @media print {
      body { padding: 15px 20px; }
      .page-break { page-break-before: always; }
      .no-print { display: none !important; height: 0 !important; margin: 0 !important; padding: 0 !important; overflow: hidden !important; }
      .print-area { padding-top: 0 !important; }
    }
  </style>
</head>
<body>
  <div class="no-print">
    <button onclick="window.print()">🖨️ 打印 / 保存 PDF</button>
    <button class="secondary" onclick="window.close()">关闭</button>
    <p style="margin-top:10px;color:#999;font-size:13px;">
      💡 点击打印后，在打印对话框中选择「另存为 PDF」即可下载
    </p>
  </div>

  <div class="print-area">
    <div class="header">
      <h1>🧮 数学练习题 · ${LEVEL_NAMES[config.level]}</h1>
      <div class="info">
        <span>姓名：______________</span>
        <span>日期：${today}</span>
        <span>用时：______________</span>
      </div>
    </div>

    <div class="problems">
      ${problemsHTML}
    </div>

    <p class="footer-note">MathGoGoGo · 快乐学数学 · ${LEVEL_NAMES[config.level]}</p>

    ${answersHTML}
  </div>

  <script>
    // 自动弹出打印对话框
    setTimeout(() => window.print(), 500);
  </script>
</body>
</html>`;
}

function escapeHTML(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
