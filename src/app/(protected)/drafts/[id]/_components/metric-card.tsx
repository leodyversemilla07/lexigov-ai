import { Card, CardContent } from "@/components/ui/card";

type MetricCardProps = {
    label: string;
    value: string;
    detail: string;
};

export function MetricCard({ label, value, detail }: MetricCardProps) {
    return (
        <Card>
            <CardContent className="p-4">
                <div className="text-xs font-medium text-muted-foreground">{label}</div>
                <div className="mt-2 text-2xl font-bold">{value}</div>
                <div className="mt-1 text-xs text-muted-foreground">{detail}</div>
            </CardContent>
        </Card>
    );
}
