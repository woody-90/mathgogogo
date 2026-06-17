// ============================================================
// MathGoGoGo - 练习题 PDF API
// POST /api/worksheet
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { generateWorksheetPDF } from '@/lib/pdf-generator';
import { ApiResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { level, questionCount, questionTypes, includeAnswerSheet, title } = body;

    // 参数校验
    if (!level || level < 1 || level > 6) {
      return NextResponse.json({
        success: false,
        error: '等级参数无效 (1-5)',
      } as ApiResponse<never>, { status: 400 });
    }

    if (!questionCount || questionCount < 5 || questionCount > 50) {
      return NextResponse.json({
        success: false,
        error: '题目数量须在 5-50 之间',
      } as ApiResponse<never>, { status: 400 });
    }

    // 生成 PDF
    const pdfBuffer = await generateWorksheetPDF({
      level,
      questionCount,
      questionTypes: questionTypes || [],
      includeAnswerSheet: includeAnswerSheet ?? true,
      title: title || undefined,
    });

    // 返回 PDF 文件（转换为 Uint8Array 兼容 NextResponse）
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="math-worksheet-level-${level}.pdf"`,
        'Content-Length': String(pdfBuffer.length),
      },
    });
  } catch (error) {
    console.error('Worksheet API error:', error);
    return NextResponse.json({
      success: false,
      error: 'PDF 生成失败，请重试',
    } as ApiResponse<never>, { status: 500 });
  }
}
