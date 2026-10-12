import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import { LoginPage, RegisterPage } from './pages/AuthPages';
import { ResourcesPage, SnippetsPage, TasksPage } from './pages/WorkspacePages';

function WorkspaceLayout() {
  return <div className="app-shell"><Navbar /><main className="main-content"><Outlet /></main></div>;
}

export default function App() {
  return <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route element={<ProtectedRoute />}>
      <Route element={<WorkspaceLayout />}>
        <Route index element={<Navigate to="/resources" replace />} />
        <Route path="resources" element={<ResourcesPage />} />
        <Route path="snippets" element={<SnippetsPage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="*" element={<Navigate to="/resources" replace />} />
      </Route>
    </Route>
  </Routes>;
}
