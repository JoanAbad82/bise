// src/ds · the gallery's entry (pnpm gallery, or the built page the visual check shoots). Not part of
// the app's build. `?only=a,b` keeps those sections; `?motion=0` stops every animation for stills.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../index.css";
import "./gallery.css";
import { Gallery } from "./Gallery";

const params = new URLSearchParams(location.search);
const only = (params.get("only") ?? "").split(",").filter(Boolean);
if (params.get("motion") === "0") document.documentElement.classList.add("g-still");

const root = document.getElementById("root");
if (!root) throw new Error("index.html has no #root");
createRoot(root).render(
  <StrictMode>
    <Gallery only={only} />
  </StrictMode>,
);
