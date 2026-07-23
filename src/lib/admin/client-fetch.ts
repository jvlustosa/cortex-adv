/** Admin client fetches — never cache (prod CDN / Next fetch cache). */
export function adminFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  return fetch(input, {
    ...init,
    cache: "no-store",
  });
}
