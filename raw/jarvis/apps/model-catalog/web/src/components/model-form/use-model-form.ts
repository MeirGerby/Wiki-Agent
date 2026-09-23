import { createFormHook } from '@tanstack/react-form';
import { fieldContext, formContext } from './model-form-context';

export const { useAppForm: useModelForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {},
  formComponents: {},
});
