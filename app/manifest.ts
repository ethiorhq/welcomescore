import { MetadataRoute } from "next";
import { BACKGROUND_COLOR, SITE_DESCRIPTION, SITE_NAME, THEME_COLOR } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "welcomescore-pwa",
    name: SITE_NAME,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui", "window-controls-overlay"],
    background_color: BACKGROUND_COLOR,
    theme_color: THEME_COLOR,
    lang: "en",
    dir: "ltr",
    icons: [
      {
        src: "/icon/medium",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon/large",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon/maskable",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    categories: ["development", "productivity", "education"],
    orientation: "portrait-primary",
    prefer_related_applications: false,
    shortcuts: [
      {
        name: "Hall of Fame",
        url: "/leaderboard",
        icons: [{ src: "/icon/small", sizes: "32x32" }]
      },
      {
        name: "Dev Lounge",
        url: "/lounge",
        icons: [{ src: "/icon/small", sizes: "32x32" }]
      }
    ]
  };
}
