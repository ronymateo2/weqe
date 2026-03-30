import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

const withSerwist = withSerwistInit({
  cacheOnNavigation: true,
  disable: process.env.NODE_ENV === "development",
  reloadOnOnline: true,
  swSrc: "app/sw.ts",
  swDest: "public/sw.js"
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: true
};

export default withSerwist(nextConfig);
