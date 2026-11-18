import type { MetadataRoute } from "next";

// Required for `output: "export"`: write robots.txt at build time.
export const dynamic = "force-static";

// The whole site is public, so every path may be crawled. A sitemap line is added once the production domain is set.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
  };
}
