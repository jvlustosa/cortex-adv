import { NextResponse } from "next/server";

const NO_STORE = "private, no-store, no-cache, must-revalidate";

export function adminJson<T>(data: T, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", NO_STORE);
  return NextResponse.json(data, { ...init, headers });
}
