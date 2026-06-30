import type { ReactNode } from 'react';
import { Button } from 'antd-mobile';

type QuickActionButtonProps = {
  label: string;
  hint?: string;
  onClick: () => void;
  tone?: 'dark' | 'primary';
  icon?: ReactNode;
};

export function QuickActionButton({ label, hint, onClick, tone = 'dark', icon }: QuickActionButtonProps) {
  const isDark = tone === 'dark';

  return (
    <Button
      className={isDark ? 'quick-action-button quick-action-button--dark' : 'quick-action-button'}
      color={isDark ? 'default' : 'primary'}
      fill="solid"
      shape="rounded"
      onClick={onClick}
    >
      {icon ? <span className="quick-action-button__icon">{icon}</span> : null}
      <span className="quick-action-button__label">{label}</span>
      {hint ? <span className="quick-action-button__hint">{hint}</span> : null}
    </Button>
  );
}
