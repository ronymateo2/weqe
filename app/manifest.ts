import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NeuroEye Log",
    short_name: "NeuroEye",
    description: "Registro clínico para ojo seco neuropático",
    start_url: "/register",
    display: "standalone",
    background_color: "#121008",
    theme_color: "#121008",
    lang: "es",
    orientation: "portrait",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any"
      },
      {
        src: "/apple-icon.svg",
        sizes: "180x180",
        type: "image/svg+xml",
        purpose: "maskable"
      }
    ]
  };
}
