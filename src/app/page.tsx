'use client';

import Link from 'next/link';
import { LEVEL_NAMES, LEVEL_DESCRIPTIONS } from '@/types';
import type { Level } from '@/types';

const LEVELS: Level[] = [1, 2, 3, 4, 5];

const LEVEL_EMOJIS: Record<Level, string> = {
  1: '🌱',
  2: '🌿',
  3: '🌳',
  4: '🚀',
  5: '⭐',
};

export default function Home() {
  return (
    <div className="flex-1 bg-dots">
      {/* Hero Section */}
      <section className="text-center px-4 pt-12 pb-8">
        <div className="animate-float inline-block text-7xl mb-4">🧮</div>
        <h1 className="text-4xl font-extrabold text-gray-800 mb-3">
          Math<span className="text-blue-500">GoGoGo</span>
        </h1>
        <p className="text-lg text-gray-500 max-w-md mx-auto leading-relaxed">
          专为幼儿园到小学三年级小朋友设计的
          <br />
          数学练习工具 🎉
        </p>
      </section>

      {/* CTA Buttons */}
      <section className="px-4 pb-8">
        <div className="max-w-md mx-auto flex flex-col gap-4">
          <Link
            href="/assessment"
            className="btn-primary text-center text-xl no-underline"
          >
            🚀 开始水平测试
          </Link>
          <Link
            href="/worksheet"
            className="bg-white text-gray-700 font-bold text-lg rounded-2xl px-6 py-3 border-2 border-gray-200 text-center no-underline hover:border-blue-300 hover:shadow-md transition-all"
          >
            📄 直接生成练习题
          </Link>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-4 pb-10">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-xl font-bold text-gray-700 text-center mb-6">
            ✨ 使用流程
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                step: '1',
                emoji: '📝',
                title: '水平测试',
                desc: '回答 12 道数学题\n系统自动评估水平',
              },
              {
                step: '2',
                emoji: '📊',
                title: '查看结果',
                desc: '了解小朋友的\n数学能力等级',
              },
              {
                step: '3',
                emoji: '🖨️',
                title: '打印练习',
                desc: '下载适配水平的\nPDF 练习题',
              },
            ].map((item) => (
              <div
                key={item.step}
                className="card p-5 text-center animate-slide-up"
              >
                <div className="text-4xl mb-2">{item.emoji}</div>
                <h3 className="font-bold text-gray-700 mb-1">{item.title}</h3>
                <p className="text-sm text-gray-500 whitespace-pre-line">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Level Reference */}
      <section className="px-4 pb-12">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-xl font-bold text-gray-700 text-center mb-6">
            📚 等级参考
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {LEVELS.map((lv, i) => (
              <div
                key={lv}
                className="card p-4 animate-slide-up"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{LEVEL_EMOJIS[lv]}</span>
                  <span className="font-bold text-gray-700">
                    等级 {lv} · {LEVEL_NAMES[lv]}
                  </span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {LEVEL_DESCRIPTIONS[lv]}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-6 text-sm text-gray-400">
        💡 提示：请家长陪同操作，题目由家长读给小朋友听
      </footer>
    </div>
  );
}
