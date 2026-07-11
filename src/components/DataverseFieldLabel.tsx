import type { ComponentProps, ReactNode } from 'react';
import { Label, makeStyles, tokens } from '@fluentui/react-components';
import { useDataverseFieldMetadata } from '@/hooks/use-dataverse-field-metadata';

const useStyles = makeStyles({ required: { color: tokens.colorPaletteRedForeground1, marginLeft: tokens.spacingHorizontalXXS } });

type Props = Omit<ComponentProps<typeof Label>, 'children'> & {
  tableLogicalName?: string;
  fieldLogicalName?: string;
  fallback?: ReactNode;
  required?: boolean;
  children?: ReactNode;
};

export function DataverseFieldLabel({ tableLogicalName, fieldLogicalName, fallback, required, children, ...props }: Props) {
  const styles = useStyles();
  const { data } = useDataverseFieldMetadata(tableLogicalName ?? '', fieldLogicalName ?? '');
  const text = data?.displayName ?? fallback ?? children;
  const isRequired = data?.isRequired ?? required ?? false;
  return <Label {...props}>{text}{isRequired && <span aria-hidden="true" className={styles.required}>*</span>}</Label>;
}

export function useDataverseFieldRequired(tableLogicalName?: string, fieldLogicalName?: string, fallback = false): boolean {
  const { data } = useDataverseFieldMetadata(tableLogicalName ?? '', fieldLogicalName ?? '');
  return data?.isRequired ?? fallback;
}
