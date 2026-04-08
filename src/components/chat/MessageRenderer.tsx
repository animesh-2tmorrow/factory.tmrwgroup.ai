"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { Check, Clipboard } from "lucide-react";

interface MessageRendererProps {
  content: string;
}

function CodeCopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      className="cc-code-copy-btn"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          setCopied(false);
        }
      }}
      aria-label="Copy code"
    >
      {copied ? <Check size={12} /> : <Clipboard size={12} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export default function MessageRenderer({ content }: MessageRendererProps) {
  return (
    <div className="vf-chat-markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          code(props) {
            const { className, children, ...rest } = props;
            const raw = String(children ?? "").replace(/\n$/, "");
            const isBlock = raw.includes("\n");

            if (!isBlock) {
              return (
                <code className={className} {...rest}>
                  {children}
                </code>
              );
            }

            // Extract language from className (e.g., "language-typescript")
            const lang = className?.replace("hljs ", "").replace("language-", "") ?? "";

            return (
              <div className="cc-code-block-wrap">
                <div className="cc-code-block-header">
                  <span>{lang || "code"}</span>
                  <CodeCopyButton text={raw} />
                </div>
                <pre>
                  <code className={className} {...rest}>
                    {raw}
                  </code>
                </pre>
              </div>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
