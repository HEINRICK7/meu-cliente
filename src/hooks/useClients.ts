import { useEffect, useMemo, useState } from 'react';
import type { Client, ClientStatus, ClientUpsertInput } from '../types/domain';
import { createClientRecord, listenClients, updateClientRecord } from '../services/clientsService';

type UseClientsResult = {
  clients: Client[];
  loading: boolean;
  error: string | null;
  createClient: (input: ClientUpsertInput, ownerId: string) => Promise<Client>;
  updateClient: (clientId: string, input: ClientUpsertInput) => Promise<void>;
};

export function useClients(businessId: string | null, ownerId: string | null): UseClientsResult {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!businessId) {
      setClients([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = listenClients(
      businessId,
      (nextClients) => {
        setClients(nextClients);
        setLoading(false);
        setError(null);
      },
      () => {
        setClients([]);
        setLoading(false);
        setError('Não foi possível carregar os clientes agora.');
      },
    );

    return () => unsubscribe();
  }, [businessId, ownerId]);

  const sortedClients = useMemo(
    () => [...clients].sort((left, right) => (right.createdAt || '').localeCompare(left.createdAt || '')),
    [clients],
  );

  async function createClient(input: ClientUpsertInput, creatorId: string) {
    if (!businessId) {
      throw new Error('Business indisponível para criar cliente.');
    }

    const client = await createClientRecord({
      businessId,
      ownerId: ownerId || creatorId,
      input,
    });

    return client;
  }

  async function updateClient(clientId: string, input: ClientUpsertInput) {
    await updateClientRecord({ clientId, input });
  }

  return {
    clients: sortedClients,
    loading,
    error,
    createClient,
    updateClient,
  };
}
