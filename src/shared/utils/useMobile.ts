"use client";
import { useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
  window.addEventListener("resize", callback);
  return () => window.removeEventListener("resize", callback);
}

function getSnapshot() {
  return window.innerWidth <= 768;
}

function getServerSnapshot() {
  return false; // Default to false on server
}

export function useMobile() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
