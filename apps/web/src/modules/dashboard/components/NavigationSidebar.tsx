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
  ChevronRight
} from "lucide-react";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";

export function NavigationSidebar() {
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <aside className={`${isCollapsed ? 'w-16' : 'w-72'} bg-white border-r border-gray-200 flex flex-col transition-all duration-300 shrink-0`}>
      {/* Logo */}
      <div className="px-6 py-6 border-b border-gray-200 relative">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-lime-500 rounded-lg flex items-center justify-center shrink-0">
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
        {/* Management Section */}
        <div className="mb-6">
          {!isCollapsed && (
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">
              Management
            </div>
          )}
          <div className="space-y-1">
            <button className={`w-full flex items-center gap-3 ${isCollapsed ? 'justify-center px-2' : 'px-3'} py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors`} title="Performance Detail">
              <ChartBar className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span>Performance Detail</span>}
            </button>
            <button className={`w-full flex items-center gap-3 ${isCollapsed ? 'justify-center px-2' : 'px-3'} py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors`} title="Daily Sales">
              <FileText className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span>Daily Sales</span>}
            </button>
            <button className={`w-full flex items-center gap-3 ${isCollapsed ? 'justify-center px-2' : 'px-3'} py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors`} title="Monthly Reports">
              <Calendar className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span>Monthly Reports</span>}
            </button>
            <button className={`w-full flex items-center gap-3 ${isCollapsed ? 'justify-center px-2' : 'px-3'} py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors`} title="Sales Analytics">
              <LayoutDashboard className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span>Sales Analytics</span>}
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
            <button className={`w-full flex items-center gap-3 ${isCollapsed ? 'justify-center px-2' : 'px-3'} py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors`} title="Profile Settings">
              <Settings className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span>Profile Settings</span>}
            </button>
            <button className={`w-full flex items-center gap-3 ${isCollapsed ? 'justify-center px-2' : 'px-3'} py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors`} title="Payment Methods">
              <CreditCard className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span>Payment Methods</span>}
            </button>
            <button className={`w-full flex items-center gap-3 ${isCollapsed ? 'justify-center px-2' : 'px-3'} py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors`} title="Notification Setting">
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
            <button className={`w-full flex items-center gap-3 ${isCollapsed ? 'justify-center px-2' : 'px-3'} py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors`} title="Help Center">
              <HelpCircle className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span>Help Center</span>}
            </button>
            <button
              onClick={handleSignOut}
              className={`w-full flex items-center gap-3 ${isCollapsed ? 'justify-center px-2' : 'px-3'} py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors`}
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
