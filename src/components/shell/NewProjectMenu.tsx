import { useState } from "react";
import { useCanvasStore } from "../../store/canvasStore";
import { appConfirm } from "../../utils/appDialog";
import { PROJECT_TEMPLATES } from "../../utils/templates";

type Props = {
  onBlankNew: () => void;
};

export function NewProjectMenu({ onBlankNew }: Props) {
  const [open, setOpen] = useState(false);
  const newFromTemplate = useCanvasStore((s) => s.newFromTemplate);

  return (
    <div className="new-menu-wrap">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="新建项目"
      >
        新建 ▾
      </button>
      {open && (
        <>
          <div className="bg-picker-backdrop" onClick={() => setOpen(false)} />
          <div className="new-menu">
            <button
              type="button"
              className="new-menu-item"
              onClick={() => {
                setOpen(false);
                onBlankNew();
              }}
            >
              <strong>空白项目</strong>
              <span>直接清空画布</span>
            </button>
            <p className="new-menu-divider">从模板创建</p>
            {PROJECT_TEMPLATES.filter((t) => t.id !== "blank").map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                className="new-menu-item"
                onClick={() => {
                  void (async () => {
                    setOpen(false);
                    if (
                      useCanvasStore.getState().isDirty &&
                      !(await appConfirm(
                        "当前项目未保存，确定新建？",
                        "新建项目",
                      ))
                    ) {
                      return;
                    }
                    newFromTemplate(tpl.id);
                  })();
                }}
              >
                <strong>{tpl.name}</strong>
                <span>{tpl.description}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
