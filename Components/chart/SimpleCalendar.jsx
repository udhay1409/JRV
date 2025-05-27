"use client"

import React, { useState } from 'react'
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  subDays,
  startOfDay 
} from 'date-fns'

const QUICK_RANGES = [
  { label: 'Custom', range: null },
  { label: 'Today', range: { start: new Date(), end: new Date() } },
  { 
    label: 'Yesterday', 
    range: { 
      start: subDays(new Date(), 1), 
      end: subDays(new Date(), 1) 
    } 
  },
  { 
    label: 'Last 7 days', 
    range: { 
      start: subDays(new Date(), 6), 
      end: new Date() 
    } 
  },
  { 
    label: 'Last 30 days', 
    range: { 
      start: subDays(new Date(), 29), 
      end: new Date() 
    } 
  },
]

export function SimpleCalendar({ onSelect, onClose, minDate = new Date() }) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedRange, setSelectedRange] = useState({ start: null, end: null })
  const [activePreset, setActivePreset] = useState('Custom')
  const { start, end } = selectedRange

  const handleQuickRange = (preset) => {
    setActivePreset(preset.label)
    if (preset.range) {
      // Ensure the range doesn't include past dates
      const range = {
        start: startOfDay(preset.range.start) < startOfDay(minDate) ? minDate : preset.range.start,
        end: startOfDay(preset.range.end) < startOfDay(minDate) ? minDate : preset.range.end
      }
      setSelectedRange(range)
    }
  }

  // Handle individual day selection
  function handleDayClick(day) {
    // Don't allow selecting dates before minDate
    if (startOfDay(day) < startOfDay(minDate)) return

    if (!start || (start && end)) {
      setSelectedRange({ start: day, end: null })
    } else {
      setSelectedRange(day < start 
        ? { start: day, end: start } 
        : { start, end: day }
      )
    }
  }

  return (
    <div className="fixed inset-0 z-[1000] overflow-y-auto">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm" 
        onClick={onClose} 
      />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-[600px]">
          <div className="flex flex-col sm:flex-row">
            {/* Quick Ranges */}
            <div className="w-full sm:w-1/3 p-3 border-b sm:border-b-0 sm:border-r border-gray-200">
              <div className="text-sm font-medium text-gray-700 mb-2">Quick Select</div>
              <ul className="space-y-1">
                {QUICK_RANGES.map((preset) => (
                  <li
                    key={preset.label}
                    onClick={() => handleQuickRange(preset)}
                    className={`
                      cursor-pointer px-3 py-1.5 rounded-md text-sm transition-colors
                      ${activePreset === preset.label 
                        ? 'bg-blue-50 text-blue-600 font-medium' 
                        : 'text-gray-600 hover:bg-gray-50'}
                    `}
                  >
                    {preset.label}
                  </li>
                ))}
              </ul>
            </div>

            {/* Calendar and Inputs */}
            <div className="flex-1 p-3">
              {/* Header: Date Inputs & Close Button */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Start</label>
                  <input
                    type="text"
                    readOnly
                    value={start ? format(start, 'MMM dd, yyyy') : ''}
                    className="w-full border border-gray-300 rounded-md p-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Select start"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1">End</label>
                  <input
                    type="text"
                    readOnly
                    value={end ? format(end, 'MMM dd, yyyy') : ''}
                    className="w-full border border-gray-300 rounded-md p-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Select end"
                  />
                </div>
                <button
                  onClick={onClose}
                  className="self-end p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Calendar Navigation */}
              <div className="flex justify-between items-center mb-2">
                <button
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <svg className="w-4 h-4 text-gray-600" fill="none" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="text-sm font-semibold text-gray-900">
                  {format(currentMonth, 'MMMM yyyy')}
                </div>
                <button
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <svg className="w-4 h-4 text-gray-600" fill="none" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Days-of-Week Header */}
              <div className="grid grid-cols-7 text-center text-xs font-medium text-gray-500 mb-1">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                  <div key={day} className="py-1">{day}</div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {eachDayOfInterval({
                  start: startOfMonth(currentMonth),
                  end: endOfMonth(currentMonth)
                }).map((day) => {
                  const isSelected = isSameDay(day, start) || isSameDay(day, end)
                  const isInRange = start && end && day > start && day < end

                  return (
                    <button
                      key={day.toString()}
                      onClick={() => handleDayClick(day)}
                      disabled={startOfDay(day) < startOfDay(minDate)}
                      className={`
                        aspect-square p-1 text-xs rounded-md transition-all
                        ${!isSameMonth(day, currentMonth) ? 'text-gray-300' : 'text-gray-700'}
                        ${isSelected ? 'bg-blue-500 text-white hover:bg-blue-600' : 'hover:bg-gray-100'}
                        ${isInRange ? 'bg-blue-50 text-blue-600' : ''}
                        ${startOfDay(day) < startOfDay(minDate) ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                    >
                      {format(day, 'd')}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-gray-200 px-3 pb-3">
            <div className="text-xs text-gray-600">
              {start && end && (
                <>
                  {format(start, 'MMM dd, yyyy')} - {format(end, 'MMM dd, yyyy')}
                </>
              )}
            </div>
            <div className="space-x-2">
              <button
                onClick={onClose}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (start && end) {
                    onSelect({ from: start, to: end })
                  }
                }}
                disabled={!start || !end}
                className="px-3 py-1.5 text-xs font-medium bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}