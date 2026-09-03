import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import legacy from "@vitejs/plugin-legacy";

// Remplace "NOM-DU-REPO" par le nom EXACT de ton dépôt GitHub
// (visible dans l'URL, ex: github.com/ton-compte/NOM-DU-REPO).
// Sans ça, les fichiers CSS/JS ne se chargeront pas sur GitHub Pages.
export default defineConfig({
  plugins: [
    react(),
    legacy({
      targets: ["defaults", "not IE 11"]
    })
  ],
  base: "/Only-me-and-you-app/",
});
