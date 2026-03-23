// src/lib/convex.ts
// This connects to the SAME Convex deployment as nsd-custom-quotes.
// The partner portal is just another frontend — no separate backend needed.
import { ConvexReactClient } from "convex/react";

export const convex = new ConvexReactClient(
  process.env.REACT_APP_CONVEX_URL!
);
