'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAssessment } from '@/contexts/AssessmentContext';
import QuestionCard from '@/components/QuestionCard';
import AnswerButton from '@/components/AnswerButton';
import ProgressBar from '@/components/ProgressBar';
import StarAnimation from '@/components/StarAnimation';

export default function AssessmentPage() {
  const router = useRouter();
  const { state, startAssessment, answerQuestion, reset } = useAssessment();
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answerState, setAnswerState] = useState<'waiting' | 'checking' | 'next'>('waiting');
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackCorrect, setFeedbackCorrect] = useState(false);
  const [showStars, setShowStars] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const initialized = useRef(false);

  // 开始测试
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      reset();
      startAssessment();
    }
  }, [startAssessment, reset]);

  // 记录答题开始时间
  useEffect(() => {
    if (state.currentQuestion) {
      setQuestionStartTime(Date.now());
    }
  }, [state.currentQuestion]);

  // 测试完成后跳转结果页
  useEffect(() => {
    if (state.result) {
      router.push('/result');
    }
  }, [state.result, router]);

  const handleSelectAnswer = useCallback(
    (value: number) => {
      if (answerState !== 'waiting') return;

      setSelectedAnswer(value);
      setAnswerState('checking');

      const timeSpentMs = Date.now() - questionStartTime;

      // 检查答案
      const isCorrect = value === state.currentQuestion?.correctAnswer;
      setFeedbackCorrect(isCorrect);
      setShowFeedback(true);

      if (isCorrect) {
        setShowStars(true);
      }

      // 延迟提交，给小朋友看到反馈的时间
      setTimeout(() => {
        answerQuestion(value, timeSpentMs);
        setSelectedAnswer(null);
        setAnswerState('waiting');
        setShowFeedback(false);
        setShowStars(false);
      }, 1200);
    },
    [answerState, questionStartTime, state.currentQuestion, answerQuestion]
  );

  const handleRetry = useCallback(() => {
    reset();
    startAssessment();
  }, [reset, startAssessment]);

  // 加载中
  if (state.isLoading && !state.currentQuestion) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl animate-bounce mb-4">🧮</div>
          <p className="text-gray-500 text-lg">正在准备题目...</p>
        </div>
      </div>
    );
  }

  // 错误
  if (state.error) {
    return (
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="card p-8 text-center max-w-md">
          <div className="text-5xl mb-4">😢</div>
          <h2 className="text-xl font-bold text-gray-700 mb-2">出错了</h2>
          <p className="text-gray-500 mb-6">{state.error}</p>
          <button onClick={handleRetry} className="btn-primary text-lg">
            重新开始
          </button>
        </div>
      </div>
    );
  }

  // 没有题目时
  if (!state.currentQuestion) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🤔</div>
          <p className="text-gray-500 mb-4">没有题目数据</p>
          <button onClick={handleRetry} className="btn-primary">
            重新开始
          </button>
        </div>
      </div>
    );
  }

  const question = state.currentQuestion;
  const assessmentState = state.assessmentState;
  const isCountingQuestion = question.type === 'counting';

  return (
    <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-4 py-6">
      <StarAnimation show={showStars} count={8} />

      {/* 进度条 */}
      {assessmentState && (
        <div className="mb-6">
          <ProgressBar
            current={assessmentState.currentQuestionIndex + 1}
            total={assessmentState.totalQuestions}
            color="bg-gradient-to-r from-blue-400 to-purple-500"
          />
        </div>
      )}

      {/* 当前等级指示 */}
      {assessmentState && (
        <div className="text-center mb-4">
          <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
            当前难度：等级 {Math.round(assessmentState.currentLevel)}
          </span>
        </div>
      )}

      {/* 题目卡片 */}
      <div className="mb-8 animate-pop-in" key={question.id}>
        <QuestionCard question={question} isCounting={isCountingQuestion} />
      </div>

      {/* 反馈提示 */}
      {showFeedback && (
        <div className="text-center mb-4 animate-pop-in">
          {feedbackCorrect ? (
            <span className="text-2xl font-bold text-green-500">
              ✅ 回答正确！太棒了！
            </span>
          ) : (
            <span className="text-xl font-bold text-red-400">
              ❌ 不对哦，正确答案是 {question.correctAnswer}
            </span>
          )}
        </div>
      )}

      {/* 选项按钮 */}
      <div className="grid grid-cols-2 gap-3">
        {question.choices.map((choice, index) => {
          let btnState: 'default' | 'correct' | 'wrong' = 'default';
          if (showFeedback) {
            if (choice.value === question.correctAnswer) {
              btnState = 'correct';
            } else if (choice.value === selectedAnswer) {
              btnState = 'wrong';
            }
          }

          return (
            <AnswerButton
              key={`${question.id}-${index}`}
              choice={choice}
              index={index}
              onClick={handleSelectAnswer}
              disabled={answerState !== 'waiting'}
              state={btnState}
              size="large"
            />
          );
        })}
      </div>

      {/* 暂停/退出 */}
      <div className="text-center mt-8">
        <button
          onClick={handleRetry}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          重新开始测试
        </button>
      </div>
    </div>
  );
}
