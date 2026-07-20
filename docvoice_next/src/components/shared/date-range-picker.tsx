"use client"

import * as React from "react"
import { addDays, format, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useI18n } from "@/providers/i18n-provider"

function buildPresets(now: Date) {
  return [
    { value: 'today', label: 'Today', range: { from: now, to: now } },
    { value: 'yesterday', label: 'Yesterday', range: { from: addDays(now, -1), to: addDays(now, -1) } },
    { value: 'last7', label: 'Last 7 days', range: { from: addDays(now, -6), to: now } },
    { value: 'last30', label: 'Last 30 days', range: { from: addDays(now, -29), to: now } },
    { value: 'thisMonth', label: 'This Month', range: { from: startOfMonth(now), to: endOfMonth(now) } },
    { value: 'lastMonth', label: 'Last Month', range: { from: startOfMonth(subMonths(now, 1)), to: endOfMonth(subMonths(now, 1)) } },
    { value: 'thisYear', label: 'This Year', range: { from: startOfYear(now), to: endOfYear(now) } },
  ];
}

export function DateRangePicker({
  className,
}: React.HTMLAttributes<HTMLDivElement>) {
  const { t } = useI18n();
  const [mounted, setMounted] = React.useState(false);
  const [presets, setPresets] = React.useState<{ value: string; label: string; range: DateRange }[]>([]);
  const [date, setDate] = React.useState<DateRange | undefined>(undefined);
  const [isPopoverOpen, setPopoverOpen] = React.useState(false);
  const [selectedPreset, setSelectedPreset] = React.useState<string | undefined>(undefined);

  React.useEffect(() => {
    const now = new Date();
    setPresets(buildPresets(now));
    setDate({ from: startOfYear(now), to: now });
    setSelectedPreset('thisYear');
    setMounted(true);
  }, []);

  const handleDateSelect = (range: DateRange | undefined) => {
    setDate(range);
    if (range?.from && range?.to) {
      setPopoverOpen(false);
    }
  };

  const handlePresetClick = (preset: typeof presets[0]) => {
    setDate(preset.range);
    setSelectedPreset(preset.value);
    setPopoverOpen(false);
  }

  React.useEffect(() => {
    const isPresetDate = presets.some(p => 
        p.range.from?.getTime() === date?.from?.getTime() && 
        p.range.to?.getTime() === date?.to?.getTime()
    );
    if (!isPresetDate) {
        setSelectedPreset(undefined);
    }
  }, [date]);

  if (!mounted) {
    return <div className={cn("grid gap-2", className)} />;
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isPopoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[260px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>{t.pickADate || 'Pick a date'}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
            <div className="flex">
                <div className="flex flex-col space-y-2 p-2 border-e">
                    {presets.map((preset) => (
                        <Button
                            key={preset.value}
                            onClick={() => handlePresetClick(preset)}
                            variant={selectedPreset === preset.value ? "secondary" : "ghost"}
                            className="w-full justify-start text-sm h-8 px-2"
                        >
                            {preset.label}
                        </Button>
                    ))}
                </div>
                <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={date?.from}
                    selected={date}
                    onSelect={handleDateSelect}
                    numberOfMonths={2}
                />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
