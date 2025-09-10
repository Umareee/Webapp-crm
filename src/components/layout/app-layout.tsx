"use client";

import type { ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAppState } from "@/context/app-state-context";
import { useIsMobile } from "@/hooks/use-mobile";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { BottomNav } from "./bottom-nav";
import type { ActiveView } from "@/lib/types";

export default function AppLayout({ children }: { children: ReactNode }) {
  const { activeView, setActiveView, setSelectedTagId } = useAppState();
  const isMobile = useIsMobile();
  const router = useRouter();     // for navigation (push/replace)
  const pathname = usePathname(); // current path as string

  const handleSetActiveView = (view: ActiveView) => {
    if (view === "bulk") {
      // navigate to /bulk
      void router.push("/bulk");
      return;
    }

    // ensure on root before setting the view
    if (pathname !== "/") {
      void router.push("/");
    }

    setActiveView(view);
  };

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar
          activeView={activeView}
          setActiveView={handleSetActiveView}
          setSelectedTagId={setSelectedTagId}
        />
        <main className="flex-1 md:mb-0 mb-16">{children}</main>
      </div>
      {isMobile && (
        <BottomNav
          activeView={activeView}
          setActiveView={handleSetActiveView}
          setSelectedTagId={setSelectedTagId}
        />
      )}
    </div>
  );
}
