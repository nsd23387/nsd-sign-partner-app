// src/index.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { ConvexProvider } from "convex/react";
import { convex } from "./lib/convex";
import "./index.css";
import App from "./App";

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
root.render(
  <React.StrictMode>
    <ConvexProvider client={convex}>
      <App />
    </ConvexProvider>
  </React.StrictMode>
);
