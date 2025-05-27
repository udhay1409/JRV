"use client"

import { useState, useEffect } from "react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addDays, isSameDay, startOfWeek, endOfWeek } from "date-fns"

export default function WeeklySchedule({ currentDate, category, bookings }) {
  const [days, setDays] = useState([])

  useEffect(() => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    
    // Get all days in the month
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })
    
    // Get the first week's start and last week's end
    const firstWeekStart = startOfWeek(monthStart)
    const lastWeekEnd = endOfWeek(monthEnd)
    
    // Get all days including those from previous/next months to fill the calendar
    const allDays = eachDayOfInterval({ start: firstWeekStart, end: lastWeekEnd })
    
    setDays(allDays)
  }, [currentDate])

  const getBookingsForDay = (day) => {
    // Don't show bookings for past dates
    const today = new Date()
    if (day < today && !isSameDay(day, today)) return []

    return bookings.filter((booking) => {
      const isSameDate = isSameDay(booking.date, day)
      if (category === 'all') return isSameDate
      if (category === 'hall') return isSameDate && booking.propertyType === 'hall'
      if (category === 'room') return isSameDate && booking.propertyType === 'room'
      return false
    })
  }

  const isPastDate = (day) => {
    const today = new Date()
    return day < today && !isSameDay(day, today)
  }

  const isCurrentMonth = (day) => {
    return day.getMonth() === currentDate.getMonth()
  }

  return (
    <div className="grid grid-cols-7 gap-2">
      {/* Week day headers */}
      <div className="text-center text-sm font-bold py-2 text-gray-600">Sun</div>
      <div className="text-center text-sm font-bold py-2 text-gray-600">Mon</div>
      <div className="text-center text-sm font-bold py-2 text-gray-600">Tue</div>
      <div className="text-center text-sm font-bold py-2 text-gray-600">Wed</div>
      <div className="text-center text-sm font-bold py-2 text-gray-600">Thu</div>
      <div className="text-center text-sm font-bold py-2 text-gray-600">Fri</div>
      <div className="text-center text-sm font-bold py-2 text-gray-600">Sat</div>

      {/* Calendar days */}
      {days.map((day, index) => {
        const isDatePast = isPastDate(day)
        const isInCurrentMonth = isCurrentMonth(day)
        
        return (
          <div 
            key={index} 
            className={`min-h-[120px] border border-gray-100 p-1 ${
              isDatePast ? 'bg-gray-50' : ''
            } ${!isInCurrentMonth ? 'opacity-50' : ''}`}
          >
            <div className={`text-xs ${
              isDatePast ? 'text-gray-400' : 'text-gray-500'
            } mb-1`}>
              {format(day, "d")}
            </div>
            <div className="space-y-1">
              {getBookingsForDay(day).map((booking, index) => (
                <div 
                  key={`${booking.id}-${index}`} 
                  className={`${booking.color} p-2 rounded text-xs`}
                >
                  <div className="text-[10px] text-gray-600">
                    {booking.propertyId}
                  </div>
                  <div className="font-medium">
                    {booking.title} - {booking.type}
                  </div>
                  {booking.subtitle && (
                    <div className="text-[10px] mt-1">{booking.subtitle}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
