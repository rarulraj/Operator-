/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Self-contained server build for the Electron desktop app
  output: "standalone",
  // pdf-parse (and its pdfjs-dist internals) must keep their real file
  // layout at runtime: pdfjs resolves its worker file from disk.
  serverExternalPackages: ["pdf-parse"],
  outputFileTracingIncludes: {
    "/**": [
      "./node_modules/pdf-parse/**/*",
      "./node_modules/pdfjs-dist/**/*",
      // pdf-parse polyfills DOMMatrix/ImageData/Path2D from these at runtime
      // via a dynamic require that static tracing can't see
      "./node_modules/@napi-rs/canvas/**/*",
      "./node_modules/@napi-rs/canvas-darwin-arm64/**/*",
    ],
  },
};

export default nextConfig;
