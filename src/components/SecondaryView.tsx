import { useRef } from "react";
import type Konva from "konva";
import { InfiniteCanvas } from "./InfiniteCanvas";
import { useProjectSyncListen } from "../hooks/useProjectSync";

export function SecondaryView() {
  const stageRef = useRef<Konva.Stage | null>(null);
  useProjectSyncListen();

  return (
    <div className="secondary-view">
      <header className="secondary-header">
        <span>副视图</span>
        <span className="secondary-hint">独立缩放与平移，内容与主窗口同步</span>
      </header>
      <InfiniteCanvas
        onImport={() => {}}
        onStageReady={(s) => {
          stageRef.current = s;
        }}
      />
    </div>
  );
}
