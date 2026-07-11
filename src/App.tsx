import { Navigate, Route, Routes } from 'react-router-dom';
import { AccessBoundary } from '@/components/AccessBoundary/AccessBoundary';
import { AdminShell } from '@/components/AdminShell/AdminShell';
import { AdministrationPortfolioPage } from '@/pages/AdministrationPortfolioPage';
import { CreateSidecarPage } from '@/pages/CreateSidecarPage';
import { SidecarDetailPage } from '@/pages/SidecarDetailPage';

export function App() {
  return (
    <AccessBoundary>
      <AdminShell>
        <Routes>
          <Route path="/" element={<AdministrationPortfolioPage />} />
          <Route path="/new" element={<CreateSidecarPage />} />
          <Route path="/sidecars/:id" element={<SidecarDetailPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AdminShell>
    </AccessBoundary>
  );
}
