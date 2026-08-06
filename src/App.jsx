import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OtpVerifyPage from './pages/OtpVerifyPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import AccountsPage from './pages/AccountsPage';
import FamilyPage from './pages/FamilyPage';
import TwoFactorPage from './pages/TwoFactorPage';
import HealthPage from './pages/HealthPage';
import CauseAdminPage from './pages/CauseAdminPage';
import CausePublicPage from './pages/CausePublicPage';
import CausesListPage from './pages/CausesListPage';
import DonatePage from './pages/DonatePage';
import DisbursementsPage from './pages/DisbursementsPage';
import BeneficiaryPage from './pages/BeneficiaryPage';
import MessagesPage from './pages/MessagesPage';
import HelpPage from './pages/HelpPage';
import AdminPage from './pages/AdminPage';
import PublicEntityPage from './pages/PublicEntityPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Rotas públicas */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify" element={<OtpVerifyPage />} />
          <Route path="/q/:uniqueCode" element={<PublicEntityPage />} />
          {/* Ajuda é pública: o rodapé do site aponta para cá, e quem
              ainda não tem conta é quem mais precisa entender como o
              sistema funciona antes de se cadastrar. */}
          <Route path="/ajuda" element={<HelpPage />} />
          {/* Vitrine pública da causa — Fase 3, T2-R04.
              A listagem redireciona para a home quando não há nenhuma causa
              publicada (decisão do proprietário, 06/08/2026). */}
          <Route path="/causas" element={<CausesListPage />} />
          <Route path="/causa/:slug" element={<CausePublicPage />} />
          {/* URL única do beneficiário — Fase 4, T4-R05/R06/R07.
              Pública por definição: o beneficiário não tem conta. */}
          <Route path="/b/:uniqueCode" element={<BeneficiaryPage />} />
          {/*
            Mapa de calor (Fase 6, T2-R07) — DESATIVADO em 06/08/2026 por
            decisão do proprietário.

            A rota foi removida; a página segue em src/pages/HeatmapPage.jsx
            e o backend continua agregando as leituras em `heatmap_cells`.
            Para reativar, basta importar a página e devolver esta linha:

              <Route path="/mapa" element={<HeatmapPage />} />
          */}

          {/* Rotas protegidas */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/painel" element={<DashboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            {/* Minhas contas e vínculos — Fase 0, entrega 0.11 (TX-R02..R04) */}
            <Route path="/contas" element={<AccountsPage />} />
            {/* Árvore genealógica — Fase 1, entrega 1.6 (T1-R02) */}
            <Route path="/familia" element={<FamilyPage />} />
            {/* Verificação em duas etapas — Fase 1, entrega 1.5 (T1-R05) */}
            <Route path="/seguranca" element={<TwoFactorPage />} />
            {/* Diário de saúde e medicação — Fase 6, T1-R08 a T1-R11 */}
            <Route path="/saude" element={<HealthPage />} />
            {/* Painel da causa: vitrine, moderação e lotes — Fase 3 */}
            <Route path="/causa" element={<CauseAdminPage />} />
            {/* Doações — Fase 4, T4-R01 a T4-R04 */}
            <Route path="/doacoes" element={<DonatePage />} />
            {/* Beneficiários e repasses — Fase 4, T4-R03/R05/R06/R08 */}
            <Route path="/repasses" element={<DisbursementsPage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Route>

          {/* Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
