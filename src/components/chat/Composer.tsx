"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef } from "react";
import { ArrowUp, Square } from "lucide-react";
import { PUBLIC_RUNTIME_LABEL } from "@/lib/runtime-brand";

interface ComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onStop?: () => void;
  disabled?: boolean;
  generating?: boolean;
  modelLabel?: string | null;
}

export default function Composer({
  value,
  onChange,
  onSubmit,
  onStop,
  disabled,
  generating,
  modelLabel: _modelLabel,
}: ComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(200, Math.max(52, el.scrollHeight))}px`;
  }, [value]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="cc-composer-wrap">
      <form className="cc-composer" onSubmit={handleSubmit}>
        <textarea
          ref={textareaRef}
          className="cc-composer-input"
          placeholder="Message Cloud Agent..."
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="Message composer"
          disabled={disabled}
        />

        <div className="cc-composer-bottom">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="cc-composer-model">
              {PUBLIC_RUNTIME_LABEL}
            </span>
            {generating && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <span className="cc-thinking-dot" style={{ width: 4, height: 4 }} />
                <span className="cc-thinking-dot" style={{ width: 4, height: 4 }} />
                <span className="cc-thinking-dot" style={{ width: 4, height: 4 }} />
              </span>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {generating && onStop ? (
              <button
                type="button"
                className="cc-stop-btn"
                onClick={onStop}
                aria-label="Stop generating"
              >
                <Square size={14} />
              </button>
            ) : (
              <button
                type="submit"
                className="cc-send-btn"
                disabled={disabled || generating || value.trim().length === 0}
                aria-label="Send message"
              >
                <ArrowUp size={16} strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
