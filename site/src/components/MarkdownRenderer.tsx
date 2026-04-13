import React, { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  /** If true (user bubble with dark bg), skip heading sizes — keeps bubbles compact */
  compact?: boolean;
}

const MarkdownRenderer = memo(function MarkdownRenderer({ content, className, compact = false }: MarkdownRendererProps) {
  return (
    <div className={cn('text-sm', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        components={{
          p: ({ children }) => <p className="leading-relaxed mb-2 last:mb-0">{children}</p>,
          h1: ({ children }) => <h1 className={cn('font-bold mt-2 mb-1', compact ? 'text-sm' : 'text-base')}>{children}</h1>,
          h2: ({ children }) => <h2 className={cn('font-semibold mt-2 mb-1', compact ? 'text-sm' : 'text-base')}>{children}</h2>,
          h3: ({ children }) => <h3 className="font-semibold mt-2 mb-1 text-sm">{children}</h3>,
          ul: ({ children }) => <ul className="list-disc list-inside space-y-1 my-1 pl-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 my-1 pl-1">{children}</ol>,
          li: ({ children }) => <li className="leading-snug">{children}</li>,
          hr: () => <hr className="border-current opacity-20 my-2" />,
          code: ({ children }) => (
            <code className="px-1 py-0.5 rounded text-[0.8em] font-mono bg-black/10 dark:bg-white/10">
              {children}
            </code>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
});

export default MarkdownRenderer;
