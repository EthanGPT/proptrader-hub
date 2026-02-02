import { useState, useMemo } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  FileText,
  X,
} from "lucide-react";
import { useData } from "@/context/DataContext";
import { DailyEntry } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const Calendar = () => {
  const { dailyEntries, upsertDailyEntry, deleteDailyEntry } = useData();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Build a lookup map for fast access
  const entryMap = useMemo(() => {
    const map = new Map<string, DailyEntry>();
    dailyEntries.forEach((e) => map.set(e.date, e));
    return map;
  }, [dailyEntries]);

  // Monthly stats
  const monthStats = useMemo(() => {
    const monthStr = format(currentMonth, "yyyy-MM");
    const monthEntries = dailyEntries.filter((e) => e.date.startsWith(monthStr));
    const totalPnl = monthEntries.reduce((sum, e) => sum + (e.pnl ?? 0), 0);
    const winDays = monthEntries.filter((e) => (e.pnl ?? 0) > 0).length;
    const lossDays = monthEntries.filter((e) => (e.pnl ?? 0) < 0).length;
    const tradingDays = monthEntries.filter((e) => e.pnl !== undefined && e.pnl !== 0).length;
    return { totalPnl, winDays, lossDays, tradingDays };
  }, [dailyEntries, currentMonth]);

  // Generate calendar grid
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days: Date[] = [];
    let day = calStart;
    while (day <= calEnd) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [currentMonth]);

  const selectedEntry = selectedDate
    ? entryMap.get(format(selectedDate, "yyyy-MM-dd"))
    : null;

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
  };

  const handleAddEdit = () => {
    setIsDialogOpen(true);
  };

  const handleDelete = () => {
    if (selectedEntry) {
      deleteDailyEntry(selectedEntry.id);
      setSelectedDate(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-fade-in">
        <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
        <p className="text-muted-foreground">
          Track your daily P&L and journal notes
        </p>
      </div>

      {/* Monthly stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 animate-slide-up">
        <div className="stat-card p-4">
          <p className="text-xs text-muted-foreground">Monthly P&L</p>
          <p
            className={cn(
              "text-xl font-bold",
              monthStats.totalPnl >= 0 ? "text-success" : "text-destructive"
            )}
          >
            {monthStats.totalPnl >= 0 ? "+" : ""}$
            {Math.abs(monthStats.totalPnl).toLocaleString()}
          </p>
        </div>
        <div className="stat-card p-4">
          <p className="text-xs text-muted-foreground">Win Days</p>
          <p className="text-xl font-bold text-success">{monthStats.winDays}</p>
        </div>
        <div className="stat-card p-4">
          <p className="text-xs text-muted-foreground">Loss Days</p>
          <p className="text-xl font-bold text-destructive">
            {monthStats.lossDays}
          </p>
        </div>
        <div className="stat-card p-4">
          <p className="text-xs text-muted-foreground">Win Rate</p>
          <p className="text-xl font-bold">
            {monthStats.tradingDays > 0
              ? Math.round(
                  (monthStats.winDays / monthStats.tradingDays) * 100
                )
              : 0}
            %
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Calendar Grid */}
        <div className="stat-card flex-1 animate-slide-up p-4 sm:p-6">
          {/* Month navigation */}
          <div className="mb-4 flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-lg font-semibold">
              {format(currentMonth, "MMMM yyyy")}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          {/* Day headers */}
          <div className="mb-1 grid grid-cols-7 gap-1">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div
                key={d}
                className="py-2 text-center text-xs font-medium text-muted-foreground"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day) => {
              const dateStr = format(day, "yyyy-MM-dd");
              const entry = entryMap.get(dateStr);
              const inMonth = isSameMonth(day, currentMonth);
              const selected = selectedDate && isSameDay(day, selectedDate);
              const today = isToday(day);
              const pnl = entry?.pnl;
              const hasNotes = !!entry?.notes;

              return (
                <button
                  key={dateStr}
                  onClick={() => handleDayClick(day)}
                  className={cn(
                    "relative flex min-h-[72px] flex-col items-center rounded-lg border p-1 text-left transition-all hover:border-accent/50 sm:min-h-[80px] sm:p-2",
                    !inMonth && "opacity-30",
                    selected
                      ? "border-accent bg-accent/10 ring-1 ring-accent"
                      : "border-border/50 bg-card/50",
                    today && !selected && "border-accent/30"
                  )}
                >
                  <span
                    className={cn(
                      "mb-1 text-xs font-medium sm:text-sm",
                      today && "rounded-full bg-accent px-1.5 py-0.5 text-accent-foreground",
                      !inMonth && "text-muted-foreground"
                    )}
                  >
                    {format(day, "d")}
                  </span>

                  {pnl !== undefined && pnl !== null && (
                    <span
                      className={cn(
                        "text-[10px] font-bold sm:text-xs",
                        pnl > 0
                          ? "text-success"
                          : pnl < 0
                          ? "text-destructive"
                          : "text-muted-foreground"
                      )}
                    >
                      {pnl > 0 ? "+" : ""}${Math.abs(pnl).toLocaleString()}
                    </span>
                  )}

                  {hasNotes && (
                    <FileText className="absolute bottom-1 right-1 h-3 w-3 text-muted-foreground/60" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Side Panel - Selected Day Details */}
        <div className="stat-card animate-slide-up w-full p-5 lg:w-80">
          {selectedDate ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">
                  {format(selectedDate, "EEEE, MMM d")}
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setSelectedDate(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {selectedEntry ? (
                <>
                  {selectedEntry.pnl !== undefined && (
                    <div>
                      <p className="text-xs text-muted-foreground">P&L</p>
                      <p
                        className={cn(
                          "text-2xl font-bold",
                          selectedEntry.pnl >= 0
                            ? "text-success"
                            : "text-destructive"
                        )}
                      >
                        {selectedEntry.pnl >= 0 ? "+" : ""}$
                        {Math.abs(selectedEntry.pnl).toLocaleString()}
                      </p>
                    </div>
                  )}

                  {selectedEntry.notes && (
                    <div>
                      <p className="mb-1 text-xs text-muted-foreground">
                        Journal Notes
                      </p>
                      <div className="rounded-lg bg-secondary/50 p-3 text-sm leading-relaxed whitespace-pre-wrap">
                        {selectedEntry.notes}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={handleAddEdit}
                    >
                      <Pencil className="mr-1 h-3 w-3" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={handleDelete}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    No entry for this day yet.
                  </p>
                  <Button
                    className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                    onClick={handleAddEdit}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Entry
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-full min-h-[200px] flex-col items-center justify-center text-center">
              <FileText className="mb-3 h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                Select a day to view or add your P&L and journal notes
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedEntry ? "Edit Entry" : "Add Entry"} -{" "}
              {selectedDate && format(selectedDate, "MMM d, yyyy")}
            </DialogTitle>
          </DialogHeader>
          {selectedDate && (
            <EntryForm
              date={format(selectedDate, "yyyy-MM-dd")}
              initialData={selectedEntry}
              onSave={(entry) => {
                upsertDailyEntry(entry);
                setIsDialogOpen(false);
              }}
              onClose={() => setIsDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface EntryFormProps {
  date: string;
  initialData?: DailyEntry | null;
  onSave: (entry: Omit<DailyEntry, "id">) => void;
  onClose: () => void;
}

function EntryForm({ date, initialData, onSave, onClose }: EntryFormProps) {
  const [pnl, setPnl] = useState<string>(
    initialData?.pnl !== undefined ? String(initialData.pnl) : ""
  );
  const [notes, setNotes] = useState(initialData?.notes ?? "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      date,
      pnl: pnl !== "" ? parseFloat(pnl) : undefined,
      notes: notes || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="pnl">Daily P&L ($)</Label>
        <Input
          id="pnl"
          type="number"
          step="0.01"
          placeholder="e.g. 450 or -120"
          value={pnl}
          onChange={(e) => setPnl(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Use negative numbers for losses. Leave blank if no trades.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Journal Notes</Label>
        <Textarea
          id="notes"
          rows={5}
          placeholder="What went well? What could be improved? Key observations..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="submit"
          className="bg-accent text-accent-foreground hover:bg-accent/90"
        >
          {initialData ? "Update" : "Save"} Entry
        </Button>
      </div>
    </form>
  );
}

export default Calendar;
