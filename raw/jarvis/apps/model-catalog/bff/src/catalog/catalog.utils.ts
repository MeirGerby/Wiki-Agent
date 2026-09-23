import type {
  Category,
  ModelPerformance,
  UpdateModelPerformance,
} from '@jarvis/model-catalog-contract';
import { z } from 'zod';

export const StoredPerformanceRate = z.object({
  precision: z.number().optional(),
  recall: z.number().optional(),
  recommendedScoreThreshold: z.number().optional(),
});
export type StoredPerformanceRate = z.infer<typeof StoredPerformanceRate>;

export const StoredSqruleConfig = z.object({
  omekScoreThresh: z.number().optional().catch(undefined),
  dexterScoreThresh: z.record(z.string(), z.json()).optional().catch(undefined),
});
export type StoredSqruleConfig = z.infer<typeof StoredSqruleConfig>;

export function formatConfigRecord(
  record: Record<string, z.infer<ReturnType<typeof z.json>>>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => {
      const text = z.string().safeParse(value);
      return [key, text.success ? text.data : JSON.stringify(value)];
    }),
  );
}

export function toModelPerformance(
  stored: StoredPerformanceRate,
): ModelPerformance {
  return {
    precision: stored.precision ?? null,
    recall: stored.recall ?? null,
    recommendedScoreThreshold: stored.recommendedScoreThreshold ?? null,
  };
}

export function applyPerformanceRate(
  stored: StoredPerformanceRate,
  performance: UpdateModelPerformance,
): StoredPerformanceRate {
  return {
    precision: performance.precision ?? stored.precision,
    recall: performance.recall ?? stored.recall,
    recommendedScoreThreshold:
      performance.recommendedScoreThreshold ?? stored.recommendedScoreThreshold,
  };
}

export function buildRuleName({
  sensorGroupName,
  geographyName,
  minResolution,
  maxResolution,
}: {
  sensorGroupName: string | undefined;
  geographyName: string | undefined;
  minResolution: number | undefined;
  maxResolution: number | undefined;
}): string {
  return [sensorGroupName, geographyName, minResolution, maxResolution]
    .filter((piece) => piece !== undefined)
    .join('-');
}

export function sortCategories(
  categories: readonly Category[],
  otherKey: string | undefined,
): Category[] {
  return [...categories].sort((a, b) => {
    const aIsOther = a.englishName === otherKey;
    const bIsOther = b.englishName === otherKey;

    if (aIsOther !== bIsOther) return aIsOther ? 1 : -1;

    return a.hebrewName.localeCompare(b.hebrewName, 'he');
  });
}
