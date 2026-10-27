import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";
import { BORDER, SECTION, SUBTEXT } from "@/lib/ui/styles";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-md p-6", BORDER, className)} {...props} />;
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-6", className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn(SECTION, className)} {...props} />;
}

export function CardDescription({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn(SUBTEXT, "mt-1", className)} {...props} />;
}
