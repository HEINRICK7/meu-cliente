import type { SocialProvider } from '../../types/domain';
import type { AuthValues } from './AuthScreen';
import { AuthScreen } from './AuthScreen';

type LoginScreenProps = {
  onSubmit: (values: AuthValues) => void;
  onSocial: (provider: SocialProvider) => void;
  onSwitchMode: () => void;
};

export function LoginScreen({ onSubmit, onSocial, onSwitchMode }: LoginScreenProps) {
  return (
    <AuthScreen
      mode="login"
      onSubmit={onSubmit}
      onSocial={onSocial}
      onSwitchMode={onSwitchMode}
    />
  );
}
