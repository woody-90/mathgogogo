'use client';

import { Level, QuestionType, LEVEL_NAMES } from '@/types';
import { useState, useEffect } from 'react';
import { generateWorksheetProblems } from '@/lib/question-bank';

interface WorksheetPreviewProps {
  level: Level;
  questionCount: number;
  questionTypes: QuestionType[];
}

interface Problem {
  index: number;
  type: QuestionType;
  questionText: string;
  answer: number;
}

export default function WorksheetPreview({
  level,
  questionCount,
  questionTypes,
}: WorksheetPreviewProps) {
  const [problems, setProblems] = useState<Problem[]>([]);

  useEffect(() => {
    const types =
      questionTypes.length > 0
        ? questionTypes
        : undefined;
    const generated = generateWorksheetProblems(level, questionCount, questionTypes);
    setProblems(generated);
  }, [level, questionCount, questionTypes]);

  return (
    <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-inner">
      {/* Preview Header */}
      <div className="bg-blue-500 text-white text-center py-2 rounded-lg mb-4 font-bold text-sm">
        📝 练习题预览 · {LEVEL_NAMES[level]} · {questionCount} 题
      </div>

      {/* Info Row */}
      <div className="flex gap-8 mb-3 text-xs text-gray-500">
        <span>姓名：____________</span>
        <span>日期：____________</span>
        <span>用时：____________</span>
      </div>

      <div className="border-t border-gray-200 pt-3" />

      {/* Problems Grid - 2 columns */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-3">
        {problems.map((p) => (
          <div key={p.index} className="flex items-start gap-2 text-sm">
            <span className="font-bold text-gray-500 min-w-[24px]">{p.index}.</span>
            <span className="text-gray-800">
              {p.questionText.replace(/？/g, '?').replace(/×/g, 'x').replace(/÷/g, '/')} = ________
            </span>
          </div>
        ))}
      </div>

      {/* Note about PDF */}
      <div className="mt-4 pt-3 border-t border-gray-200 text-xs text-gray-400 text-center">
        💡 这是预览效果，下载的 PDF 排版更精美
      </div>
    </div>
  );
}
