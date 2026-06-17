import type { Metadata } from 'next';
import './globals.css';
import { AssessmentProvider } from '@/contexts/AssessmentContext';
import Header from '@/components/Header';

export const metadata: Metadata = {
  title: 'MathGoGoGo - 儿童数学练习',
  description:
    '专为幼儿园到小学三年级小朋友设计的数学练习工具。通过自适应测试评估水平，生成可打印的练习题PDF。',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50">
        <AssessmentProvider>
          <Header />
          <main className="flex-1 flex flex-col">{children}</main>
        </AssessmentProvider>
      </body>
    </html>
  );
}
