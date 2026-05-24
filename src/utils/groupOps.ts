import type { ImageGroup, ImageItem, TextItem } from "../types/project";

export type GroupMemberSlice = {
  groups: ImageGroup[];
  images: ImageItem[];
  texts: TextItem[];
};

/** 删除框并解除框内图片/文本的 groupId 绑定 */
export function detachFrameMembers(
  slice: GroupMemberSlice,
  frameId: string,
): GroupMemberSlice {
  return {
    groups: slice.groups.filter((g) => g.id !== frameId),
    images: slice.images.map((img) =>
      img.groupId === frameId ? { ...img, groupId: null } : img,
    ),
    texts: slice.texts.map((t) =>
      t.groupId === frameId ? { ...t, groupId: null } : t,
    ),
  };
}

/** 即将被删除的成员所在群组 id */
export function affectedGroupIdsFromRemoval(
  images: ImageItem[],
  texts: TextItem[],
  removeIds: ReadonlySet<string>,
): string[] {
  const ids = new Set<string>();
  for (const item of images) {
    if (removeIds.has(item.id) && item.groupId) ids.add(item.groupId);
  }
  for (const item of texts) {
    if (removeIds.has(item.id) && item.groupId) ids.add(item.groupId);
  }
  return [...ids];
}
