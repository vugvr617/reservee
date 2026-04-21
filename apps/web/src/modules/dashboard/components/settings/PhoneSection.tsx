"use client";

import {
  Phone,
  Globe,
  DollarSign,
  CalendarDays,
} from "lucide-react";
import type { VenueData } from "@/modules/onboarding/types";

interface PhoneSectionProps {
  venue: VenueData;
  phoneData: {
    id: string;
    phone_number: string;
    phone_country: string;
    phone_provider: string;
    phone_status: string;
    monthly_cost: number | null;
    is_primary: boolean;
    purchased_at: string;
  } | null;
  onUpdated: () => void;
}

function StatItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5 min-w-0">
      <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center shrink-0">
        <Icon className="h-3.5 w-3.5 text-gray-500" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
          {label}
        </p>
        <div className="text-sm font-medium text-gray-900 mt-0.5 truncate">
          {value}
        </div>
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function PhoneSection({ venue, phoneData, onUpdated }: PhoneSectionProps) {
  if (!phoneData) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center mx-auto mb-3">
            <Phone className="h-5 w-5 text-gray-400" />
          </div>
          <p className="text-gray-700 text-sm font-medium">
            No phone number configured yet
          </p>
          <p className="text-gray-400 text-xs mt-1">
            A phone number is provisioned during onboarding.
          </p>
        </div>
      </div>
    );
  }

  const statusMeta =
    phoneData.phone_status === "active"
      ? {
          label: "Active",
          dot: "bg-green-500",
          text: "text-green-700",
          bg: "bg-green-50",
          border: "border-green-200",
          pulse: true,
        }
      : phoneData.phone_status === "provisioning"
        ? {
            label: "Provisioning",
            dot: "bg-amber-500",
            text: "text-amber-700",
            bg: "bg-amber-50",
            border: "border-amber-200",
            pulse: true,
          }
        : phoneData.phone_status === "suspended"
          ? {
              label: "Suspended",
              dot: "bg-red-500",
              text: "text-red-700",
              bg: "bg-red-50",
              border: "border-red-200",
              pulse: false,
            }
          : {
              label: "Inactive",
              dot: "bg-gray-400",
              text: "text-gray-600",
              bg: "bg-gray-50",
              border: "border-gray-200",
              pulse: false,
            };

  return (
    <div className="space-y-5">
      {/* Hero number card */}
      <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="relative px-6 py-7 bg-gradient-to-br from-green-50/60 via-white to-white border-b border-gray-100">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-2">
                AI Receptionist Number
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-3xl font-mono font-semibold text-gray-900 tabular-nums tracking-tight">
                  {phoneData.phone_number}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs font-medium ${statusMeta.bg} ${statusMeta.border} ${statusMeta.text}`}
                >
                  <span className="relative flex h-1.5 w-1.5">
                    {statusMeta.pulse && (
                      <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${statusMeta.dot}`} />
                    )}
                    <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${statusMeta.dot}`} />
                  </span>
                  {statusMeta.label}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                This is the number customers call to reach your AI agent.
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-green-500/10 border border-green-200 flex items-center justify-center shrink-0">
              <Phone className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </div>

        {/* Stat row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-6 py-5">
          <StatItem
            icon={DollarSign}
            label="Monthly Cost"
            value={
              phoneData.monthly_cost
                ? `$${phoneData.monthly_cost.toFixed(2)}/mo`
                : "N/A"
            }
          />
          <StatItem icon={Globe} label="Country" value={phoneData.phone_country} />
          <StatItem
            icon={CalendarDays}
            label="Purchased"
            value={new Date(phoneData.purchased_at).toLocaleDateString()}
          />
        </div>
      </section>
    </div>
  );
}
