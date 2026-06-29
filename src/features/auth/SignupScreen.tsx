import { AuthScreen } from './AuthScreen';
import type { AuthFormValues } from './AuthScreen';

type SignupScreenProps = {
  onGoogle: () => void;
  onEmailSubmit: (values: AuthFormValues) => Promise<void>;
  onSwitchMode: () => void;
  isBusy?: boolean;
};

export function SignupScreen({ onGoogle, onEmailSubmit, onSwitchMode, isBusy = false }: SignupScreenProps) {
  return (
    <AuthScreen
      mode="signup"
      onGoogle={onGoogle}
      onEmailSubmit={onEmailSubmit}
      onSwitchMode={onSwitchMode}
      isBusy={isBusy}
    />
  );
}
