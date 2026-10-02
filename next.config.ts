import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 開発サーバーを同じLAN内の別URL（PCのIPアドレス）から開くと、
  // 開発用リソースがブロックされて画面が「読み込み中…」のまま止まるため許可する
  allowedDevOrigins: ["192.168.11.7"],
};

export default nextConfig;
