"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { Spinner } from "@/components/ui/spinner";
import { useCurrentUser } from "@/hooks/use-auth";

export function RequireAuth({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { data: user, isLoading, isError } = useCurrentUser();

    useEffect(() => {
        if (!isLoading && (isError || !user)) {
            router.replace("/login");
        }
    }, [isError, isLoading, router, user]);

    if (isLoading || !user) {
        return (
            <div className="flex min-h-svh items-center justify-center">
                <Spinner className="size-6" />
            </div>
        );
    }

    return <>{children}</>;
}
