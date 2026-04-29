"use client";

import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Settings,
  ChartBar,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Phone,
  Activity,
  Users,
  MoreHorizontal,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { signOut, useSession } from "@/lib/auth-client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getCurrentUserRole } from "@/modules/dashboard/get-current-venue";

type NavItem = {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Workspace",
    items: [
      { label: "Floor Plan", path: "/dashboard", icon: LayoutDashboard },
      { label: "AI Calls", path: "/dashboard/calls", icon: Phone },
      { label: "Activity Log", path: "/dashboard/activity-log", icon: Activity },
    ],
  },
  {
    label: "Insights",
    items: [
      { label: "Analytics", path: "/dashboard/analytics", icon: ChartBar },
      { label: "Guests", path: "/dashboard/guests", icon: Users },
    ],
  },
];

function getInitials(name?: string | null, email?: string | null): string {
  const source = (name && name.trim()) || email || "?";
  const parts = source.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function NavigationSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { data: session } = useSession();
  const [role, setRole] = useState<"admin" | "staff" | null>(null);

  useEffect(() => {
    if (!session?.user?.id) return;
    let cancelled = false;
    getCurrentUserRole()
      .then((r) => {
        if (!cancelled) setRole(r);
      })
      .catch(() => {
        if (!cancelled) setRole("admin");
      });
    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  const visibleNavGroups: NavGroup[] =
    role === "staff"
      ? [
          {
            label: "Workspace",
            items: [
              { label: "Floor Plan", path: "/dashboard", icon: LayoutDashboard },
            ],
          },
        ]
      : NAV_GROUPS;

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  const isActive = (path: string) => {
    if (path === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(path);
  };

  const userName = session?.user?.name || "";
  const userEmail = session?.user?.email || "";

  return (
    <aside
      className={`${
        isCollapsed ? "w-16" : "w-64"
      } bg-white border-r border-gray-200 flex flex-col transition-[width] duration-200 shrink-0 relative`}
    >
      {/* Logo */}
      <div className={`${isCollapsed ? "px-3" : "px-5"} py-5`}>
        <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-2.5"}`}>
          <div className="w-9 h-9 bg-green-500 rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-base">R</span>
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-gray-900 leading-tight">
                Reservee
              </span>
              <span className="text-[11px] text-gray-400 leading-tight">
                AI Reservations
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-7 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 shadow-sm z-10"
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? (
          <ChevronRight className="h-3 w-3 text-gray-600" />
        ) : (
          <ChevronLeft className="h-3 w-3 text-gray-600" />
        )}
      </button>

      {/* Navigation */}
      <nav className="flex-1 px-3 pb-4 overflow-y-auto">
        {visibleNavGroups.map((group, idx) => (
          <div key={group.label} className={idx > 0 ? "mt-5" : "mt-2"}>
            {!isCollapsed && (
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.08em] mb-1.5 px-3">
                {group.label}
              </div>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.path);
                const Icon = item.icon;
                return (
                  <li key={item.path}>
                    <button
                      onClick={() => router.push(item.path)}
                      title={item.label}
                      className={`w-full flex items-center ${
                        isCollapsed ? "justify-center px-2" : "gap-3 px-3"
                      } py-2 text-sm rounded-lg transition-colors ${
                        active
                          ? "bg-gray-100 text-gray-900 font-medium"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 shrink-0 ${
                          active ? "text-green-600" : "text-gray-500"
                        }`}
                      />
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="border-t border-gray-100 p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={`w-full flex items-center ${
                isCollapsed ? "justify-center" : "gap-2.5 px-2 py-2"
              } rounded-lg hover:bg-gray-50 transition-colors text-left`}
              aria-label="Account menu"
            >
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-700 text-xs font-semibold shrink-0">
                {getInitials(userName, userEmail)}
              </div>
              {!isCollapsed && (
                <>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate leading-tight">
                      {userName || "Account"}
                    </div>
                    {userEmail && (
                      <div className="text-[11px] text-gray-500 truncate leading-tight mt-0.5">
                        {userEmail}
                      </div>
                    )}
                  </div>
                  <MoreHorizontal className="h-4 w-4 text-gray-400 shrink-0" />
                </>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            side="top"
            className="bg-white w-56"
          >
            {(userName || userEmail) && (
              <>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col">
                    {userName && (
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {userName}
                      </span>
                    )}
                    {userEmail && (
                      <span className="text-xs text-gray-500 truncate">
                        {userEmail}
                      </span>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
              </>
            )}
            {role !== "staff" && (
              <>
                <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem
              onClick={handleSignOut}
              className="text-red-600 focus:text-red-700 focus:bg-red-50"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
