import { Image } from "@/components/ui/image";

export default function ProfileAvatar({ profile, size = "w-12 h-12", text = "text-base" }) {
  if (profile?.avatar_url) {
    return (
      <div className={`${size} rounded-full overflow-hidden shrink-0`}>
        <Image src={profile.avatar_url} fittingType="fill" className="w-full h-full" />
      </div>
    );
  }
  return (
    <div className={`${size} rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold shrink-0 ${text}`}>
      {profile?.user_name?.charAt(0).toUpperCase() || "?"}
    </div>
  );
}