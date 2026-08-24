import type { MetadataRoute } from "next";
import { publicEnv } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/ar/admin/",
          "/en/admin/",
          "/ar/dashboard/",
          "/en/dashboard/",
          "/ar/vault/",
          "/en/vault/",
          "/ar/brain/",
          "/en/brain/",
          "/ar/tasks/",
          "/en/tasks/",
          "/ar/reports/",
          "/en/reports/",
          "/ar/usage/",
          "/en/usage/",
          "/ar/billing/",
          "/en/billing/",
          "/ar/settings/",
          "/en/settings/",
          "/ar/onboarding/",
          "/en/onboarding/",
          "/ar/projects/",
          "/en/projects/",
          "/ar/lab/",
          "/en/lab/",
        ],
      },
    ],
    sitemap: `${publicEnv.appUrl}/sitemap.xml`,
  };
}
