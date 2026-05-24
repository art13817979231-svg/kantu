import type { ImageGroup } from "../types/project";

export type ImageGroupKind = "cluster" | "frame";

export function getGroupKind(group: ImageGroup): ImageGroupKind {
  return group.kind === "cluster" ? "cluster" : "frame";
}

export function isClusterGroup(group: ImageGroup): boolean {
  return getGroupKind(group) === "cluster";
}

export function isFrameGroup(group: ImageGroup): boolean {
  return getGroupKind(group) === "frame";
}

export function isClusterMember(
  groupId: string | null,
  groups: ImageGroup[],
): boolean {
  if (!groupId) return false;
  const g = groups.find((x) => x.id === groupId);
  return g ? isClusterGroup(g) : false;
}
