import React from "react";
import * as ReactDOMClient from "react-dom/client";
import { Profile } from "./components/Profile";
import "./index.css";
import { getProfile } from "./lib/social";

const isDevelopment = process.env.NODE_ENV === "development";

const render = async () => {
  const root = document.getElementById("root");
  const accountId = "efiz.near"; // You might want to make this configurable

  try {
    const profile = await getProfile(accountId);

    if (root) {
      const rootInstance = ReactDOMClient.createRoot(root);

      if (profile) {
        if (isDevelopment) {
          // Dynamically import development dependencies
          const { DevWrapper } = await import(
            /* webpackChunkName: "dev-tools" */ "./dev/DevWrapper"
          );
          rootInstance.render(
            <React.StrictMode>
              <DevWrapper profile={profile} accountId={accountId} />
            </React.StrictMode>
          );
        } else {
          rootInstance.render(
            <React.StrictMode>
              <Profile profile={profile} accountId={accountId} />
            </React.StrictMode>
          );
        }
      } else {
        rootInstance.render(
          <React.StrictMode>
            <div>No profile found for {accountId}</div>
          </React.StrictMode>
        );
      }
    }
  } catch (error) {
    console.error("Error fetching profile:", error);
    if (root) {
      ReactDOMClient.createRoot(root).render(
        <React.StrictMode>
          <div>Error loading profile. Please try again later.</div>
        </React.StrictMode>
      );
    }
  }
};

render();
