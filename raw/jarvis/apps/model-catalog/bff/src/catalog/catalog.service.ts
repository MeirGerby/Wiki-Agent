import {
  type Db,
  deepWisdomModels,
  deepWisdomModelsObjects,
  geographies,
  objectCategories,
  objects,
  rules,
  sensorGroups,
  sequences,
  sqrules,
  users,
} from '@jarvis/db';
import {
  CreateObjectInput,
  type AbortTrainingInput,
  type Category,
  type CatalogObject,
  type CloneModelInput,
  type CreateModelInput,
  type GetTrainingModelsInput,
  type Geography,
  type ObjectFilter,
  type ObjectModels,
  type ObjectModelsInput,
  type RetryTrainingInput,
  type Role,
  type SensorGroup,
  type TaggingClass,
  type TrainingModel,
  type UpdateModelInput,
} from '@jarvis/model-catalog-contract';
import { TRPCError } from '@trpc/server';
import { and, asc, countDistinct, eq, ilike, inArray, or } from 'drizzle-orm';
import {
  type CatalogVisibilityStrategy,
  visibilityStrategyFor,
} from './catalog-visibility.js';
import {
  applyPerformanceRate,
  buildRuleName,
  formatConfigRecord,
  sortCategories,
  StoredSqruleConfig,
  StoredPerformanceRate,
  toModelPerformance,
} from './catalog.utils.js';
import type { Logger } from '@jarvis/logging';
import type { ServerEnv } from '../server-env.js';
import type { RobertoService } from '../roberto/roberto.service.js';
import type { PicassoService } from '../picasso/picasso.service.js';
import type { TaskManagerService } from '../task-manager/task-manager.service.js';

export class CatalogService {
  private readonly db: Db;
  private readonly config: ServerEnv;
  private readonly logger: Logger;
  private readonly robertoService: RobertoService;
  private readonly picassoService: PicassoService;
  private readonly taskManagerService: TaskManagerService;
  private otherCategoryWarned = false;

  constructor({
    db,
    config,
    logger,
    robertoService,
    picassoService,
    taskManagerService,
  }: {
    db: Db;
    config: ServerEnv;
    logger: Logger;
    robertoService: RobertoService;
    picassoService: PicassoService;
    taskManagerService: TaskManagerService;
  }) {
    this.db = db;
    this.config = config;
    this.logger = logger;
    this.robertoService = robertoService;
    this.picassoService = picassoService;
    this.taskManagerService = taskManagerService;
  }

  async categories(): Promise<Category[]> {
    const rows = await this.db
      .select({
        englishName: objectCategories.englishName,
        hebrewName: objectCategories.hebrewName,
      })
      .from(objectCategories);

    const otherKey = this.config.OTHER_CATEGORY_KEY;

    if (
      otherKey !== undefined &&
      !this.otherCategoryWarned &&
      !rows.some((row) => row.englishName === otherKey)
    ) {
      this.otherCategoryWarned = true;
      this.logger.warn(
        { otherCategoryKey: otherKey },
        'OTHER_CATEGORY_KEY does not match any category',
      );
    }

    return sortCategories(rows, otherKey);
  }

  async geographies(): Promise<Geography[]> {
    return this.db
      .select({ name: geographies.name })
      .from(geographies)
      .orderBy(asc(geographies.name));
  }

  async sensorGroups(): Promise<SensorGroup[]> {
    return this.db
      .select({
        name: sensorGroups.name,
        description: sensorGroups.description,
      })
      .from(sensorGroups)
      .orderBy(asc(sensorGroups.name));
  }

  async taggingClasses(): Promise<TaggingClass[]> {
    const classes = await this.picassoService.getTaggingClasses();

    return [...classes].sort((a, b) =>
      a.hebrewName.localeCompare(b.hebrewName, 'he'),
    );
  }

