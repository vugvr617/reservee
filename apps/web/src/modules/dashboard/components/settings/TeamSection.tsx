"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, UserPlus, Users, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  inviteStaffMember,
  listStaffMembers,
  removeStaffMember,
} from "@/modules/dashboard/staff-actions";
import type { StaffMember } from "@/modules/dashboard/staff-types";

function getInitials(name: string | null, email: string): string {
  const source = (name && name.trim()) || email;
  const parts = source.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

export function TeamSection() {
  const [members, setMembers] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [pendingRemove, setPendingRemove] = useState<StaffMember | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const load = async () => {
    setIsLoading(true);
    const result = await listStaffMembers();
    if (result.success) {
      setMembers(result.data);
    } else {
      toast.error(result.error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsInviting(true);
    const result = await inviteStaffMember({ name, email, password });
    setIsInviting(false);

    if (result.success) {
      toast.success("Staff member added successfully");
      setMembers((prev) => [result.data, ...prev]);
      resetForm();
      setInviteOpen(false);
    } else {
      toast.error(result.error);
    }
  };

  const handleRemove = async () => {
    if (!pendingRemove) return;
    setIsRemoving(true);
    const result = await removeStaffMember(pendingRemove.id);
    setIsRemoving(false);

    if (result.success) {
      toast.success("Staff member removed successfully");
      setMembers((prev) => prev.filter((m) => m.id !== pendingRemove.id));
      setPendingRemove(null);
    } else {
      toast.error(result.error);
    }
  };

  return (
    <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <header className="flex items-start justify-between gap-3 px-6 pt-6 pb-4 border-b border-gray-100 bg-gradient-to-b from-gray-50/50 to-transparent">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
            <Users className="h-4 w-4 text-green-600" />
          </div>
          <div className="min-w-0">
            <h3 className="text-[15px] font-semibold text-gray-900 leading-snug">
              Team
            </h3>
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
              Add staff who can manage reservations on the floor plan
            </p>
          </div>
        </div>

        <Dialog
          open={inviteOpen}
          onOpenChange={(open) => {
            setInviteOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-green-500 hover:bg-green-600 text-white">
              <UserPlus className="h-4 w-4" />
              Add staff
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add a staff member</DialogTitle>
              <DialogDescription>
                Create a login for someone on your team. They&apos;ll only see the
                reservation floor plan.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="staff-name">Full name</Label>
                <Input
                  id="staff-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  required
                  disabled={isInviting}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="staff-email">Email</Label>
                <Input
                  id="staff-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@example.com"
                  required
                  disabled={isInviting}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="staff-password">Temporary password</Label>
                <Input
                  id="staff-password"
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  required
                  minLength={8}
                  disabled={isInviting}
                />
                <p className="text-xs text-gray-500">
                  Share this password with them. They can sign in with this
                  email and password.
                </p>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setInviteOpen(false)}
                  disabled={isInviting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-green-500 hover:bg-green-600 text-white"
                  disabled={isInviting}
                >
                  {isInviting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Add staff
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      <div className="px-6 py-5">
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-green-500" />
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-gray-200 rounded-xl">
            <div className="w-10 h-10 mx-auto rounded-lg bg-gray-50 flex items-center justify-center mb-3">
              <Users className="h-4 w-4 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-900">No staff yet</p>
            <p className="text-xs text-gray-500 mt-1">
              Add a staff member to give them floor-plan access
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {members.map((member) => (
              <li
                key={member.id}
                className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-gray-700 text-xs font-semibold shrink-0">
                  {getInitials(member.name, member.email)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {member.name || member.email}
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-green-700 bg-green-50 px-1.5 py-0.5 rounded">
                      Staff
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {member.email}
                  </div>
                </div>
                <div className="text-xs text-gray-400 hidden sm:block">
                  Added {formatDate(member.createdAt)}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                  onClick={() => setPendingRemove(member)}
                  aria-label={`Remove ${member.email}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <AlertDialog
        open={pendingRemove !== null}
        onOpenChange={(open) => !open && setPendingRemove(null)}
      >
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove staff member?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingRemove?.name || pendingRemove?.email} will lose access
              immediately. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              disabled={isRemoving}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {isRemoving && <Loader2 className="h-4 w-4 animate-spin" />}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
