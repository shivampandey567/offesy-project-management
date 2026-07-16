import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import type { Metadata } from "next";
import { SettingsSidebar } from "@/components/settings-sidebar";

export const metadata: Metadata = {
    title: "Issue",
    description: "Your application settings",
};

export default function Layout({ children, }: { children: React.ReactNode; }) {
    return (
        <div className="min-h-screen w-full">
            <main>
                {children}
            </main>
        </div>
    );
}
