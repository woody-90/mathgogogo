'use client';

import { Choice } from '@/types';

interface AnswerButtonProps {
  choice: Choice;
  index: number;
  onClick: (value: number) => void;
  disabled?: boolean;
  state?: 'default' | 'correct' | 'wrong';
  size?: 'normal' | 'large';
}

const STATE_STYLES = {
  default: 'bg-white border-gray-200 hover:border-blue-400 hover:bg-blue-50 hover:shadow-md text-gray-700',
  correct: 'bg-green-100 border-green-400 text-green-700 ring-2 ring-green-300',
  wrong: 'bg-red-100 border-red-400 text-red-700 ring-2 ring-red-300',
};

const SIZE_STYLES = {
  normal: 'px-6 py-4 text-xl',
  large: 'px-8 py-6 text-3xl',
};

const LABELS = ['A', 'B', 'C', 'D'];

export default function AnswerButton({
  choice,
  index,
  onClick,
  disabled = false,
  state = 'default',
  size = 'normal',
}: AnswerButtonProps) {
  return (
    <button
      onClick={() => onClick(choice.value)}
      disabled={disabled}
      className={`
        rounded-2xl border-2 font-bold transition-all duration-200
        ${STATE_STYLES[state]}
        ${SIZE_STYLES[size]}
        ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer active:scale-95'}
        flex items-center gap-3 min-w-[120px]
      `}
    >
      <span className={`
        w-8 h-8 rounded-full flex items-center justify-center text-sm font-extrabold shrink-0
        ${state === 'correct'
          ? 'bg-green-500 text-white'
          : state === 'wrong'
          ? 'bg-red-500 text-white'
          : 'bg-blue-500 text-white'}
      `}>
        {LABELS[index]}
      </span>
      <span>{choice.label}</span>
    </button>
  );
}
