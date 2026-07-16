import { Toaster } from "sonner"

export default async function layout({
    children,
    params,
}: {
    children: React.ReactNode
    params: Promise<{ url: string }>
}) {
    return (
        <div>
            {children}
            <Toaster />
        </div>
    );
}