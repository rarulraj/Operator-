import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Operator — Personal RPG",
    short_name: "Operator",
    description:
      "A personal AI-powered RPG for career growth, brand building, and startup execution.",
    start_url: "/",
    display: "standalone",
    background_color: "#161009",
    theme_color: "#161009",
    icons: [
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
