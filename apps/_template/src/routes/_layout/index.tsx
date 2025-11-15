import React from "react";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_layout/")({
  component: Home,
});

function Home() {
  return <div>Home Route</div>;
}
