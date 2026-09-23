# TypeScript Configuration Reference

This document consolidates all TypeScript compiler options from across the workspace.

## Root Level Configuration

### Main Structure (tsconfig.json)

```json
{
  "extends": "./tsconfig.base.json",
  "compileOnSave": false,
  "files": [],
  "references": []
}
```

- **extends** — Inherits all compiler options from the base config to avoid duplication
- **compileOnSave** — Disables automatic compilation on file save in supported IDEs
- **files** — Empty; files are referenced through project references instead
- **references** — Points to project references for composite builds

---

## Base Configuration (tsconfig.base.json)

All projects inherit from this. It defines the strict, unified settings for the entire workspace.

### Compiler Options

#### Strictness & Type Safety
- **strict: true** — Enables all strict type-checking options (recommended for modern TS projects)
- **noImplicitOverride: true** — Requires explicit `override` keyword when overriding base class methods
- **noImplicitReturns: true** — Errors if function doesn't return a value on all code paths
- **noFallthroughCasesInSwitch: true** — Errors if a switch case lacks break or return
- **noUnusedLocals: true** — Errors on unused local variables
- **noUncheckedSideEffectImports: false** — Allows imports without type checking for packages with side effects

#### Module & Resolution
- **module: esnext** — Outputs modern ES module syntax (tree-shaking friendly)
- **target: es2022** — Targets ES2022 JavaScript features
- **moduleResolution: bundler** — Uses bundler-friendly resolution (prefers `exports` over `main` in package.json)
- **customConditions: ["@jarvis/source"]** — Resolves workspace packages directly to `.ts` source files (skips `dist/` during dev)

#### Compilation & Emit
- **composite: true** — Enables project references for incremental builds
- **emitDeclarationOnly: true** — Only emits `.d.ts` files, no JS output
- **declarationMap: true** — Generates source maps for `.d.ts` files (IDE navigation)
- **importHelpers: true** — Reuses helper functions from `tslib` instead of inlining them
- **isolatedModules: true** — Each file is compiled independently; safer for transpilers

#### Library & Typing
- **lib: ["es2022"]** — Includes type definitions for ES2022 APIs
- **types: ["*"]** — Includes all available type definitions
- **skipLibCheck: true** — Skips type-checking of declaration files (faster builds)

---

## App-Level Configurations

### BFF (Backend For Frontend) - apps/model-catalog/bff/tsconfig.app.json

```json
{
  "extends": "../../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "tsBuildInfoFile": "dist/tsconfig.app.tsbuildinfo",
    "composite": false,
    "declaration": false,
    "declarationMap": false,
    "emitDeclarationOnly": false,
    "types": ["node"]
  },
  "include": ["src/**/*.ts"],
  "exclude": ["dist"]
}
```

- **outDir** — Output JavaScript goes to `dist/`
- **rootDir** — Input source files are in `src/`
- **tsBuildInfoFile** — Incremental build info stored here for faster rebuilds
- **composite: false** — Not a library; doesn't generate declaration files for consumption
- **types: ["node"]** — Includes Node.js type definitions (server-side APIs)

---

### Web (Frontend) - apps/model-catalog/web/tsconfig.app.json

```json
{
  "extends": "../../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "tsBuildInfoFile": "dist/tsconfig.app.tsbuildinfo",
    "jsx": "react-jsx",
    "lib": ["dom"],
    "module": "esnext",
    "moduleResolution": "bundler",
    "composite": false,
    "declaration": false,
    "declarationMap": false,
    "emitDeclarationOnly": false,
    "types": ["node", "@nx/react/typings/cssmodule.d.ts", "@nx/react/typings/image.d.ts", "vite/client"]
  },
  "include": ["src/**/*.js", "src/**/*.jsx", "src/**/*.ts", "src/**/*.tsx"],
  "exclude": ["out-tsc", "dist", "src/**/*.spec.*", "src/**/*.test.*"]
}
```

