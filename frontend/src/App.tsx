import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import ProjectCreate from './pages/ProjectCreate';
import ProjectEdit from './pages/ProjectEdit';
import AssetCreate from './pages/AssetCreate';
import AssetDetail from './pages/AssetDetail';
import SegmentDetail from './pages/SegmentDetail';
import MapView from './pages/MapView';
import CADView from './pages/CADView';
import Settings from './pages/Settings';
import Capture from './pages/Capture';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="projects" element={<Projects />} />
        <Route path="projects/new" element={<ProjectCreate />} />
        <Route path="projects/:projectId" element={<ProjectDetail />} />
        <Route path="projects/:projectId/edit" element={<ProjectEdit />} />
        <Route path="projects/:projectId/assets/new" element={<AssetCreate />} />
        <Route path="projects/:projectId/assets/:assetId" element={<AssetDetail />} />
        <Route path="projects/:projectId/assets/:assetId/segments/:segmentId" element={<SegmentDetail />} />
        <Route path="projects/:projectId/map" element={<MapView />} />
        <Route path="projects/:projectId/cad" element={<CADView />} />
        <Route path="capture" element={<Capture />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

export default App;