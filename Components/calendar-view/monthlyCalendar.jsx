"use client"

import { useState, useEffect } from "react"
import { Tooltip } from "@heroui/tooltip"
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  addDays,
} from "date-fns"

export default function MonthlyCalendar({ currentDate, occasions = [] }) {
  const [days, setDays] = useState([])

  useEffect(() => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

    const firstDayOfMonth = monthStart.getDay()
    const lastDayOfMonth = monthEnd.getDay()

    const previousMonthDays = Array.from({ length: firstDayOfMonth }, (_, i) =>
      addDays(monthStart, -firstDayOfMonth + i)
    )

    const nextMonthDays = Array.from({ length: 6 - lastDayOfMonth }, (_, i) => addDays(monthEnd, i + 1))

    setDays([...previousMonthDays, ...daysInMonth, ...nextMonthDays])
  }, [currentDate])

  const getOccasionsForDay = (date) => {
    return occasions.filter(occasion =>
      occasion.dates.some(occDate => 
        new Date(occDate).toDateString() === date.toDateString()
      )
    )
  }

  return (
    <div className="bg-white rounded-lg">
      <div className="grid grid-cols-7 text-center text-xs text-gray-500 mb-2">
        <div className="py-1">Sun</div>
        <div className="py-1">Mon</div>
        <div className="py-1">Tue</div>
        <div className="py-1">Wed</div>
        <div className="py-1">Thu</div>
        <div className="py-1">Fri</div>
        <div className="py-1">Sat</div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-sm">
        {days.map((day, index) => {
          const isCurrentMonth = isSameMonth(day, currentDate)
          const dayOccasions = getOccasionsForDay(day)
          const hasOccasions = dayOccasions.length > 0

          return (
            <Tooltip
              key={index}
              content={
                hasOccasions ? (
                  <div className="space-y-1">
                    {dayOccasions.map((occ, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span 
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: occ.color }}
                        />
                        <span>{occ.name}</span>
                      </div>
                    ))}
                  </div>
                ) : null
              }
              className="bg-white px-2 py-1 rounded-md shadow-lg border border-gray-100"
              isDisabled={!hasOccasions}
            >
              <div
                className={`
                  relative h-8 w-8 flex items-center justify-center
                  ${!isCurrentMonth ? "text-gray-400" : "text-gray-700"}
                `}
              >
                <span className={`z-10 ${hasOccasions ? 'text-white' : ''}`}>
                  {format(day, "d")}
                </span>
                {hasOccasions && (
                  <div 
                    className="absolute inset-0 rounded-full"
                    style={{ 
                      backgroundColor: dayOccasions[0].color,
                      opacity: isCurrentMonth ? 1 : 0.5 
                    }}
                  />
                )}
                {dayOccasions.length > 1 && (
                  <span className="absolute -bottom-1 text-[8px] text-gray-500">
                    +{dayOccasions.length - 1}
                  </span>
                )}
              </div>
            </Tooltip>
          )
        })}
      </div>
    </div>
  )
}
