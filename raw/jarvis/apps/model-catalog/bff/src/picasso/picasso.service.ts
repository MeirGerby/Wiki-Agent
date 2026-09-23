import type { TaggingClass } from '@jarvis/model-catalog-contract';
import axios, { type AxiosInstance } from 'axios';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import type { ServerEnv } from '../server-env.js';

const PicassoItem = z
  .object({
    className: z.string(),
    hebrewName: z.string(),
  })
  .passthrough();

const PicassoResponse = z.array(PicassoItem);

function toDuplicateError(className: string): TRPCError {
  return new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: `Duplicate tagging class from Picasso: ${className}`,
  });
}

/**
 * Thin client over Picasso, the service that owns the list of tagging classes.
 */
export class PicassoService {
  private readonly client: AxiosInstance;

  constructor({ config }: { config: ServerEnv }) {
    this.client = axios.create({ baseURL: config.PICASSO_URL });
  }

  async getTaggingClasses(): Promise<TaggingClass[]> {
    let data: unknown;

    try {
      ({ data } = await this.client.get(''));
    } catch {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch tagging classes from Picasso',
      });
    }

    const parsed = PicassoResponse.safeParse(data);
    if (!parsed.success) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Invalid response from Picasso',
      });
    }

    const seen = new Set<string>();
    for (const item of parsed.data) {
      if (seen.has(item.className)) throw toDuplicateError(item.className);
      seen.add(item.className);
    }

    return parsed.data.map((item) => ({
      className: item.className,
      hebrewName: item.hebrewName,
    }));
  }
}
