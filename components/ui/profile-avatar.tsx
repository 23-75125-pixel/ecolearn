import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { BORDER, SURFACE } from "@/lib/ui/styles";

export function ProfileAvatar({
  firstName,
  lastName,
  avatarUrl,
  size = "md",
}: {
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const initials = `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "?";
  const dimensions = { sm: 32, md: 40, lg: 56 }[size];
  const classes = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-14 w-14 text-lg",
  }[size];

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-medium",
        BORDER,
        SURFACE,
        classes,
      )}
      aria-label={`${firstName ?? ""} ${lastName ?? ""}`.trim() || "Profile avatar"}
    >
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt=""
          fill
          sizes={`${dimensions}px`}
          className="object-cover"
        />
      ) : (
        initials
      )}
    </span>
  );
}
