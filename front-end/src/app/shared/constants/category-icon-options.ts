export interface CategoryIconOption {
  value: string;
  label: string;
}

export const CATEGORY_ICON_OPTIONS: CategoryIconOption[] = [
  { value: 'devices', label: 'Eletrônicos' },
  { value: 'computer', label: 'Informática / Desktop' },
  { value: 'laptop', label: 'Notebook' },
  { value: 'print', label: 'Impressora' },
  { value: 'mouse', label: 'Mouse' },
  { value: 'keyboard', label: 'Teclado' },
  { value: 'kitchen', label: 'Eletrodomésticos' },
  { value: 'router', label: 'Redes' },
  { value: 'build', label: 'Mecânica' },
];

const LEGACY_ICON_MAP: Record<string, string> = {
  notebook: 'laptop',
  desktop: 'computer',
  impressora: 'print',
  teclado: 'keyboard',
};

export function normalizeCategoryIcon(icon: string | null | undefined): string {
  if (!icon) {
    return 'devices';
  }

  return LEGACY_ICON_MAP[icon] ?? icon;
}
