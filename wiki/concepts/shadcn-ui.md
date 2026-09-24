# shadcn/ui

## Definition

A collection of React components built on Radix primitives and Tailwind classes,
distributed by **copying source into your repository** rather than by installing a
package. Once copied, the components are ordinary files you own and edit.

## Mental Model

A normal component library is a dependency: you import `<Button>`, you get their
button, and customising it means whatever escape hatches they chose to expose —
theme objects, `sx` props, CSS overrides fighting specificity.

shadcn inverts that. The CLI writes the component's source into your repo and then
leaves. There is no `shadcn` package in `dependencies`, because there is nothing to
depend on.

```
npm library:   node_modules/lib/Button.js   ← theirs, upgrade with npm
shadcn:        src/components/ui/button.tsx ← yours, edit it
```

The trade is ownership for upgrades. Customising is trivial — open the file. Getting
upstream fixes is manual, because nothing tracks the version you copied.

What you *do* depend on is the layer underneath: Radix for behaviour and
accessibility, `cva` for variants, `tailwind-merge` for class conflicts.

## The setup file

`components.json` is config for the CLI, not for the runtime:

```json
{
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": { "config": "", "css": "src/styles/globals.css",
                "baseColor": "neutral", "cssVariables": true },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "@jarvis/ui/components",
    "ui": "@jarvis/ui/components/ui",
    "utils": "@jarvis/ui/lib/utils"
  }
}
```

- `"rsc": false` — no React Server Components; this is a client-rendered SPA.
- `"config": ""` — no `tailwind.config.js`. Tailwind v4 keeps theming in CSS.
- The aliases point at the **package name**, so generated components import
  `@jarvis/ui/lib/utils` and resolve through the exports map rather than by relative
  path. See [[conditional-exports]].

## The function every component runs through

```ts
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

Two libraries, two jobs. `clsx` flattens conditionals into a class string.
`twMerge` then resolves Tailwind conflicts, keeping the last.

That second step is the one that matters. Without it, passing `className="p-8"` to
a component whose base is `p-4` produces `"p-4 p-8"`, and which wins depends on the
order rules appear in the compiled stylesheet — not on the caller. With `twMerge`,
the caller's class wins because it came last. `cn` is what makes `className`
overrides behave the way everyone assumes they already do.

## The component contract

Jarvis's `button.tsx` shows the shape the rest follow:

```tsx
const buttonVariants = cva("inline-flex shrink-0 items-center ...", {
  variants: {
    variant: { default, destructive, outline, secondary, ghost, link },
    size: { default, xs, sm, lg, icon, 'icon-xs', 'icon-sm', 'icon-lg' },
  },
  defaultVariants: { variant: 'default', size: 'default' },
});

function Button({ className, variant, size, asChild = false, ...props }:
  React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> &
  { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'button';
  return (
    <Comp
      data-slot="button" data-variant={variant} data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
```

Four conventions worth carrying into any new component:

**`React.ComponentProps<'button'>`** — accept every native attribute instead of an
invented prop list. `type`, `disabled`, `aria-*`, `onClick` all work without being
declared.

**`VariantProps<typeof buttonVariants>`** — the prop type is *inferred from the cva
config*. Add a variant to the config and the type updates; there is no second list
to keep in sync.

**`asChild` with Radix `Slot`** — render the child element instead of a `<button>`.
This is how a link gets button styling without nesting an `<a>` inside a `<button>`,
which is invalid HTML and breaks keyboard behaviour.

**`data-slot` / `data-variant` / `data-size`** — stable attributes for styling and
test selectors that survive a class-name change.

Exporting `buttonVariants` alongside `Button` lets a caller apply button classes to
something that is not a Button.

## Organising what you own

`@jarvis/ui` splits its components in two:

```
src/components/ui/          20 generated primitives — CLI may overwrite
src/components/             hand-written app components — it will not
```

`ui/` holds `badge`, `button`, `card`, `checkbox`, `dialog`, `dropdown-menu`,
`input`, `label`, `multi-select`, `popover`, `scroll-area`, `select`, `separator`,
`skeleton`, `slider`, `sonner`, `switch`, `tabs`, `textarea`, `tooltip`.

One level up sit `ErrorComponent` and `LoadingSpinner` — composed, application-
specific, not generated.

The split is worth copying. Regenerating a primitive is safe precisely because
nothing hand-written lives in that directory.

Note that `multi-select` is **not** a stock shadcn component — shadcn ships none. It
is hand-written or adapted, and sits in the directory the CLI might overwrite.

## Theming

Tailwind v4, config-less. `globals.css` maps semantic tokens onto CSS variables:

```css
@theme inline {
  --color-background: var(--background);
  --color-primary:    var(--primary);
  --color-destructive: var(--destructive);
}
@custom-variant dark (&:is(.dark *));
```

The indirection (`--color-primary` → `--primary`) is what lets a consumer override
`--primary` alone and have every `bg-primary` follow.

Dark mode is **class-based** (`.dark` on an ancestor), not `prefers-color-scheme`,
so the app can offer an explicit toggle rather than only following the OS. Variants
carry their dark classes inline — `dark:bg-destructive/60` — rather than in a
separate theme file.

## Related Concepts

- [[jarvis-shared-libs]] — `@jarvis/ui` and its siblings
- [[jarvis-frontend]] — The app consuming these components
- [[conditional-exports]] — How `@jarvis/ui/components/*` resolves

## Sources

- [[raw/jarvis/libs/ui/components.json]]
- [[raw/jarvis/libs/ui/package.json]]
- [[raw/jarvis/libs/ui/src/lib/utils.ts]]
- [[raw/jarvis/libs/ui/src/components/ui/button.tsx]]
- [[raw/jarvis/libs/ui/src/components/error-component.tsx]]
- [[raw/jarvis/libs/ui/src/components/loading-spinner.tsx]]
- [[raw/jarvis/libs/ui/src/styles/globals.css]]
- [[raw/jarvis/libs/UI-INVENTORY.md]]

shadcn's distribution model, Radix `Slot`, `cva` and Tailwind v4 conventions are
general knowledge. Of the 20 primitives only `button.tsx` was read in full — the
claim that the others follow the same contract is inference from the shadcn
convention, not a verified reading of each file. `UI-INVENTORY.md` is a map derived
from the same files, not an independent source.
