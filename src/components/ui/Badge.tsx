import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  NEW: "bg-amber-100 text-amber-800",
  CONTACTED: "bg-blue-100 text-blue-800",
  FULFILLED: "bg-green-100 text-green-800",
};

const statusLabels: Record<string, string> = {
  NEW: "جديد",
  CONTACTED: "تم التواصل",
  FULFILLED: "تم التسليم",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-sm font-bold",
        statusStyles[status] ?? "bg-gray-100 text-gray-800"
      )}
    >
      {statusLabels[status] ?? status}
    </span>
  );
}
