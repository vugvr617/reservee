"use client";

import { useEffect, useState } from "react";
import { Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface WalkInDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tableName: string;
  tableMaxCapacity: number | null;
  isSubmitting: boolean;
  onSubmit: (input: {
    partySize: number;
    reservationDate: string;
    reservationTime: string;
  }) => void;
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function formatDateISO(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatTimeHHMM(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function WalkInDialog({
  open,
  onOpenChange,
  tableName,
  tableMaxCapacity,
  isSubmitting,
  onSubmit,
}: WalkInDialogProps) {
  const [partySize, setPartySize] = useState<string>("1");
  const [seatDate, setSeatDate] = useState<Date>(() => new Date());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setPartySize("1");
      setSeatDate(new Date());
      setError(null);
    }
  }, [open]);

  const handleSubmit = () => {
    const size = Number(partySize);
    if (!Number.isFinite(size) || size < 1) {
      setError("At least 1 guest");
      return;
    }
    if (size > 50) {
      setError("Max 50 guests");
      return;
    }
    if (tableMaxCapacity && size > tableMaxCapacity) {
      setError(`This table seats only ${tableMaxCapacity}`);
      return;
    }
    setError(null);
    onSubmit({
      partySize: size,
      reservationDate: formatDateISO(seatDate),
      reservationTime: formatTimeHHMM(seatDate),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] bg-white">
        <DialogHeader>
          <DialogTitle>Seat Walk-In</DialogTitle>
          <DialogDescription>
            Seat a walk-in party at {tableName}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-1.5">
            <Label className="text-sm">Table</Label>
            <div className="h-10 flex items-center px-3 rounded-md border border-gray-200 bg-gray-50 text-sm text-gray-700">
              {tableName}
              {tableMaxCapacity ? (
                <span className="ml-2 text-xs text-gray-500">
                  (seats {tableMaxCapacity})
                </span>
              ) : null}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="walkin-party-size" className="text-sm">
              Total Guests
            </Label>
            <Input
              id="walkin-party-size"
              type="number"
              min={1}
              placeholder="e.g., 2"
              className="h-10"
              value={partySize}
              onChange={(e) => setPartySize(e.target.value)}
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">Date & Time</Label>
            <DateTimePicker
              value={seatDate}
              onChange={(d) => setSeatDate(d)}
              placeholder="Pick date & time"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            Seat Walk-In
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
