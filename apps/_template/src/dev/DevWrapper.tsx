import React, { useEffect, useState } from "react";
import {
  setupWalletSelector,
  WalletSelector,
} from "@near-wallet-selector/core";
import { setupModal } from "@near-wallet-selector/modal-ui";
import { setupMyNearWallet } from "@near-wallet-selector/my-near-wallet";
import { Profile as ProfileType } from "../lib/social";
import { Profile } from "../components/Profile";
import "@near-wallet-selector/modal-ui/styles.css";
import { ProfileEditForm } from "./ProfileEditForm";
import { getConnectedAccountId, saveProfileToNear } from "./near-service";

type DevWrapperProps = {
  accountId: string;
  profile: ProfileType | null;
};

export function DevWrapper({
  accountId,
  profile: initialProfile,
}: DevWrapperProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<ProfileType | null>(initialProfile);
  const [selector, setSelector] = useState<WalletSelector | null>(null);
  const [walletModal, setWalletModal] = useState<any>(null);
  const [connectedId, setConnectedId] = useState<string | null>(null);
  const [isDevToolsOpen, setIsDevToolsOpen] = useState(false);

  useEffect(() => {
    // Initialize wallet selector
    const initWallet = async () => {
      const walletSelector = await setupWalletSelector({
        network: "testnet",
        modules: [setupMyNearWallet()],
      });

      const modal = setupModal(walletSelector, {
        contractId: "guest-book.testnet",
      });

      setSelector(walletSelector);
      setWalletModal(modal);

      // Check if already connected
      const accountId = await getConnectedAccountId(walletSelector);
      setConnectedId(accountId);

      // Subscribe to account changes
      walletSelector.store.observable.subscribe(async () => {
        const accountId = await getConnectedAccountId(walletSelector);
        setConnectedId(accountId);
      });
    };

    initWallet().catch(console.error);
  }, []);

  const handleConnect = () => {
    if (walletModal) {
      walletModal.show();
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setIsDevToolsOpen(false);
  };

  const toggleDevTools = () => {
    setIsDevToolsOpen(!isDevToolsOpen);
  };

  return (
    <div className="relative min-h-screen">
      {/* Dev Tools Toggle Button */}
      <button
        onClick={toggleDevTools}
        className="fixed right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-black text-white transition-all hover:bg-gray-800"
      >
        ⚙️
      </button>

      {/* Dev Tools Panel */}
      <div
        className={`fixed right-4 top-16 z-50 flex flex-col gap-2 overflow-hidden transition-all duration-300 ${
          isDevToolsOpen ? "h-auto opacity-100" : "h-0 opacity-0"
        }`}
      >
        {connectedId ? (
          <div className="rounded bg-green-500 px-4 py-2 text-white shadow">
            Connected: {connectedId}
          </div>
        ) : (
          <button
            onClick={handleConnect}
            className="rounded bg-blue-500 px-4 py-2 text-white shadow hover:bg-blue-600"
          >
            Connect Wallet
          </button>
        )}
        <button
          onClick={handleEdit}
          className="rounded bg-gray-500 px-4 py-2 text-white shadow hover:bg-gray-600"
        >
          Edit Profile
        </button>
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-start bg-white md:items-center md:bg-black md:bg-opacity-50">
          <div className="h-full w-full overflow-y-auto bg-white p-4 md:mx-auto md:h-auto md:max-h-[90vh] md:w-[90vw] md:max-w-4xl md:rounded-lg md:p-8">
            <div className="sticky top-0 z-10 flex items-center justify-between bg-white pb-4">
              <h1 className="text-2xl font-bold">Edit Profile</h1>
              <button
                onClick={() => setIsEditing(false)}
                className="text-2xl text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <div className="mt-4">
              <ProfileEditForm
                profile={profile}
                onSave={async (newProfile) => {
                  if (!selector) {
                    console.error("Wallet selector not initialized");
                    return;
                  }

                  try {
                    await saveProfileToNear(selector, accountId, newProfile);
                    setProfile(newProfile);
                    setIsEditing(false);
                  } catch (error) {
                    console.error("Failed to save profile:", error);
                    alert("Failed to save profile. Please try again.");
                  }
                }}
                onCancel={() => setIsEditing(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Profile Component */}
      <Profile accountId={accountId} profile={profile} />
    </div>
  );
}
