import { MetadataRoute } from "next";
import { BACKGROUND_COLOR, SITE_DESCRIPTION, SITE_NAME, THEME_COLOR } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  const baseManifest: MetadataRoute.Manifest = {
    name: SITE_NAME,
    short_name: "WelcomeScore",
    description: SITE_DESCRIPTION,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: BACKGROUND_COLOR,
    theme_color: THEME_COLOR,
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
    categories: ["development", "productivity"],
    orientation: "portrait-primary",
    prefer_related_applications: false,
  };

  // Use Object.assign to include newer PWA properties (id, screenshots with form_factor)
  // that are valid in browsers but may be missing from the current MetadataRoute.Manifest type.
  return Object.assign(baseManifest, {
    id: "/",
    screenshots: [
      {
        src: "/opengraph-image",
        sizes: "1200x630",
        type: "image/png",
        form_factor: "wide",
        label: "WelcomeScore Dashboard",
      },
    ],
  });
}
