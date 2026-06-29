import { AuthScreen } from './AuthScreen';

type SignupScreenProps = {
  onGoogle: () => void;
  onSwitchMode: () => void;
};

export function SignupScreen({ onGoogle, onSwitchMode }: SignupScreenProps) {
  return <AuthScreen mode="signup" onGoogle={onGoogle} onSwitchMode={onSwitchMode} />;
}
