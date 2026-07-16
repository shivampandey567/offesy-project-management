import { Metadata } from "next";

export default function Layout({ children, }: { children: React.ReactNode; }) {
    return (
        <div className="min-h-screen w-full">
            <main>
                {children}
            </main>
        </div>
    );
}
