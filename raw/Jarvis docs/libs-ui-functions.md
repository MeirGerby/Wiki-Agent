# libs/ui: functions reference

`libs/ui` (`@jarvis/ui`) is the shared React component library, built on Radix UI primitives, Tailwind and `class-variance-authority`. It follows the shadcn/ui pattern.

Almost every component is a thin wrapper. It adds project styling and a `data-slot` attribute, and passes all other props through to the Radix element. Only the components with real logic are described in detail.

This covers every non-spec, non-story source file under `src/`.

## lib/

### `lib/utils.ts`
- `cn(...inputs)`: merges class names. It resolves conditionals with `clsx`, then removes conflicting Tailwind classes with `tailwind-merge`, so the last one wins. Used by every component.

## Shared components

### `components/error-component.tsx`
- `ErrorComponent({ title, message, className, children })`: a centered full-screen error block with a title, a muted message and optional children, such as a retry button.

### `components/loading-spinner.tsx`
- `LoadingSpinner()`: a spinning circle with `role="status"` and a Hebrew "טוען" label.

## Components with logic

### `components/ui/multi-select.tsx`
- `MultiSelect({ options, value, onValueChange, placeholder, className, disabled })`: a dropdown of checkbox items. The trigger shows the chosen options as badges, or the placeholder.
  - `toggle(optionValue)` (internal): adds the value if absent, removes it if present, and calls `onValueChange`.
  - Items call `preventDefault` on select, so the menu stays open while you tick several.
  - Also exports the `MultiSelectOption` type (`{ value, label }`).

### `components/ui/searchable-multi-select-option-list.tsx`
- `SearchableMultiSelectOptionList({ options, selectedValues, onToggle, listLabel, searchPlaceholder, emptyText })`: a search box above a virtualized checkbox list, built for long option lists inside a popover.
  - Filters options by a case-insensitive label match.
  - Renders only visible rows with `@tanstack/react-virtual` (32 px rows, a list height of up to 5 rows).
  - Internal functions:
    - `changeSearch`: updates the search, resets the active row to 0 and scrolls to the top.
    - `moveActive(index)`: moves the active row within bounds, scrolls it into view and focuses it. If the row isn't rendered yet, it remembers the index in `pendingFocusIndexRef`.
    - `focusIfPending(row, index)`: ref callback that focuses a row once it renders, if it was waiting.
    - `handleOptionKeyDown`: ArrowDown moves down. ArrowUp moves up, or back to the search box from the first row. Enter or Space toggles the option.
  - In the search box, ArrowDown jumps to the first row.
  - Uses ARIA `listbox` / `option` roles, with a roving `tabIndex`.

### `components/ui/slider.tsx`
- `Slider({ className, defaultValue, value, min = 0, max = 100, ...props })`: a Radix slider. It renders one thumb per value, so the same component works for single and range sliders. With no value or default it assumes a two-thumb range of `[min, max]`.

### `components/ui/scroll-area.tsx`
- `ScrollArea`: a Radix scroll area with a viewport, a vertical scrollbar and a corner.
- `ScrollBar({ orientation = 'vertical' })`: a styled scrollbar and thumb. It supports vertical and horizontal.

### `components/ui/sonner.tsx`
- `Toaster(props)`: the `sonner` toast container, forced to the light theme. It maps the toast colors to the app's `--popover`, `--popover-foreground` and `--border` CSS variables.

### `components/ui/checkbox.tsx`
- `Checkbox`: a Radix checkbox. It shows a minus icon when `checked` is `'indeterminate'`, and a check icon otherwise.

### `components/ui/tooltip.tsx`
- `TooltipProvider({ delayDuration = 0 })`: the provider, with no show delay by default.
- `Tooltip`, `TooltipTrigger`, `TooltipContent`: Radix wrappers. The content is styled and portaled.

## Variant-based components

### `components/ui/button.tsx`
- `buttonVariants`: the `cva` style map.
  - Variants: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`.
  - Sizes: `default`, `xs`, `sm`, `lg`, `icon`, `icon-xs`, `icon-sm`, `icon-lg`.
- `Button({ variant, size, asChild, ... })`: a button. With `asChild` it renders its child, for example a router `Link`, with the button styling.

### `components/ui/badge.tsx`
- `badgeVariants`: the style map with variants `default`, `secondary`, `destructive`, `outline`, `ghost` and `link`.
- `Badge({ variant, asChild, ... })`: a pill-shaped label that can render as another element via `asChild`.

### `components/ui/tabs.tsx`
- `tabsListVariants`: style map with `default` (muted background) and `line` (underline style).
- `Tabs`, `TabsList({ variant })`, `TabsTrigger`, `TabsContent`: Radix tabs wrappers.

## Simple wrappers (styling only)

Each of these wraps one Radix or HTML element, with a `data-slot` and project classes.

- **Card (`card.tsx`)**: `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardAction`, `CardContent`, `CardFooter`. Plain `div` building blocks.
- **Dialog (`dialog.tsx`)**:
  - `Dialog`, `DialogTrigger`, `DialogPortal`, `DialogClose`, `DialogOverlay`: pass-through wrappers.
  - `DialogContent`: a centered, animated modal panel, up to 535 px wide and 90vh tall.
  - `DialogHeader`, `DialogFooter`: layout `div`s.
  - `DialogTitle`, `DialogDescription`: text elements.
- **Select (`select.tsx`)**: `Select`, `SelectGroup`, `SelectValue`, `SelectItem`.
  - `SelectTrigger({ size: 'sm' | 'default' })`: includes a chevron that rotates when open.
  - `SelectContent`: the dropdown panel.
- **Dropdown menu (`dropdown-menu.tsx`)**: `DropdownMenu`, `DropdownMenuPortal`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuGroup`, `DropdownMenuItem`, `DropdownMenuCheckboxItem`, `DropdownMenuRadioGroup`, `DropdownMenuRadioItem`, `DropdownMenuLabel`, `DropdownMenuSeparator`, `DropdownMenuShortcut`, `DropdownMenuSub`, `DropdownMenuSubTrigger`, `DropdownMenuSubContent`.
- **Popover (`popover.tsx`)**: `Popover`, `PopoverTrigger`, `PopoverContent`.
- **Form controls**:
  - `Input` (`input.tsx`).
  - `Textarea` (`textarea.tsx`).
  - `Label` (`label.tsx`).
  - `Switch` (`switch.tsx`).
- **Misc**:
  - `Separator` (`separator.tsx`).
  - `Skeleton` (`skeleton.tsx`): a pulsing placeholder block.
