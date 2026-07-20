"use client";

import { useSidebarStore } from "@/stores/sidebar-store";
import { Button } from "../ui/button";
import { Menu, PanelLeftClose, PanelRightClose } from "lucide-react";
import { UserNav } from "./user-nav";
import { LanguageSwitcher } from "../language-switcher";

export function Header() {
  const { toggle, isMinimized } = useSidebarStore();
  return (
    <header className="z-10 sticky top-0 w-full bg-background/95 shadow-sm backdrop-blur-sm dark:bg-background/80 border-b">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={toggle}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:flex"
            onClick={toggle}
          >
            {isMinimized ? (
              <PanelRightClose className="h-5 w-5" />
            ) : (
              <PanelLeftClose className="h-5 w-5" />
            )}
            <span className="sr-only">Toggle sidebar</span>
          </Button>
        </div>

        <div className="flex flex-1 items-center justify-end space-x-2">
          <LanguageSwitcher />
          <UserNav />
        </div>
      </div>
    </header>
  );
}
