# @jarvis/ui — Component Inventory

> **Derived document.** Written by reading `libs/ui/package.json`,
> `libs/ui/components.json`, `libs/ui/src/lib/utils.ts`,
> `libs/ui/src/components/ui/button.tsx`, the two custom components, and
> `libs/ui/src/styles/globals.css`. The remaining primitives were inventoried by
> filename, not read in full — noted where that matters.

## What this library is

A **shadcn/ui** component set, vendored into the monorepo. `components.json`
declares the generator config:

```json
{
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": { "baseColor": "neutral", "cssVariables": true },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "@jarvis/ui/components",
    "ui": "@jarvis/ui/components/ui",
    "utils": "@jarvis/ui/lib/utils"
  }
}
```

The distinction that matters: shadcn is **not a dependency**. Components are copied
into `src/` and owned outright — which is why `components.json` exists (so the CLI
can add more later) and why there is no `shadcn` entry in `dependencies`.

`"rsc": false` — no React Server Components. This is a client-rendered SPA.

The aliases point at the **package name**, not relative paths, so newly generated
components import `@jarvis/ui/lib/utils` and resolve through the exports map
described in `LIBS-ARCHITECTURE.md`.

## Dependencies and what each is for

| Package | Role |
|---|---|
| `radix-ui` | Unstyled accessible primitives (the behaviour under dialog, select, tooltip, …) |
| `class-variance-authority` | Declaring variant → class mappings |
| `clsx` + `tailwind-merge` | Conditional classes, then conflict resolution |
| `lucide-react` | Icon set |
| `sonner` | Toast notifications |
| `tw-animate-css` | Animation utilities, imported by `globals.css` |

`react ^19.0.0` is a **peerDependency** — the app owns the React version.

## The two-line function everything depends on

```ts
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

`clsx` flattens conditionals into a class string; `twMerge` then removes Tailwind
conflicts, keeping the last one. Without `twMerge`, passing `className="p-8"` to a
component whose base is `p-4` yields `"p-4 p-8"` and the winner depends on CSS
source order rather than on the caller. `cn` is what makes `className` overrides
behave predictably, and every component routes its classes through it.

## The component contract

`button.tsx`, read in full, shows the pattern the rest follow:

```tsx
const buttonVariants = cva("inline-flex shrink-0 items-center ...", {
  variants: {
    variant: { default, destructive, outline, secondary, ghost, link },
    size: { default, xs, sm, lg, icon, 'icon-xs', 'icon-sm', 'icon-lg' },
  },
  defaultVariants: { variant: 'default', size: 'default' },
});

function Button({ className, variant, size, asChild = false, ...props }:
  React.ComponentProps<'button'> & VariantProps<typeof buttonVariants> &
  { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'button';
  return <Comp data-slot="button" data-variant={variant} data-size={size}
    className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}
```

Four conventions worth carrying to any new component here:

1. **`React.ComponentProps<'button'>`** — the component accepts every native
   attribute rather than an invented prop list.
2. **`VariantProps<typeof buttonVariants>`** — variant names are inferred from the
   `cva` config, so they cannot drift from the class definitions.
3. **`asChild` + Radix `Slot`** — renders the child element instead of a `<button>`,
   so a link can be styled as a button without nesting an `<a>` inside a `<button>`.
4. **`data-slot` / `data-variant` / `data-size`** — stable hooks for styling and for
   test selectors that do not break when class names change.

`buttonVariants` is exported alongside `Button`, so callers can style a non-button
element with button classes.

Variants also carry dark-mode classes inline (`dark:bg-destructive/60`) rather than
in a separate theme file.

## Inventory

**Primitives** — `src/components/ui/` (20 files, inventoried by filename):

`badge` · `button` · `card` · `checkbox` · `dialog` · `dropdown-menu` · `input` ·
`label` · `multi-select` · `popover` · `scroll-area` · `select` · `separator` ·
`skeleton` · `slider` · `sonner` · `switch` · `tabs` · `textarea` · `tooltip`

Largest are `dropdown-menu` (255 lines), `dialog` (132), `select` (118) — the ones
wrapping the most Radix sub-parts.

`multi-select` (88 lines) is **not** a stock shadcn component; shadcn ships no
multi-select. It is either hand-written or adapted, and it is the one primitive most
likely to encode project-specific behaviour. Not read in full here.

**Composed components** — `src/components/` (outside `ui/`):

```tsx
// error-component.tsx — full-page error state
export function ErrorComponent({ title, message, children }:
  { title: string; message: string; children?: ReactNode })
```

```tsx
// loading-spinner.tsx
export function LoadingSpinner() {
  return <div role="status" aria-label="טוען"
    className="size-8 animate-spin rounded-full border-2 border-muted border-t-foreground" />;
}
```

These two sit one level up from `ui/`, which reads as a deliberate split:
`ui/` holds generated primitives that a shadcn CLI update may overwrite, the parent
directory holds hand-written application components that it will not.

Note `aria-label="טוען"` — the accessible label is hard-coded Hebrew, not routed
through any i18n mechanism. Consistent with the bilingual columns in the database
(see `DB-SCHEMA-MAP.md`), the product is Hebrew-facing.

## Styling

`globals.css` uses Tailwind v4 conventions — `@source '..'` for content detection,
`@import 'tw-animate-css'`, `@custom-variant dark (&:is(.dark *))`, and an
`@theme inline` block mapping semantic tokens onto CSS variables:

```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  ...
}
```

There is **no `tailwind.config.js`** — `components.json` has `"tailwind": { "config": "" }`,
confirming config-less Tailwind v4 where theming lives in CSS.

Dark mode is class-based (`.dark` ancestor), not `prefers-color-scheme`, so the app
can offer an explicit toggle.

The two-layer indirection (`--color-primary` → `--primary`) is what lets a consumer
override `--primary` alone and have every `bg-primary` follow.

## Not read in full

The 19 primitives other than `button`, and `globals.css` beyond its first 20 lines.
The claim that they follow the button pattern is an inference from the shadcn
convention plus `components.json`, not a verified reading of each file.
`multi-select` in particular should be read before relying on it.

## Files read

- `libs/ui/package.json`, `libs/ui/components.json`
- `libs/ui/src/lib/utils.ts`
- `libs/ui/src/components/ui/button.tsx`
- `libs/ui/src/components/error-component.tsx`
- `libs/ui/src/components/loading-spinner.tsx`
- `libs/ui/src/styles/globals.css` (first 20 lines)
- remaining `src/components/ui/*.tsx` inventoried by filename and line count only
