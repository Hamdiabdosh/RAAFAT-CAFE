import { useSyncExternalStore } from "react";

/** True only after hydration — use to avoid SSR/client markup mismatches. */
export function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}
