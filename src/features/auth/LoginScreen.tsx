import { AuthScreen } from './AuthScreen';
import { Toast } from 'antd-mobile';

type LoginScreenProps = {
  onGoogle: () => void;
  onSwitchMode: () => void;
  isBusy?: boolean;
};

export function LoginScreen({ onGoogle, onSwitchMode, isBusy = false }: LoginScreenProps) {
  return (
    <AuthScreen
      mode="login"
      onGoogle={onGoogle}
      onSwitchMode={() => {
        Toast.show({ content: 'Cadastro em breve' });
      }}
      isBusy={isBusy}
    />
  );
}
