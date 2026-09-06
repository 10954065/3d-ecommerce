import "server-only";
import { auth } from "@/auth";
import type { Session } from "next-auth";

/**
 * Defense-in-depth role check for admin Server Actions. `src/proxy.ts` already
 * gates every `/admin/*` page request, but Server Actions can be invoked
 * directly (e.g. from devtools) bypassing page-level middleware, so every
 * mutating action must re-verify the role itself.
 */
export async function requireAdminSession(): Promise<Session | null> {
  const session = await auth();
  const role = session?.user?.role;
  if (role !== "ADMIN" && role !== "STAFF") {
    return null;
  }
  return session;
}

export const UNAUTHORIZED_ERROR = "You do not have permission to perform this action.";
