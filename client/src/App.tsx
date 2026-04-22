import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppShell } from './components/AppShell';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { SwipePage } from './pages/SwipePage';
import { LikedPage } from './pages/LikedPage';
import { SettingsPage } from './pages/SettingsPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { AchievementsPage } from './pages/AchievementsPage';

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Onboarding requires auth. */}
      <Route element={<ProtectedRoute />}>
        <Route path="/onboarding" element={<OnboardingPage />} />
      </Route>

      {/* Shell is public; each page handles its own logged-out state. */}
      <Route element={<AppShell />}>
        <Route index element={<SwipePage />} />
        <Route path="liked" element={<LikedPage />} />
        <Route path="achievements" element={<AchievementsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
