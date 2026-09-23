import { ChevronDownIcon } from 'lucide-react';

import { cn } from '../../lib/utils.js';
import { Badge } from './badge.js';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from './dropdown-menu.js';

export type MultiSelectOption = {
  value: string;
  label: string;
};

function MultiSelect({
  options,
  value,
  onValueChange,
  placeholder,
  className,
  disabled,
}: {
  options: readonly MultiSelectOption[];
  value: readonly string[];
  onValueChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}) {
  const selectedOptions = options.filter((option) =>
    value.includes(option.value),
  );

  function toggle(optionValue: string) {
    onValueChange(
      value.includes(optionValue)
        ? value.filter((selected) => selected !== optionValue)
        : [...value, optionValue],
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        data-slot="multi-select-trigger"
        disabled={disabled}
        className={cn(
          "flex min-h-8 w-full flex-wrap items-center gap-1 rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none data-[placeholder]:text-muted-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground",
          'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
      >
        <span className="flex flex-1 flex-wrap items-center gap-1 text-start">
          {selectedOptions.length === 0 ? (
            <span className="text-muted-foreground">{placeholder}</span>
          ) : (
            selectedOptions.map((option) => (
              <Badge key={option.value} variant="secondary">
                {option.label}
              </Badge>
            ))
          )}
        </span>
        <ChevronDownIcon className="opacity-[0.88]" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="min-w-[var(--radix-dropdown-menu-trigger-width)]"
      >
        {options.map((option) => (
          <DropdownMenuCheckboxItem
            key={option.value}
            checked={value.includes(option.value)}
            onSelect={(event) => event.preventDefault()}
            onCheckedChange={() => toggle(option.value)}
          >
            {option.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { MultiSelect };
