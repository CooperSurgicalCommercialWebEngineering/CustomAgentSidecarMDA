import type { ReactNode } from 'react';
import {
  Card,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Spinner,
  Text,
  Title2,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { useAdminAccess } from '@/hooks/useSidecarAdministration';

const useStyles = makeStyles({
  center: { minHeight: '100vh', display: 'grid', placeItems: 'center', padding: tokens.spacingHorizontalXL },
  card: { maxWidth: '560px', padding: tokens.spacingHorizontalXL, gap: tokens.spacingVerticalM },
});

export function AccessBoundary({ children }: { children: ReactNode }) {
  const styles = useStyles();
  const access = useAdminAccess();

  if (access.isLoading) return <div className={styles.center}><Spinner label="Checking administrator access" /></div>;
  if (access.isError) {
    return (
      <div className={styles.center}>
        <MessageBar intent="error"><MessageBarBody><MessageBarTitle>Access check failed</MessageBarTitle>Administrator access could not be verified.</MessageBarBody></MessageBar>
      </div>
    );
  }
  if (!access.data?.isSystemAdministrator) {
    return (
      <div className={styles.center}>
        <Card className={styles.card}>
          <Title2>System Administrator access required</Title2>
          <Text>This administration app is restricted to Power Platform System Administrators.</Text>
        </Card>
      </div>
    );
  }
  return <>{children}</>;
}
