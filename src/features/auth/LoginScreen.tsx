import { AuthScreen } from './AuthScreen';
import type { AuthFormValues } from './AuthScreen';

type LoginScreenProps = {
  onGoogle: () => void;
  onEmailSubmit: (values: AuthFormValues) => Promise<void>;
  onSwitchMode: () => void;
  isBusy?: boolean;
};

export function LoginScreen({ onGoogle, onEmailSubmit, onSwitchMode, isBusy = false }: LoginScreenProps) {
  return (
    <AuthScreen
      mode="login"
      onGoogle={onGoogle}
      onEmailSubmit={onEmailSubmit}
      onSwitchMode={onSwitchMode}
      isBusy={isBusy}
    />
  );
}
