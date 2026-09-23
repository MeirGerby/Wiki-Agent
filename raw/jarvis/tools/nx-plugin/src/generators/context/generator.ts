import {
  formatFiles,
  generateFiles,
  installPackagesTask,
  joinPathFragments,
  type GeneratorCallback,
  type Tree,
} from '@nx/devkit';
import { readFileSync } from 'node:fs';
import * as path from 'node:path';
import { ensureContextCi } from '../../utils/context-ci';
import { registerLoggingProject } from '../../utils/logging-projects';
import {
  contextNames,
  projectExists,
  templateVariables,
  type ContextNames,
} from '../../utils/options';
import { addRootTsconfigReference } from '../../utils/root-tsconfig';
import type { ContextGeneratorSchema } from './schema';

const DEFAULT_BFF_PORT = 3001;
const DEFAULT_WEB_PORT = 5173;

export async function contextGenerator(
  tree: Tree,
  options: ContextGeneratorSchema,
): Promise<GeneratorCallback> {
  const context = contextNames(options.name, options.directory);
  const bffPort = options.bffPort ?? DEFAULT_BFF_PORT;

  const written = [
    writeContract(tree, context),
    writeBff(tree, context, bffPort),
    writeWeb(tree, context, {
      title: options.title ?? context.name,
      port: options.webPort ?? DEFAULT_WEB_PORT,
      bffPort,
    }),
  ].filter(Boolean).length;

  if (written === 0) {
    throw new Error(
      `${context.root} already holds all three projects — pick another name or --directory.`,
    );
  }

  if (!options.skipCi) {
    ensureContextCi(tree, context);
  }

  if (!options.skipFormat) {
    await formatFiles(tree);
  }

  return () => {
    if (!options.skipPackageJson) {
      installPackagesTask(tree);
    }
  };
}

function writeContract(tree: Tree, context: ContextNames): boolean {
  const root = context.contractRoot;
  if (projectExists(tree, root)) {
    return false;
  }

  render(tree, 'contract', root, templateVariables(context, root));
  addRootTsconfigReference(tree, root);

  return true;
}

function writeBff(tree: Tree, context: ContextNames, port: number): boolean {
  const root = context.bffRoot;
  if (projectExists(tree, root)) {
    return false;
  }

  render(tree, 'bff', root, { ...templateVariables(context, root), port });
  registerLoggingProject(tree, `${context.name}-bff`);

  const envExample = tree.read(
    joinPathFragments(root, '.env.example'),
    'utf-8',
  );
  if (envExample) {
    tree.write(joinPathFragments(root, '.env'), envExample);
  }

  return true;
}

function writeWeb(
  tree: Tree,
  context: ContextNames,
  options: { title: string; port: number; bffPort: number },
): boolean {
  const root = context.webRoot;
  if (projectExists(tree, root)) {
    return false;
  }

  render(tree, 'web', root, {
    ...templateVariables(context, root),
    ...options,
  });
  registerLoggingProject(tree, `${context.name}-web`);

  tree.write(
    joinPathFragments(root, 'public', 'favicon.ico'),
    readFileSync(path.join(__dirname, 'assets', 'favicon.ico')),
  );

  return true;
}

type TemplateVariables = ReturnType<typeof templateVariables> & {
  port?: number;
  title?: string;
  bffPort?: number;
};

function render(
  tree: Tree,
  kind: 'contract' | 'bff' | 'web',
  target: string,
  variables: TemplateVariables,
): void {
  generateFiles(tree, path.join(__dirname, 'files', kind), target, variables);
}

export default contextGenerator;
