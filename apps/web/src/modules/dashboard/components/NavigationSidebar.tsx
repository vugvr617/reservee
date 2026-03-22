"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  FileText,
  Calendar,
  Settings,
  ChartBar,
  CreditCard,
  Bell,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Phone
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { signOut } from "@/lib/auth-client";

export function NavigationSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  const isActive = (path: string) => {
    if (path === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(path);
  };

  const navButtonClass = (path: string) =>
    `w-full flex items-center gap-3 ${isCollapsed ? 'justify-center px-2' : 'px-3'} py-2.5 text-sm rounded-lg transition-colors ${
      isActive(path)
        ? 'bg-green-50 text-green-700 font-medium'
        : 'text-gray-700 hover:bg-gray-50'
    }`;

  const inactiveClass = `w-full flex items-center gap-3 ${isCollapsed ? 'justify-center px-2' : 'px-3'} py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors`;

  return (
    <aside className={`${isCollapsed ? 'w-16' : 'w-72'} bg-white border-r border-gray-200 flex flex-col transition-all duration-300 shrink-0`}>
      {/* Logo */}
      <div className={`${isCollapsed ? 'px-3' : 'px-6'} py-6 border-b border-gray-200 relative`}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-lg">R</span>
          </div>
          {!isCollapsed && (
            <span className="text-lg font-semibold text-gray-900">Reservee</span>
          )}
        </div>
        {/* Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 shadow-sm z-10"
        >
          {isCollapsed ? (
            <ChevronRight className="h-3 w-3 text-gray-600" />
          ) : (
            <ChevronLeft className="h-3 w-3 text-gray-600" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 overflow-y-auto">
        {/* Main Section */}
        <div className="mb-6">
          {!isCollapsed && (
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">
              Main
            </div>
          )}
          <div className="space-y-1">
            <button
              onClick={() => router.push("/dashboard")}
              className={navButtonClass("/dashboard")}
              title="Floor Plan"
            >
              <LayoutDashboard className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span>Floor Plan</span>}
            </button>
            <button
              onClick={() => router.push("/dashboard/calls")}
              className={navButtonClass("/dashboard/calls")}
              title="AI Calls"
            >
              <Phone className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span>AI Calls</span>}
            </button>
          </div>
        </div>

        {/* Management Section */}
        <div className="mb-6">
          {!isCollapsed && (
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">
              Management
            </div>
          )}
          <div className="space-y-1">
            <button className={inactiveClass} title="Performance Detail">
              <ChartBar className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span>Performance Detail</span>}
            </button>
            <button className={inactiveClass} title="Daily Sales">
              <FileText className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span>Daily Sales</span>}
            </button>
            <button className={inactiveClass} title="Monthly Reports">
              <Calendar className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span>Monthly Reports</span>}
            </button>
          </div>
        </div>

        {/* Preferences Section */}
        <div className="mb-6">
          {!isCollapsed && (
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">
              Preferences
            </div>
          )}
          <div className="space-y-1">
            <button className={inactiveClass} title="Profile Settings">
              <Settings className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span>Profile Settings</span>}
            </button>
            <button className={inactiveClass} title="Payment Methods">
              <CreditCard className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span>Payment Methods</span>}
            </button>
            <button className={inactiveClass} title="Notification Setting">
              <Bell className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span>Notification Setting</span>}
            </button>
          </div>
        </div>

        {/* Other Section */}
        <div>
          {!isCollapsed && (
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">
              Other
            </div>
          )}
          <div className="space-y-1">
            <button className={inactiveClass} title="Help Center">
              <HelpCircle className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span>Help Center</span>}
            </button>
            <button
              onClick={handleSignOut}
              className={inactiveClass}
              title="Logout"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span>Logout</span>}
            </button>
          </div>
        </div>
      </nav>
    </aside>
  );
}
