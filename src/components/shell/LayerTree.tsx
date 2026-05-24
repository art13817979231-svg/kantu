import { useState, useCallback } from "react";
import { useCanvasStore } from "../../store/canvasStore";
import { useUiStore } from "../../store/uiStore";
import { getColorMarkHex } from "../../utils/colorMarks";
import { filterImages } from "../../utils/filterImages";
import { useActiveBoardCanvas } from "../../hooks/useActiveBoard";
import type { ImageGroup, ImageItem } from "../../types/project";
import { isClusterGroup } from "../../utils/groupUtils";

export function LayerTree() {
  const { images, groups } = useActiveBoardCanvas();
  const selectedIds = useCanvasStore((s) => s.selectedIds);
  const selectImage = useCanvasStore((s) => s.selectImage);
  const setSelectedIds = useCanvasStore((s) => s.setSelectedIds);
  const updateImage = useCanvasStore((s) => s.updateImage);
  const focusOnImage = useCanvasStore((s) => s.focusOnImage);
  const fitToGroup = useCanvasStore((s) => s.fitToGroup);
  const reorderLayers = useCanvasStore((s) => s.reorderLayersDisplayOrder);
  const colorFilter = useUiStore((s) => s.colorFilter);
  const categoryFilter = useUiStore((s) => s.categoryFilter);
  const layerSearch = useUiStore((s) => s.layerSearch);
  const setContextMenu = useUiStore((s) => s.setContextMenu);

  const filtered = filterImages(images, colorFilter, layerSearch, categoryFilter);
  const sorted = [...filtered].sort((a, b) => b.zIndex - a.zIndex);
  const searchLower = layerSearch.trim().toLowerCase();
  const collapsedIds = new Set(groups.filter((g) => g.collapsed).map((g) => g.id));

  const [dragId, setDragId] = useState<string | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  const visibleLayers = sorted.filter(
    (img) => !img.groupId || !collapsedIds.has(img.groupId),
  );

  const onDropAt = useCallback(
    (targetIndex: number) => {
      if (!dragId) return;
      reorderLayers(dragId, targetIndex);
      setDragId(null);
      setDropIndex(null);
    },
    [dragId, reorderLayers],
  );

  const seenGroups = new Set<string>();

  return (
    <div className="layer-tree">
      {sorted.map((img) => {
        const header =
          img.groupId && !seenGroups.has(img.groupId) ? (
            (() => {
              seenGroups.add(img.groupId!);
              const g = groups.find((x) => x.id === img.groupId);
              return g ? (
                <GroupHeader
                  key={`g-${g.id}`}
                  group={g}
                  onToggle={() =>
                    useCanvasStore.setState({
                      groups: groups.map((x) =>
                        x.id === g.id ? { ...x, collapsed: !x.collapsed } : x,
                      ),
                    })
                  }
                  onFit={() => fitToGroup(g.id)}
                />
              ) : null;
            })()
          ) : null;

        if (img.groupId && collapsedIds.has(img.groupId)) {
          return header;
        }

        const index = visibleLayers.findIndex((i) => i.id === img.id);
        if (index < 0) return header;

        return (
          <span key={img.id} style={{ display: "contents" }}>
            {header}
            <LayerRow
              img={img}
              indent={!!img.groupId}
              selected={selectedIds.includes(img.id)}
              dragging={dragId === img.id}
              dropBefore={dropIndex === index}
              onSelect={(additive) => {
                if (additive) selectImage(img.id, true);
                else setSelectedIds([img.id]);
              }}
              onDoubleClick={() => focusOnImage(img.id)}
              onToggleVisible={() => updateImage(img.id, { visible: !img.visible })}
              onToggleLock={() => updateImage(img.id, { locked: !img.locked })}
              onDragStart={() => setDragId(img.id)}
              onDragEnd={() => {
                setDragId(null);
                setDropIndex(null);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDropIndex(index);
              }}
              onDrop={() => onDropAt(index)}
              onContextMenu={(e) => {
                e.preventDefault();
                setContextMenu({ x: e.clientX, y: e.clientY, imageId: img.id });
                setSelectedIds([img.id]);
              }}
            />
          </span>
        );
      })}
      {sorted.length === 0 && (
        <p className="layer-empty">
          无图层
          {colorFilter !== "all" || searchLower ? "（筛选中）" : ""}
        </p>
      )}
    </div>
  );
}

function GroupHeader({
  group,
  onToggle,
  onFit,
}: {
  group: ImageGroup;
  onToggle: () => void;
  onFit: () => void;
}) {
  return (
    <div className="layer-group-head-row">
      <button type="button" className="layer-group-head" onClick={onToggle}>
        {group.collapsed ? "▸" : "▾"}{" "}
        <span className="layer-group-kind">
          {isClusterGroup(group) ? "组" : "框"}
        </span>{" "}
        {group.name}
      </button>
      <button type="button" className="layer-fit-group" onClick={onFit} title="适应此分组">
        ⊡
      </button>
    </div>
  );
}

function LayerRow({
  img,
  indent,
  selected,
  dragging,
  dropBefore,
  onSelect,
  onDoubleClick,
  onToggleVisible,
  onToggleLock,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onContextMenu,
}: {
  img: ImageItem;
  indent?: boolean;
  selected: boolean;
  dragging: boolean;
  dropBefore: boolean;
  onSelect: (additive: boolean) => void;
  onDoubleClick: () => void;
  onToggleVisible: () => void;
  onToggleLock: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}) {
  return (
    <div
      className={`layer-row ${selected ? "selected" : ""} ${!img.visible ? "hidden" : ""} ${indent ? "indented" : ""} ${dragging ? "dragging" : ""} ${dropBefore ? "drop-target" : ""}`}
      draggable
      onClick={(e) => onSelect(e.metaKey || e.ctrlKey)}
      onDoubleClick={(e) => {
        e.preventDefault();
        onDoubleClick();
      }}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={(e) => {
        e.preventDefault();
        onDrop();
      }}
      onContextMenu={onContextMenu}
    >
      <span className="layer-grip" title="拖拽排序">
        ⠿
      </span>
      <span
        className="layer-dot"
        style={{ background: getColorMarkHex(img.colorMark) }}
      />
      <span className="layer-name">{img.name || "未命名"}</span>
      <button
        type="button"
        className="layer-icon"
        onClick={(e) => {
          e.stopPropagation();
          onToggleVisible();
        }}
      >
        {img.visible ? "👁" : "—"}
      </button>
      <button
        type="button"
        className="layer-icon"
        onClick={(e) => {
          e.stopPropagation();
          onToggleLock();
        }}
      >
        {img.locked ? "🔒" : "○"}
      </button>
    </div>
  );
}
