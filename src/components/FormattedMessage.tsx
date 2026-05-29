import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Copy, Check, Terminal, Code2 } from "lucide-react";

interface FormattedMessageProps {
  content: string;
}

export default function FormattedMessage({ content }: FormattedMessageProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!content) return null;

  // Preprocess content to ensure robust parsing of backslash-wrapped equations and LaTeX inline/block delimiters
  const preprocessMarkdown = (text: string): string => {
    // Convert \[ ... \] block math to $$ ... $$ block math
    let formatted = text.replace(/\\\[([\s\S]*?)\\\]/g, (_, match) => {
      return `\n$$\n${match.trim()}\n$$\n`;
    });

    // Convert \( ... \) inline math to $ ... $ inline math
    formatted = formatted.replace(/\\\(([\s\S]*?)\\\)/g, (_, match) => {
      return `$${match.trim()}$`;
    });

    // Clean up excessive spacing around block formulas
    formatted = formatted.replace(/\$\$\s*\$\$/g, "");

    return formatted;
  };

  const processedContent = preprocessMarkdown(content);

  // Overrider components object for custom markdown element rendering
  const components: Record<string, React.ComponentType<any>> = {
    // Sleek code element styling (distinguishes custom block code vs inline code)
    code({ className, children, ...props }) {
      const childrenStr = String(children || "");
      const hasNewline = childrenStr.includes("\n");
      const match = /language-(\w+)/.exec(className || "");
      const isInline = !match && !hasNewline;

      if (isInline) {
        return (
          <code 
            className="px-1.5 py-0.5 rounded-md bg-[#f1f1f2] dark:bg-gpt-dark-input font-mono text-[13px] text-gpt-accent italic font-semibold border border-black/[0.04] dark:border-white/[0.04]" 
            {...props}
          >
            {childrenStr}
          </code>
        );
      }

      const language = match ? match[1] : "code";
      const blockId = `code-${Math.random().toString(36).substring(2, 9)}`;

      return (
        <div 
          className="my-5 rounded-lg overflow-hidden border border-[#e5e5e6] dark:border-gpt-dark-border bg-gpt-dark-panel max-w-full text-white shadow-xs"
        >
          {/* Header element for premium copy mechanics */}
          <div className="flex items-center justify-between px-4 py-1.5 border-b border-[#2f2f2f]/20 bg-[#2f2f2f] text-slate-300 select-none">
            <div className="flex items-center gap-1.5 text-xs font-mono">
              {language === "html" || language === "css" || language === "js" || language === "ts" || language === "tsx" || language === "javascript" || language === "typescript" ? (
                <Code2 className="w-3.5 h-3.5 text-gpt-accent" />
              ) : (
                <Terminal className="w-3.5 h-3.5 text-gpt-accent" />
              )}
              <span>{language.toUpperCase()}</span>
            </div>
            <button
              onClick={() => handleCopy(childrenStr, blockId)}
              className="flex items-center gap-1.5 text-[11px] font-sans text-slate-400 hover:text-white cursor-pointer transition-colors"
            >
              {copiedId === blockId ? (
                <>
                  <Check className="w-3.5 h-3.5 text-gpt-accent" />
                  <span className="text-gpt-accent font-semibold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy code</span>
                </>
              )}
            </button>
          </div>
          <pre className="p-4 overflow-x-auto font-mono text-xs text-[#E5E7EB] bg-gpt-dark-panel leading-relaxed max-w-full whitespace-pre">
            <code>{children}</code>
          </pre>
        </div>
      );
    },

    // Beautiful styling details for lists
    ul({ children }) {
      return <ul className="list-disc pl-6 space-y-1 my-3 text-[15px]">{children}</ul>;
    },
    ol({ children }) {
      return <ol className="list-decimal pl-6 space-y-1 my-3 text-[15px]">{children}</ol>;
    },
    li({ children }) {
      return <li className="pl-1 py-0.5 text-[#202123]/95 dark:text-[#ECECEC]/95 leading-relaxed">{children}</li>;
    },

    // Elegant heading sizes and typography variables matching premium ChatGPT layouts
    h1({ children }) {
      return <h1 className="text-xl font-bold tracking-tight text-[#202123] dark:text-white mt-6 mb-2">{children}</h1>;
    },
    h2({ children }) {
      return <h2 className="text-lg font-bold tracking-tight text-[#202123] dark:text-white mt-5 mb-2">{children}</h2>;
    },
    h3({ children }) {
      return <h3 className="text-md font-bold tracking-tight text-[#202123] dark:text-white mt-4 mb-1.5">{children}</h3>;
    },
    h4({ children }) {
      return <h4 className="text-sm font-bold tracking-tight text-[#202123] dark:text-white mt-3 mb-1">{children}</h4>;
    },

    // Standard paragraphs
    p({ children }) {
      return <p className="text-[#202123] dark:text-[#ECECEC] leading-relaxed my-2 break-words text-[15px]">{children}</p>;
    },

    // Blockquotes with beautiful accent left border
    blockquote({ children }) {
      return (
        <blockquote className="border-l-4 border-gpt-accent bg-[#f7f7f8] dark:bg-gpt-dark-card pl-4 pr-2 py-2.5 my-4 rounded-r-md text-sm text-[#565869] dark:text-gpt-dark-text-secondary italic">
          {children}
        </blockquote>
      );
    },

    // Responsive, high-contrast visual tables
    table({ children }) {
      return (
        <div className="overflow-x-auto my-5 rounded-lg border border-gpt-light-border dark:border-gpt-dark-border max-w-full">
          <table className="min-w-full divide-y divide-gpt-light-border dark:divide-gpt-dark-border table-auto text-sm text-left">
            {children}
          </table>
        </div>
      );
    },
    thead({ children }) {
      return <thead className="bg-[#f7f7f8] dark:bg-gpt-dark-panel text-[13px] font-bold text-[#202123] dark:text-white uppercase tracking-wider">{children}</thead>;
    },
    tbody({ children }) {
      return <tbody className="divide-y divide-gpt-light-border dark:divide-gpt-dark-border bg-white dark:bg-gpt-dark-card">{children}</tbody>;
    },
    tr({ children }) {
      return <tr className="hover:bg-black/[0.01] dark:hover:bg-white/[0.01] transition-colors">{children}</tr>;
    },
    th({ children }) {
      return <th className="px-4 py-3 font-semibold border-b border-gpt-light-border dark:border-gpt-dark-border">{children}</th>;
    },
    td({ children }) {
      return <td className="px-4 py-3 text-[#202123]/90 dark:text-gpt-dark-text-secondary border-b border-gpt-light-border dark:border-gpt-dark-border">{children}</td>;
    },
  };

  return (
    <div className="space-y-3 font-sans leading-relaxed text-[15px] max-w-full overflow-hidden text-[#202123] dark:text-[#ECECEC]">
      <ReactMarkdown 
        remarkPlugins={[remarkMath]} 
        rehypePlugins={[rehypeKatex]}
        components={components}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}
