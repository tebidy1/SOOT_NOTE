"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

// Mock zones for demo purposes
const ZONES = ["Zone A", "Zone B", "Zone C"];
const SERVICES = [
  { id: "standard", name: "Standard Delivery", multiplier: 1, eta: "3-5 Business Days" },
  { id: "express", name: "Express Delivery", multiplier: 2.5, eta: "1-2 Business Days" },
];

interface Quote {
  serviceId: string;
  serviceName: string;
  cost: number;
  currency: string;
  eta: string;
}

export function PricingEstimatorWidget({ className }: { className?: string }) {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [weight, setWeight] = useState<number | "">("");
  const [quotes, setQuotes] = useState<Quote[] | null>(null);
  const [loading, setLoading] = useState(false);

  // Simplified pricing logic: Base Rate + (Weight * 2) * Service Multiplier
  const calculateQuote = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setQuotes(null);

    // Simulate API delay
    setTimeout(() => {
      const baseRate = 10; // Base cost
      const w = Number(weight) || 1;

      const calculatedQuotes = SERVICES.map((service) => ({
        serviceId: service.id,
        serviceName: service.name,
        cost: (baseRate + w * 2) * service.multiplier,
        currency: "USD",
        eta: service.eta,
      }));

      setQuotes(calculatedQuotes);
      setLoading(false);
    }, 800);
  };

  return (
    <div className={cn("bg-card rounded-xl shadow-md p-6 border border-border", className)}>
      <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
        <span className="material-icons text-primary">calculate</span>
        Get a Quote
      </h3>

      <form onSubmit={calculateQuote} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-muted-foreground">Origin</label>
            <Select required value={origin} onValueChange={setOrigin}>
              <SelectTrigger>
                <SelectValue placeholder="Select Origin" />
              </SelectTrigger>
              <SelectContent>
                {ZONES.map((z) => (
                  <SelectItem key={z} value={z}>{z}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-muted-foreground">Destination</label>
            <Select required value={destination} onValueChange={setDestination}>
               <SelectTrigger>
                <SelectValue placeholder="Select Destination" />
              </SelectTrigger>
              <SelectContent>
                {ZONES.map((z) => (
                  <SelectItem key={z} value={z}>{z}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-muted-foreground">Weight (kg)</label>
          <Input
            type="number"
            min="0.1"
            step="0.1"
            required
            placeholder="e.g. 5.0"
            value={weight}
            onChange={(e) => setWeight(Number(e.target.value))}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 flex justify-center items-center gap-2"
        >
          {loading ? (
            <span className="material-icons animate-spin text-sm">refresh</span>
          ) : (
            <span className="material-icons text-sm">search</span>
          )}
          {loading ? "Calculating..." : "Calculate Price"}
        </button>
      </form>

      {quotes && (
        <div className="mt-6 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Estimated Rates</h4>
          {quotes.map((quote) => (
            <div key={quote.serviceId} className="flex items-center justify-between p-3 rounded-lg bg-muted border border-border hover:border-primary/30 transition-colors">
              <div>
                <p className="font-bold text-foreground">{quote.serviceName}</p>
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                  <span className="material-icons text-[10px]">schedule</span>
                  {quote.eta}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-black text-primary">{quote.currency} {quote.cost.toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
