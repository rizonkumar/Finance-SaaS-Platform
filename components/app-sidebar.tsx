import { AppLogo } from "@/components/app-logo";
import { NavLinks } from "@/components/nav-links";
import { SidebarUserCard } from "@/components/sidebar-user-card";

export const AppSidebar = () => {
  return (
    <aside className="border-alpha-300 bg-surface hidden h-full w-60 shrink-0 flex-col border-r lg:flex">
      <div className="flex h-14 items-center px-3">
        <AppLogo />
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2">
        <NavLinks />
      </div>

      <div className="p-3">
        <SidebarUserCard />
      </div>
    </aside>
  );
};
