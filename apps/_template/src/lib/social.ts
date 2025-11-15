export type SocialImage = {
  url?: string;
  ipfs_cid?: string;
};

export type Profile = {
  name?: string;
  description?: string;
  image?: SocialImage;
  backgroundImage?: SocialImage;
  linktree?: Record<string, string>;
};

const API_SERVER = "https://api.near.social";

const fallbackUrl =
  "https://ipfs.near.social/ipfs/bafkreibmiy4ozblcgv3fm3gc6q62s55em33vconbavfd2ekkuliznaq3zm";

export const getImageUrl = (
  image: SocialImage | undefined,
  fallback?: string,
): string => {
  if (image?.url) return image.url;
  if (image?.ipfs_cid) return `https://ipfs.near.social/ipfs/${image.ipfs_cid}`;
  return fallback || fallbackUrl;
};

export function getSocialLink(platform: string, username: string): string {
  const links: Record<string, string> = {
    github: `https://github.com/${username}`,
    telegram: `https://t.me/${username}`,
    linkedin: `https://linkedin.com/in/${username}`,
    twitter: `https://twitter.com/${username}`,
    website: `https://${username}`,
  };
  return links[platform] || "#";
}

export async function getProfile(accountId: string): Promise<Profile | null> {
  const keys = [`${accountId}/profile/**`];

  try {
    const response = await fetch(`${API_SERVER}/get`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        keys,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data && data[accountId] && data[accountId].profile) {
      return data[accountId].profile as Profile;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error fetching profile:", error);
    return null;
  }
}
