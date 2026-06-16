'use client';

import { useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Level,
  QuestionType,
  LEVEL_NAMES,
  QUESTION_TYPE_NAMES,
  LEVEL_QUESTION_TYPES,
} from '@/types';
import LevelBadge from '@/components/LevelBadge';
import WorksheetPreview from '@/components/WorksheetPreview';

const ALL_LEVELS: Level[] = [1, 2, 3, 4, 5];

function WorksheetContent() {
  const searchParams = useSearchParams();
  const levelFromUrl = Number(searchParams.get('level')) as Level;

  const [level, setLevel] = useState<Level>(
    levelFromUrl >= 1 && levelFromUrl <= 5 ? levelFromUrl : 3
  );
  const [questionCount, setQuestionCount] = useState(20);
  const [selectedTypes, setSelectedTypes] = useState<QuestionType[]>([]);
  const [includeAnswers, setIncludeAnswers] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 切换题型选择
  const toggleType = useCallback((type: QuestionType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }, []);

  // 全部选择 / 取消
  const toggleAll = useCallback(() => {
    const allTypes = LEVEL_QUESTION_TYPES[level];
    if (selectedTypes.length === allTypes.length) {
      setSelectedTypes([]);
    } else {
      setSelectedTypes([...allTypes]);
    }
  }, [level, selectedTypes]);

  // 下载 PDF
  const handleDownload = useCallback(async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch('/api/worksheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level,
          questionCount,
          questionTypes:
            selectedTypes.length > 0
              ? selectedTypes
              : LEVEL_QUESTION_TYPES[level],
          includeAnswerSheet: includeAnswers,
          title: `Math Worksheet - ${LEVEL_NAMES[level]}`,
        }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        setError(json?.error || 'PDF 生成失败');
        return;
      }

      // 下载文件
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `math-worksheet-level-${level}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      setError('网络错误，请重试');
    } finally {
      setIsGenerating(false);
    }
  }, [level, questionCount, selectedTypes, includeAnswers]);

  const availableTypes = LEVEL_QUESTION_TYPES[level];

  return (
    <div className="flex-1 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-800 mb-2">
            📄 生成练习题
          </h1>
          <p className="text-gray-500">
            选择难度和题型，下载可打印的 PDF 练习题
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 左侧：配置区 */}
          <div className="space-y-5">
            {/* 等级选择 */}
            <div className="card p-5">
              <label className="block font-bold text-gray-700 mb-3">
                📚 选择难度等级
              </label>
              <div className="flex flex-wrap gap-2">
                {ALL_LEVELS.map((lv) => (
                  <button
                    key={lv}
                    onClick={() => {
                      setLevel(lv);
                      setSelectedTypes([]);
                    }}
                    className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                      level === lv
                        ? 'bg-blue-500 text-white shadow-md scale-105'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    等级 {lv}
                    <span className="block text-xs opacity-75">
                      {LEVEL_NAMES[lv]}
                    </span>
                  </button>
                ))}
              </div>
              <div className="mt-3">
                <LevelBadge level={level} size="sm" />
              </div>
            </div>

            {/* 题量选择 */}
            <div className="card p-5">
              <label className="block font-bold text-gray-700 mb-3">
                🔢 题目数量：
                <span className="text-blue-500 text-xl ml-2">{questionCount}</span>
                题
              </label>
              <input
                type="range"
                min={5}
                max={50}
                step={5}
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>5 题</span>
                <span>50 题</span>
              </div>
            </div>

            {/* 题型选择 */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <label className="font-bold text-gray-700">
                  ✏️ 选择题型
                </label>
                <button
                  onClick={toggleAll}
                  className="text-xs text-blue-500 hover:text-blue-700"
                >
                  {selectedTypes.length === availableTypes.length ? '取消全选' : '全选'}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {availableTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => toggleType(type)}
                    className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                      selectedTypes.length === 0 ||
                      selectedTypes.includes(type)
                        ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                        : 'bg-gray-50 text-gray-400 border-2 border-gray-200'
                    } ${selectedTypes.includes(type) ? 'ring-2 ring-blue-300' : ''}`}
                  >
                    {QUESTION_TYPE_NAMES[type]}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {selectedTypes.length === 0
                  ? '未选择时默认包含全部题型'
                  : `已选择 ${selectedTypes.length} 种题型`}
              </p>
            </div>

            {/* 答案页选项 */}
            <div className="card p-5">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeAnswers}
                  onChange={(e) => setIncludeAnswers(e.target.checked)}
                  className="w-5 h-5 rounded accent-blue-500"
                />
                <span className="font-bold text-gray-700">
                  📋 附带答案页（家长版）
                </span>
              </label>
            </div>

            {/* 下载按钮 */}
            <button
              onClick={handleDownload}
              disabled={isGenerating}
              className="btn-primary w-full text-xl py-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span>
                  正在生成 PDF...
                </span>
              ) : (
                '⬇️ 下载练习题 PDF'
              )}
            </button>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl text-center">
                {error}
              </div>
            )}
          </div>

          {/* 右侧：预览区 */}
          <div>
            <div className="sticky top-4">
              <h3 className="font-bold text-gray-700 mb-3 text-center">
                👀 实时预览
              </h3>
              <WorksheetPreview
                level={level}
                questionCount={Math.min(questionCount, 12)}
                questionTypes={
                  selectedTypes.length > 0
                    ? selectedTypes
                    : LEVEL_QUESTION_TYPES[level]
                }
              />
              {questionCount > 12 && (
                <p className="text-xs text-gray-400 text-center mt-2">
                  预览仅显示前 12 题，PDF 包含全部 {questionCount} 题
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WorksheetPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center">
          <div className="text-6xl animate-bounce">📄</div>
        </div>
      }
    >
      <WorksheetContent />
    </Suspense>
  );
}
