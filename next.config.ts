import type { NextConfig } from "next";

// Unity WebGL .br(사전 브로틀리 압축) 파일을 위한 공통 헤더
// - Content-Encoding: br  → 브라우저가 자동 해제
// - Cache-Control immutable → 재방문 즉시 로드
const brotliHeaders = (contentType: string) => [
  { key: "Content-Encoding", value: "br" },
  { key: "Content-Type", value: contentType },
  { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
];

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
      // ── 사전 압축(.br) 파일별 정확한 Content-Type 지정 ──
      // 주의: 일반 `:path*.br` 와일드카드 룰을 쓰면 모든 .br 에
      // application/javascript 가 강제되어 wasm 스트리밍 컴파일이 깨진다.
      // 파일별로 정확히 매칭한다.
      {
        source: "/unity/characterbuilder.framework.js.br",
        headers: brotliHeaders("application/javascript"),
      },
      {
        source: "/unity/characterbuilder.wasm.br",
        headers: brotliHeaders("application/wasm"),
      },
      {
        source: "/unity/characterbuilder.data.br",
        headers: brotliHeaders("application/octet-stream"),
      },
    ];
  },
};

export default nextConfig;
