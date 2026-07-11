import { useNavigate } from 'react-router-dom';
import { PortfolioDashboard } from '@/components/PortfolioDashboard/PortfolioDashboard';
import { useSidecarConfigurations } from '@/hooks/useSidecarAdministration';

export function AdministrationPortfolioPage() {
  const navigate = useNavigate();
  const configurations = useSidecarConfigurations();
  return (
    <PortfolioDashboard
      configurations={configurations.data}
      loading={configurations.isLoading}
      error={configurations.error instanceof Error ? configurations.error.message : undefined}
      onCreate={() => navigate('/new')}
      onOpen={(id) => navigate(`/sidecars/${id}`)}
    />
  );
}
