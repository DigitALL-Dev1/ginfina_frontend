import { Navigate, Route, Routes } from 'react-router-dom';
import screenSpecs from './config/screenSpecs.json';
import { relativeGinfinaPath } from './utils/routes';
import GinfinaAppShell from './components/shell/GinfinaAppShell';
import GinfinaScreen from './screens/GinfinaScreen';
import BranchPage from './screens/BranchPage';
import UiCatalog from './screens/UiCatalog';
import WelcomePage from './screens/WelcomePage';
import { AuthProvider } from './components/auth/AuthProvider';
import ModuleAccess, { NoModuleAccess } from './components/auth/ModuleAccess';

export default function App() {
  const login = screenSpecs.find(screen => screen.id === 'GIN-UI-001');
  const appScreens = screenSpecs.filter(screen => screen.id !== 'GIN-UI-001');
  return <AuthProvider><Routes>
    <Route path="/" element={<Navigate to="/ginfina/login" replace />} />
    <Route path="/ginfina/login" element={<GinfinaScreen spec={login} />} />
    <Route path="/reset-password" element={<GinfinaScreen spec={login} />} />
    <Route element={<ModuleAccess />}>
      <Route path="/ginfina" element={<GinfinaAppShell />}>
        <Route index element={<WelcomePage />} />
        <Route path="no-access" element={<NoModuleAccess />} />
        <Route path="ui-catalog" element={<UiCatalog />} />
        <Route path="ui-branch/:screenId/:branchKey" element={<BranchPage />} />
        {appScreens.map(spec => <Route key={spec.id} path={relativeGinfinaPath(spec.route)} element={<GinfinaScreen spec={spec} />} />)}
      </Route>
    </Route>
    <Route path="*" element={<Navigate to="/ginfina" replace />} />
  </Routes></AuthProvider>;
}
