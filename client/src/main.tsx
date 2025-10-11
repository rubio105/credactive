import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

console.log("[CIRY DEBUG] main.tsx loaded");
console.log("[CIRY DEBUG] Root element:", document.getElementById("root"));

try {
  createRoot(document.getElementById("root")!).render(<App />);
  console.log("[CIRY DEBUG] App mounted successfully");
} catch (error) {
  console.error("[CIRY DEBUG] Failed to mount app:", error);
}