  async objects(
    { categoryEnglishNames, query, geography: geographyName }: ObjectFilter,
    role: Role,
  ): Promise<CatalogObject[]> {
    if (categoryEnglishNames.length === 0) {
      return [];
    }

    const strategy = visibilityStrategyFor(role);
    const term = query.trim();

    const rows = await this.db
      .select({
        englishName: objects.englishName,
        hebrewName: objects.hebrewName,
        categoryEnglishName: objects.categoryName,
        fileUrl: objects.fileUrl,
        modelCount: countDistinct(sqrules.englishName),
      })
      .from(objects)
      .leftJoin(
        deepWisdomModelsObjects,
        eq(deepWisdomModelsObjects.objectName, objects.englishName),
      )
      .leftJoin(
        deepWisdomModels,
        eq(deepWisdomModels.modelName, deepWisdomModelsObjects.modelName),
      )
      .leftJoin(sequences, eq(sequences.deepWisdomModelId, deepWisdomModels.id))
      .leftJoin(
        sqrules,
        and(eq(sqrules.sequenceId, sequences.id), strategy.modelCondition),
      )
      .where(
        and(
          inArray(objects.categoryName, categoryEnglishNames),
          eq(objects.isActive, true),
          this.objectSearchCondition(term, strategy),
          geographyName === undefined || geographyName === ''
            ? undefined
            : inArray(
                objects.englishName,
                this.objectNamesInGeography(geographyName, strategy),
              ),
        ),
      )
      .groupBy(
        objects.englishName,
        objects.hebrewName,
        objects.categoryName,
        objects.fileUrl,
      )
      .orderBy(asc(objects.englishName));

    return rows
      .map((row) => ({ ...row, modelCount: Number(row.modelCount) }))
      .filter((object) => !strategy.hidesEmptyObjects || object.modelCount > 0);
  }

