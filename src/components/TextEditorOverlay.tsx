import { useEffect, useRef, useState } from "react";
import type Konva from "konva";
import { useCanvasStore } from "../store/canvasStore";
import { useUiStore } from "../store/uiStore";
import { measureTextBox } from "../utils/measureTextBox";
import { TEXT_CORNER_RADIUS } from "../utils/textDefaults";
type Props = {
  stageRef: React.RefObject<Konva.Stage | null>;
};

export function TextEditorOverlay({ stageRef }: Props) {
  const editingTextId = useUiStore((s) => s.editingTextId);
  const setEditingTextId = useUiStore((s) => s.setEditingTextId);
  const item = useCanvasStore((s) =>
    editingTextId ? s.texts.find((t) => t.id === editingTextId) : undefined,
  );
  const updateText = useCanvasStore((s) => s.updateText);
  const viewport = useCanvasStore((s) => s.viewport);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (!editingTextId || !item) return;
    setDraft(item.text);
    const t = setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.select();
    }, 0);
    return () => clearTimeout(t);
  }, [editingTextId, item?.id]);

  if (!editingTextId || !item || !stageRef.current) return null;

  const sx = viewport.panX + item.x * viewport.zoom;
  const sy = viewport.panY + item.y * viewport.zoom;
  const w = item.width * viewport.zoom;
  const h = item.height * viewport.zoom;

  const applyDraft = (value: string) => {
    const text = value.trim() || " ";
    if (item.autoSize === false) {
      updateText(item.id, { text });
      return;
    }
    const { width, height } = measureTextBox(text, item.fontSize);
    updateText(item.id, { text, width, height });
  };

  const commit = () => {
    applyDraft(draft);
    setEditingTextId(null);
  };

  const onDraftChange = (value: string) => {
    setDraft(value);
    applyDraft(value);
  };

  return (
    <textarea
      ref={textareaRef}
      className="text-editor-overlay"
      value={draft}
      onChange={(e) => onDraftChange(e.target.value)}
      style={{
        left: sx,
        top: sy,
        width: w,
        height: h,
        fontSize: item.fontSize * viewport.zoom,
        lineHeight: 1.35,
        color: item.fill,
        textAlign: item.align,
        backgroundColor: item.backgroundColor,
        borderRadius: TEXT_CORNER_RADIUS,
        boxSizing: "border-box",
      }}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          setEditingTextId(null);
        }
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          commit();
        }
        e.stopPropagation();
      }}
      onMouseDown={(e) => e.stopPropagation()}
    />
  );
}
