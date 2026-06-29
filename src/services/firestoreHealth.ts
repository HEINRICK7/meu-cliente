let firestoreUnavailableMessage: string | null = null;

function isDatabaseMissingError(error: unknown) {
  const text = String(error ?? '');

  return (
    text.includes("Database '(default)' not found") ||
    text.includes("database '(default)' not found") ||
    text.includes('Please check your project configuration')
  );
}

export function isFirestoreUnavailableError(error: unknown) {
  const text = String(error ?? '');

  return isDatabaseMissingError(error) || text.includes('Firestore deste projeto ainda não foi criado');
}

export function markFirestoreUnavailable(error: unknown) {
  if (firestoreUnavailableMessage || !isDatabaseMissingError(error)) {
    return;
  }

  firestoreUnavailableMessage =
    'O Firestore deste projeto ainda não foi criado no Firebase. Crie o banco padrão (default) para salvar e sincronizar dados.';
}

export function isFirestoreUnavailable() {
  return firestoreUnavailableMessage !== null;
}

export function getFirestoreUnavailableMessage() {
  return firestoreUnavailableMessage;
}

export function assertFirestoreAvailable() {
  if (firestoreUnavailableMessage) {
    throw new Error(firestoreUnavailableMessage);
  }
}

export async function runFirestoreOperation<T>(operation: Promise<T>) {
  assertFirestoreAvailable();

  try {
    return await operation;
  } catch (error) {
    markFirestoreUnavailable(error);
    throw error;
  }
}
