import { Button } from '@jarvis/ui/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@jarvis/ui/components/ui/dialog';
import type { ComponentType, PropsWithChildren, ReactNode } from 'react';
import closeIcon from '../../assets/close.svg';
import { Icon } from '../icon';
import {
  DescriptionField,
  EmptyFieldsClassesField,
  EnglishNameField,
  GeographyField,
  HebrewNameField,
  PositiveTaggingClassesField,
  ResolutionRangeField,
  SensorGroupField,
  SubmitButton,
} from './model-form-parts';

type ModelFormHandle = {
  AppForm: ComponentType<PropsWithChildren>;
  handleSubmit: () => Promise<void>;
};

function ModelFormDialog({
  form,
  title,
  onClose,
  children,
}: {
  form: ModelFormHandle;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <form.AppForm>
      <Dialog
        open
        onOpenChange={(next) => {
          if (!next) onClose();
        }}
      >
        <DialogContent className="gap-0 p-0">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
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
            className="flex min-h-0 flex-1 flex-col"
          >
            {children}
          </form>
        </DialogContent>
      </Dialog>
    </form.AppForm>
  );
}

function ModelFormBody({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 py-4">
      {children}
    </div>
  );
}

function ModelFormSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <>
      <div className="h-px w-full bg-line-subtle" />
      <h3 className="text-sm font-medium">{title}</h3>
      {children}
    </>
  );
}

function ModelFormFooter({
  cancelLabel,
  onCancel,
  children,
}: {
  cancelLabel: string;
  onCancel: () => void;
  children: ReactNode;
}) {
  return (
    /* The design pins these to the left edge, opposite the RTL reading start — reverse
       here rather than reordering, so the primary button still stays first in the DOM. */
    <DialogFooter className="flex-row-reverse">
      {children}
      <Button type="button" size="sm" variant="outline" onClick={onCancel}>
        {cancelLabel}
      </Button>
    </DialogFooter>
  );
}

export const ModelForm = {
  Dialog: ModelFormDialog,
  Body: ModelFormBody,
  Section: ModelFormSection,
  Footer: ModelFormFooter,
  Submit: SubmitButton,
  HebrewNameField,
  EnglishNameField,
  DescriptionField,
  SensorGroupField,
  ResolutionRangeField,
  GeographyField,
  PositiveTaggingClassesField,
  EmptyFieldsClassesField,
};
