import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.png", "pwa-icon-512.png", "pwa-icon-192.png"],
      workbox: {
        navigateFallbackDenylist: [/^\/~oauth/],
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
      },
      manifest: {
        name: "OncoSync — Pancreatic Cancer Vaccine Companion",
        short_name: "OncoSync",
        description: "Research companion for pancreatic cancer vaccine development. Track immune response, analyze expression data, monitor safety events.",
        theme_color: "#1a8fb5",
        background_color: "#f7f5f2",
        display: "standalone",
        orientation: "any",
        scope: "/",
        start_url: "/",
        categories: ["medical", "health", "science"],
        icons: [
          {
            src: "pwa-icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "pwa-icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
