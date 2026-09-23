import { Badge } from '@jarvis/ui/components/ui/badge';
import { Checkbox } from '@jarvis/ui/components/ui/checkbox';
import { Input } from '@jarvis/ui/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@jarvis/ui/components/ui/popover';
import { cn } from '@jarvis/ui/lib/utils';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ChevronDownIcon, SearchIcon } from 'lucide-react';
import {
  type KeyboardEvent,
  type RefObject,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

export type TaggingClassOption = { value: string; label: string };

const ROW_HEIGHT_PX = 32;
const MAX_VISIBLE_ROWS = 5;

const TRIGGER_CLASS = cn(
  "flex min-h-8 w-full flex-wrap items-center gap-1 rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground",
  'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
  'disabled:cursor-not-allowed disabled:opacity-50',
);

const OPTION_CLASS =
  'absolute inset-x-0 top-0 flex cursor-pointer items-center gap-2 rounded-sm px-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground';

type TaggingClassesMultiSelectProps = {
  options: readonly TaggingClassOption[];
  value: readonly string[];
  onValueChange: (value: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
  disabled?: boolean;
};

export function TaggingClassesMultiSelect({
  options,
  value,
  onValueChange,
  placeholder,
  searchPlaceholder,
  emptyText,
  className,
  disabled,
}: TaggingClassesMultiSelectProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const selectedValues = useMemo(() => new Set(value), [value]);
  const selectedOptions = useMemo(
    () => options.filter((option) => selectedValues.has(option.value)),
    [options, selectedValues],
  );

  function toggle(optionValue: string) {
    onValueChange(
      selectedValues.has(optionValue)
        ? value.filter((selected) => selected !== optionValue)
        : [...value, optionValue],
    );
  }

  return (
    <Popover>
      <PopoverTrigger
        data-slot="tagging-classes-trigger"
        disabled={disabled}
        className={cn(TRIGGER_CLASS, className)}
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
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="bottom"
        avoidCollisions={false}
        className="flex w-(--radix-popover-trigger-width) flex-col gap-2 p-2"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          searchInputRef.current?.focus();
        }}
      >
        <SearchableOptionList
          options={options}
          selectedValues={selectedValues}
          onToggle={toggle}
          searchInputRef={searchInputRef}
          listLabel={placeholder}
          searchPlaceholder={searchPlaceholder}
          emptyText={emptyText}
        />
      </PopoverContent>
    </Popover>
  );
}

function SearchableOptionList({
  options,
  selectedValues,
  onToggle,
  searchInputRef,
  listLabel,
  searchPlaceholder,
  emptyText,
}: {
  options: readonly TaggingClassOption[];
  selectedValues: ReadonlySet<string>;
  onToggle: (value: string) => void;
  searchInputRef: RefObject<HTMLInputElement | null>;
  listLabel?: string;
  searchPlaceholder?: string;
  emptyText?: string;
}) {
  const [search, setSearch] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const pendingFocusIndexRef = useRef<number | null>(null);

  const filteredOptions = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query === ''
      ? options
      : options.filter((option) => option.label.toLowerCase().includes(query));
  }, [options, search]);

  const rowVirtualizer = useVirtualizer({
    count: filteredOptions.length,
    getScrollElement: () => listRef.current,
    estimateSize: () => ROW_HEIGHT_PX,
    overscan: MAX_VISIBLE_ROWS,
  });

  useEffect(() => {
    setActiveIndex(0);
    rowVirtualizer.scrollToIndex(0, { align: 'start' });
  }, [filteredOptions, rowVirtualizer]);

  function moveActive(nextIndex: number) {
    const index = Math.max(0, Math.min(nextIndex, filteredOptions.length - 1));
    setActiveIndex(index);
    rowVirtualizer.scrollToIndex(index, { align: 'auto' });
    const row = listRef.current?.querySelector<HTMLElement>(
      `[data-index="${index}"]`,
    );
    if (row) {
      row.focus();
    } else {
      pendingFocusIndexRef.current = index;
    }
  }

  function focusIfPending(row: HTMLDivElement | null, index: number) {
    if (row && pendingFocusIndexRef.current === index) {
      row.focus();
      pendingFocusIndexRef.current = null;
    }
  }

  function handleOptionKeyDown(
    event: KeyboardEvent<HTMLDivElement>,
    optionValue: string,
  ) {
    switch (event.key) {
      case 'ArrowDown':
        moveActive(activeIndex + 1);
        break;
      case 'ArrowUp':
        if (activeIndex === 0) {
          searchInputRef.current?.focus();
        } else {
          moveActive(activeIndex - 1);
        }
        break;
      case 'Enter':
      case ' ':
        onToggle(optionValue);
        break;
      default:
        return;
    }
    event.preventDefault();
  }

  return (
    <>
      <div className="relative shrink-0">
        <Input
          ref={searchInputRef}
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              moveActive(0);
            }
          }}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
          className="h-8 pe-8 text-sm"
        />
        <SearchIcon className="pointer-events-none absolute end-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      </div>
      {filteredOptions.length === 0 ? (
        <p className="px-2 py-1.5 text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <div
          ref={listRef}
          role="listbox"
          aria-multiselectable="true"
          aria-label={listLabel}
          className="overflow-y-auto"
          style={{
            height:
              Math.min(filteredOptions.length, MAX_VISIBLE_ROWS) *
              ROW_HEIGHT_PX,
            maxHeight: 'var(--radix-popover-content-available-height)',
          }}
        >
          <div
            className="relative w-full"
            style={{ height: rowVirtualizer.getTotalSize() }}
          >
            {rowVirtualizer
              .getVirtualItems()
              .map(({ key, index, size, start }) => {
                const option = filteredOptions[index];
                const checked = selectedValues.has(option.value);
                return (
                  <div
                    key={key}
                    data-index={index}
                    ref={(row) => focusIfPending(row, index)}
                    role="option"
                    aria-selected={checked}
                    tabIndex={index === activeIndex ? 0 : -1}
                    onFocus={() => setActiveIndex(index)}
                    onClick={() => onToggle(option.value)}
                    onKeyDown={(event) =>
                      handleOptionKeyDown(event, option.value)
                    }
                    className={OPTION_CLASS}
                    style={{
                      height: size,
                      transform: `translateY(${start}px)`,
                    }}
                  >
                    <Checkbox
                      checked={checked}
                      tabIndex={-1}
                      aria-hidden="true"
                      className="pointer-events-none"
                    />
                    {option.label}
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </>
  );
}
