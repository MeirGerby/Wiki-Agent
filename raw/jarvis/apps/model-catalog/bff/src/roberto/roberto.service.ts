import axios, { type AxiosInstance } from 'axios';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import type { ServerEnv } from '../server-env.js';

const RobertoSqrule = z.object({
  englishName: z.string(),
  hebrewName: z.string(),
  version: z.number(),
  sequenceId: z.number(),
  config: z.unknown(),
  performanceRate: z.unknown(),
  operationalStatus: z.string(),
});
export type RobertoSqrule = z.infer<typeof RobertoSqrule>;

const RobertoCreateObjectResult = z.object({ fileUrl: z.string() });
export type RobertoCreateObjectResult = z.infer<
  typeof RobertoCreateObjectResult
>;

const RobertoCreateSqruleVersionResult = z.object({ version: z.number() });

const RobertoErrorBody = z.object({ message: z.string() });

export type CreateObjectBody = {
  englishName: string;
  hebrewName: string;
  categoryName: string;
  createUser: string;
  isActive: boolean;
  image: File;
};

export type CreateSqruleBody = {
  englishName: string;
  hebrewName: string;
  ruleName: string;
  lastUpdateUser: string;
  sequenceId: number;
  config: unknown;
  performanceRate: unknown;
  operationalStatus: string;
};

export type CreateSqruleVersionBody = {
  config: unknown;
  performanceRate: unknown;
  operationalStatus: string;
  lastUpdateUser: string;
};

/**
 * Thin client over Roberto, the service that owns every write to the model-catalog data. Each
 * method mirrors one Roberto route; the calling order for a given operation (edit, clone,
 * activation) lives in CatalogService, not here.
 */
export class RobertoService {
  private readonly client: AxiosInstance;

  constructor({ config }: { config: ServerEnv }) {
    this.client = axios.create({ baseURL: config.ROBERTO_BASE_URL });

    this.client.interceptors.response.use(undefined, (error) => {
      if (!axios.isAxiosError(error)) throw error;

      if (error.response) {
        const asError = RobertoErrorBody.safeParse(error.response.data);
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: asError.success ? asError.data.message : error.message,
        });
      }

      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Unknown server error',
      });
    });
  }

  async createObject(
    body: CreateObjectBody,
  ): Promise<RobertoCreateObjectResult> {
    const form = new FormData();
    form.append(
      'objectJson',
      JSON.stringify({
        englishName: body.englishName,
        hebrewName: body.hebrewName,
        categoryName: body.categoryName,
        createUser: body.createUser,
        isActive: body.isActive,
      }),
    );
    form.append('file', body.image, body.image.name);

    const { data } = await this.client.post('objects/create', form);
    return RobertoCreateObjectResult.parse(data);
  }

  async getActiveSqrule(englishName: string): Promise<RobertoSqrule[]> {
    const { data } = await this.client.get(
      `sqrules/getByName/${encodeURIComponent(englishName)}`,
      { params: { isActive: true } },
    );

    return z.array(RobertoSqrule).parse(data);
  }

  async createSqrule(body: CreateSqruleBody): Promise<void> {
    await this.client.post('sqrules/create', body);
  }

  async createSqruleVersion(
    englishName: string,
    body: CreateSqruleVersionBody,
  ): Promise<{ version: number }> {
    const { data } = await this.client.post(
      `sqrules/createVersion/${encodeURIComponent(englishName)}`,
      body,
    );

    return RobertoCreateSqruleVersionResult.parse(data);
  }

  async changeActivationStatus(
    englishName: string,
    version: number,
    lastUpdateUser: string,
  ): Promise<void> {
    await this.client.patch(
      `sqrules/changeActivationStatus/${encodeURIComponent(englishName)}/${version}`,
      { lastUpdateUser },
    );
  }
}
