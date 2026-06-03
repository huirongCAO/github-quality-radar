import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

const serviceWorkerUrl = `${import.meta.env.BASE_URL || "./"}sw.js`;

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(serviceWorkerUrl).catch((error) => {
      console.warn("Service worker registration failed", error);
    });
  });
}
