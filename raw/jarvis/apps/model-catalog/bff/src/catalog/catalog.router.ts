import {
  AbortTrainingInput,
  CatalogObject,
  Category,
  CloneModelInput,
  CloneModelOutput,
  CreateModelInput,
  CreateModelOutput,
  CreateObjectInput,
  CreateObjectRequest,
  Geography,
  GetTrainingModelsInput,
  ObjectFilter,
  ObjectModels,
  ObjectModelsInput,
  RetryTrainingInput,
  SensorGroup,
  TaggingClass,
  TrainingModels,
  UpdateModelInput,
  UpdateModelOutput,
} from '@jarvis/model-catalog-contract';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { authedProcedure, roleProcedure, router } from '../trpc.js';

const guestProcedure = roleProcedure('guest');
const adminProcedure = roleProcedure('admin');

function parseCreateObjectForm(form: FormData) {
  const objectJsonEntry = z.string().safeParse(form.get('objectJson'));

  if (!objectJsonEntry.success) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'missing objectJson' });
  }

  let objectJsonValue: unknown;

  try {
    objectJsonValue = JSON.parse(objectJsonEntry.data);
  } catch {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'invalid objectJson' });
  }

  const input = CreateObjectInput.safeParse(objectJsonValue);

  if (!input.success) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'invalid objectJson' });
  }

  const image = z.instanceof(File).safeParse(form.get('file'));

  if (!image.success) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'missing file' });
  }

  return { input: input.data, image: image.data };
}

export const catalogRouter = router({
  categories: authedProcedure
    .output(z.array(Category))
    .query(({ ctx }) => ctx.cradle.catalogService.categories()),

  geographies: authedProcedure
    .output(z.array(Geography))
    .query(({ ctx }) => ctx.cradle.catalogService.geographies()),

  sensorGroups: authedProcedure
    .output(z.array(SensorGroup))
    .query(({ ctx }) => ctx.cradle.catalogService.sensorGroups()),

  taggingClasses: authedProcedure
    .output(z.array(TaggingClass))
    .query(({ ctx }) => ctx.cradle.catalogService.taggingClasses()),

  objects: guestProcedure
    .input(ObjectFilter)
    .output(z.array(CatalogObject))
    .query(({ input, ctx }) =>
      ctx.cradle.catalogService.objects(input, ctx.role),
    ),

  object: guestProcedure
    .input(ObjectModelsInput)
    .output(ObjectModels)
    .query(({ input, ctx }) =>
      ctx.cradle.catalogService.object(input, ctx.role),
    ),

  createObject: adminProcedure
    .input(CreateObjectRequest)
    .output(CatalogObject)
    .mutation(({ input, ctx }) => {
      const { input: objectInput, image } = parseCreateObjectForm(input);
      return ctx.cradle.catalogService.createObject(
        objectInput,
        image,
        ctx.user.userId,
      );
    }),

  updateModel: adminProcedure
    .input(UpdateModelInput)
    .output(UpdateModelOutput)
    .mutation(({ input, ctx }) =>
      ctx.cradle.catalogService.updateModel(input, ctx.user.userId),
    ),

  cloneModel: adminProcedure
    .input(CloneModelInput)
    .output(CloneModelOutput)
    .mutation(({ input, ctx }) =>
      ctx.cradle.catalogService.cloneModel(input, ctx.user.userId),
    ),

  createModel: adminProcedure
    .input(CreateModelInput)
    .output(CreateModelOutput)
    .mutation(({ input, ctx }) =>
      ctx.cradle.catalogService.createModel(input, ctx.user.userId),
    ),

  trainingModels: adminProcedure
    .input(GetTrainingModelsInput)
    .output(TrainingModels)
    .query(({ input, ctx }) => ctx.cradle.catalogService.trainingModels(input)),

  abortModelTraining: adminProcedure
    .input(AbortTrainingInput)
    .output(z.void())
    .mutation(({ input, ctx }) =>
      ctx.cradle.catalogService.abortModelTraining(input),
    ),

  retryModelTraining: adminProcedure
    .input(RetryTrainingInput)
    .output(z.void())
    .mutation(({ input, ctx }) =>
      ctx.cradle.catalogService.retryModelTraining(input),
    ),
});
