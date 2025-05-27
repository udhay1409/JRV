"use client"

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts"

export const DonutChart = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          innerRadius="70%"
          outerRadius="85%"
          paddingAngle={3}
          dataKey="value"
          strokeWidth={1}
          stroke="#fff"
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.color}
              style={{
                filter: `drop-shadow(0px 2px 4px ${entry.color}40)`,
              }}
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "white",
            border: "none",
            borderRadius: "8px",
            boxShadow: "0 2px 12px -2px rgb(0 0 0 / 0.15)",
            padding: "8px 12px",
          }}
          formatter={(value, name) => [
            value,
            name,
          ]}
          itemStyle={{
            fontSize: "12px",
            color: "#4B5563",
          }}
          labelStyle={{
            fontSize: "12px",
            fontWeight: "500",
            color: "#1F2937",
            marginBottom: "4px",
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}