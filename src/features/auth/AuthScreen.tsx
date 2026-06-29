import {
  CalendarOutline,
  CheckCircleOutline,
  AppOutline,
  GlobalOutline,
  PhoneFill,
  TeamOutline,
  RightOutline,
} from 'antd-mobile-icons';
import { Button, Card, Divider, Form, Input, Tag } from 'antd-mobile';
import type { ComponentType, SVGProps } from 'react';
import type { SocialProvider } from '../../types/domain';

type AuthMode = 'login' | 'signup';
type SocialIcon = ComponentType<SVGProps<SVGSVGElement>>;

export type AuthValues = {
  name?: string;
  email: string;
  password: string;
};

type AuthScreenProps = {
  mode: AuthMode;
  onSubmit: (values: AuthValues) => void;
  onSocial: (provider: SocialProvider) => void;
  onSwitchMode: () => void;
};

const socialButtons: Array<{ provider: SocialProvider; label: string; icon: SocialIcon; accent: string }> = [
  { provider: 'google', label: 'Google', icon: GlobalOutline, accent: '#4285F4' },
  { provider: 'apple', label: 'Apple', icon: AppOutline, accent: '#111111' },
  { provider: 'facebook', label: 'Facebook', icon: TeamOutline, accent: '#1877F2' },
];

function titleForMode(mode: AuthMode) {
  return mode === 'login' ? 'Entrar' : 'Criar conta';
}

function subtitleForMode(mode: AuthMode) {
  return mode === 'login'
    ? 'Acesse seu painel para ver o dia, clientes e atendimentos.'
    : 'Crie sua conta para começar a organizar sua agenda e seus clientes.';
}

function submitLabelForMode(mode: AuthMode) {
  return mode === 'login' ? 'Entrar agora' : 'Criar conta';
}

function socialLabelForMode(mode: AuthMode) {
  return mode === 'login' ? 'Entrar com' : 'Criar com';
}

function switchCopyForMode(mode: AuthMode) {
  return mode === 'login' ? 'Ainda não tem conta?' : 'Já tem conta?';
}

function switchActionForMode(mode: AuthMode) {
  return mode === 'login' ? 'Criar conta' : 'Entrar';
}

export function AuthScreen({ mode, onSubmit, onSocial, onSwitchMode }: AuthScreenProps) {
  const isSignup = mode === 'signup';

  return (
    <div className="auth-page">
      <div className="auth-page__glow auth-page__glow--left" aria-hidden="true" />
      <div className="auth-page__glow auth-page__glow--right" aria-hidden="true" />

      <div className="auth-page__content">
        <Card className="soft-card auth-hero">
          <div className="auth-brand">
            <div className="auth-brand__badge">MC</div>
            <div>
              <div className="auth-brand__eyebrow">Meu Cliente</div>
              <div className="auth-brand__subtitle">Organização simples do dia</div>
            </div>
          </div>

          <div className="auth-hero__title">{titleForMode(mode)}</div>
          <p className="auth-hero__text">{subtitleForMode(mode)}</p>

          <div className="auth-hero__chips" aria-hidden="true">
            <span>Clientes</span>
            <span>Agenda</span>
            <span>Atendimentos</span>
          </div>
        </Card>

        <Card className="soft-card auth-card">
          <div className="auth-card__lead">
            <Tag color="warning" fill="outline">
              App instalável
            </Tag>
            <div className="auth-card__title">{mode === 'login' ? 'Entre com sua conta' : 'Crie sua conta'}</div>
            <p className="auth-card__text">
              {mode === 'login'
                ? 'Use seu email ou uma conta social para acessar a versão demo.'
                : 'Leva menos de um minuto para começar a testar o sistema.'}
            </p>
          </div>

          <div className="auth-points">
            <div className="auth-points__item">
              <CheckCircleOutline />
              <span>Acesso rápido e sem complicação</span>
            </div>
            <div className="auth-points__item">
              <CalendarOutline />
              <span>Pronto para instalar no navegador</span>
            </div>
            <div className="auth-points__item">
              <PhoneFill />
              <span>Feito para celular primeiro</span>
            </div>
          </div>

          <div className="auth-social">
            <div className="auth-social__label">{socialLabelForMode(mode)}</div>
            <div className="auth-social__grid">
              {socialButtons.map((item) => (
                <Button
                  key={item.provider}
                  className="auth-social__button"
                  fill="outline"
                  type="button"
                  onClick={() => onSocial(item.provider)}
                >
                  <span className="auth-social__icon" style={{ backgroundColor: item.accent }}>
                    <item.icon className="auth-social__glyph" aria-hidden="true" />
                  </span>
                  <span>{item.label}</span>
                </Button>
              ))}
            </div>
          </div>

          <Divider contentPosition="center">ou continue com email</Divider>

          <Form
            layout="vertical"
            footer={
              <Button block color="primary" size="large" type="submit" className="auth-submit">
                {submitLabelForMode(mode)}
              </Button>
            }
            onFinish={(values) => {
              onSubmit({
                name: values.name?.trim(),
                email: values.email.trim(),
                password: values.password,
              });
            }}
          >
            {isSignup ? (
              <Form.Item
                label="Nome"
                name="name"
                rules={[{ required: true, message: 'Informe seu nome' }]}
              >
                <Input placeholder="Seu nome" clearable />
              </Form.Item>
            ) : null}

            <Form.Item
              label="E-mail"
              name="email"
              rules={[
                { required: true, message: 'Informe seu e-mail' },
                { type: 'email', message: 'Digite um e-mail válido' },
              ]}
            >
              <Input placeholder="voce@exemplo.com" clearable />
            </Form.Item>

            <Form.Item
              label="Senha"
              name="password"
              rules={[{ required: true, message: 'Informe sua senha' }]}
            >
              <Input placeholder="Sua senha" type="password" clearable />
            </Form.Item>
          </Form>

          <div className="auth-switch">
            <span>{switchCopyForMode(mode)}</span>
            <Button fill="none" onClick={onSwitchMode}>
              {switchActionForMode(mode)}
              <RightOutline />
            </Button>
          </div>
        </Card>

        <div className="auth-footer">
          <div className="auth-footer__text">
            Faça login com email ou social para acessar a versão demo do sistema.
          </div>
        </div>
      </div>
    </div>
  );
}
