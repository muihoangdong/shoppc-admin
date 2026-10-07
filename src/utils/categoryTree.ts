import { Category } from '../types';

export interface CategoryNode extends Category {
  children: CategoryNode[];
}

/**
 * Dựng cây danh mục từ danh sách phẳng (nhiều cấp). Dữ liệu hỏng (vòng lặp cha-con) không làm treo giao diện:
 * các nút không với tới được từ gốc được tách ra thành gốc riêng.
 */
export const buildTree = (categories: Category[]): CategoryNode[] => {
  const byId = new Map<number, CategoryNode>(categories.map((c) => [c.id, { ...c, children: [] }]));
  const roots: CategoryNode[] = [];

  byId.forEach((node) => {
    const parent = node.parent_id ? byId.get(node.parent_id) : undefined;
    if (parent && parent.id !== node.id) parent.children.push(node);
    else roots.push(node);
  });

  const seen = new Set<number>();
  const visit = (node: CategoryNode) => {
    if (seen.has(node.id)) return;
    seen.add(node.id);
    node.children.forEach(visit);
  };
  roots.forEach(visit);

  byId.forEach((node) => {
    if (seen.has(node.id)) return;
    const parent = node.parent_id ? byId.get(node.parent_id) : undefined;
    if (parent) parent.children = parent.children.filter((c) => c.id !== node.id); // cắt vòng lặp
    roots.push(node);
    visit(node);
  });

  return roots;
};

/** Id của danh mục và toàn bộ con cháu của nó (để không cho chọn làm "danh mục cha" của chính mình). */
export const selfAndDescendants = (categories: Category[], id: number): Set<number> => {
  const result = new Set<number>([id]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const c of categories) {
      if (c.parent_id && result.has(c.parent_id) && !result.has(c.id)) {
        result.add(c.id);
        grew = true;
      }
    }
  }
  return result;
};

export interface CategoryOption {
  id: number;
  label: string;
  type: Category['type'];
}

/** Danh sách phẳng có thụt đầu dòng theo cấp để dùng trong ô chọn. */
export const flattenForSelect = (tree: CategoryNode[], excluded: Set<number> = new Set()): CategoryOption[] => {
  const out: CategoryOption[] = [];
  const walk = (nodes: CategoryNode[], depth: number) => {
    for (const n of nodes) {
      if (excluded.has(n.id)) continue;
      out.push({ id: n.id, label: `${'— '.repeat(depth)}${n.name}`, type: n.type });
      walk(n.children, depth + 1);
    }
  };
  walk(tree, 0);
  return out;
};
