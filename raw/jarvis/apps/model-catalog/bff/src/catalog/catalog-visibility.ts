import { sqrules } from '@jarvis/db';
import type {
  Model,
  OperationalStatus,
  Role,
} from '@jarvis/model-catalog-contract';
import { and, eq, type SQL } from 'drizzle-orm';

type ModelWithoutStatus = Omit<Model, 'operationalStatus'>;

function operationalStatusOf(rawOperationalStatus: string): OperationalStatus {
  return rawOperationalStatus === 'OPERATIONAL'
    ? 'OPERATIONAL'
    : 'EXPERIMENTAL';
}

export interface CatalogVisibilityStrategy {
  readonly modelCondition: SQL | undefined;
  readonly hidesEmptyObjects: boolean;
  decorateModel(model: ModelWithoutStatus, rawOperationalStatus: string): Model;
}

class GuestVisibility implements CatalogVisibilityStrategy {
  readonly modelCondition = and(
    eq(sqrules.isActive, true),
    eq(sqrules.operationalStatus, 'OPERATIONAL'),
  );

  readonly hidesEmptyObjects = true;

  decorateModel(model: ModelWithoutStatus): Model {
    return model;
  }
}

class FullVisibility implements CatalogVisibilityStrategy {
  readonly modelCondition: SQL = eq(sqrules.isActive, true);

  readonly hidesEmptyObjects = false;

  decorateModel(
    model: ModelWithoutStatus,
    rawOperationalStatus: string,
  ): Model {
    return {
      ...model,
      operationalStatus: operationalStatusOf(rawOperationalStatus),
    };
  }
}

const GUEST_VISIBILITY = new GuestVisibility();
const FULL_VISIBILITY = new FullVisibility();

const STRATEGY_BY_ROLE: Record<Role, CatalogVisibilityStrategy> = {
  guest: GUEST_VISIBILITY,
  viewer: FULL_VISIBILITY,
  admin: FULL_VISIBILITY,
  superadmin: FULL_VISIBILITY,
};

export function visibilityStrategyFor(role: Role): CatalogVisibilityStrategy {
  return STRATEGY_BY_ROLE[role];
}
