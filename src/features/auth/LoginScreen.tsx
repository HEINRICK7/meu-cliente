import { AuthScreen } from './AuthScreen';

type LoginScreenProps = {
  onGoogle: () => void;
  onSwitchMode: () => void;
};

export function LoginScreen({ onGoogle, onSwitchMode }: LoginScreenProps) {
  return <AuthScreen mode="login" onGoogle={onGoogle} onSwitchMode={onSwitchMode} />;
}
