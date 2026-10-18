"use client"
"use client";

import React from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const QueryProvider = ({ children }: { children: React.ReactNode }) => {
    const [query] = React.useState(() => new QueryClient());

    return <QueryClientProvider client={query}>{children}</QueryClientProvider>
};

export default QueryProvider;
