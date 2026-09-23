import {
  CreateObjectInput,
  isRoleAtLeast,
  type CatalogObject,
  type Category,
  type CreateObjectConflict,
} from '@jarvis/model-catalog-contract';
import { Button } from '@jarvis/ui/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@jarvis/ui/components/ui/dialog';
import { Input } from '@jarvis/ui/components/ui/input';
import { Label } from '@jarvis/ui/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@jarvis/ui/components/ui/select';
import { useForm } from '@tanstack/react-form';
import { useMutation } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import closeIcon from '../assets/close.svg';
import photoIcon from '../assets/photo.svg';
import plusIcon from '../assets/plus.svg';
import { useCatalogSync } from '../catalog/use-catalog-sync';
import { useAuth } from '../contexts/auth-context';
import { logError, logInfo } from '../logging/log';
import { useTRPC } from '../trpc';
import { firstMessage } from '../utils/form-errors';
import { Icon } from './icon';

type FormValues = CreateObjectInput;

const EMPTY_FORM: FormValues = {
  hebrewName: '',
  englishName: '',
  categoryEnglishName: '',
};

const GENERIC_ERROR = 'יצירת האובייקט נכשלה. נסה שוב.';
const IMAGE_REQUIRED_ERROR = 'יש לבחור תמונה';

const ACCEPTED_FILE_TYPES = 'PNG, JPG, JPEG';

type ConflictInfo = { field: keyof FormValues; message: string };

const CONFLICT_INFO: Record<CreateObjectConflict, ConflictInfo> = {
  english_name_taken: {
    field: 'englishName',
    message: 'שם באנגלית זה כבר קיים',
  },
  hebrew_name_taken: {
    field: 'hebrewName',
    message: 'שם בעברית זה כבר קיים',
  },
};

const CONFLICTS = new Map<string, ConflictInfo>(Object.entries(CONFLICT_INFO));

function conflictOf<E>(error: E): ConflictInfo | undefined {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return CONFLICTS.get(message);
}

function buildRobertoForm(input: CreateObjectInput, image: File): FormData {
  const form = new FormData();
  form.append('objectJson', JSON.stringify(input));
  form.append('file', image, image.name);
  return form;
}

