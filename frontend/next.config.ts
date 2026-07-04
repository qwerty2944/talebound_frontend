import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      // Unity 파일 장기 캐시 (1년) - 재방문 시 즉시 로드
      {
        source: "/unity/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // Brotli 압축 파일 헤더
      {
        source: "/unity/:path*.br",
        headers: [
          {
            key: "Content-Encoding",
            value: "br",
          },
          {
            key: "Content-Type",
            value: "application/javascript",
          },
        ],
      },
      {
        source: "/unity/:path*.wasm.br",
        headers: [
          {
            key: "Content-Encoding",
            value: "br",
          },
          {
            key: "Content-Type",
            value: "application/wasm",
          },
        ],
      },
      {
        source: "/unity/:path*.data.br",
        headers: [
          {
            key: "Content-Encoding",
            value: "br",
          },
          {
            key: "Content-Type",
            value: "application/octet-stream",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
