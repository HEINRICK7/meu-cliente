import { Button, Empty } from 'antd-mobile';

type EmptyStateProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <Empty description={title} />
      {description ? <p className="muted-text empty-state__text">{description}</p> : null}
      {actionLabel && onAction ? (
        <Button color="primary" fill="solid" shape="rounded" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
