"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { User } from "lucide-react";
import { useCanvasStore } from "@/stores/canvas-store";
import { calculateChairPositions, CHAIR_GAP, CHAIR_THICKNESS } from "@/modules/dashboard/utils/chairs";
import { formatTime12, type TableLiveStatus, type TableStatusInfo } from "@/modules/dashboard/utils/table-status";
import type { Border, CanvasTable } from "@/modules/dashboard/types";

interface FloorPlanViewProps {
  statusByTable: Record<string, TableStatusInfo>;
  onTableClick: (tableId: string | null, screenPos: { x: number; y: number }) => void;
}

const SCREEN_PADDING = 36;
const MIN_SCALE = 0.2;
const MAX_SCALE = 1.6;

// Per-status visual tokens for the table card.
const STATUS_STYLES: Record<
  TableLiveStatus,
  { card: string; dot: string; number: string; chair: string; accent: string }
> = {
  seated: {
    card: "bg-green-50 border-green-300",
    dot: "bg-green-500",
    number: "text-green-700",
    chair: "bg-green-200",
    accent: "text-green-600",
  },
  reserved: {
    card: "bg-blue-50/60 border-blue-200",
    dot: "bg-blue-500",
    number: "text-blue-600",
    chair: "bg-blue-200",
    accent: "text-blue-600",
  },
  overdue: {
    card: "bg-red-50 border-red-200",
    dot: "bg-red-500",
    number: "text-red-600",
    chair: "bg-red-200",
    accent: "text-red-500",
  },
  open: {
    card: "bg-white border-gray-200",
    dot: "bg-gray-300",
    number: "text-gray-400",
    chair: "bg-gray-200",
    accent: "text-gray-400",
  },
};

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Compute the world-space bounding box that contains the border and every
// table (including its chairs), with a little breathing room.
function computeBoundingBox(tables: CanvasTable[], border: Border | undefined): BoundingBox {
  let minX = border ? border.x : Infinity;
  let minY = border ? border.y : Infinity;
  let maxX = border ? border.x + border.width : -Infinity;
  let maxY = border ? border.y + border.height : -Infinity;

  const chairExtent = CHAIR_GAP + CHAIR_THICKNESS;

  for (const t of tables) {
    minX = Math.min(minX, t.position_x - chairExtent);
    minY = Math.min(minY, t.position_y - chairExtent);
    maxX = Math.max(maxX, t.position_x + t.width + chairExtent);
    maxY = Math.max(maxY, t.position_y + t.height + chairExtent);
  }

  if (!isFinite(minX)) {
    return { x: 0, y: 0, width: 1000, height: 700 };
  }

  const pad = 16;
  return {
    x: minX - pad,
    y: minY - pad,
    width: maxX - minX + pad * 2,
    height: maxY - minY + pad * 2,
  };
}

function CapacityBadge({ capacity, font }: { capacity: number; font: number }) {
  return (
    <div
      className="flex items-center gap-0.5 rounded-md bg-gray-100/80 px-1 py-0.5 text-gray-500"
      style={{ fontSize: font }}
    >
      <User style={{ width: font + 1, height: font + 1 }} strokeWidth={2.25} />
      <span className="font-semibold">{capacity}</span>
    </div>
  );
}

interface TableCardProps {
  table: CanvasTable;
  info: TableStatusInfo;
  left: number;
  top: number;
  width: number;
  height: number;
  shape: string;
  onClick: (e: React.MouseEvent) => void;
}

function TableCard({ table, info, left, top, width, height, shape, onClick }: TableCardProps) {
  const styles = STATUS_STYLES[info.status];
  const isFull = width >= 140 && height >= 82;

  const numberFont = Math.round(clamp(height * (isFull ? 0.3 : 0.34), isFull ? 20 : 16, isFull ? 34 : 30));
  const nameFont = Math.round(clamp(height * 0.13, 10, 13));
  const metaFont = Math.round(clamp(height * 0.11, 9, 12));
  const capacity = table.max_capacity ?? 4;
  const reservation = info.reservation;

  // Numbered tables (e.g. "Table 5") show the digits big and status-colored;
  // named tables (e.g. "My Table") show the name as a neutral heading.
  const hasDigits = /\d/.test(table.table_identifier);
  const displayLabel = hasDigits
    ? table.table_identifier.replace(/[^\d]/g, "")
    : table.table_identifier;
  const labelFont = hasDigits ? numberFont : Math.round(clamp(height * 0.18, 12, 19));

  const radius =
    shape === "round"
      ? "9999px"
      : shape === "oval"
      ? `${Math.min(width, height) / 2}px`
      : `${Math.round(clamp(width * 0.12, 10, 18))}px`;

  // The secondary "meta" line below the number.
  const renderMeta = () => {
    if (info.status === "open") {
      if (isFull) return null;
      return (
        <span className="text-gray-400" style={{ fontSize: metaFont }}>
          {capacity} seats
        </span>
      );
    }

    // Compact cards show just the key fact (time / status).
    if (!isFull) {
      if (info.status === "seated") {
        return (
          <span className={`font-semibold ${styles.accent}`} style={{ fontSize: metaFont }}>
            Seated
          </span>
        );
      }
      if (info.status === "overdue") {
        return (
          <span className={`font-semibold ${styles.accent}`} style={{ fontSize: metaFont }}>
            Due {reservation ? formatTime12(reservation.reservationTime) : ""}
          </span>
        );
      }
      // reserved
      return (
        <span className={`font-semibold ${styles.accent}`} style={{ fontSize: metaFont }}>
          {reservation ? formatTime12(reservation.reservationTime) : ""}
        </span>
      );
    }

    // Full cards show guest name + party + status/time.
    return (
      <div className="w-full">
        <div className="truncate font-semibold text-gray-800" style={{ fontSize: nameFont }}>
          {reservation?.guestName ?? "Reserved"}
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-1">
          <span className="truncate text-gray-400" style={{ fontSize: metaFont }}>
            Party of {reservation?.partySize ?? capacity}
          </span>
          <span className={`shrink-0 font-semibold ${styles.accent}`} style={{ fontSize: metaFont }}>
            {info.status === "seated"
              ? "Seated"
              : info.status === "overdue"
              ? `Due ${reservation ? formatTime12(reservation.reservationTime) : ""}`
              : reservation
              ? formatTime12(reservation.reservationTime)
              : ""}
          </span>
        </div>
      </div>
    );
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`absolute flex flex-col border shadow-sm transition-shadow hover:shadow-md ${styles.card}`}
      style={{
        left,
        top,
        width,
        height,
        borderRadius: radius,
        padding: Math.round(clamp(width * 0.07, 6, 12)),
      }}
    >
      {/* Top row: status dot + capacity badge */}
      <div className="flex w-full items-start justify-between">
        <span className={`rounded-full ${styles.dot}`} style={{ width: 9, height: 9 }} />
        {isFull && <CapacityBadge capacity={capacity} font={Math.round(clamp(height * 0.11, 9, 12))} />}
      </div>

      {/* Number / name */}
      <div className="flex flex-1 items-center justify-center overflow-hidden px-0.5">
        <span
          className={`text-center font-bold leading-tight ${hasDigits ? styles.number : "text-gray-700"} ${hasDigits ? "" : "line-clamp-2"}`}
          style={{ fontSize: labelFont }}
        >
          {displayLabel}
        </span>
      </div>

      {/* Meta line */}
      <div className={`flex w-full ${isFull ? "" : "items-center justify-center"}`}>{renderMeta()}</div>
    </button>
  );
}

