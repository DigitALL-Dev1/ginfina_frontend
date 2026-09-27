import { Alert, Button, Center, Loader, Stack, Text } from '@mantine/core';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { canAccessModule, roleHome } from '../../utils/moduleAccess';

export default function ModuleAccess() {
  const { user, loading, error, signOut } = useAuth();
  const { pathname } = useLocation();
  if (loading) return <Center mih="60vh"><Loader aria-label="Checking account access" /></Center>;
  if (error) return <Center mih="60vh" p="md"><Stack><Alert color="red">{error}</Alert><Button onClick={signOut}>Sign in again</Button></Stack></Center>;
  if (!user) return <Navigate to="/ginfina/login" replace />;
  if (pathname === '/ginfina/no-access') return <Outlet />;
  if (!canAccessModule(user.role, pathname)) return <Navigate to={roleHome(user.role)} replace />;
  return <Outlet />;
}

export function NoModuleAccess() {
  const { user, signOut } = useAuth();
  return <Stack p="xl" align="flex-start"><Text fw={700}>No modules assigned</Text>
    <Text>Module access has not been configured for your {user?.role || 'account'} role. Contact your administrator.</Text>
    <Button onClick={signOut}>Sign out</Button></Stack>;
}
