import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@lexigov/ui/components/card';

type SidePanelCardProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
};

export function SidePanelCard({ title, description, children, className }: SidePanelCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className='text-base'>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className='p-4'>{children}</CardContent>
    </Card>
  );
}
