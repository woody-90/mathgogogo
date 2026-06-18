// ============================================================
// MathGoGoGo - PDF 练习题生成器
// 使用 html2canvas 截图 + jsPDF 打包
// 浏览器渲染 HTML → 截图 → PDF，完美支持中文和 emoji
// ============================================================

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Level, QuestionType, LEVEL_NAMES } from '@/types';
import { generateWorksheetProblems } from './question-bank';

interface WorksheetConfig {
  level: Level;
  questionCount: number;
  questionTypes: QuestionType[];
  title?: string;
}

/** 生成练习题 HTML（A4 宽度，适合打印） */
function buildWorksheetHTML(config: WorksheetConfig): string {
  const problems = generateWorksheetProblems(config.level, config.questionCount, config.questionTypes);
  const title = config.title || `🧮 数学练习题 - ${LEVEL_NAMES[config.level]}`;

  // 统一单栏排版，根据题量调整字号
  const fontSize = config.questionCount <= 8 ? 26
    : config.questionCount <= 15 ? 22
    : config.questionCount <= 25 ? 19
    : 17;

  const problemsHTML = problems.map((p) => {
    const text = p.questionText.replace(/\n/g, '<br>');
    return `<div class="p"><span class="pi">${p.index}.</span> ${text} = ________</div>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="UTF-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
body{
  font-family:"PingFang SC","Microsoft YaHei","STHeiti",sans-serif;
  color:#333;
  width:780px;
  padding:30px 50px 30px 65px;
  background:#fff;
}
h1{text-align:center;font-size:28px;color:#2563eb;margin-bottom:18px;letter-spacing:2px}
.info{display:flex;gap:40px;font-size:16px;color:#666;margin-bottom:12px;justify-content:center}
.info span{border-bottom:1px solid #bbb;padding:0 16px 4px;min-width:110px;text-align:center}
.line{border-bottom:2.5px solid #2563eb;margin:0 0 16px 0}
.p{
  font-size:${fontSize}px;
  line-height:${Math.round(fontSize * 2.4)}px;
  break-inside:avoid;
  padding:2px 0;
}
.pi{font-weight:bold;color:#2563eb;margin-right:2px}
</style></head>
<body>
<h1>${title}</h1>
<div class="info">
  <span>姓名：______________</span>
  <span>日期：______________</span>
  <span>用时：______________</span>
</div>
<div class="line"></div>
<div>${problemsHTML}</div>
</body></html>`;
}

/** 生成并下载 PDF */
export async function downloadWorksheet(config: WorksheetConfig): Promise<void> {
  // 1. 创建隐藏容器
  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;left:-9999px;top:0;width:794px;background:#fff;z-index:9999;';
  container.innerHTML = buildWorksheetHTML(config);
  document.body.appendChild(container);

  try {
    // 2. html2canvas 截图
    const canvas = await html2canvas(container, {
      scale: 2,           // 2x 高清
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    // 3. 放入 PDF（A4: 210×297mm）
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pw = pdf.internal.pageSize.getWidth();   // 210
    const ph = pdf.internal.pageSize.getHeight();   // 297
    const margin = 8;  // 8mm 打印边距

    const imgW = pw - margin * 2;
    const imgH = (canvas.height * imgW) / canvas.width;
    const contentH = ph - margin * 2;

    // 分页：每页 A4 高度切割
    let srcY = 0;
    let pageNum = 0;
    while (srcY < canvas.height) {
      if (pageNum > 0) pdf.addPage();
      const sliceH = Math.min(canvas.height - srcY, (contentH / imgH) * canvas.height);
      const pdfSliceH = (sliceH / canvas.height) * imgH;

      const sliceCanvas = document.createElement('canvas');
      sliceCanvas.width = canvas.width;
      sliceCanvas.height = Math.ceil(sliceH);
      const ctx = sliceCanvas.getContext('2d')!;
      ctx.drawImage(canvas, 0, srcY, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
      const sliceData = sliceCanvas.toDataURL('image/png');

      pdf.addImage(sliceData, 'PNG', margin, margin, imgW, pdfSliceH);
      srcY += sliceH;
      pageNum++;
    }

    // 4. 下载
    pdf.save(`math-worksheet-level-${config.level}.pdf`);
  } finally {
    // 5. 清理
    document.body.removeChild(container);
  }
}
