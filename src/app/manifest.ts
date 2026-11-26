import type { MetadataRoute } from "next";
import { enCA } from "@/lib/i18n/en-CA";

// Installable web app: opens full screen from the Home Screen. Placeholder icon; real PNG icons come with T21.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: enCA.app.name,
    short_name: enCA.app.name,
    description: enCA.app.description,
    start_url: "/",
    display: "standalone",
    background_color: "#F3F2EC",
    theme_color: "#1F6B47",
    icons: [{ src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
