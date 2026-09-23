import { createDb, type Db } from '@jarvis/db';
import {
  asClass,
  asFunction,
  asValue,
  type AwilixContainer,
  createContainer,
  InjectionMode,
} from 'awilix';
import { createConsoleLogger, type Logger } from '@jarvis/logging';
import { AuthService } from './auth/auth.service.js';
import { PermissionsService } from './permissions/permissions.service.js';
import { UsersService } from './users/users.service.js';
import { CatalogService } from './catalog/catalog.service.js';
import { RobertoService } from './roberto/roberto.service.js';
import { PicassoService } from './picasso/picasso.service.js';
import { TaskManagerService } from './task-manager/task-manager.service.js';
import { loadServerEnv, type ServerEnv } from './server-env.js';
import { loadWebEnv, type WebConfig } from './web-env.js';

export interface Cradle {
  logger: Logger;
  config: ServerEnv;
  webConfig: WebConfig;
  db: Db;
  catalogService: CatalogService;
  robertoService: RobertoService;
  picassoService: PicassoService;
  taskManagerService: TaskManagerService;
  authService: AuthService;
  usersService: UsersService;
  permissionsService: PermissionsService;
}

export function createAppContainer(): AwilixContainer<Cradle> {
  const container = createContainer<Cradle>({
    injectionMode: InjectionMode.PROXY,
    strict: true,
  });

  const config = loadServerEnv();
  const webConfig = loadWebEnv();

  container.register({
    config: asValue(config),
    webConfig: asValue(webConfig),

    logger: asFunction(() => createConsoleLogger(config.LOG_LEVEL)).singleton(),

    db: asFunction(
      () =>
        createDb({
          connectionString: config.DATABASE_URL,
          ssl: config.DATABASE_SSL,
          max: 10,
        }).db,
    ).singleton(),

    catalogService: asClass(CatalogService).singleton(),
    robertoService: asClass(RobertoService).singleton(),
    picassoService: asClass(PicassoService).singleton(),
    taskManagerService: asClass(TaskManagerService).singleton(),
    authService: asClass(AuthService).singleton(),
    usersService: asClass(UsersService).singleton(),
    permissionsService: asClass(PermissionsService).singleton(),
  });

  return container;
}
