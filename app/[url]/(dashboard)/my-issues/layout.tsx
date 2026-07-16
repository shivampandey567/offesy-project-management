

import { Metadata } from "next";

export const metadata: Metadata = {
    title: "My issues",
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
