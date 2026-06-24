import { useState } from "react";
import { Outlet, useLoaderData } from "react-router";
import { Sidebar } from "../components/layout/Sidebar";
import { TopBar } from "../components/layout/TopBar";
import { UserNameModal } from "../components/layout/UserNameModal";
import { useUserName } from "~/hooks/useUserName";
import { getSidebarFilterCounts } from "~/data/tickets";

export async function loader() {
  const result = await getSidebarFilterCounts();

  if (!result.ok) {
    throw new Response(result.error, { status: 500 });
  }

  return { sidebarCounts: result.data };
}

export default function AppLayout() {
  const { sidebarCounts } = useLoaderData<typeof loader>();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { userName, setUserName, initials, isReady } = useUserName();

  const closeMobileSidebar = () => setIsMobileSidebarOpen(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {isReady && !userName && <UserNameModal onSubmit={setUserName} />}

      {isMobileSidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={closeMobileSidebar}
          aria-label="Cerrar menú lateral"
        />
      )}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-40 h-screen border-r border-border bg-sidebar transition-[transform,width] duration-200",
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0",
          "w-72",
          isSidebarCollapsed ? "lg:w-18" : "lg:w-72",
        ].join(" ")}
      >
        <Sidebar
          sidebarCounts={sidebarCounts}
          isCollapsed={isSidebarCollapsed}
          onCollapseToggle={() =>
            setIsSidebarCollapsed((collapsed) => !collapsed)
          }
          onNavigate={closeMobileSidebar}
        />
      </aside>

      <div
        className={[
          "flex min-h-0 min-w-0 flex-1 flex-col transition-[margin] duration-200",
          isSidebarCollapsed ? "lg:ml-18" : "lg:ml-72",
        ].join(" ")}
      >
        <TopBar
          userName={userName}
          initials={initials}
          onMobileMenuToggle={() =>
            setIsMobileSidebarOpen((open) => !open)
          }
          isMobileSidebarOpen={isMobileSidebarOpen}
        />

        <main className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 sm:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
