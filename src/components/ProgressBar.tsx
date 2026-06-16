interface ProgressBarProps {
  current: number;
  total: number;
  color?: string;
}

export default function ProgressBar({
  current,
  total,
  color = 'bg-blue-500',
}: ProgressBarProps) {
  const percentage = Math.round((current / total) * 100);

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm text-gray-500">
          进度：{current} / {total} 题
        </span>
        <span className="text-sm font-bold text-gray-700">{percentage}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
