import "./App.css"; // ou "./index.css" selon le nom de votre fichier CSS
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode><App /></React.StrictMode>
);
