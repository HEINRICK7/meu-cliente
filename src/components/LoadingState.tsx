import { Card, Skeleton } from 'antd-mobile';

type LoadingStateProps = {
  lines?: number;
};

export function LoadingState({ lines = 3 }: LoadingStateProps) {
  return (
    <div className="screen-stack">
      <Card className="soft-card highlight-card">
        <Skeleton.Title animated />
        <Skeleton.Paragraph lineCount={2} animated />
      </Card>
      {Array.from({ length: lines }).map((_, index) => (
        <Card key={index} className="soft-card">
          <Skeleton.Title animated />
          <Skeleton.Paragraph lineCount={2} animated />
        </Card>
      ))}
    </div>
  );
}
