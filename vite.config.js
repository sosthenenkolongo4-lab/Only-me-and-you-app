import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// ⚠️ Remplace "NOM-DU-REPO" par le nom EXACT de ton dépôt GitHub
// (visible dans l'URL, ex: github.com/ton-compte/NOM-DU-REPO).
// Sans ça, les fichiers CSS/JS ne se chargeront pas sur GitHub Pages.
export default defineConfig({
  plugins: [react()],
  base: "/NOM-DU-REPO/",
});
