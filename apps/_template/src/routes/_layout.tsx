import { Outlet, createFileRoute } from "@tanstack/react-router";
import React from "react";

export const Route = createFileRoute("/_layout")({
  component: LayoutComponent,
});

function LayoutComponent() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Outlet />
    </div>
  );
}
