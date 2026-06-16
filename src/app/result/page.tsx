'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAssessment } from '@/contexts/AssessmentContext';
import LevelBadge from '@/components/LevelBadge';
import StarAnimation from '@/components/StarAnimation';
import { Level, LEVEL_NAMES, LEVEL_DESCRIPTIONS } from '@/types';

export default function ResultPage() {
  const router = useRouter();
  const { state, reset } = useAssessment();

  // 没有结果时重定向到测试页
  useEffect(() => {
    if (!state.result && !state.isLoading) {
      const timer = setTimeout(() => router.push('/assessment'), 500);
      return () => clearTimeout(timer);
    }
  }, [state.result, state.isLoading, router]);

  // 加载中
  if (state.isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl animate-bounce mb-4">📊</div>
          <p className="text-gray-500 text-lg">正在分析结果...</p>
        </div>
      </div>
    );
  }

  // 没有结果
  if (!state.result) {
    return (
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="card p-8 text-center max-w-md">
          <div className="text-5xl mb-4">📭</div>
          <h2 className="text-xl font-bold text-gray-700 mb-2">还没有测试结果</h2>
          <p className="text-gray-500 mb-6">
            请先完成水平测试，才能查看结果哦！
          </p>
          <Link href="/assessment" className="btn-primary text-lg no-underline inline-block">
            去测试
          </Link>
        </div>
      </div>
    );
  }

  const result = state.result;

  return (
    <div className="flex-1 bg-dots py-8 px-4">
      <StarAnimation show={true} count={15} />

      <div className="max-w-2xl mx-auto">
        {/* 鼓励语 */}
        <div className="text-center mb-8 animate-pop-in">
          <div className="text-5xl mb-3">
            {result.score >= 90 ? '🏆' : result.score >= 70 ? '🎉' : result.score >= 50 ? '💪' : '🌈'}
          </div>
          <h1 className="text-3xl font-extrabold text-gray-800 mb-2">
            {state.encouragement}
          </h1>
          <p className="text-gray-500">测试完成！以下是你的数学水平分析</p>
        </div>

        {/* 等级徽章 + 总成绩 */}
        <div className="card p-6 mb-6 text-center animate-slide-up">
          <div className="flex justify-center mb-3">
            <LevelBadge level={result.finalLevel} size="lg" />
          </div>

          <div className="flex items-center justify-center gap-8 mt-4">
            <div>
              <div className="text-4xl font-extrabold text-blue-600">
                {result.score}
                <span className="text-lg text-gray-400">分</span>
              </div>
              <div className="text-sm text-gray-500 mt-1">总正确率</div>
            </div>
            <div className="w-px h-12 bg-gray-200" />
            <div>
              <div className="text-4xl font-extrabold text-green-500">
                {result.totalCorrect}
                <span className="text-lg text-gray-400">/{result.totalQuestions}</span>
              </div>
              <div className="text-sm text-gray-500 mt-1">答对题数</div>
            </div>
          </div>
        </div>

        {/* 各等级表现 */}
        <div className="card p-6 mb-6 animate-slide-up">
          <h3 className="font-bold text-gray-700 mb-4 text-center">
            📊 各等级答题表现
          </h3>
          <div className="space-y-3">
            {([1, 2, 3, 4, 5] as Level[]).map((lv) => {
              const ls = result.levelScores[lv];
              if (ls.total === 0) return null;
              const rate = Math.round((ls.correct / ls.total) * 100);
              const barColor =
                rate >= 80
                  ? 'bg-green-400'
                  : rate >= 60
                  ? 'bg-yellow-400'
                  : 'bg-red-300';

              return (
                <div key={lv} className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-600 w-20 text-right shrink-0">
                    {LEVEL_NAMES[lv]}
                  </span>
                  <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${barColor} transition-all duration-1000 flex items-center justify-end pr-2`}
                      style={{ width: `${Math.max(rate, 8)}%` }}
                    >
                      <span className="text-xs font-bold text-white">
                        {ls.correct}/{ls.total}
                      </span>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-gray-500 w-10">
                    {rate}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 学习建议 */}
        <div className="card p-6 mb-8 animate-slide-up">
          <h3 className="font-bold text-gray-700 mb-2 text-center">💡 学习建议</h3>
          <p className="text-gray-600 text-center leading-relaxed">
            {result.suggestion}
          </p>
          <p className="text-xs text-gray-400 text-center mt-2">
            推荐等级：{LEVEL_NAMES[result.finalLevel]} · {LEVEL_DESCRIPTIONS[result.finalLevel]}
          </p>
        </div>

        {/* 操作按钮 */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center animate-slide-up">
          <Link
            href={`/worksheet?level=${result.finalLevel}`}
            className="btn-primary text-center text-lg no-underline"
          >
            📄 生成练习题 PDF
          </Link>
          <button
            onClick={() => {
              reset();
              router.push('/assessment');
            }}
            className="bg-white text-gray-700 font-bold text-lg rounded-2xl px-6 py-3 border-2 border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
          >
            🔄 重新测试
          </button>
          <Link
            href="/"
            className="bg-white text-gray-500 font-bold text-lg rounded-2xl px-6 py-3 border-2 border-gray-200 hover:border-gray-300 hover:shadow-md transition-all no-underline text-center"
          >
            🏠 回到首页
          </Link>
        </div>
      </div>
    </div>
  );
}
