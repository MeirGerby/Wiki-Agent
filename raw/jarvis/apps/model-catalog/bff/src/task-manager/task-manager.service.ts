import axios, { type AxiosInstance } from 'axios';
import { TRPCError } from '@trpc/server';
import type { TrainingStatus } from '@jarvis/model-catalog-contract';
import { toLogError, type Logger } from '@jarvis/logging';
import { z } from 'zod';
import type { ServerEnv } from '../server-env.js';

const TASK_MANAGER_TIMEOUT_MS = 10_000;
const TRAINING_MODEL_MAX_AGE_MS = 2 * 24 * 60 * 60 * 1000;

const TaskManagerErrorBody = z.object({
  detail: z.object({ error: z.string() }).optional(),
});

const UNKNOWN_ERROR_MESSAGE = 'שגיאה לא ידועה';

const ERROR_MESSAGES = {
  RULE_NOT_EXIST: 'החוק המבוקש לא קיים',
} satisfies Record<string, string>;

export type CreateTaskBody = {
  objectName: string;
  modelNameEn: string;
  modelNameHe: string;
  creatingUserName: string;
  ruleName: string;
  trainClasses: string[];
  backgroundClasses: string[];
};

export type TrainingMission = {
  missionId: string;
  englishName: string;
  hebrewName: string;
  creatorUserId: string;
  createdAt: string;
  status: TrainingStatus;
};

const MissionResponse = z.object({
  mission_id: z.string(),
  mission_status: z.string(),
  creation_time: z.string(),
  input_config: z.object({
    extra_input_for_upload: z.object({
      new_sqrule_name: z.string(),
      new_sqrule_name_he: z.string(),
      creating_user_name: z.string(),
    }),
  }),
});

const MissionsByObjectResponse = z.object({
  missions: z.array(MissionResponse),
});

function toTrainingStatus(missionStatus: string): TrainingStatus | undefined {
  switch (missionStatus) {
    case 'Not Started':
      return 'NOT_STARTED';
    case 'Running':
      return 'RUNNING';
    case 'Error':
      return 'ERROR';
    default:
      return undefined;
  }
}

function toTrainingMission(
  mission: z.infer<typeof MissionResponse>,
  now: number,
  term: string,
): TrainingMission | undefined {
  const status = toTrainingStatus(mission.mission_status);
  if (status === undefined) return undefined;

  if (status === 'ERROR') {
    const createdAt = new Date(mission.creation_time).getTime();
    const isRecent =
      Number.isFinite(createdAt) && now - createdAt < TRAINING_MODEL_MAX_AGE_MS;
    if (!isRecent) return undefined;
  }

  const upload = mission.input_config.extra_input_for_upload;
  const matchesQuery =
    term === '' ||
    upload.new_sqrule_name.toLowerCase().includes(term) ||
    upload.new_sqrule_name_he.toLowerCase().includes(term);
  if (!matchesQuery) return undefined;

  return {
    missionId: mission.mission_id,
    englishName: upload.new_sqrule_name,
    hebrewName: upload.new_sqrule_name_he,
    creatorUserId: upload.creating_user_name,
    createdAt: mission.creation_time,
    status,
  };
}

/**
 * Thin client over the task manager, the service that runs model-creation tasks.
 */
export class TaskManagerService {
  private readonly client: AxiosInstance;
  private readonly logger: Logger;

  constructor({ config, logger }: { config: ServerEnv; logger: Logger }) {
    this.client = axios.create({
      baseURL: config.TASK_MANAGER_URL,
      timeout: TASK_MANAGER_TIMEOUT_MS,
    });
    this.logger = logger;
  }

  async createTask(body: CreateTaskBody): Promise<void> {
    const queryParams = new URLSearchParams();
    queryParams.append('objectName', body.objectName);
    queryParams.append('modelNameEn', body.modelNameEn);
    queryParams.append('modelNameHe', body.modelNameHe);
    queryParams.append('creatingUserName', body.creatingUserName);
    queryParams.append('ruleName', body.ruleName);

    try {
      await this.client.post(`/create?${queryParams.toString()}`, {
        cropIds: null,
        trainClasses: body.trainClasses,
        backgroundClasses: body.backgroundClasses,
        dontcareClasses: [],
      });

      this.logger.info(
        {
          objectName: body.objectName,
          modelNameEn: body.modelNameEn,
          creatingUserName: body.creatingUserName,
        },
        'create model success',
      );
    } catch (error) {
      this.logger.error(
        {
          error: toLogError(error),
          objectName: body.objectName,
          modelNameEn: body.modelNameEn,
          creatingUserName: body.creatingUserName,
        },
        'create model error',
      );

      throw this.toTRPCError(error);
    }
  }

  async getTrainingModels(
    objectName: string,
    query: string,
  ): Promise<TrainingMission[]> {
    const queryParams = new URLSearchParams();
    queryParams.append('objectName', objectName);

    let missions: z.infer<typeof MissionResponse>[];

    try {
      const response = await this.client.get(
        `/by-object?${queryParams.toString()}`,
      );
      missions = MissionsByObjectResponse.parse(response.data).missions;
    } catch (error) {
      this.logger.error(
        { error: toLogError(error), objectName },
        'loading training models by object error',
      );
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: UNKNOWN_ERROR_MESSAGE,
      });
    }

    const now = Date.now();
    const term = query.trim().toLowerCase();

    return missions
      .map((mission) => toTrainingMission(mission, now, term))
      .filter((mission) => mission !== undefined);
  }

  async abortTraining(missionId: string): Promise<void> {
    const queryParams = new URLSearchParams();
    queryParams.append('mission_id', missionId);

    try {
      await this.client.post(`/abort?${queryParams.toString()}`);
      this.logger.info({ missionId }, 'abort training success');
    } catch (error) {
      this.logger.error(
        { error: toLogError(error), missionId },
        'abort training error',
      );
      throw this.toTRPCError(error);
    }
  }

  async retryTraining(missionId: string): Promise<void> {
    const queryParams = new URLSearchParams();
    queryParams.append('mission_id', missionId);

    try {
      await this.client.post(`/retry?${queryParams.toString()}`);
      this.logger.info({ missionId }, 'retry training success');
    } catch (error) {
      this.logger.error(
        { error: toLogError(error), missionId },
        'retry training error',
      );
      throw this.toTRPCError(error);
    }
  }

  private toTRPCError<T>(error: T): TRPCError {
    if (axios.isAxiosError(error)) {
      const errorCode = TaskManagerErrorBody.safeParse(error.response?.data)
        .data?.detail?.error;
      // SAFETY: hasOwnProperty just confirmed errorCode is a key of ERROR_MESSAGES.
      const knownMessage =
        errorCode !== undefined &&
        Object.prototype.hasOwnProperty.call(ERROR_MESSAGES, errorCode)
          ? ERROR_MESSAGES[errorCode as keyof typeof ERROR_MESSAGES]
          : undefined;

      return new TRPCError({
        code: 'BAD_REQUEST',
        message: knownMessage ?? UNKNOWN_ERROR_MESSAGE,
      });
    }

    return new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: UNKNOWN_ERROR_MESSAGE,
    });
  }
}
