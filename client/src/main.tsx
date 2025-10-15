import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

console.log("[CIRY DEBUG] main.tsx loaded");
console.log("[CIRY DEBUG] Root element:", document.getElementById("root"));

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((registration) => {
        console.log('[PWA] Service Worker registered successfully:', registration.scope);
      })
      .catch((error) => {
        console.log('[PWA] Service Worker registration failed:', error);
      });
  });
}

try {
  createRoot(document.getElementById("root")!).render(<App />);
  console.log("[CIRY DEBUG] App mounted successfully");
} catch (error) {
  console.error("[CIRY DEBUG] Failed to mount app:", error);
}