  async createObject(
    input: CreateObjectInput,
    image: File,
    createUser: string,
  ): Promise<CatalogObject> {
    const { englishName, hebrewName, categoryEnglishName } = input;

    const taken = await this.db
      .select({
        englishName: objects.englishName,
        hebrewName: objects.hebrewName,
      })
      .from(objects)
      .where(
        or(
          eq(objects.englishName, englishName),
          eq(objects.hebrewName, hebrewName),
        ),
      );

    if (taken.some((row) => row.englishName === englishName)) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'english_name_taken',
      });
    }

    if (taken.length > 0) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'hebrew_name_taken',
      });
    }

    const { fileUrl } = await this.robertoService.createObject({
      englishName,
      hebrewName,
      categoryName: categoryEnglishName,
      createUser,
      isActive: true,
      image,
    });

    return {
      englishName,
      hebrewName,
      categoryEnglishName,
      fileUrl,
      modelCount: 0,
    };
  }

  async updateModel(
    input: UpdateModelInput,
    lastUpdateUser: string,
  ): Promise<{ id: string }> {
    const activeSqrule = await this.fetchActiveSqrule(input.id);
    const parsedRate = StoredPerformanceRate.safeParse(
      activeSqrule.performanceRate,
    );
    const currentRate: StoredPerformanceRate = parsedRate.success
      ? parsedRate.data
      : {};

    const performanceRate =
      input.performance === undefined
        ? currentRate
        : applyPerformanceRate(currentRate, input.performance);

    const { version } = await this.robertoService.createSqruleVersion(
      input.id,
      {
        config: activeSqrule.config,
        performanceRate,
        operationalStatus: activeSqrule.operationalStatus,
        lastUpdateUser,
      },
    );

    await this.robertoService.changeActivationStatus(
      input.id,
      version,
      lastUpdateUser,
    );

    return { id: input.id };
  }

  async cloneModel(
    input: CloneModelInput,
    createUser: string,
  ): Promise<{ id: string }> {
    const source = await this.fetchActiveSqrule(input.sourceId);

    const ruleName = buildRuleName({
      sensorGroupName: input.sensorGroupName,
      geographyName: input.geographyName,
      minResolution: input.minResolution,
      maxResolution: input.maxResolution,
    });

    await this.robertoService.createSqrule({
      englishName: input.englishName,
      hebrewName: input.hebrewName,
      ruleName,
      lastUpdateUser: createUser,
      sequenceId: source.sequenceId,
      config: source.config,
      performanceRate: null,
      operationalStatus: 'EXPERIMENTAL',
    });

    await this.robertoService.changeActivationStatus(
      input.englishName,
      1,
      createUser,
    );

    return { id: input.englishName };
  }

  async createModel(
    input: CreateModelInput,
    creatingUserName: string,
  ): Promise<void> {
    const ruleName = buildRuleName({
      sensorGroupName: input.sensorGroupName,
      geographyName: input.geographyName,
      minResolution: input.minResolution,
      maxResolution: input.maxResolution,
    });

    await this.taskManagerService.createTask({
      objectName: input.objectEnglishName,
      modelNameEn: input.englishName,
      modelNameHe: input.hebrewName,
      creatingUserName,
      ruleName,
      trainClasses: input.positiveTaggingClassNames,
      backgroundClasses: input.emptyFieldsClassNames,
    });
  }

  async trainingModels({
    objectEnglishName,
    query,
  }: GetTrainingModelsInput): Promise<TrainingModel[]> {
    const missions = await this.taskManagerService.getTrainingModels(
      objectEnglishName,
      query,
    );

    if (missions.length === 0) return [];

    const creatorRows = await this.db
      .select({ userId: users.userId, displayName: users.displayName })
      .from(users)
      .where(
        inArray(users.userId, [
          ...new Set(missions.map((mission) => mission.creatorUserId)),
        ]),
      );
    const creatorNames = new Map(
      creatorRows.map((row) => [row.userId, row.displayName]),
    );

    return missions
      .map((mission) => ({
        missionId: mission.missionId,
        englishName: mission.englishName,
        hebrewName: mission.hebrewName,
        creator:
          creatorNames.get(mission.creatorUserId) ?? mission.creatorUserId,
        createdAt: mission.createdAt,
        status: mission.status,
      }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async abortModelTraining({ missionId }: AbortTrainingInput): Promise<void> {
    await this.taskManagerService.abortTraining(missionId);
  }

  async retryModelTraining({ missionId }: RetryTrainingInput): Promise<void> {
    await this.taskManagerService.retryTraining(missionId);
  }

  async object(
    { englishName, query }: ObjectModelsInput,
    role: Role,
  ): Promise<ObjectModels> {
    const strategy = visibilityStrategyFor(role);

    const [object] = await this.db
      .select({ englishName: objects.englishName })
      .from(objects)
      .where(
        and(eq(objects.englishName, englishName), eq(objects.isActive, true)),
      )
      .limit(1);

    if (!object) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: `no object named "${englishName}"`,
      });
    }

    const term = query.trim();

    const rows = await this.db
      .select({
        id: sqrules.englishName,
        englishName: sqrules.englishName,
        hebrewName: sqrules.hebrewName,
        performanceRate: sqrules.performanceRate,
        operationalStatus: sqrules.operationalStatus,
        dexterModelIds: sequences.dexterModelIds,
        minResolution: rules.minResolution,
        maxResolution: rules.maxResolution,
        geography: rules.geographyName,
        sensorGroupName: rules.sensorGroup,
        sensors: sensorGroups.sensors,
        description: sqrules.description,
        config: sqrules.config,
        lastUpdateUserId: sqrules.lastUpdateUser,
        lastUpdateUserName: users.displayName,
        updateTime: sqrules.updateTime,
      })
      .from(deepWisdomModelsObjects)
      .innerJoin(
        deepWisdomModels,
        eq(deepWisdomModels.modelName, deepWisdomModelsObjects.modelName),
      )
      .innerJoin(
        sequences,
        eq(sequences.deepWisdomModelId, deepWisdomModels.id),
      )
      .innerJoin(sqrules, eq(sqrules.sequenceId, sequences.id))
      .leftJoin(rules, eq(rules.name, sqrules.ruleName))
      .leftJoin(sensorGroups, eq(sensorGroups.name, rules.sensorGroup))
      .leftJoin(users, eq(users.userId, sqrules.lastUpdateUser))
      .where(
        and(
          eq(deepWisdomModelsObjects.objectName, englishName),
          strategy.modelCondition,
          term === '' ? undefined : this.modelNameCondition(term),
        ),
      )
      .orderBy(asc(deepWisdomModelsObjects.detectionOrder), asc(sequences.id));

    const models = rows.map((row) => {
      const parsedRate = StoredPerformanceRate.safeParse(row.performanceRate);
      const parsedConfig = StoredSqruleConfig.safeParse(row.config);
      const config: StoredSqruleConfig = parsedConfig.success
        ? parsedConfig.data
        : {};

      const model = {
        id: row.id,
        englishName: row.englishName,
        hebrewName: row.hebrewName,
        performance: toModelPerformance(
          parsedRate.success ? parsedRate.data : {},
        ),
        sensorGroupName: row.sensorGroupName,
        sensors: row.sensors ?? [],
        hasDexter: (row.dexterModelIds?.length ?? 0) > 0,
        minResolution: row.minResolution,
        maxResolution: row.maxResolution,
        geography: row.geography,
        description: row.description,
        depthThreshold: config.omekScoreThresh ?? null,
        dexterThreshold:
          config.dexterScoreThresh === undefined
            ? null
            : formatConfigRecord(config.dexterScoreThresh),
        lastUpdateUser: row.lastUpdateUserName ?? row.lastUpdateUserId,
        updateTime: row.updateTime,
      };

      return strategy.decorateModel(model, row.operationalStatus);
    });

    if (strategy.hidesEmptyObjects && models.length === 0) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: `no object named "${englishName}"`,
      });
    }

    return models;
  }

  private objectNamesWithMatchingModel(
    term: string,
    strategy: CatalogVisibilityStrategy,
  ) {
    return this.db
      .select({ objectName: deepWisdomModelsObjects.objectName })
      .from(deepWisdomModelsObjects)
      .innerJoin(
        deepWisdomModels,
        eq(deepWisdomModels.modelName, deepWisdomModelsObjects.modelName),
      )
      .leftJoin(sequences, eq(sequences.deepWisdomModelId, deepWisdomModels.id))
      .leftJoin(sqrules, eq(sqrules.sequenceId, sequences.id))
      .where(and(this.modelNameCondition(term), strategy.modelCondition));
  }

  private modelNameCondition(term: string) {
    return or(
      ilike(sqrules.englishName, `%${term}%`),
      ilike(sqrules.hebrewName, `%${term}%`),
    );
  }

  private objectSearchCondition(
    term: string,
    strategy: CatalogVisibilityStrategy,
  ) {
    if (term === '') return undefined;

    return or(
      ilike(objects.hebrewName, `%${term}%`),
      ilike(objects.englishName, `%${term}%`),
      inArray(
        objects.englishName,
        this.objectNamesWithMatchingModel(term, strategy),
      ),
    );
  }

  private objectNamesInGeography(
    geographyName: string,
    strategy: CatalogVisibilityStrategy,
  ) {
    return this.db
      .select({ objectName: deepWisdomModelsObjects.objectName })
      .from(rules)
      .innerJoin(sqrules, eq(sqrules.ruleName, rules.name))
      .innerJoin(sequences, eq(sequences.id, sqrules.sequenceId))
      .innerJoin(
        deepWisdomModels,
        eq(deepWisdomModels.id, sequences.deepWisdomModelId),
      )
      .innerJoin(
        deepWisdomModelsObjects,
        eq(deepWisdomModelsObjects.modelName, deepWisdomModels.modelName),
      )
      .where(
        and(eq(rules.geographyName, geographyName), strategy.modelCondition),
      );
  }

  private async fetchActiveSqrule(id: string) {
    const [activeSqrule] = await this.robertoService.getActiveSqrule(id);

    if (!activeSqrule) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: `no active model named "${id}"`,
      });
    }

    return activeSqrule;
  }
}
