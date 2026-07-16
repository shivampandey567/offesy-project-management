import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Teams",
    description: "Your application settings",
};

export default function Layout({ children, }: { children: React.ReactNode; }) {
    return (
        <div >
            {children}
        </div>
    );
}
