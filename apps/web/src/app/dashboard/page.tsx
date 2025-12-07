"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  // Redirect to login if session is invalid/expired
  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-lime-500" />
      </div>
    );
  }

  if (!session) {
    // Show loading while redirecting
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-lime-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-lime-50/30">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 mt-1">Welcome back, {session.user.name}!</p>
          </div>
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="rounded-xl"
          >
            Sign Out
          </Button>
        </div>

        {/* User Info Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Your Account
          </h2>
          <div className="space-y-3">
            <div>
              <span className="text-sm text-gray-500">Name:</span>
              <p className="text-gray-900 font-medium">{session.user.name}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Email:</span>
              <p className="text-gray-900 font-medium">{session.user.email}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">User ID:</span>
              <p className="text-gray-900 font-mono text-sm">{session.user.id}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Email Verified:</span>
              <p className="text-gray-900 font-medium">
                {session.user.emailVerified ? "✅ Yes" : "❌ No"}
              </p>
            </div>
          </div>
        </div>

        {/* Session Info */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm mt-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Session Information
          </h2>
          <div className="space-y-3">
            <div>
              <span className="text-sm text-gray-500">Session ID:</span>
              <p className="text-gray-900 font-mono text-sm">{session.session.id}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Created At:</span>
              <p className="text-gray-900 font-medium">
                {new Date(session.session.createdAt).toLocaleString()}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Expires At:</span>
              <p className="text-gray-900 font-medium">
                {new Date(session.session.expiresAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Protected Content Notice */}
        <div className="bg-lime-50 border border-lime-200 rounded-2xl p-6 mt-6">
          <h3 className="text-lg font-semibold text-lime-900 mb-2">
            🔒 This is a Protected Page
          </h3>
          <p className="text-lime-700">
            Only authenticated users can access this page. If you're not logged in,
            the middleware will automatically redirect you to the login page.
          </p>
        </div>
      </div>
    </div>
  );
}