export function FloorPlanView({ statusByTable, onTableClick }: FloorPlanViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  const { tables, borders, currentFloorId } = useCanvasStore();

  const floorTables = useMemo(
    () => tables.filter((t: CanvasTable) => t.floor_id === currentFloorId),
    [tables, currentFloorId]
  );
  const border = useMemo(
    () => borders.find((b: Border) => b.floorId === currentFloorId),
    [borders, currentFloorId]
  );

  // Track available space.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setSize({ width: el.offsetWidth, height: el.offsetHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const bbox = useMemo(() => computeBoundingBox(floorTables, border), [floorTables, border]);

  const scale = useMemo(() => {
    if (!size.width || !size.height) return 1;
    const s = Math.min(
      (size.width - SCREEN_PADDING * 2) / bbox.width,
      (size.height - SCREEN_PADDING * 2) / bbox.height
    );
    return clamp(s, MIN_SCALE, MAX_SCALE);
  }, [size, bbox]);

  const stageWidth = bbox.width * scale;
  const stageHeight = bbox.height * scale;

  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onTableClick(null, { x: 0, y: 0 });
  };

  const handleCardClick = (tableId: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    const cardRect = e.currentTarget.getBoundingClientRect();
    const contRect = containerRef.current?.getBoundingClientRect();
    if (!contRect) return;
    onTableClick(tableId, {
      x: cardRect.left - contRect.left + cardRect.width / 2,
      y: cardRect.bottom - contRect.top,
    });
  };

  return (
    <div
      ref={containerRef}
      onClick={handleBackgroundClick}
      className="relative flex h-full w-full items-center justify-center overflow-auto bg-gray-50 p-4"
      style={{
        backgroundImage: "radial-gradient(circle, #e5e7eb 1px, transparent 1px)",
        backgroundSize: "22px 22px",
      }}
    >
      {currentFloorId && floorTables.length > 0 ? (
        <div
          className="relative shrink-0"
          style={{ width: stageWidth, height: stageHeight }}
          onClick={handleBackgroundClick}
        >
          {/* Floor border container */}
          {border && (
            <div
              className="absolute rounded-2xl border border-gray-200 bg-white/50"
              style={{
                left: (border.x - bbox.x) * scale,
                top: (border.y - bbox.y) * scale,
                width: border.width * scale,
                height: border.height * scale,
              }}
            />
          )}

          {/* Chairs (behind cards) */}
          {floorTables.map((t: CanvasTable) => {
            const info = statusByTable[t.id] ?? { status: "open" as const, reservation: null };
            const chairColor = STATUS_STYLES[info.status].chair;
            const chairs = calculateChairPositions(
              t.max_capacity ?? 4,
              t.width,
              t.height,
              t.shape as "square" | "round" | "rectangular" | "oval"
            );
            return chairs.map((chair, i) => (
              <div
                key={`${t.id}-chair-${i}`}
                className={`absolute rounded-full ${chairColor}`}
                style={{
                  left: (t.position_x - bbox.x + chair.x) * scale,
                  top: (t.position_y - bbox.y + chair.y) * scale,
                  width: chair.width * scale,
                  height: chair.height * scale,
                }}
              />
            ));
          })}

          {/* Table cards */}
          {floorTables.map((t: CanvasTable) => {
            const info = statusByTable[t.id] ?? { status: "open" as const, reservation: null };
            return (
              <TableCard
                key={t.id}
                table={t}
                info={info}
                left={(t.position_x - bbox.x) * scale}
                top={(t.position_y - bbox.y) * scale}
                width={t.width * scale}
                height={t.height * scale}
                shape={t.shape}
                onClick={handleCardClick(t.id)}
              />
            );
          })}
        </div>
      ) : (
        <div className="text-center text-gray-500">
          <p className="text-lg font-medium">No tables on this floor</p>
          <p className="mt-2 text-sm">Use Edit Floor Plan to add tables</p>
        </div>
      )}
    </div>
  );
}
