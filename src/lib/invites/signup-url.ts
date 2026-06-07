import { SITE_URL } from "@/lib/site";

export function buildSignupUrl(token: string): string {
  const url = new URL("/signup", SITE_URL);
  url.searchParams.set("token", token.trim());
  return url.toString();
}
