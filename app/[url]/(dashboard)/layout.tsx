import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import type { Metadata } from "next";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { AppSidebar } from "@/components/app-sidebar";
import AppHeader from "@/components/app-header";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your application dashboard",
};

export default function Layout({ children, }: { children: React.ReactNode; }) {
  return (
    <div className="max-h-screen w-full">
      <SidebarProvider>
        <TooltipProvider>
          <AppSidebar /> 
          <SidebarInset className="flex flex-col">
            <main className="flex flex-1 flex-col">
              {children}
            </main>
          </SidebarInset>
        </TooltipProvider>
      </SidebarProvider>
    </div>
  );
}
