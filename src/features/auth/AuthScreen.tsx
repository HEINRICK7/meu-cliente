import { Button, Card, Form, Input, Popup, Toast } from 'antd-mobile';
import { useMemo, useState } from 'react';

type AuthMode = 'login' | 'signup';

export type AuthFormValues = {
  name?: string;
  email: string;
  password: string;
};

type AuthScreenProps = {
  mode: AuthMode;
  onGoogle: () => void;
  onEmailSubmit: (values: AuthFormValues) => Promise<void>;
  onSwitchMode: () => void;
  isBusy?: boolean;
};

type SocialOption = {
  label: string;
  iconSrc: string;
  iconAlt: string;
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
    : 'Bem-vindo! Use sua conta Google ou e-mail para começar.';
}

function footerQuestionForMode(mode: AuthMode) {
  return mode === 'login' ? 'Ainda não tem uma conta?' : 'Já tem uma conta?';
}

function footerActionForMode(mode: AuthMode) {
  return mode === 'login' ? 'Cadastre-se' : 'Entrar';
}

function emailButtonLabelForMode(mode: AuthMode) {
  return mode === 'login' ? 'Entrar com e-mail' : 'Criar conta com e-mail';
}

function emailPopupTitleForMode(mode: AuthMode) {
  return mode === 'login' ? 'Entrar com e-mail' : 'Criar conta com e-mail';
}

function emailSubmitLabelForMode(mode: AuthMode) {
  return mode === 'login' ? 'Entrar' : 'Criar conta';
}

function SocialIcon({ iconSrc, iconAlt, tone }: Pick<SocialOption, 'iconSrc' | 'iconAlt' | 'tone'>) {
  return (
    <span className={`auth-social__icon auth-social__icon--${tone}`}>
      <img src={iconSrc} alt={iconAlt} className="auth-social__icon-image" />
    </span>
  );
}

function SocialButton({ label, iconSrc, iconAlt, tone, onClick, disabled, loading }: SocialOption) {
  return (
    <Button
      block
      fill="outline"
      className={`auth-social-button auth-social-button--${tone}`}
      disabled={disabled}
      loading={loading}
      onClick={onClick}
    >
      <span className="auth-social-button__inner">
        <SocialIcon iconSrc={iconSrc} iconAlt={iconAlt} tone={tone} />
        <span className="auth-social-button__text">{label}</span>
      </span>
    </Button>
  );
}

export function AuthScreen({ mode, onGoogle, onEmailSubmit, onSwitchMode, isBusy = false }: AuthScreenProps) {
  const [form] = Form.useForm<AuthFormValues>();
  const [emailPopupVisible, setEmailPopupVisible] = useState(false);

  const googleButton: SocialOption = useMemo(
    () => ({
      label: 'Sign in with Google',
      iconSrc: '/brand/logo-google.png',
      iconAlt: 'Google',
      tone: 'google',
      onClick: onGoogle,
      disabled: isBusy,
      loading: isBusy,
    }),
    [isBusy, onGoogle],
  );

  const socialButtons: SocialOption[] = useMemo(
    () => [
      {
        label: 'Sign in with Apple',
        iconSrc: '/brand/logo-apple.png',
        iconAlt: 'Apple',
        tone: 'apple',
        onClick: () => {
          Toast.show({ content: 'Login com Apple em breve' });
        },
        disabled: isBusy,
      },
      {
        label: 'Sign in with Facebook',
        iconSrc: '/brand/logo-facebook.png',
        iconAlt: 'Facebook',
        tone: 'facebook',
        onClick: () => {
          Toast.show({ content: 'Login com Facebook em breve' });
        },
        disabled: isBusy,
      },
    ],
    [isBusy],
  );

  async function handleEmailSubmit() {
    try {
      const values = await form.validateFields();
      await onEmailSubmit(values as AuthFormValues);
      setEmailPopupVisible(false);
    } catch {
      // Validation already marks the missing fields.
    }
  }

  function openEmailPopup() {
    form.resetFields();

    if (mode === 'signup') {
      form.setFieldsValue({ name: '', email: '', password: '' });
    } else {
      form.setFieldsValue({ email: '', password: '' });
    }

    setEmailPopupVisible(true);
  }

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
            color="primary"
            fill="solid"
            disabled={isBusy}
            loading={isBusy}
            onClick={openEmailPopup}
          >
            {emailButtonLabelForMode(mode)}
          </Button>

          <div className="auth-footer">
            <span>{footerQuestionForMode(mode)}</span>
            <Button fill="none" className="auth-footer__action" disabled={isBusy} onClick={onSwitchMode}>
              {footerActionForMode(mode)}
            </Button>
          </div>
        </Card>
      </div>

      <Popup
        visible={emailPopupVisible}
        onMaskClick={() => setEmailPopupVisible(false)}
        position="bottom"
        bodyStyle={{
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          minHeight: '58vh',
          padding: '18px 16px calc(18px + env(safe-area-inset-bottom))',
        }}
      >
        <div className="auth-popup">
          <div className="auth-popup__handle" />
          <div className="auth-popup__title">{emailPopupTitleForMode(mode)}</div>
          <p className="auth-popup__subtitle">
            {mode === 'login'
              ? 'Entre com seu e-mail e senha para acessar sua conta.'
              : 'Preencha seus dados para criar sua conta.'}
          </p>

          <Form className="auth-form" form={form} layout="vertical" disabled={isBusy}>
            {mode === 'signup' ? (
              <Form.Item name="name" label="Nome" rules={[{ required: true, message: 'Informe seu nome.' }]}>
                <Input placeholder="Seu nome" autoComplete="name" clearable />
              </Form.Item>
            ) : null}

            <Form.Item
              name="email"
              label="E-mail"
              rules={[
                { required: true, message: 'Informe seu e-mail.' },
                { type: 'email', message: 'Informe um e-mail válido.' },
              ]}
            >
              <Input placeholder="seuemail@dominio.com" autoComplete="email" clearable />
            </Form.Item>

            <Form.Item
              name="password"
              label="Senha"
              rules={[
                { required: true, message: 'Informe sua senha.' },
                { min: 6, message: 'A senha precisa ter pelo menos 6 caracteres.' },
              ]}
            >
              <Input
                placeholder="Sua senha"
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                clearable
              />
            </Form.Item>

            <Button
              block
              className="auth-email-button"
              color="primary"
              fill="solid"
              loading={isBusy}
              onClick={handleEmailSubmit}
            >
              {emailSubmitLabelForMode(mode)}
            </Button>

            <Button
              block
              style={{ marginTop: 12 }}
              onClick={() => setEmailPopupVisible(false)}
            >
              Fechar
            </Button>
          </Form>
        </div>
      </Popup>
    </div>
  );
}
