import { useAuth } from '../AuthProvider';
import { AppLayout } from '../layout/AppLayout';
import { AppRoutes } from './AppRoutes';
import { AppLoadingState, AppErrorState, AppSetupState } from './AppLoadingStates';
import { useFamilyData } from '../../hooks/useFamilyData';
import { FamilyInheritance } from '../FamilyInheritance';

export const AppContent = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { persons, loading: dataLoading, error, needsSetup, refetch, familyInheritance, acceptInvitation } = useFamilyData(user);

  console.log(' AppContent - User state:', { user: !!user, email: user?.email, loading: authLoading });

  if (authLoading) {
    return <AppLoadingState message="Authenticating..." />;
  }

  if (needsSetup) {
    return <AppSetupState onRetry={refetch} />;
  }

  if (error) {
    return <AppErrorState error={error} onRetry={refetch} />;
  }

  return (
    <AppLayout signOut={signOut} user={user}>
      <FamilyInheritance 
        familyInheritance={familyInheritance}
        onAcceptInvitation={acceptInvitation}
        loading={dataLoading}
      />
      <AppRoutes 
        persons={persons} 
        dataLoading={dataLoading} 
        onPersonAdded={refetch} 
      />
    </AppLayout>
  );
};
