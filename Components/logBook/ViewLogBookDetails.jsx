"use client";
import React from "react";
import { format } from "date-fns";
import { Table, TableHeader, TableBody, TableColumn, TableRow, TableCell } from "@heroui/table";
import { X, FileText, Calendar, Phone, Home, Tag, Clock, Notebook } from 'lucide-react';

export default function ViewLogBookDetails({ isOpen, onClose, logData }) {
  if (!isOpen || !logData) return null;

  // Format check-in time to 12-hour format
  const formatCheckInTime = (time) => {
    if (!time) return "-";
    try {
      return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      return time; // Fallback to original format if parsing fails
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-all duration-300">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full p-6 relative animate-in fade-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
        {/* Header section */}
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h2 className="text-xl font-bold text-hotel-primary">Customer & Booking Details:</h2>
          <button
            className="text-gray-400 hover:text-gray-900 transition-colors duration-200"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Customer & Booking Details with icons */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <h3 className="text-lg font-semibold mb-4 text-hotel-primary-text">
            Customer & Booking Details
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-hotel-primary" />
              <div>
                <p className="text-xs text-gray-500">Booking ID</p>
                <p className="font-medium">{logData.bookingId}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Home className="h-4 w-4 text-hotel-primary" />
              <div>
                <p className="text-xs text-gray-500">Property Type</p>
                <p className="font-medium">{logData.propertyType}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-hotel-primary" />
              <div>
                <p className="text-xs text-gray-500">Event Type</p>
                <p className="font-medium">{logData.eventType}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-hotel-primary" />
              <div>
                <p className="text-xs text-gray-500">Phone Number</p>
                <p className="font-medium">{logData.mobileNo}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-hotel-primary" />
              <div>
                <p className="text-xs text-gray-500">Check-in Time</p>
                <p className="font-medium">{formatCheckInTime(logData.checkInTime)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-hotel-primary" />
              <div>
                <p className="text-xs text-gray-500">Date</p>
                <p className="font-medium">
                  {format(new Date(logData.dateRange.from), 'dd/MM/yyyy')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 col-span-full">
              <Notebook className="h-4 w-4 text-hotel-primary" />
              <div>
                <p className="text-xs text-gray-500">Notes</p>
                <p className="font-medium">{logData.notes || '-'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Items Issued Section */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-hotel-primary-text">
            <span className="h-5 w-1 bg-hotel-primary rounded-full"></span>
            {logData.status === 'Verified' ? 'Items Returned' : 'Items Issued'}
          </h3>
          <div className="overflow-x-auto rounded-lg border border-gray-200 mb-3">
            <Table aria-label="Items issued table" className="w-full">
              <TableHeader>
                <TableColumn className="bg-hotel-primary text-gray-600 text-sm font-medium py-2 px-3 text-left">Category</TableColumn>
                <TableColumn className="bg-hotel-primary text-gray-600 text-sm font-medium py-2 px-3 text-left">Sub Category</TableColumn>
                <TableColumn className="bg-hotel-primary text-gray-600 text-sm font-medium py-2 px-3 text-left">Brand</TableColumn>
                <TableColumn className="bg-hotel-primary text-gray-600 text-sm font-medium py-2 px-3 text-left">Model</TableColumn>
                <TableColumn className="bg-hotel-primary text-gray-600 text-sm font-medium py-2 px-3 text-left">Quantity</TableColumn>
                <TableColumn className="bg-hotel-primary text-gray-600 text-sm font-medium py-2 px-3 text-left">Condition</TableColumn>
                <TableColumn className="bg-hotel-primary text-gray-600 text-sm font-medium py-2 px-3 text-left">Remarks</TableColumn>
              </TableHeader>
              <TableBody>
                {logData.itemsIssued.map((item, idx) => (
                  <TableRow key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <TableCell className="py-2 px-3 text-sm border-t border-gray-200">{item.category}</TableCell>
                    <TableCell className="py-2 px-3 text-sm border-t border-gray-200">{item.subCategory}</TableCell>
                    <TableCell className="py-2 px-3 text-sm border-t border-gray-200">{item.brand}</TableCell>
                    <TableCell className="py-2 px-3 text-sm border-t border-gray-200">{item.model}</TableCell>
                    <TableCell className="py-2 px-3 text-sm border-t border-gray-200">{item.quantity}</TableCell>
                    <TableCell className="py-2 px-3 text-sm border-t border-gray-200">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        item.condition === 'Good' ? 'bg-green-100 text-green-800' : 
                        item.condition === 'Fair' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'
                      }`}>
                        {item.condition}
                      </span>
                    </TableCell>
                    <TableCell className="py-2 px-3 text-sm border-t border-gray-200">{item.remarks}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex justify-end gap-3 mt-3">
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex flex-col items-end min-w-[90px] shadow-sm">
              <span className="text-xs text-gray-500 font-medium">Total Items</span>
              <span className="text-base font-bold text-hotel-primary-text">{logData.itemsIssued.length}</span>
            </div>
            <div className="bg-hotel-primary/10 border border-hotel-primary/20 rounded-lg px-3 py-2 flex flex-col items-end min-w-[120px] shadow-sm">
              <span className="text-xs text-hotel-primary font-medium">Total Amount</span>
              <span className="text-base font-bold text-hotel-primary">₹{logData.totalAmount?.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Electricity Section */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-hotel-primary-text">
            <span className="h-5 w-1 bg-hotel-primary rounded-full"></span>
            Electricity / Generator
          </h3>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableColumn>Type</TableColumn>
                <TableColumn>Start Reading</TableColumn>
                <TableColumn>End Reading</TableColumn>
                <TableColumn>Units Consumed</TableColumn>
                <TableColumn>Unit Type</TableColumn>
                <TableColumn>Cost/Unit</TableColumn>
                <TableColumn>Total</TableColumn>
                <TableColumn>Remarks</TableColumn>
              </TableHeader>
              <TableBody>
                {logData.electricityReadings.map((reading, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{reading.type}</TableCell>
                    <TableCell>{reading.startReading}</TableCell>
                    <TableCell>{reading.endReading}</TableCell>
                    <TableCell>{reading.unitsConsumed}</TableCell>
                    <TableCell>{reading.unitType}</TableCell>
                    <TableCell>₹{reading.costPerUnit}</TableCell>
                    <TableCell>₹{reading.total}</TableCell>
                    <TableCell>{reading.remarks}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex justify-end mt-2">
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex flex-col items-end min-w-[120px] shadow-sm">
              <span className="text-xs text-gray-500 font-medium">Total Amount</span>
              <span className="text-lg font-bold text-hotel-primary-text">
                ₹{logData.electricityReadings.reduce((sum, r) => sum + (parseFloat(r.total) || 0), 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Damage/Loss Summary Section - Show for all statuses if damageLossSummary exists */}
        {logData.damageLossSummary && logData.damageLossSummary.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-hotel-primary-text">
              <span className="h-5 w-1 bg-hotel-primary rounded-full"></span>
              Damage/Loss Summary
            </h3>
            <div className="overflow-x-auto rounded-lg border border-gray-200 mb-3">
              <Table aria-label="Damage/Loss summary table" className="w-full">
                <TableHeader>
                  <TableColumn className="bg-hotel-primary text-gray-600 text-sm font-medium py-2 px-3 text-left">Category</TableColumn>
                  <TableColumn className="bg-hotel-primary text-gray-600 text-sm font-medium py-2 px-3 text-left">Sub Category</TableColumn>
                  <TableColumn className="bg-hotel-primary text-gray-600 text-sm font-medium py-2 px-3 text-left">Brand</TableColumn>
                  <TableColumn className="bg-hotel-primary text-gray-600 text-sm font-medium py-2 px-3 text-left">Model</TableColumn>
                  <TableColumn className="bg-hotel-primary text-gray-600 text-sm font-medium py-2 px-3 text-left">Quantity</TableColumn>
                  <TableColumn className="bg-hotel-primary text-gray-600 text-sm font-medium py-2 px-3 text-left">Condition</TableColumn>
                  <TableColumn className="bg-hotel-primary text-gray-600 text-sm font-medium py-2 px-3 text-left">Remarks</TableColumn>
                  <TableColumn className="bg-hotel-primary text-gray-600 text-sm font-medium py-2 px-3 text-left">Amount</TableColumn>
                </TableHeader>
                <TableBody>
                  {logData.damageLossSummary.map((item, idx) => (
                    <TableRow key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <TableCell className="py-2 px-3 text-sm border-t border-gray-200">{item.category}</TableCell>
                      <TableCell className="py-2 px-3 text-sm border-t border-gray-200">{item.subCategory}</TableCell>
                      <TableCell className="py-2 px-3 text-sm border-t border-gray-200">{item.brand}</TableCell>
                      <TableCell className="py-2 px-3 text-sm border-t border-gray-200">{item.model}</TableCell>
                      <TableCell className="py-2 px-3 text-sm border-t border-gray-200">{item.quantity}</TableCell>
                      <TableCell className="py-2 px-3 text-sm border-t border-gray-200">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          item.condition === 'Broken' ? 'bg-red-100 text-red-800' : 
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {item.condition}
                        </span>
                      </TableCell>
                      <TableCell className="py-2 px-3 text-sm border-t border-gray-200">{item.remarks || '-'}</TableCell>
                      <TableCell className="py-2 px-3 text-sm border-t border-gray-200">₹{item.amount || 0}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex justify-end gap-3 mt-3">
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex flex-col items-end min-w-[90px] shadow-sm">
                <span className="text-xs text-gray-500 font-medium">Total Items</span>
                <span className="text-base font-bold text-hotel-primary-text">{logData.damageLossSummary.length}</span>
              </div>
              <div className="bg-hotel-primary/10 border border-hotel-primary/20 rounded-lg px-3 py-2 flex flex-col items-end min-w-[120px] shadow-sm">
                <span className="text-xs text-hotel-primary font-medium">Recovery Amount</span>
                <span className="text-base font-bold text-hotel-primary">₹{logData.totalRecoveryAmount || 0}</span>
              </div>
            </div>
          </div>
        )}

        {/* Grand Total Summary - Only show for Verified status */}
        {logData.status === 'Verified' && (
          <div className="border-t border-dashed pt-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-hotel-primary-text">
              <span className="h-5 w-1 bg-hotel-primary rounded-full"></span>
              Grand Total Summary
            </h3>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="grid grid-cols-2 gap-4 max-w-md ml-auto">
                <div className="text-gray-600">Total Amount for Items:</div>
                <div className="text-right font-medium">₹{logData.totalAmount || 0}</div>
                
                <div className="text-gray-600">Total Electricity Cost:</div>
                <div className="text-right font-medium">
                  ₹{logData.electricityReadings.reduce((sum, r) => sum + (parseFloat(r.total) || 0), 0).toFixed(2)}
                </div>
                
                <div className="text-gray-600">Total Recovery Amount:</div>
                <div className="text-right font-medium">₹{logData.totalRecoveryAmount || 0}</div>
                
                <div className="font-semibold text-hotel-primary-text border-t pt-2">Grand Total:</div>
                <div className="text-right font-bold text-hotel-primary border-t pt-2">₹{(
                  (parseFloat(logData.totalAmount) || 0) +
                  (logData.electricityReadings.reduce((sum, r) => sum + (parseFloat(r.total) || 0), 0)) +
                  (parseFloat(logData.totalRecoveryAmount) || 0)
                ).toFixed(2)}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}