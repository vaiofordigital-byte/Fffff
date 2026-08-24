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
