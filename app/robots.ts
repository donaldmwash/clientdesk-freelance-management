import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/dashboard/", "/clients/", "/invoices/", "/expenses/"] }],
    sitemap: "https://clientdesk-freelance-management-3d89g35fd.vercel.app/sitemap.xml",
  };
}
