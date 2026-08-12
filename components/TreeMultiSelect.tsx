"use client";

import { useState } from "react";

export type TreeNode = {
  id: string;
  label: string;
  value?: string;
  children?: readonly TreeNode[];
};

type TreeMultiSelectProps = {
  label: string;
  labelNote?: string;
  hint?: string;
  required?: boolean;
  nodes: readonly TreeNode[];
  values: string[];
  onChange: (values: string[]) => void;
  exclusiveValue?: string;
  /** true면 하나만 선택 가능 */
  single?: boolean;
};

function collectSelectableValues(nodes: readonly TreeNode[]): string[] {
  return nodes.flatMap((node) => {
    const own = node.value ? [node.value] : [];
    const nested = node.children ? collectSelectableValues(node.children) : [];
    return [...own, ...nested];
  });
}

function countSelectedInSubtree(node: TreeNode, values: string[]): number {
  let count = node.value && values.includes(node.value) ? 1 : 0;
  if (node.children) {
    for (const child of node.children) {
      count += countSelectedInSubtree(child, values);
    }
  }
  return count;
}

function findPathToValue(
  nodes: readonly TreeNode[],
  targetValue: string,
  path: TreeNode[] = [],
): TreeNode[] | null {
  for (const node of nodes) {
    const currentPath = [...path, node];
    if (node.value === targetValue) return currentPath;
    if (node.children) {
      const found = findPathToValue(node.children, targetValue, currentPath);
      if (found) return found;
    }
  }
  return null;
}

type TreeNodeRowProps = {
  node: TreeNode;
  depth: number;
  openIds: string[];
  values: string[];
  onToggleOpen: (id: string) => void;
  onToggleValue: (value: string) => void;
};

function TreeNodeRow({
  node,
  depth,
  openIds,
  values,
  onToggleOpen,
  onToggleValue,
}: TreeNodeRowProps) {
  const hasChildren = !!node.children?.length;
  const isOpen = openIds.includes(node.id);
  const isSelectable = !!node.value;
  const selected = isSelectable && values.includes(node.value!);
  const selectedInSubtree = hasChildren ? countSelectedInSubtree(node, values) : 0;

  return (
    <>
      <div
        className="flex items-center gap-1 py-1"
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => onToggleOpen(node.id)}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-xs text-zinc-500 hover:bg-zinc-100"
            aria-expanded={isOpen}
            aria-label={`${node.label} 펼치기`}
          >
            {isOpen ? "▼" : "▶"}
          </button>
        ) : (
          <span className="h-6 w-6 shrink-0" />
        )}

        {isSelectable ? (
          <button
            type="button"
            onClick={() => onToggleValue(node.value!)}
            className={`min-w-0 flex-1 rounded-lg px-2 py-1.5 text-left text-sm transition ${
              selected
                ? "bg-orange-600 font-medium text-white"
                : "text-zinc-700 hover:bg-orange-50"
            }`}
          >
            {node.label}
          </button>
        ) : (
          <span className="min-w-0 flex-1 px-2 py-1.5 text-sm font-semibold text-zinc-900">
            {node.label}
            {selectedInSubtree > 0 && (
              <span className="ml-2 text-xs font-normal text-orange-600">
                {selectedInSubtree}개 선택
              </span>
            )}
          </span>
        )}
      </div>

      {hasChildren &&
        isOpen &&
        node.children!.map((child) => (
          <TreeNodeRow
            key={child.id}
            node={child}
            depth={depth + 1}
            openIds={openIds}
            values={values}
            onToggleOpen={onToggleOpen}
            onToggleValue={onToggleValue}
          />
        ))}
    </>
  );
}

export function TreeMultiSelect({
  label,
  labelNote,
  hint,
  required,
  nodes,
  values,
  onChange,
  exclusiveValue,
  single = false,
}: TreeMultiSelectProps) {
  const [openIds, setOpenIds] = useState<string[]>([]);

  function toggleOpen(id: string) {
    setOpenIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  function collapsePathToValue(value: string) {
    const path = findPathToValue(nodes, value);
    if (!path || path.length <= 1) return;

    const ancestorIds = path.slice(0, -1).map((node) => node.id);
    setOpenIds((current) =>
      current.filter((id) => !ancestorIds.includes(id)),
    );
  }

  function toggleValue(value: string) {
    if (single) {
      const isRemoving = values.includes(value);
      onChange(isRemoving ? [] : [value]);
      if (!isRemoving) collapsePathToValue(value);
      return;
    }

    if (exclusiveValue && value === exclusiveValue) {
      const isRemoving = values.includes(exclusiveValue);
      onChange(isRemoving ? [] : [exclusiveValue]);
      if (!isRemoving) collapsePathToValue(value);
      return;
    }

    const withoutExclusive = exclusiveValue
      ? values.filter((item) => item !== exclusiveValue)
      : values;

    if (withoutExclusive.includes(value)) {
      onChange(withoutExclusive.filter((item) => item !== value));
      return;
    }

    onChange([...withoutExclusive, value]);
    collapsePathToValue(value);
  }

  const selectedValues = collectSelectableValues(nodes).filter((value) =>
    values.includes(value),
  );
  const selectedCount = selectedValues.length;

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm font-semibold text-zinc-900">
        <span>
          {label}
          {required && <span className="text-orange-600"> *</span>}
        </span>
        {labelNote && (
          <span className="ml-2 text-xs font-normal text-zinc-600">
            {labelNote}
          </span>
        )}
      </legend>
      {hint && <p className="text-xs text-zinc-600">{hint}</p>}

      {selectedCount > 0 && (
        <p className="text-xs font-medium text-orange-700">
          {single ? `선택: ${selectedValues[0]}` : `${selectedCount}개 선택됨`}
        </p>
      )}

      <div className="rounded-xl border border-zinc-200 bg-white py-2">
        {nodes.map((node) => (
          <TreeNodeRow
            key={node.id}
            node={node}
            depth={0}
            openIds={openIds}
            values={values}
            onToggleOpen={toggleOpen}
            onToggleValue={toggleValue}
          />
        ))}
      </div>
    </fieldset>
  );
}
