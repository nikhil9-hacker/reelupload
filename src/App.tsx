import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Setup from './pages/Setup';
import Dashboard from './pages/Dashboard';
import CalendarPage from './pages/Calendar';
import Library from './pages/Library';
import Settings from './pages/Settings';
import UploadLogs from './pages/UploadLogs';
import NotFound from './pages/NotFound';
import { MainLayout } from './components/layouts/MainLayout';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        {/* Public Routes outside layout */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/setup" element={<Setup />} />
        <Route path="/onboarding" element={<Setup />} />

        {/* Private/Main App Layout Routes */}
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/library" element={<Library />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/logs" element={<UploadLogs />} />
        </Route>

        {/* 404 & Fallback Routes */}
        <Route path="/not-found" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/not-found" replace />} />
      </Routes>
    </HashRouter>
  );
}
