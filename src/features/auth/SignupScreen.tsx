import { AuthScreen } from './AuthScreen';
import { Toast } from 'antd-mobile';

type SignupScreenProps = {
  onGoogle: () => void;
  onSwitchMode: () => void;
  isBusy?: boolean;
};

export function SignupScreen({ onGoogle, onSwitchMode, isBusy = false }: SignupScreenProps) {
  return (
    <AuthScreen
      mode="signup"
      onGoogle={onGoogle}
      onSwitchMode={() => {
        Toast.show({ content: 'Login em breve' });
      }}
      isBusy={isBusy}
    />
  );
}
