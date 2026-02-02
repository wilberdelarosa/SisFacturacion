"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { currentSession } from "../../lib/auth";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    currentSession().then((session) => {
      if (!session) {
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      } else {
        setReady(true);
      }
    });
  }, [router, pathname]);

  if (!ready) return null;
  return <>{children}</>;
}
