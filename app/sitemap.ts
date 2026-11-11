import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: "https://clientdesk-freelance-management-3d89g35fd.vercel.app/", changeFrequency: "monthly", priority: 1 }];
}