export function CreateObjectModal({
  categories,
  onCreated,
}: {
  categories: readonly Category[];
  onCreated: (object: CatalogObject) => void;
}) {
  const trpc = useTRPC();
  const { objectCreated } = useCatalogSync();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [image, setImage] = useState<File | null>(null);

  const createObject = useMutation(
    trpc.catalog.createObject.mutationOptions({
      onSuccess: (object) => {
        logInfo({
          event: 'object.create.ok',
          message: 'Object created',
          objectId: object.englishName,
          categoryId: object.categoryEnglishName,
        });
        void objectCreated();
        handleOpenChange(false);
        onCreated(object);
      },
    }),
  );

  const form = useForm({
    defaultValues: EMPTY_FORM,
    validators: {
      onMount: CreateObjectInput,
      onChange: CreateObjectInput,
      onSubmitAsync: async ({ value }) => {
        if (image === null) {
          return { form: IMAGE_REQUIRED_ERROR };
        }

        logInfo({
          event: 'object.create.attempted',
          message: 'Object create attempted',
          categoryId: value.categoryEnglishName,
        });

        try {
          await createObject.mutateAsync(
            buildRobertoForm(CreateObjectInput.parse(value), image),
          );
          return null;
        } catch (error) {
          const conflict = conflictOf(error);
          if (conflict) {
            return { fields: { [conflict.field]: conflict.message } };
          }

          logError(
            { event: 'object.create.failed', message: 'Object create failed' },
            error,
          );
          return { form: GENERIC_ERROR };
        }
      },
    },
  });

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      form.reset();
      createObject.reset();
      setImage(null);
    }
  }

  if (user === null || !isRoleAtLeast(user.role, 'admin')) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Icon src={plusIcon} />
          צור אובייקט חדש
        </Button>
      </DialogTrigger>

      <DialogContent className="gap-0 p-0">
        <DialogHeader>
          <DialogTitle>יצירת אובייקט חדש</DialogTitle>
          <DialogClose asChild>
            <Button variant="ghost" size="icon-sm">
              <Icon src={closeIcon} label="סגור" />
            </Button>
          </DialogClose>
        </DialogHeader>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            void form.handleSubmit();
          }}
        >
          <div className="flex flex-col gap-4 px-6 py-4">
            <form.Field name="hebrewName">
              {(field) => (
                <ModalRow
                  label="שם בעברית"
                  htmlFor={field.name}
                  error={
                    field.state.meta.isTouched
                      ? firstMessage(field.state.meta.errors)
                      : undefined
                  }
                >
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    placeholder="הזן שם בעברית"
                    aria-invalid={
                      field.state.meta.isTouched && !field.state.meta.isValid
                    }
                    className="h-8 flex-1 text-sm"
                  />
                </ModalRow>
              )}
            </form.Field>

            <form.Field name="englishName">
              {(field) => (
                <ModalRow
                  label="שם באנגלית"
                  htmlFor={field.name}
                  error={
                    field.state.meta.isTouched
                      ? firstMessage(field.state.meta.errors)
                      : undefined
                  }
                >
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    placeholder="violet_camera"
                    dir="ltr"
                    aria-invalid={
                      field.state.meta.isTouched && !field.state.meta.isValid
                    }
                    className="h-8 flex-1 text-sm"
                  />
                </ModalRow>
              )}
            </form.Field>

            <form.Field name="categoryEnglishName">
              {(field) => (
                <ModalRow
                  label="קטגוריה"
                  error={
                    field.state.meta.isTouched
                      ? firstMessage(field.state.meta.errors)
                      : undefined
                  }
                >
                  <Select
                    value={field.state.value}
                    onValueChange={field.handleChange}
                  >
                    <SelectTrigger
                      className="w-full"
                      onBlur={field.handleBlur}
                      aria-invalid={
                        field.state.meta.isTouched && !field.state.meta.isValid
                      }
                    >
                      <SelectValue placeholder="בחר קטגוריה" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem
                          key={category.englishName}
                          value={category.englishName}
                        >
                          {category.hebrewName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </ModalRow>
              )}
            </form.Field>

            <div className="flex flex-col gap-1">
              <Label className="text-sm font-normal">תמונה</Label>
              <label className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-input p-3 text-center">
                <img src={photoIcon} alt="" width={24} height={24} />
                <span className="text-sm">
                  גרור או{' '}
                  <span className="text-brand">
                    {image?.name ?? 'בחר קובץ'}
                  </span>
                </span>
                <span className="text-xs text-muted-foreground">
                  יש להעלות קבצים מסוג: {ACCEPTED_FILE_TYPES} בלבד
                </span>
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  className="sr-only"
                  onChange={(event) =>
                    setImage(event.target.files?.[0] ?? null)
                  }
                />
              </label>
            </div>

            <form.Subscribe selector={(state) => state.errorMap.onSubmit}>
              {(submitError) =>
                submitError ? (
                  <p className="text-sm text-destructive">
                    {String(submitError)}
                  </p>
                ) : null
              }
            </form.Subscribe>
          </div>

          <DialogFooter className="flex-row-reverse">
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
            >
              {([canSubmit, isSubmitting]) => (
                <Button
                  type="submit"
                  size="sm"
                  disabled={!canSubmit || image === null}
                >
                  {isSubmitting ? 'יוצר…' : 'צור'}
                </Button>
              )}
            </form.Subscribe>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              בטל
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ModalRow({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <Label
          htmlFor={htmlFor}
          className="w-[71px] shrink-0 text-sm font-normal"
        >
          {label}
        </Label>
        <div className="flex flex-1 items-center gap-2">{children}</div>
      </div>
      {error ? (
        <p className="pr-[79px] text-xs text-destructive">{error}</p>
      ) : null}
    </div>
  );
}
