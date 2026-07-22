import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

const PUBLIC_ROUTES = [
  { path: "", changeFrequency: "weekly" as const, priority: 1 },
  { path: "/curso/", changeFrequency: "weekly" as const, priority: 0.9 },
  {
    path: "/simulador-custo-claude/",
    changeFrequency: "monthly" as const,
    priority: 0.95,
  },
  { path: "/quiz/", changeFrequency: "monthly" as const, priority: 0.85 },
  { path: "/login/", changeFrequency: "yearly" as const, priority: 0.3 },
  { path: "/signup/", changeFrequency: "yearly" as const, priority: 0.3 },
  { path: "/validar/", changeFrequency: "yearly" as const, priority: 0.4 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return PUBLIC_ROUTES.map(({ path, changeFrequency, priority }) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
