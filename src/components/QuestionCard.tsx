import { Question, QUESTION_TYPE_NAMES } from '@/types';

interface QuestionCardProps {
  question: Question;
  isCounting?: boolean;
}

export default function QuestionCard({ question, isCounting }: QuestionCardProps) {
  return (
    <div className="bg-white rounded-3xl shadow-lg border-2 border-blue-100 p-8 max-w-2xl mx-auto">
      {/* 题型标签 */}
      <div className="mb-4">
        <span className="inline-block bg-gradient-to-r from-blue-400 to-purple-400 text-white text-xs font-bold px-3 py-1 rounded-full">
          {QUESTION_TYPE_NAMES[question.type]}
        </span>
      </div>

      {/* 题目文字 */}
      <div
        className={`text-center font-bold text-gray-800 whitespace-pre-line ${
          isCounting ? 'text-4xl leading-relaxed' : 'text-2xl leading-relaxed'
        }`}
      >
        {question.questionText}
      </div>
    </div>
  );
}
