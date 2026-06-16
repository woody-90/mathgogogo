'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: '🏠 首页' },
    { href: '/assessment', label: '📝 水平测试' },
    { href: '/worksheet', label: '📄 练习题' },
  ];

  return (
    <header className="bg-white border-b-2 border-blue-100 shadow-sm">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 no-underline">
          <span className="text-3xl">🧮</span>
          <span className="text-xl font-bold text-blue-600">MathGoGoGo</span>
        </Link>

        <nav className="flex gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors no-underline ${
                pathname === item.href
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
