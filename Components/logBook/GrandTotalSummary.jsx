import React from "react";
import { Input } from "@/Components/ui/input";

export default function GrandTotalSummary({ totalAmount, currentBill, damageLossSummary, totalRecoveryAmount, setTotalRecoveryAmount }) {
  // Calculate grand total
  const grandTotal =
    (parseFloat(totalAmount) || 0) +
    (parseFloat(currentBill) || 0) +
    (parseFloat(totalRecoveryAmount) || 0);

  return (
    <div className="flex flex-col gap-2 max-w-md ml-auto">
      <div className="flex justify-between items-center">
        <span className="font-medium">Total Amount for Items</span>
        <span className="font-bold text-lg">₹{parseFloat(totalAmount || 0).toFixed(2)}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="font-medium">Total Current Bill</span>
        <span className="font-bold text-lg">₹{parseFloat(currentBill || 0).toFixed(2)}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="font-medium">Total Recovery Amount</span>
        <Input
          type="number"
          min="0"
          className="h-8 text-sm text-right bg-transparent border-0 focus:ring-0 focus-visible:ring-0 max-w-[100px] font-bold"
          placeholder="0.00"
          value={totalRecoveryAmount}
          onChange={e => setTotalRecoveryAmount(e.target.value)}
          style={{ textAlign: "right" }}
        />
      </div>
      <div className="flex justify-between items-center border-t pt-2 mt-2">
        <span className="font-bold text-lg">Grand Total</span>
        <span className="font-bold text-2xl text-hotel-primary">₹{grandTotal.toFixed(2)}</span>
      </div>
    </div>
  );
} 