import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import Onboarding from "./pages/Onboarding";
import Feed from "./pages/Feed";
import NewGame from "./pages/NewGame";
import { useProfile } from "./hooks/useProfile";

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-emerald-50 text-primary">
      <div className="flex flex-col items-center gap-3">
        <span className="loading loading-spinner loading-lg text-primary" aria-label="Lädt" />
        <p className="text-sm font-medium">Profil wird geladen…</p>
      </div>
    </div>
  );
}

function RequireProfile() {
  const { profileCompleted, isLoading } = useProfile();
  const location = useLocation();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!profileCompleted) {
    return <Navigate to="/onboarding" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

export default function App() {
  const { profileCompleted, isLoading } = useProfile();

  if (isLoading) {
    return <LoadingScreen />;
  }

  const defaultTarget = profileCompleted ? "/feed" : "/onboarding";

  return (
    <Routes>
      <Route path="/onboarding" element={<Onboarding />} />
      <Route element={<RequireProfile />}>
        <Route element={<AppLayout />}>
          <Route path="/feed" element={<Feed />} />
          <Route path="/neues-spiel" element={<NewGame />} />
        </Route>
      </Route>
      <Route path="/" element={<Navigate to={defaultTarget} replace />} />
      <Route path="*" element={<Navigate to={defaultTarget} replace />} />
    </Routes>
  );
}
