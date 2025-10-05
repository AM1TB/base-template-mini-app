"use client";

import { useClientOnly } from "~/hooks/useClientOnly";

interface ClientOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  const isClient = useClientOnly();

  if (!isClient) {
    return fallback;
  }

  return <>{children}</>;
}
