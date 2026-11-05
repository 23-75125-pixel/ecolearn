import type { ReactNode } from "react";
import { RoleShell } from "@/components/layout/role-shell";

export default function TutorLayout({ children }: { children: ReactNode }) {
  return <RoleShell role="tutor">{children}</RoleShell>;
}
