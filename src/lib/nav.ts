"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";

/** Pile des pages visitées dans l'appli, pour que « retour » ne fasse jamais sortir de l'appli. */
const stack: string[] = [];

export function useNavTracker() {
  const pathname = usePathname();
  useEffect(() => {
    const top = stack[stack.length - 1];
    if (top === pathname) return;
    if (stack[stack.length - 2] === pathname) stack.pop();
    else stack.push(pathname);
  }, [pathname]);
}

export function useBack(fallback: string) {
  const router = useRouter();
  return useCallback(() => {
    if (stack.length > 1) router.back();
    else router.replace(fallback);
  }, [router, fallback]);
}
