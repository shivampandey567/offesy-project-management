import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import type { Metadata } from "next";
import { SettingsSidebar } from "@/components/settings-sidebar";

export const metadata: Metadata = {
  title: "Settings",
  description: "Your application settings",
};

export default function Layout({ children, }: { children: React.ReactNode; }) {
  return (
    <div className="max-h-screen w-full">
      <SidebarProvider>
          <SettingsSidebar/>
          <SidebarInset className="flex flex-col">
            <main className="flex flex-1 flex-col p-2">
              {children}
            </main>
          </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
