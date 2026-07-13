import type { TargetForm } from '@/types/sidecar-admin-models';

/**
 * The Dataverse "Information" main form is the default surface a sidecar binds
 * to. Every other active main form is offered but starts unselected.
 */
export function isInformationFormName(name: string | undefined | null): boolean {
  return (name ?? '').trim().toLowerCase() === 'information';
}

/** Selects a sensible default form for a table: the Information form, else the first. */
export function defaultFormId(forms: TargetForm[]): string | undefined {
  return forms.find((form) => isInformationFormName(form.name))?.formId ?? forms[0]?.formId;
}
