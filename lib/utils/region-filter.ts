import { GYM_REGION_TREE } from "@/lib/constants/regions";
import type { TreeNode } from "@/components/TreeMultiSelect";

export type RegionFilterOption = {
  value: string;
  label: string;
  provinceLabel: string;
};

function collectRegionOptions(nodes: TreeNode[]): RegionFilterOption[] {
  const options: RegionFilterOption[] = [];

  for (const node of nodes) {
    if (node.value) {
      options.push({
        value: node.value,
        label: node.label,
        provinceLabel: node.label,
      });
    }

    if (node.children?.length) {
      const provinceLabel = node.label;
      for (const child of node.children) {
        if (!child.value) continue;
        options.push({
          value: child.value,
          label: child.label,
          provinceLabel,
        });
      }
    }
  }

  return options;
}

export const GYM_REGION_FILTER_OPTIONS = collectRegionOptions(GYM_REGION_TREE);

export function formatRegionFilterLabel(value: string | null | undefined): string | null {
  if (!value) return null;

  const match = GYM_REGION_FILTER_OPTIONS.find((option) => option.value === value);
  if (!match) return value;

  if (match.label.endsWith(" 전체")) {
    return match.label;
  }

  return match.value;
}

export function getProvinceNodes(): readonly TreeNode[] {
  return GYM_REGION_TREE;
}

export function getDistrictOptionsForProvince(
  provinceId: string,
): readonly TreeNode[] {
  const province = GYM_REGION_TREE.find((node) => node.id === provinceId);
  return province?.children ?? [];
}

export function findProvinceIdForRegion(value: string | null | undefined): string | null {
  if (!value) return null;

  for (const province of GYM_REGION_TREE) {
    if (province.value === value) return province.id;

    for (const child of province.children ?? []) {
      if (child.value === value) return province.id;
    }
  }

  return null;
}
