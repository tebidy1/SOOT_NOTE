
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart"
import { shipments } from "@/data/mock/shipments"
import { useI18n } from "@/providers/i18n-provider"
import { ShipmentStatusAPI } from "@/types"
import { Bar, BarChart, Pie, PieChart, Cell, XAxis, YAxis } from "recharts"

function generateRevenueData() {
  return [
    { month: "Jan", revenue: Math.floor(Math.random() * 5000) + 1000 },
    { month: "Feb", revenue: Math.floor(Math.random() * 5000) + 1000 },
    { month: "Mar", revenue: Math.floor(Math.random() * 5000) + 1000 },
    { month: "Apr", revenue: Math.floor(Math.random() * 5000) + 1000 },
    { month: "May", revenue: Math.floor(Math.random() * 5000) + 1000 },
    { month: "Jun", revenue: Math.floor(Math.random() * 5000) + 1000 },
  ]
}

export function RevenueChart() {
  const [revenueData, setRevenueData] = useState<{ month: string; revenue: number }[]>([])

  useEffect(() => {
    setRevenueData(generateRevenueData())
  }, [])

  const chartConfig = {
    revenue: {
      label: "Revenue",
      color: "hsl(var(--primary))",
    },
  }

  if (revenueData.length === 0) {
    return <div className="min-h-[200px] w-full" />
  }

  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
        <BarChart accessibilityLayer data={revenueData}>
        <XAxis
            dataKey="month"
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
        />
        <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `$${value / 1000}K`}
        />
        <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent indicator="dot" />}
        />
        <Bar
            dataKey="revenue"
            fill="var(--color-revenue)"
            radius={4}
        />
        </BarChart>
    </ChartContainer>
  )
}

export function StatusDistributionChart() {
  const { t } = useI18n();

  const statusCounts = shipments.reduce((acc, shipment) => {
    acc[shipment.status] = (acc[shipment.status] || 0) + 1;
    return acc;
  }, {} as Record<ShipmentStatusAPI, number>);

  const statusData = Object.entries(statusCounts).map(([status, count]) => ({
    status: status, // Use raw status key
    count,
    fill: `var(--color-${status})` // Reference variable from ChartContainer
  }));

   const chartConfig = {
    delivered: { label: t.delivered, color: "hsl(var(--chart-1))" },
    in_transit: { label: t.inTransit, color: "hsl(var(--chart-2))" },
    pending: { label: t.pending, color: "hsl(var(--chart-3))" },
    picked_up: { label: t.pickedUp, color: "hsl(var(--chart-5))" },
    cancelled: { label: t.cancelled, color: "hsl(var(--chart-4))" },
  } satisfies import("@/components/ui/chart").ChartConfig

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.statusDistribution}</CardTitle>
        <CardDescription>{t.statusBreakdown}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square h-full max-h-[350px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel nameKey="status" />}
            />
            <Pie
              data={statusData}
              dataKey="count"
              nameKey="status"
              innerRadius={60}
              strokeWidth={5}
            >
              {statusData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <ChartLegend content={<ChartLegendContent nameKey="status" />} />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
