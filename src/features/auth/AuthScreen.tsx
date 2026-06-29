import { Button, Card } from 'antd-mobile';
import { GlobalOutline, RightOutline } from 'antd-mobile-icons';

type AuthMode = 'login' | 'signup';

type AuthScreenProps = {
  mode: AuthMode;
  onGoogle: () => void;
  onSwitchMode: () => void;
  isBusy?: boolean;
};

function titleForMode(mode: AuthMode) {
  return mode === 'login' ? 'Entrar' : 'Criar conta';
}

function subtitleForMode(mode: AuthMode) {
  return mode === 'login'
    ? 'Acesse o Meu Cliente com sua conta Google.'
    : 'Crie sua conta com Google para começar rapidamente.';
}

function buttonLabelForMode(mode: AuthMode) {
  return mode === 'login' ? 'Entrar com Google' : 'Criar conta com Google';
}

function switchCopyForMode(mode: AuthMode) {
  return mode === 'login' ? 'Não tem conta?' : 'Já tem conta?';
}

function switchActionForMode(mode: AuthMode) {
  return mode === 'login' ? 'Criar conta' : 'Entrar';
}

export function AuthScreen({ mode, onGoogle, onSwitchMode, isBusy = false }: AuthScreenProps) {
  return (
    <div className="auth-page">
      <div className="auth-page__content">
        <Card className="soft-card auth-hero">
          <div className="auth-brand">
            <div className="auth-brand__badge">
              <img src="/brand/app-logo-wide.png" alt="" aria-hidden="true" className="auth-brand__image" />
            </div>
            <div>
              <div className="auth-brand__eyebrow">Meu Cliente</div>
              <div className="auth-brand__subtitle">Gestão simples do dia a dia</div>
            </div>
          </div>

          <div className="auth-hero__title">{titleForMode(mode)}</div>
          <p className="auth-hero__text">{subtitleForMode(mode)}</p>

          <div className="auth-hero__badge-row" aria-hidden="true">
            <span>Google</span>
            <span>Clientes</span>
            <span>Agenda</span>
          </div>

          <Button
            block
            color="primary"
            size="large"
            className="auth-submit"
            loading={isBusy}
            disabled={isBusy}
            onClick={onGoogle}
          >
            <GlobalOutline />
            {buttonLabelForMode(mode)}
          </Button>

          <div className="auth-switch">
            <span>{switchCopyForMode(mode)}</span>
            <Button fill="none" onClick={onSwitchMode} disabled={isBusy}>
              {switchActionForMode(mode)}
              <RightOutline />
            </Button>
          </div>

          <div className="auth-footer__text auth-footer__text--center">
            Entrar e criar conta usam a mesma experiência com Google.
          </div>
        </Card>
      </div>
    </div>
  );
}
