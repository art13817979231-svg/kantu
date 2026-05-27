import { useEffect, useRef, useState } from "react";
import { useUiStore } from "../../store/uiStore";

export function PromptDialog() {
  const dialog = useUiStore((s) => s.promptDialog);
  const finishPrompt = useUiStore((s) => s.finishPrompt);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!dialog) return;
    setValue(dialog.defaultValue);
    const t = setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
    return () => clearTimeout(t);
  }, [dialog?.title, dialog?.defaultValue]);

  if (!dialog) return null;

  const commit = () => {
    const trimmed = value.trim();
    finishPrompt(trimmed || dialog.defaultValue.trim() || null);
  };

  return (
    <div
      className="prompt-dialog-backdrop"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) finishPrompt(null);
      }}
    >
      <div
        className="prompt-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="prompt-dialog-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 id="prompt-dialog-title" className="prompt-dialog-title">
          {dialog.title}
        </h2>
        <input
          ref={inputRef}
          className="prompt-dialog-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") finishPrompt(null);
          }}
        />
        <div className="prompt-dialog-actions">
          <button type="button" onClick={() => finishPrompt(null)}>
            取消
          </button>
          <button type="button" className="primary" onClick={commit}>
            确定
          </button>
        </div>
      </div>
    </div>
  );
}
