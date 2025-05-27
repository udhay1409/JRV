import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { RadioGroup, Radio } from "@heroui/radio";
import { Input } from "@heroui/input";
import { Textarea } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { toast } from "react-toastify";

const PaymentModal = ({
  isOpen,
  onClose,
  onConfirm,
  customerNames = [],
  banks = [],
  initialAmount = "325645.00",
}) => {
  // Update to use "cod" instead of "hotel" to match backend expectations
  // Options are: "online", "cod", "qr", "paymentLink"
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [formData, setFormData] = useState({
    customerName: "",
    payableAmount: "",
    amount: "",
    paymentType: "",
    bank: "",
    transactionId: "",
    paymentDate: "",
    remarks: "",
  });
  const [errors, setErrors] = useState({});

  // Use useEffect to initialize the form data when props change
  useEffect(() => {
    if (isOpen) {
      setFormData({
        ...formData,
        customerName: customerNames[0] || "",
        payableAmount: initialAmount,
        amount: initialAmount,
        paymentDate: getCurrentDate(),
      });
    }
  }, [isOpen, customerNames, initialAmount]);

  const handleInputChange = (name, value) => {
    // Special handling for amount field to ensure it's a proper number
    if (name === "amount") {
      // Parse as float and ensure it's a valid number
      const numValue = parseFloat(value);
      value = isNaN(numValue) ? "" : value;
    }

    setFormData({
      ...formData,
      [name]: value,
    });
    // Clear error when field is edited
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null,
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // All payment methods require amount
    if (
      !formData.amount ||
      isNaN(parseFloat(formData.amount)) ||
      parseFloat(formData.amount) <= 0
    ) {
      newErrors.amount = "Please enter a valid amount";
    }

    // Payment date is required for all methods
    if (!formData.paymentDate) {
      newErrors.paymentDate = "Payment date is required";
    }

    // Method-specific validations
    if (paymentMethod === "online") {
      if (!formData.paymentType) {
        newErrors.paymentType = "Payment type is required";
      }
      if (!formData.bank) {
        newErrors.bank = "Bank selection is required";
      }
      if (!formData.transactionId) {
        newErrors.transactionId = "Transaction ID is required";
      }
    } else if (paymentMethod === "cod") {
      if (!formData.paymentType) {
        newErrors.paymentType = "Payment type is required";
      }
    }
    // Payment links don't require paymentType, bank, or transactionId

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      toast.error("Please fill all required fields");
      return;
    }

    // Ensure amount is properly parsed as a number
    const submissionData = {
      ...formData,
      amount: parseFloat(formData.amount),
      paymentMethod,
    };

    // Set default valid paymentType based on payment method if not already set
    if (paymentMethod === "paymentLink" && !submissionData.paymentType) {
      submissionData.paymentType = "";
    } else if (paymentMethod === "cod" && !submissionData.paymentType) {
      submissionData.paymentType = "cash";
    }

    // Include the payment method in the submission data
    onConfirm(submissionData);
  };

  // Set current date as default for payment date
  const getCurrentDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  // Show different fields based on payment method
  const showOnlineFields = paymentMethod === "online";
  const showPaymentLinkFields = paymentMethod === "paymentLink";
  const showHotelFields = paymentMethod === "cod";

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalContent>
        <ModalHeader>Payment Details</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            {/* Payment Method Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Payment Method
              </label>
              <RadioGroup
                value={paymentMethod}
                onValueChange={setPaymentMethod}
                orientation="horizontal"
                className="mb-4"
              >
                <Radio value="online" color="primary">
                  Pay Via Online
                </Radio>
                <Radio value="cod" color="primary">
                  Pay at Hotel
                </Radio>
                <Radio value="paymentLink" color="primary">
                  Generate Payment Link
                </Radio>
              </RadioGroup>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 gap-4">
              <div className="mb-2">
                <label className="block text-sm font-medium mb-1">
                  Customer Name
                </label>
                <Input
                  type="text"
                  value={formData.customerName}
                  onChange={(e) =>
                    handleInputChange("customerName", e.target.value)
                  }
                  className="w-full"
                  readOnly
                />
              </div>

              <div className="mb-2">
                <label className="block text-sm font-medium mb-1">
                  Payable Amount(INR)
                </label>
                <Input
                  type="text"
                  value={formData.payableAmount}
                  onChange={(e) =>
                    handleInputChange("payableAmount", e.target.value)
                  }
                  className="w-full"
                  readOnly
                />
                <p className="text-xs text-gray-600 mt-1">
                  Total payable amount for the booking
                </p>
              </div>

              <div className="mb-2">
                <label className="block text-sm font-medium mb-1">
                  Amount(INR) *
                </label>
                <Input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => handleInputChange("amount", e.target.value)}
                  placeholder="Amount"
                  className={`w-full ${errors.amount ? "border-red-500" : ""}`}
                />
                {errors.amount && (
                  <p className="text-xs text-red-500 mt-1">{errors.amount}</p>
                )}
                {showPaymentLinkFields && (
                  <p className="text-xs text-blue-600 mt-1">
                    This amount will be used to generate the payment link. The
                    guest will only need to pay this amount.
                  </p>
                )}
                {!showPaymentLinkFields && (
                  <p className="text-xs text-blue-600 mt-1">
                    <strong>Partial payment supported.</strong> Enter the amount
                    guest is paying now. Multiple payments can be made later to
                    reach the total amount.
                  </p>
                )}
              </div>

              {/* Only show payment type for online and hotel payments */}
              {(showOnlineFields || showHotelFields) && (
                <div className="mb-2">
                  <label className="block text-sm font-medium mb-1">
                    Payment Type *
                  </label>
                  <Select
                    value={formData.paymentType}
                    onChange={(e) =>
                      handleInputChange("paymentType", e.target.value)
                    }
                    placeholder="Type"
                    className={`w-full ${
                      errors.paymentType ? "border-red-500" : ""
                    }`}
                  >
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="netbanking">Net Banking</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                  </Select>
                  {errors.paymentType && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.paymentType}
                    </p>
                  )}
                </div>
              )}

              {/* Only show bank for online payments */}
              {showOnlineFields && (
                <div className="mb-2">
                  <label className="block text-sm font-medium mb-1">
                    Bank *
                  </label>
                  <Select
                    value={formData.bank}
                    onChange={(e) => handleInputChange("bank", e.target.value)}
                    placeholder="Select Bank"
                    className={`w-full ${errors.bank ? "border-red-500" : ""}`}
                  >
                    {banks.map((bank, index) => (
                      <SelectItem key={index} value={bank}>
                        {bank}
                      </SelectItem>
                    ))}
                  </Select>
                  {errors.bank && (
                    <p className="text-xs text-red-500 mt-1">{errors.bank}</p>
                  )}
                </div>
              )}

              {/* Only show transaction ID for online payments */}
              {showOnlineFields && (
                <div className="mb-2">
                  <label className="block text-sm font-medium mb-1">
                    Transaction Id/Receipt *
                  </label>
                  <Input
                    type="text"
                    value={formData.transactionId}
                    onChange={(e) =>
                      handleInputChange("transactionId", e.target.value)
                    }
                    placeholder="Number"
                    className={`w-full ${
                      errors.transactionId ? "border-red-500" : ""
                    }`}
                  />
                  {errors.transactionId && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.transactionId}
                    </p>
                  )}
                </div>
              )}

              {/* Always show payment date */}
              <div className="mb-2">
                <label className="block text-sm font-medium mb-1">
                  Payment Date *
                </label>
                <Input
                  type="date"
                  value={formData.paymentDate}
                  onChange={(e) =>
                    handleInputChange("paymentDate", e.target.value)
                  }
                  className={`w-full ${
                    errors.paymentDate ? "border-red-500" : ""
                  }`}
                />
                {errors.paymentDate && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.paymentDate}
                  </p>
                )}
              </div>

              {/* Always show remarks */}
              <div className="mb-2">
                <label className="block text-sm font-medium mb-1">
                  Remarks
                </label>
                <Textarea
                  value={formData.remarks}
                  onChange={(e) => handleInputChange("remarks", e.target.value)}
                  placeholder="Text"
                  className="w-full"
                />
              </div>

              {/* Payment link message */}
              {showPaymentLinkFields && (
                <div className="p-4 bg-blue-50 text-blue-700 rounded-md">
                  <p className="font-medium">Payment Link Info</p>
                  <p className="text-sm">
                    A payment link for the amount specified will be generated
                    and sent to the guest&apos;s email. The booking will be
                    considered complete only after the payment is received.
                  </p>
                </div>
              )}
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="danger" variant="light" onPress={onClose}>
            Cancel
          </Button>
          <Button
            className="bg-hotel-primary text-white"
            onPress={handleSubmit}
          >
            Submit Payment
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default PaymentModal;
