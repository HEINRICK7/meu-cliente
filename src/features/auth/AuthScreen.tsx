import { Button, Card, Toast } from 'antd-mobile';

type AuthMode = 'login' | 'signup';

type AuthScreenProps = {
  mode: AuthMode;
  onGoogle: () => void;
  onSwitchMode: () => void;
  isBusy?: boolean;
};

type SocialOption = {
  label: string;
  iconLabel: string;
  tone: 'google' | 'apple' | 'facebook';
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
};

function titleForMode(mode: AuthMode) {
  return mode === 'login' ? 'Comece agora' : 'Crie sua conta';
}

function subtitleForMode(mode: AuthMode) {
  return mode === 'login'
    ? 'Bem-vindo! Entre na sua conta para continuar.'
    : 'Bem-vindo! Use sua conta Google para começar.';
}

function footerQuestionForMode(mode: AuthMode) {
  return mode === 'login' ? 'Ainda não tem uma conta?' : 'Já tem uma conta?';
}

function footerActionForMode(mode: AuthMode) {
  return mode === 'login' ? 'Cadastre-se' : 'Entrar';
}

function upcomingMessage(label: string) {
  return `${label} em breve`;
}

function SocialIcon({ tone, label }: { tone: SocialOption['tone']; label: string }) {
  return <span className={`auth-social__icon auth-social__icon--${tone}`}>{label}</span>;
}

function SocialButton({ label, iconLabel, tone, onClick, disabled, loading }: SocialOption) {
  return (
    <Button
      block
      fill="outline"
      className={`auth-social-button auth-social-button--${tone}`}
      disabled={disabled}
      loading={loading}
      onClick={onClick}
    >
      <SocialIcon tone={tone} label={iconLabel} />
      <span className="auth-social-button__text">{label}</span>
    </Button>
  );
}

export function AuthScreen({ mode, onGoogle, onSwitchMode, isBusy = false }: AuthScreenProps) {
  const googleButton: SocialOption = {
    label: 'Entrar com Google',
    iconLabel: 'G',
    tone: 'google',
    onClick: onGoogle,
    disabled: isBusy,
    loading: isBusy,
  };

  const socialButtons: SocialOption[] = [
    {
      label: 'Entrar com Apple',
      iconLabel: 'A',
      tone: 'apple',
      onClick: () => {
        Toast.show({ content: upcomingMessage('Login com Apple') });
      },
    },
    {
      label: 'Entrar com Facebook',
      iconLabel: 'f',
      tone: 'facebook',
      onClick: () => {
        Toast.show({ content: upcomingMessage('Login com Facebook') });
      },
    },
  ];

  return (
    <div className="auth-page">
      <div className="auth-page__content">
        <Card className="soft-card auth-card">
          <div className="auth-brand">
            <div className="auth-brand__badge">
              <img src="/brand/app-logo-mark.png" alt="" aria-hidden="true" className="auth-brand__image" />
            </div>
            <div className="auth-brand__copy">
              <div className="auth-brand__eyebrow">Meu Cliente</div>
              <div className="auth-brand__subtitle">Organização simples do dia</div>
            </div>
          </div>

          <div className="auth-title">{titleForMode(mode)}</div>
          <p className="auth-subtitle">{subtitleForMode(mode)}</p>

          <div className="auth-social-list">
            <SocialButton {...googleButton} />
            {socialButtons.map((button) => (
              <SocialButton key={button.label} {...button} />
            ))}
          </div>

          <div className="auth-divider" aria-hidden="true">
            <span className="auth-divider__line" />
            <span className="auth-divider__text">Ou continue com</span>
            <span className="auth-divider__line" />
          </div>

          <Button
            block
            className="auth-email-button"
            disabled={isBusy}
            onClick={() => {
              Toast.show({ content: upcomingMessage('Login com e-mail') });
            }}
          >
            Entrar com e-mail
          </Button>

          <div className="auth-footer">
            <span>{footerQuestionForMode(mode)}</span>
            <Button fill="none" className="auth-footer__action" disabled={isBusy} onClick={onSwitchMode}>
              {footerActionForMode(mode)}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
