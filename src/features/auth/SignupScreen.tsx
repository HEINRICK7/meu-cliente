import type { SocialProvider } from '../../types/domain';
import type { AuthValues } from './AuthScreen';
import { AuthScreen } from './AuthScreen';

type SignupScreenProps = {
  onSubmit: (values: AuthValues) => void;
  onSocial: (provider: SocialProvider) => void;
  onSwitchMode: () => void;
};

export function SignupScreen({ onSubmit, onSocial, onSwitchMode }: SignupScreenProps) {
  return (
    <AuthScreen
      mode="signup"
      onSubmit={onSubmit}
      onSocial={onSocial}
      onSwitchMode={onSwitchMode}
    />
  );
}
