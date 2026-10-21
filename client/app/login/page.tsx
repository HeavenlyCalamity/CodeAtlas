"use client";
import React from "react";
import Link from "next/link";
import { useRouter,useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import {AlertCircle} from "lucide-react";

import { GithubIcon } from "@/components/icons/github-icon";
import { BrandMark} from "@/components/layout/app-shell";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import{
    Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import {getGithubLoginUrl} from "@/lib/api";

function LoginLoading() {
    return (
        <div className="flex min-h-svh items-center justify-center gap-4">
            <Spinner className="size-8" />
        </div>
    );
}

const LoginContent = () => {
    const params = useSearchParams();
    const router = useRouter();
    const error = params.get("error");
    const next = params.get("next") || "/dashboard";

    const user = null;
    const isLoading = false;
    if (isLoading || !user) {
        return <LoginLoading/>
    }

    return (
        <div className="flex min-h-svh flex-col overflow-hidden bg-background">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(var(from_var(--primary))))]_l_c_h/0.1),transparent_55%" />

            <header className="relative z-10 flex h-14 items-center justify-between px-4">
                <Link href="/">
                    <BrandMark />
                </Link>
                <ModeToggle />
            </header>

            <main className="relative z-10 flex flex-1 justify-center items-center px-4 py-10">
                <Card className="w-full max-w-sm border-border/70 bg-card/90 shadow-lg shadow-foreground/5 backdrop-blur-xl">
                    <CardHeader className="space-y-4 text-center" >
                        <div className="mx-auto flex size-12 items-center justify-center rounded-2x1 bg-foreground text-background" >
                            <GithubIcon className="size-6" />
                        <CardTitle className="text-xl">Sign in</CardTitle>
                        <CardDescription>Sign in to your account</CardDescription>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        {error && (
                            <Alert variant="destructive">
                                <AlertCircle className="size-4" />
                                <AlertTitle>Sign-in Failed</AlertTitle>
                                <AlertDescription>Please Try Again</AlertDescription>
                            </Alert>
                        )}

                        <a href={getGithubLoginUrl()} className={cn(
                            buttonVariants({ size: "lg" }),
                            "inline-flex w-full items-center justify-center gap-2 bg-foreground text-background hover : bg-foreground/90")}>
                            <GithubIcon className="size-5" />
                            Sign in with GitHub
                        </a>
                    </CardContent>
                </Card>
            </main>
        </div>
    );

}
export default function LoginPage(){
    return (
        <Suspense fallback={<LoginLoading/>}>
            <LoginContent/>
        </Suspense>
    )
}