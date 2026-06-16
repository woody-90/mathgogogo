// ============================================================
// MathGoGoGo - 评估 API
// POST /api/assessment
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { initAssessment, getNextQuestion, submitAnswer, generateResult, getEncouragement } from '@/lib/assessment';
import { AssessmentState, ApiResponse, Question, AssessmentResult } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, state, selectedAnswer, question, timeSpentMs } = body;

    switch (action) {
      case 'start': {
        // 开始新测试
        const newState: AssessmentState = initAssessment();
        const nextQuestion: Question | null = getNextQuestion(newState);

        if (!nextQuestion) {
          return NextResponse.json({
            success: false,
            error: '无法生成题目',
          } as ApiResponse<never>);
        }

        return NextResponse.json({
          success: true,
          data: {
            state: newState,
            question: nextQuestion,
          },
        } as ApiResponse<{ state: AssessmentState; question: Question }>);
      }

      case 'answer': {
        // 提交答案，获取下一题
        if (!state || selectedAnswer === undefined || !question) {
          return NextResponse.json({
            success: false,
            error: '缺少必要参数：state, selectedAnswer, question',
          } as ApiResponse<never>, { status: 400 });
        }

        const updatedState = submitAnswer(
          state as AssessmentState,
          question as Question,
          selectedAnswer as number,
          timeSpentMs || 0
        );

        if (updatedState.isComplete) {
          // 测试完成，返回结果
          const result = generateResult(updatedState);
          const encouragement = getEncouragement(result.score);

          return NextResponse.json({
            success: true,
            data: {
              state: updatedState,
              result,
              encouragement,
              isComplete: true,
            },
          } as ApiResponse<{
            state: AssessmentState;
            result: AssessmentResult;
            encouragement: string;
            isComplete: true;
          }>);
        }

        // 还有下一题
        const nextQuestion = getNextQuestion(updatedState);

        if (!nextQuestion) {
          return NextResponse.json({
            success: false,
            error: '无法生成下一题',
          } as ApiResponse<never>);
        }

        return NextResponse.json({
          success: true,
          data: {
            state: updatedState,
            question: nextQuestion,
            isComplete: false,
            isCorrect: selectedAnswer === question.correctAnswer,
          },
        } as ApiResponse<{
          state: AssessmentState;
          question: Question;
          isComplete: false;
          isCorrect: boolean;
        }>);
      }

      default:
        return NextResponse.json({
          success: false,
          error: `未知操作: ${action}，支持 start 和 answer`,
        } as ApiResponse<never>, { status: 400 });
    }
  } catch (error) {
    console.error('Assessment API error:', error);
    return NextResponse.json({
      success: false,
      error: '服务器内部错误',
    } as ApiResponse<never>, { status: 500 });
  }
}
