import { WalletSelector } from "@near-wallet-selector/core";
import { Profile } from "../lib/social";

const SOCIAL_CONTRACT = "social.near";

export async function saveProfileToNear(
  selector: WalletSelector,
  accountId: string,
  profile: Profile,
) {
  const wallet = await selector.wallet();
  const account = selector.store.getState().accounts[0];

  if (!account) {
    throw new Error("No account connected");
  }

  // Format data for social contract
  const data = {
    [account.accountId]: {
      profile: {
        name: profile.name,
        description: profile.description,
        image: profile.image,
        backgroundImage: profile.backgroundImage,
        linktree: profile.linktree,
      },
    },
  };

  // Call social contract to save data
  return wallet.signAndSendTransaction({
    signerId: account.accountId,
    receiverId: SOCIAL_CONTRACT,
    actions: [
      {
        type: "FunctionCall",
        params: {
          methodName: "set",
          args: {
            data,
          },
          gas: "300000000000000",
          deposit: "0",
        },
      },
    ],
  });
}

export async function getConnectedAccountId(
  selector: WalletSelector,
): Promise<string | null> {
  const account = selector.store.getState().accounts[0];
  return account?.accountId || null;
}
