import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

// 검색 결과(?q=)와 API 는 로봇이 열지 않게: 열 때마다 정보나루를 불러 하루 500건 한도를 쓴다
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/*?q="] },
    sitemap: new URL("/sitemap.xml", SITE).href,
  };
}
