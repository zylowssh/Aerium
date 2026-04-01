import React from 'react';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Inline renderer — handles **bold**, *italic*, `code` within a text node
// ---------------------------------------------------------------------------
function renderInline(text: string, keyPrefix: string): React.ReactNode {
  const nodes: React.ReactNode[] = [];
  let rest = text;
  let k = 0;

  while (rest.length > 0) {
    // **bold**
    const bold = rest.match(/^\*\*([^*\n]+?)\*\*/);
    if (bold) {
      nodes.push(<strong key={`${keyPrefix}-b${k++}`} className="font-semibold">{bold[1]}</strong>);
      rest = rest.slice(bold[0].length);
      continue;
    }
    // *italic* (single star, not double)
    const italic = rest.match(/^\*([^*\n]+?)\*/);
    if (italic) {
      nodes.push(<em key={`${keyPrefix}-i${k++}`}>{italic[1]}</em>);
      rest = rest.slice(italic[0].length);
      continue;
    }
    // `code`
    const code = rest.match(/^`([^`\n]+?)`/);
    if (code) {
      nodes.push(
        <code
          key={`${keyPrefix}-c${k++}`}
          className="px-1 py-0.5 rounded text-[0.8em] font-mono bg-black/10 dark:bg-white/10"
        >
          {code[1]}
        </code>
      );
      rest = rest.slice(code[0].length);
      continue;
    }
    // Advance to next potential marker
    const next = rest.search(/\*\*|\*|`/);
    if (next === -1) {
      nodes.push(<React.Fragment key={`${keyPrefix}-t${k++}`}>{rest}</React.Fragment>);
      break;
    }
    if (next > 0) {
      nodes.push(<React.Fragment key={`${keyPrefix}-t${k++}`}>{rest.slice(0, next)}</React.Fragment>);
    }
    rest = rest.slice(next);
  }

  return <>{nodes}</>;
}

// ---------------------------------------------------------------------------
// Block-level parser
// ---------------------------------------------------------------------------
interface MarkdownRendererProps {
  content: string;
  className?: string;
  /** If true (user bubble with dark bg), skip heading sizes — keeps bubbles compact */
  compact?: boolean;
}

export default function MarkdownRenderer({ content, className, compact = false }: MarkdownRendererProps) {
  const blocks: React.ReactNode[] = [];
  const lines = content.split('\n');
  let i = 0;
  let bk = 0; // block key counter

  while (i < lines.length) {
    const line = lines[i];

    // Empty line → skip
    if (line.trim() === '') { i++; continue; }

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      blocks.push(<hr key={bk++} className="border-current opacity-20 my-2" />);
      i++;
      continue;
    }

    // Headings
    const h3 = line.match(/^### (.+)/);
    if (h3) {
      blocks.push(
        <p key={bk++} className={cn('font-semibold mt-2 mb-0.5', compact ? 'text-sm' : 'text-sm')}>
          {renderInline(h3[1], `h3-${bk}`)}
        </p>
      );
      i++; continue;
    }
    const h2 = line.match(/^## (.+)/);
    if (h2) {
      blocks.push(
        <p key={bk++} className={cn('font-semibold mt-2 mb-1', compact ? 'text-sm' : 'text-base')}>
          {renderInline(h2[1], `h2-${bk}`)}
        </p>
      );
      i++; continue;
    }
    const h1 = line.match(/^# (.+)/);
    if (h1) {
      blocks.push(
        <p key={bk++} className={cn('font-bold mt-2 mb-1', compact ? 'text-sm' : 'text-base')}>
          {renderInline(h1[1], `h1-${bk}`)}
        </p>
      );
      i++; continue;
    }

    // Unordered list — collect consecutive bullet lines
    if (/^[-*+] /.test(line)) {
      const items: React.ReactNode[] = [];
      let li = 0;
      while (i < lines.length && /^[-*+] /.test(lines[i])) {
        const txt = lines[i].replace(/^[-*+] /, '');
        items.push(
          <li key={li++} className="leading-snug">
            {renderInline(txt, `ul-${bk}-${li}`)}
          </li>
        );
        i++;
      }
      blocks.push(
        <ul key={bk++} className="list-disc list-inside space-y-1 my-1 pl-1">
          {items}
        </ul>
      );
      continue;
    }

    // Ordered list — collect consecutive numbered lines
    if (/^\d+\. /.test(line)) {
      const items: React.ReactNode[] = [];
      let li = 0;
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        const txt = lines[i].replace(/^\d+\. /, '');
        items.push(
          <li key={li++} className="leading-snug">
            {renderInline(txt, `ol-${bk}-${li}`)}
          </li>
        );
        i++;
      }
      blocks.push(
        <ol key={bk++} className="list-decimal list-inside space-y-1 my-1 pl-1">
          {items}
        </ol>
      );
      continue;
    }

    // Paragraph — collect non-empty, non-block lines
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !/^[#>]/.test(lines[i]) &&
      !/^[-*+] /.test(lines[i]) &&
      !/^\d+\. /.test(lines[i]) &&
      !/^---+$/.test(lines[i].trim())
    ) {
      paraLines.push(lines[i]);
      i++;
    }

    if (paraLines.length > 0) {
      const paraKey = `p-${bk++}`;
      blocks.push(
        <p key={paraKey} className="leading-relaxed">
          {paraLines.flatMap((l, j) =>
            j === 0
              ? [renderInline(l, `${paraKey}-${j}`)]
              : [<br key={`br-${paraKey}-${j}`} />, renderInline(l, `${paraKey}-${j}`)]
          )}
        </p>
      );
    }
  }

  return (
    <div className={cn('space-y-1 text-sm', className)}>
      {blocks}
    </div>
  );
}
