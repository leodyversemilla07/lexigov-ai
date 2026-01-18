
import { Button } from '@lexigov/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@lexigov/ui';
import { Input } from '@lexigov/ui';
import { Label } from '@lexigov/ui';

export default function TestPage() {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <Card className="w-[400px]">
                <CardHeader>
                    <CardTitle>Design System Check</CardTitle>
                    <CardDescription>
                        Testing components from @lexigov/ui shared package
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" placeholder="hello@example.com" />
                    </div>
                    <Button className="w-full">
                        Component Test Successful
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
