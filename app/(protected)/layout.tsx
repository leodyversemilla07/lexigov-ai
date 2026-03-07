import { ReactNode } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { Header } from "@/components/header";
import { UserBootstrap } from "@/components/user-bootstrap";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

export default function DashboardLayout({
    children,
}: {
    children: ReactNode;
}) {
    return (
        <SidebarProvider>
            <UserBootstrap />
            <AppSidebar />
            <SidebarInset>
                <Header />
                <main className="flex-1 overflow-y-auto p-6">
                    {children}
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
