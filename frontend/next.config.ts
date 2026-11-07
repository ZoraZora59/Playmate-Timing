import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 生产环境用 standalone 输出，服务器只需 Node 运行时，部署体积更小。
  output: "standalone",
  poweredByHeader: false,
};

export default nextConfig;