- **jsx: react-jsx** — Uses React 17+ JSX transform (no need to import React)
- **lib: ["dom"]** — Includes browser/DOM type definitions
- **types** — Includes CSS module, image, and Vite client types for build tooling
- **exclude** — Omits test files and previous build output from compilation

---

### Contract (Shared Types) - apps/model-catalog/contract/tsconfig.lib.json

```json
{
  "extends": "../../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist",
    "tsBuildInfoFile": "dist/tsconfig.lib.tsbuildinfo",
    "emitDeclarationOnly": false,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*.ts"]
}
```

- **forceConsistentCasingInFileNames: true** — Errors if imports use inconsistent casing (helps cross-platform builds)
- **emitDeclarationOnly: false** — Outputs both `.d.ts` and `.js` for library consumption

---

## Library Configurations

### Database Library - libs/db/tsconfig.lib.json

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist",
    "tsBuildInfoFile": "dist/tsconfig.lib.tsbuildinfo",
    "emitDeclarationOnly": false,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*.ts"],
  "references": []
}
```

- Shared database schemas and utilities
- No references to other libs (stands alone)

---

### Logging Library - libs/logging/tsconfig.lib.json

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist",
    "tsBuildInfoFile": "dist/tsconfig.lib.tsbuildinfo",
    "emitDeclarationOnly": false,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*.ts"],
  "references": []
}
```

- Shared logging utilities (no other dependencies)

---

### UI Library - libs/ui/tsconfig.lib.json

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist",
    "tsBuildInfoFile": "dist/tsconfig.lib.tsbuildinfo",
    "emitDeclarationOnly": false,
    "forceConsistentCasingInFileNames": true,
    "jsx": "react-jsx",
    "lib": ["es2022", "dom"],
    "types": ["react"],
    "paths": {
      "@jarvis/ui/*": ["./src/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"],
  "references": []
}
```

- **jsx: react-jsx** — React component library
- **lib: ["es2022", "dom"]** — Both ES2022 and browser APIs
- **paths** — Allows importing from `@jarvis/ui/*` directly (aliased to `src/*`)

---

## Tooling Configuration

### NX Plugin - tools/nx-plugin/tsconfig.json

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "composite": false,
    "declaration": false,
    "declarationMap": false,
    "emitDeclarationOnly": false,
    "noEmit": true,
    "module": "commonjs",
    "moduleResolution": "node10",
    "customConditions": [],
    "types": ["node"]
  },
  "include": ["src/**/*.ts"],
  "exclude": ["src/generators/context/files/**"]
}
```

- **noEmit: true** — Only type-checks; doesn't generate output (Nx build system handles output)
- **module: commonjs** — Node.js generators use CommonJS
- **moduleResolution: node10** — Uses Node.js module resolution (generators are run by Node)
- **customConditions: []** — Clears the `@jarvis/source` condition (uses built files)

---

## Configuration Files & References

### Pattern: tsconfig.json (in each project root)

```json
{
  "extends": "../../../tsconfig.base.json",
  "files": [],
  "include": [],
  "references": [
    { "path": "./tsconfig.lib.json" } // or tsconfig.app.json
  ],
  "compilerOptions": {
    "composite": false
  }
}
```

- **files: []** and **include: []** — Empty; delegates to the referenced config
- **references** — Points to the actual config file to use for this project
- Allows `nx sync` to track project dependencies without duplicating all options

---

## Summary

| Aspect | Base Setting | Override For |
|--------|--------------|--------------|
| **Target JS Version** | ES2022 | (same across workspace) |
| **Modules** | ESNext | CommonJS for tools/nx-plugin |
| **JSX** | Not set | React projects (JSX option) |
| **Library Support** | None | DOM for web, Node for BFF |
| **Declarations** | Yes (base) | No for apps, Yes for libs |
| **Strictness** | Maximum | (same across workspace) |
| **Resolution** | @jarvis/source condition | node10 for tooling |

