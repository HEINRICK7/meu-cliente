import { useEffect, useState } from 'react';
import type { Business, User } from '../types/domain';
import { listenBusinessProfile, listenUserProfile } from '../services/organizationService';

type UseOrganizationResult = {
  userProfile: User | null;
  businessProfile: Business | null;
  loading: boolean;
  error: string | null;
};

export function useOrganization(userId: string | null, businessId: string | null): UseOrganizationResult {
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [businessProfile, setBusinessProfile] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId || !businessId) {
      setUserProfile(null);
      setBusinessProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribeUser = listenUserProfile(
      userId,
      (nextUser) => {
        setUserProfile(nextUser);
        setLoading(false);
        setError(null);
      },
      () => {
        setUserProfile(null);
        setLoading(false);
        setError('Não foi possível carregar os dados da conta.');
      },
    );

    const unsubscribeBusiness = listenBusinessProfile(
      businessId,
      (nextBusiness) => {
        setBusinessProfile(nextBusiness);
        setLoading(false);
        setError(null);
      },
      () => {
        setBusinessProfile(null);
        setLoading(false);
        setError('Não foi possível carregar os dados do negócio.');
      },
    );

    return () => {
      unsubscribeUser();
      unsubscribeBusiness();
    };
  }, [businessId, userId]);

  return {
    userProfile,
    businessProfile,
    loading,
    error,
  };
}
