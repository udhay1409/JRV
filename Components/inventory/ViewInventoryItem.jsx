"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { usePagePermission } from "../../hooks/usePagePermission";
import { motion } from "framer-motion";
import { Table, TableHeader, TableBody, TableColumn, TableRow, TableCell } from "@heroui/table";
import { format } from "date-fns";

const SkeletonLoader = () => (
  <div className="animate-pulse">
    <div className="h-8 w-48 bg-gray-200 rounded mb-8"></div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[...Array(10)].map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 w-24 bg-gray-200 rounded"></div>
          <div className="h-6 w-32 bg-gray-200 rounded"></div>
        </div>
      ))}
    </div>
  </div>
);

export default function ViewInventoryItem({ itemId }) {
  const hasViewPermission = usePagePermission("Inventory", "view");
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [damageHistory, setDamageHistory] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [itemResponse, damageResponse] = await Promise.all([
          axios.get(`/api/inventory/${itemId}`),
          axios.get(`/api/logBook?category=${encodeURIComponent(item?.category || '')}&subCategory=${encodeURIComponent(item?.subCategory || '')}&brand=${encodeURIComponent(item?.brandName || '')}&model=${encodeURIComponent(item?.model || '')}`)
        ]);

        if (itemResponse.data.success) {
          setItem(itemResponse.data.data);
        }

        if (damageResponse.data.success) {
          // Filter and format damage history
          const damageEntries = damageResponse.data.data
            .filter(log => log.damageLossSummary && log.damageLossSummary.length > 0)
            .flatMap(log => log.damageLossSummary
              .filter(damage => 
                damage.category === item?.category &&
                damage.subCategory === item?.subCategory &&
                damage.brand === item?.brandName &&
                damage.model === item?.model
              )
              .map(damage => ({
                ...damage,
                bookingId: log.bookingId,
                customerName: log.customerName,
                date: log.dateRange.from,
              }))
            );
          setDamageHistory(damageEntries);
        }
      } catch (error) {
        toast.error("Failed to load item details");
      } finally {
        setLoading(false);
      }
    };

    if (itemId) {
      fetchData();
    }
  }, [itemId, item?.category, item?.subCategory, item?.brandName, item?.model]);

  if (!hasViewPermission) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-4 text-center text-red-500"
      >
        You don&apos;t have permission to view inventory items
      </motion.div>
    );
  }

  if (loading) {
    return (
      <div className="p-4">
        <SkeletonLoader />
      </div>
    );
  }

  if (!item) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-4 text-center text-gray-500"
      >
        Item not found
      </motion.div>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 lg:p-6 bg-content1 rounded-large shadow-small"
    >
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-xl md:text-2xl text-hotel-primary-text font-semibold">
          Item Details
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          {[
            { label: "Supplier Name", value: item.supplierName },
            { label: "Category", value: item.category },
            { label: "Sub Category", value: item.subCategory },
            { label: "Brand Name", value: item.brandName },
            { label: "Model", value: item.model },
          ].map((field, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-50 p-3 rounded-md"
            >
              <h2 className="text-sm font-semibold text-gray-600">
                {field.label}
              </h2>
              <p className="mt-1 text-gray-800">{field.value}</p>
            </motion.div>
          ))}
        </div>

        <div className="space-y-4">
          {[
            { label: "Price", value: `₹${item.price}` },
            { label: "GST", value: `${item.gst}%` },
            { label: "Quantity in Stock", value: item.quantityInStock },
            { label: "Status", value: item.status },
            { label: "Low Quantity Alert", value: item.lowQuantityAlert },
          ].map((field, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-50 p-3 rounded-md"
            >
              <h2 className="text-sm font-semibold text-gray-600">
                {field.label}
              </h2>
              <p className="mt-1 text-gray-800">{field.value}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-6 bg-gray-50 p-3 rounded-md"
      >
        <h2 className="text-sm font-semibold text-gray-600">Description</h2>
        <p className="mt-2 text-gray-800">
          {item.description || "No description available"}
        </p>
      </motion.div>

      {/* Damage/Loss History Section */}
      {damageHistory.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8"
        >
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-hotel-primary-text">
            <span className="h-5 w-1 bg-hotel-primary rounded-full"></span>
            Damage/Loss History
          </h2>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <Table aria-label="Damage/Loss history table">
              <TableHeader>
                <TableColumn className="bg-hotel-primary text-white text-sm font-medium">Date</TableColumn>
                <TableColumn className="bg-hotel-primary text-white text-sm font-medium">Booking ID</TableColumn>
                <TableColumn className="bg-hotel-primary text-white text-sm font-medium">Customer Name</TableColumn>
                <TableColumn className="bg-hotel-primary text-white text-sm font-medium">Quantity</TableColumn>
                <TableColumn className="bg-hotel-primary text-white text-sm font-medium">Condition</TableColumn>
                <TableColumn className="bg-hotel-primary text-white text-sm font-medium">Remarks</TableColumn>
                <TableColumn className="bg-hotel-primary text-white text-sm font-medium">Amount</TableColumn>
              </TableHeader>
              <TableBody>
                {damageHistory.map((entry, idx) => (
                  <TableRow key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <TableCell>{format(new Date(entry.date), 'dd/MM/yyyy')}</TableCell>
                    <TableCell>{entry.bookingId}</TableCell>
                    <TableCell>{entry.customerName}</TableCell>
                    <TableCell>{entry.quantity}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        entry.condition === 'Broken' ? 'bg-red-100 text-red-800' : 
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {entry.condition}
                      </span>
                    </TableCell>
                    <TableCell>{entry.remarks || '-'}</TableCell>
                    <TableCell>₹{entry.amount || 0}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex justify-end gap-3 mt-3">
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex flex-col items-end min-w-[90px] shadow-sm">
              <span className="text-xs text-gray-500 font-medium">Total Incidents</span>
              <span className="text-base font-bold text-hotel-primary-text">{damageHistory.length}</span>
            </div>
            <div className="bg-hotel-primary/10 border border-hotel-primary/20 rounded-lg px-3 py-2 flex flex-col items-end min-w-[120px] shadow-sm">
              <span className="text-xs text-hotel-primary font-medium">Total Amount</span>
              <span className="text-base font-bold text-hotel-primary">
                ₹{damageHistory.reduce((sum, entry) => sum + (entry.amount || 0), 0)}
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </motion.section>
  );
}
