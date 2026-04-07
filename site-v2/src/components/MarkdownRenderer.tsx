import type { Components } from 'react-markdown';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
interface MarkdownRendererProps {
  content: string;
  className?: string;
  // If true (small bubble context), keep heading sizes compact.
  compact?: boolean;
}

export default function MarkdownRenderer({ content, className, compact = false }: MarkdownRendererProps) {
  const components: Components = {
    h1: ({ children }) => (
      <h1 className={cn('font-bold mt-2 mb-1', compact ? 'text-sm' : 'text-base')}>{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 className={cn('font-semibold mt-2 mb-1', compact ? 'text-sm' : 'text-base')}>{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="font-semibold mt-2 mb-0.5 text-sm">{children}</h3>
    ),
    p: ({ children }) => <p className="leading-relaxed">{children}</p>,
    ul: ({ children }) => <ul className="list-disc list-inside space-y-1 my-1 pl-1">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 my-1 pl-1">{children}</ol>,
    li: ({ children }) => <li className="leading-snug">{children}</li>,
    blockquote: ({ children }) => (
      <blockquote className="border-l-2 border-border/70 pl-3 italic text-muted-foreground my-1">{children}</blockquote>
    ),
    code: ({ children, className: mdClassName }) => (
      <code className={cn('px-1 py-0.5 rounded text-[0.8em] font-mono bg-black/10 dark:bg-white/10', mdClassName)}>
        {children}
      </code>
    ),
    pre: ({ children }) => (
      <pre className="rounded-lg bg-black/10 dark:bg-white/10 p-2 overflow-x-auto my-2">{children}</pre>
    ),
    hr: () => <hr className="border-current opacity-20 my-2" />,
    a: ({ href, children }) => (
      <a href={href} target="_blank" rel="noopener noreferrer" className="underline text-primary hover:opacity-80">
        {children}
      </a>
    ),
    table: ({ children }) => <table className="w-full text-left border-collapse my-2">{children}</table>,
    thead: ({ children }) => <thead className="border-b border-border/70">{children}</thead>,
    tbody: ({ children }) => <tbody>{children}</tbody>,
    tr: ({ children }) => <tr className="border-b border-border/40">{children}</tr>,
    th: ({ children }) => <th className="py-1.5 pr-2 font-semibold">{children}</th>,
    td: ({ children }) => <td className="py-1.5 pr-2">{children}</td>,
  };

  return (
    <div className={cn('space-y-1 text-sm [&>*:first-child]:mt-0 [&>*:last-child]:mb-0', className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
