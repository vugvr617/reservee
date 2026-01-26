"use client";

import {
  LayoutDashboard,
  FileText,
  Calendar,
  Settings,
  ChartBar,
  CreditCard,
  Bell,
  HelpCircle,
  LogOut
} from "lucide-react";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";

export function NavigationSidebar() {
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <aside className="w-72 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-lime-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">R</span>
          </div>
          <span className="text-lg font-semibold text-gray-900">Reservee</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6">
        {/* Management Section */}
        <div className="mb-6">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">
            Management
          </div>
          <div className="space-y-1">
            <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
              <ChartBar className="h-4 w-4" />
              Performance Detail
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
              <FileText className="h-4 w-4" />
              Daily Sales
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
              <Calendar className="h-4 w-4" />
              Monthly Reports
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
              <LayoutDashboard className="h-4 w-4" />
              Sales Analytics
            </button>
          </div>
        </div>

        {/* Preferences Section */}
        <div className="mb-6">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">
            Preferences
          </div>
          <div className="space-y-1">
            <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
              <Settings className="h-4 w-4" />
              Profile Settings
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
              <CreditCard className="h-4 w-4" />
              Payment Methods
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
              <Bell className="h-4 w-4" />
              Notification Setting
            </button>
          </div>
        </div>

        {/* Other Section */}
        <div>
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">
            Other
          </div>
          <div className="space-y-1">
            <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
              <HelpCircle className="h-4 w-4" />
              Help Center
            </button>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </nav>
    </aside>
  );
}
