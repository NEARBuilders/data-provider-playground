import React, { useState } from "react";
import { Profile as ProfileType } from "../lib/social";

type ProfileEditFormProps = {
  profile: ProfileType | null;
  onSave: (profile: ProfileType) => void;
  onCancel: () => void;
};

export function ProfileEditForm({
  profile,
  onSave,
  onCancel,
}: ProfileEditFormProps) {
  const [formData, setFormData] = useState<ProfileType>({
    name: profile?.name || "",
    description: profile?.description || "",
    image: profile?.image || { url: "" },
    backgroundImage: profile?.backgroundImage || { url: "" },
    linktree: profile?.linktree || {},
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    field: keyof ProfileType,
  ) => {
    if (field === "image" || field === "backgroundImage") {
      setFormData({
        ...formData,
        [field]: { url: e.target.value },
      });
    } else if (field === "linktree") {
      const [platform] = e.target.name.split(".");
      setFormData({
        ...formData,
        linktree: {
          ...formData.linktree,
          [platform]: e.target.value,
        },
      });
    } else {
      setFormData({
        ...formData,
        [field]: e.target.value,
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-6 md:grid md:grid-cols-2 md:gap-6 md:space-y-0">
        {/* Left Column */}
        <div className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange(e, "name")}
              className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Description{" "}
              <span className="text-sm text-gray-500">
                (Markdown supported)
              </span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange(e, "description")}
              rows={4}
              className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Profile Image URL
            </label>
            <input
              type="text"
              value={formData.image?.url}
              onChange={(e) => handleInputChange(e, "image")}
              className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Background Image URL
            </label>
            <input
              type="text"
              value={formData.backgroundImage?.url}
              onChange={(e) => handleInputChange(e, "backgroundImage")}
              className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Right Column - Social Links */}
        <div className="space-y-6">
          <h3 className="text-lg font-medium">Social Links</h3>
          {["github", "twitter", "telegram", "linkedin", "website"].map(
            (platform) => (
              <div key={platform}>
                <label className="mb-2 block text-sm font-medium capitalize">
                  {platform}
                </label>
                <input
                  type="text"
                  name={`${platform}`}
                  value={formData.linktree?.[platform] || ""}
                  onChange={(e) => handleInputChange(e, "linktree")}
                  className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                />
              </div>
            ),
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 border-t pt-6">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-gray-300 bg-white px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Save Changes
        </button>
      </div>
    </form>
  );
}
