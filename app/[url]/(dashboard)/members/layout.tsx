import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import type { Metadata } from "next";
import { SettingsSidebar } from "@/components/settings-sidebar";
import AppHeader from "@/components/app-header";

export const metadata: Metadata = {
    title: "Members",
    description: "Your application settings",
};

export default function Layout({ children, }: { children: React.ReactNode; }) {
    return (
        <div className="max-h-screen w-full">
            {children}
        </div>
    );
}
