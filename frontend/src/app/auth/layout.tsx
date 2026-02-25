import type { ReactNode } from "react";
import NotificationsRoot from "@/shared/components/NotificationsRoot";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <NotificationsRoot />
    </>
  );
}
