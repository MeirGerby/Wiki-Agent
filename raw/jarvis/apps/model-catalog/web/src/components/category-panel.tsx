import { Button } from '@jarvis/ui/components/ui/button';
import { Card } from '@jarvis/ui/components/ui/card';
import { Checkbox } from '@jarvis/ui/components/ui/checkbox';
import { Label } from '@jarvis/ui/components/ui/label';
import { ScrollArea } from '@jarvis/ui/components/ui/scroll-area';
import { Separator } from '@jarvis/ui/components/ui/separator';
import { cn } from '@jarvis/ui/lib/utils';
import { useState } from 'react';
import type { Category } from '@jarvis/model-catalog-contract';
import chevronRightIcon from '../assets/chevron-right.svg';
import { Icon } from './icon';

type CategoryPanelProps = {
  categories: readonly Category[];
  selected: ReadonlySet<string>;
  onToggle: (id: string) => void;
  onToggleAll: (selectAll: boolean) => void;
};

export function CategoryPanel({
  categories,
  selected,
  onToggle,
  onToggleAll,
}: CategoryPanelProps) {
  const [collapsed, setCollapsed] = useState(false);

  const allSelected =
    categories.length > 0 && selected.size === categories.length;

  return (
    <Card
      className={cn(
        'shrink-0 gap-4 overflow-hidden rounded-card border-line-subtle py-4 transition-[width] duration-200 ease-in-out',
        collapsed ? 'w-14' : 'w-[270px]',
      )}
    >
      <div className="flex items-center justify-between px-4">
        <div
          className={cn(
            'overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-200 ease-in-out',
            collapsed ? 'max-w-0 opacity-0' : 'max-w-[180px] opacity-100',
          )}
        >
          <h2 className="text-xl font-bold">קטגוריות</h2>
        </div>

        <Button
          variant="outline"
          size="icon-xs"
          onClick={() => setCollapsed((prev) => !prev)}
        >
          <Icon
            src={chevronRightIcon}
            label={collapsed ? 'הרחב קטגוריות' : 'כווץ קטגוריות'}
            size={12}
            className={cn(
              'transition-transform duration-200',
              collapsed && 'rotate-180',
            )}
          />
        </Button>
      </div>

      <ScrollArea
        inert={collapsed || undefined}
        className={cn(
          'min-h-0 flex-1 px-4 transition-opacity duration-150',
          collapsed ? 'opacity-0' : 'opacity-100',
        )}
      >
        <div className="flex flex-col gap-1">
          <CategoryRow
            id="all"
            label="בחר הכל"
            checked={
              allSelected ? true : selected.size > 0 ? 'indeterminate' : false
            }
            onChange={() => onToggleAll(!allSelected)}
          />

          <Separator className="my-1 bg-line-subtle" />

          {categories.map((category) => (
            <CategoryRow
              key={category.englishName}
              id={category.englishName}
              label={category.hebrewName}
              checked={selected.has(category.englishName)}
              onChange={() => onToggle(category.englishName)}
            />
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}

type CategoryRowProps = {
  id: string;
  label: string;
  checked: boolean | 'indeterminate';
  onChange: () => void;
};

function CategoryRow({ id, label, checked, onChange }: CategoryRowProps) {
  const inputId = `category-${id}`;

  return (
    <div className="flex items-center gap-2 rounded-card px-1 py-1 hover:bg-accent">
      <Checkbox id={inputId} checked={checked} onCheckedChange={onChange} />
      <Label htmlFor={inputId} className="flex-1 cursor-pointer font-normal">
        {label}
      </Label>
    </div>
  );
}
