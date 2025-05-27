"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { toast } from "react-toastify";
import { usePagePermission } from "../../hooks/usePagePermission";
import { Button } from "@heroui/button";
import { RadioGroup, Radio } from "@heroui/radio";
import { Input, Textarea } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Spinner } from "react-bootstrap";
import Script from "next/script";
import {
  FaSearch,
  FaCreditCard,
  FaMoneyBillWave,
  FaLink,
} from "react-icons/fa";
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
} from "@heroui/table";
import { Pagination } from "@heroui/pagination";
import { Card, CardHeader, CardBody, CardFooter } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { Badge } from "@heroui/badge";

const RecordPaymentPage = () => {
  const hasFinancialsPermission = usePagePermission('Financials/Invoices/record-payement', 'view');
  const hasBookingsAddPermission = usePagePermission('bookings', 'add');
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check if user has either permission
  const hasPermission = hasFinancialsPermission || hasBookingsAddPermission;

  // Get booking data from URL parameters
  const bookingData = searchParams.get("bookingData");
  const customerSearch = searchParams.get("customerSearch");
  const [decodedBookingData, setDecodedBookingData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // For customer name search and transaction fetching
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [customerNameSearch, setCustomerNameSearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;

  // Payment state
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

  // Bank accounts state
  const [bankAccounts, setBankAccounts] = useState([]);
  const [cashAccounts, setCashAccounts] = useState([]);
  const [bankListAccounts, setBankListAccounts] = useState([]);

  // Load bank accounts on mount
  useEffect(() => {
    const loadBankAccounts = async () => {
      try {
        const response = await axios.get("/api/financials/bank");
        if (response.data.success) {
          const accounts = response.data.bankAccounts;

          // Filter cash type accounts
          const cashTypeAccounts = accounts.filter(
            (account) => account.type === "cash"
          );
          setCashAccounts(cashTypeAccounts);

          // Filter bank type accounts
          const bankTypeAccounts = accounts.filter(
            (account) => account.type === "bank"
          );
          setBankListAccounts(bankTypeAccounts);

          // Set all accounts
          setBankAccounts(accounts);
        }
      } catch (error) {
        console.error("Error loading bank accounts:", error);
        toast.error("Failed to load payment account options");
      }
    };

    if (hasPermission) {
      loadBankAccounts();
    }
  }, [hasPermission]);

  // Add pagination logic - calculate paginated transactions
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return transactions.slice(start, end);
  }, [transactions, currentPage, rowsPerPage]);

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Adjust the total pages calculation
  const totalPages = Math.ceil(transactions.length / rowsPerPage);

  // Decode booking data on component mount
  useEffect(() => {
    if (!hasPermission) return;

    const params = new URLSearchParams(window.location.search);
    const bookingData = params.get("bookingData");
    const customerSearch = params.get("customerSearch");

    if (customerSearch && customerSearch !== "undefined undefined") {
      setShowCustomerSearch(true);
      setCustomerNameSearch(decodeURIComponent(customerSearch));
      // Automatically trigger search
      searchTransactionsByCustomerName(decodeURIComponent(customerSearch));
      setIsLoading(false);
      return;
    }

    // If no booking data is provided, show customer search
    if (!bookingData) {
      setShowCustomerSearch(true);
      setIsLoading(false);
      return;
    }

    try {
      const decoded = JSON.parse(decodeURIComponent(bookingData));
      setDecodedBookingData(decoded);

      // Initialize form data with booking information
      setFormData({
        customerName: `${decoded.firstName} ${decoded.lastName}`,
        payableAmount: decoded.totalAmount.total.toString(),
        amount: decoded.totalAmount.total.toString(),
        paymentDate: getCurrentDate(),
        paymentType: "",
        bank: "",
        transactionId: "",
        remarks: "",
      });

      setIsLoading(false);
    } catch (error) {
      console.error("Failed to parse booking data:", error);
      toast.error("Invalid booking data");
      router.push("/dashboard/bookings");
    }
  }, [bookingData, hasPermission, router]);

  if (hasPermission === null) {
    return null;
  }

  if (hasPermission === false) {
    router.push("/dashboard/unauthorized");
    return null;
  }

  // Function to search transactions by customer name
  const searchTransactionsByCustomerName = async (searchValue = null) => {
    const searchTerm = searchValue || customerNameSearch;
    if (!searchTerm.trim()) {
      toast.error("Please enter a customer name");
      return;
    }

    setIsSearching(true);
    try {
      const response = await axios.get(
        `/api/financials/transactions/search?customerName=${encodeURIComponent(
          searchTerm
        )}`
      );

      if (response.data.success && response.data.transactions.length > 0) {
        setTransactions(response.data.transactions);
      } else {
        setTransactions([]);
        toast.info("No transactions found for this customer");
      }
    } catch (error) {
      console.error("Error searching transactions:", error);
      toast.error("Failed to search transactions");
    } finally {
      setIsSearching(false);
    }
  };

  // Function to handle selecting a transaction
  const handleSelectTransaction = async (transaction) => {
    setSelectedTransaction(transaction);
    setSelectedBookingId(transaction.bookingId);

    try {
      // Fetch all transactions for this booking
      const response = await axios.get(
        `/api/financials/transactions?bookingId=${transaction.bookingId}`
      );

      if (response.data.success) {
        setPaymentHistory(response.data.transactions);

        // Set form data based on the transaction
        setFormData({
          customerName: transaction.customerName,
          payableAmount: transaction.payableAmount.toString(),
          amount:
            response.data.paymentSummary?.remainingBalance.toString() || "0",
          paymentDate: getCurrentDate(),
          paymentType: "",
          bank: "",
          transactionId: "",
          remarks: "",
        });
      }
    } catch (error) {
      console.error("Error fetching transaction history:", error);
      toast.error("Failed to fetch transaction history");

      // Set form data even if transaction history fails
      setFormData({
        customerName: transaction.customerName,
        payableAmount: transaction.payableAmount.toString(),
        amount: transaction.remainingBalance?.toString() || "0",
        paymentDate: getCurrentDate(),
        paymentType: "",
        bank: "",
        transactionId: "",
        remarks: "",
      });
    }
  };

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
    if (paymentMethod === "online" || paymentMethod === "paymentLink") {
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getCurrentDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  const handleSubmitPayment = async () => {
    if (!validateForm()) {
      toast.error("Please fill all required fields");
      return;
    }

    setIsProcessing(true);

    try {
      // Ensure amount is properly parsed as a number
      const paymentDetails = {
        ...formData,
        amount: parseFloat(formData.amount),
        paymentMethod,
      };

      // For existing transactions (from customer search)
      if (selectedTransaction) {
        // Record an additional payment
        const transactionData = {
          bookingId: selectedTransaction.bookingId,
          bookingNumber: selectedTransaction.bookingNumber,
          paymentMethod: paymentDetails.paymentMethod,
          amount: paymentDetails.amount,
          transactionId: paymentDetails.transactionId || "",
          paymentDate: paymentDetails.paymentDate || new Date().toISOString(),
          remarks: paymentDetails.remarks || "",
          status: "completed",
          customerName: paymentDetails.customerName,
          payableAmount: parseFloat(formData.payableAmount),
          paymentType: paymentDetails.paymentType || "",
          ...(paymentDetails.bank && { bank: paymentDetails.bank }),
        };
        if (paymentMethod === "paymentLink") {
          try {
            // Create payment link for existing booking
            const paymentLinkResponse = await axios.post(
              `/api/bookings/create-razorpay-payment-link`,
              {
                amount: paymentDetails.amount,
                currency: "INR",
                customer: {
                  name: paymentDetails.customerName,
                  email: selectedTransaction.customerEmail || "",
                  contact: selectedTransaction.customerPhone || "",
                },
              }
            );

            if (paymentLinkResponse.data.success) {
              // Open payment link in a new window
              window.open(paymentLinkResponse.data.paymentLink, "_blank");

              toast.info(
                "Payment link generated. Waiting for payment confirmation..."
              );

              // Wait for payment to be completed
              const pollInterval = setInterval(async () => {
                try {
                  const statusResponse = await axios.get(
                    `/api/bookings/check-payment-status/${paymentLinkResponse.data.paymentLinkId}`
                  );

                  if (statusResponse.data.status === "paid") {
                    clearInterval(pollInterval);

                    // Only proceed with transaction recording if payment is confirmed
                    transactionData.razorpayPaymentLinkId =
                      paymentLinkResponse.data.paymentLinkId;
                    transactionData.status = "completed";
                    transactionData.paymentType = paymentDetails.paymentType;
                    transactionData.bank = paymentDetails.bank;
                    transactionData.transactionId =
                      paymentDetails.transactionId || "";

                    // Update paymentDetails with the payment link ID
                    paymentDetails.razorpayPaymentLinkId =
                      paymentLinkResponse.data.paymentLinkId;

                    try {
                      // Save the transaction only after payment is confirmed
                      const transactionResponse = await axios.post(
                        "/api/financials/transactions",
                        transactionData
                      );

                      if (transactionResponse.data.success) {
                        try {
                          // Create bank entry
                          const bankEntryData = {
                            transactionType: "deposit",
                            paymentType: "bank",
                            fromAccount: paymentDetails.paymentType,
                            amount: paymentDetails.amount,
                            date: paymentDetails.paymentDate,
                            description: `Payment received via payment link for booking #${selectedTransaction.bookingNumber}`,
                            bookingId: selectedTransaction.bookingId,
                            bookingNumber: selectedTransaction.bookingNumber,
                            customerName: paymentDetails.customerName,
                            razorpayPaymentLinkId:
                              paymentLinkResponse.data.paymentLinkId,
                          };

                          await axios.post(
                            "/api/financials/bank/entry",
                            bankEntryData
                          );
                          toast.success(
                            "Payment completed and recorded successfully!"
                          );

                          // Redirect to bookings page after success
                          setTimeout(() => {
                            router.push("/dashboard/bookings");
                          }, 2000);
                        } catch (bankEntryError) {
                          console.error(
                            "Error recording bank entry:",
                            bankEntryError
                          );
                          // Don't throw error, payment is already recorded
                        }
                      }
                    } catch (err) {
                      console.error("Error recording transaction:", err);
                      toast.error(
                        "Failed to record the payment. Please contact support."
                      );
                      setIsProcessing(false);
                    }
                  } else if (
                    ["cancelled", "expired", "failed"].includes(
                      statusResponse.data.status
                    )
                  ) {
                    clearInterval(pollInterval);
                    toast.error(`Payment ${statusResponse.data.status}`);
                    setIsProcessing(false);
                  }
                } catch (error) {
                  clearInterval(pollInterval);
                  console.error("Error checking payment status:", error);
                  toast.error("Failed to verify payment status");
                  setIsProcessing(false);
                }
              }, 5000);

              // Set a timeout to stop polling after 5 minutes
              setTimeout(() => {
                clearInterval(pollInterval);
                if (isProcessing) {
                  setIsProcessing(false);
                  toast.warn(
                    "Payment verification timed out. Please check your payments page for status."
                  );
                }
              }, 300000); // 5 minutes
            } else {
              toast.error("Failed to generate payment link");
              setIsProcessing(false);
            }
          } catch (error) {
            console.error("Error generating payment link:", error);
            toast.error("Failed to generate payment link");
            setIsProcessing(false);
          }
        } else {
          // Process direct payment (cash, online)
          const transactionResponse = await axios.post(
            "/api/financials/transactions",
            transactionData
          );

          // Record in bank entry and ledger
          if (transactionResponse.data.success) {
            try {
              // Find the selected account
              const selectedAccount = bankAccounts.find(
                (acc) => acc._id === paymentDetails.paymentType
              );

              // Create bank entry
              const bankEntryData = {
                transactionType: "deposit", // It's income for the business
                paymentType:
                  paymentMethod === "cod"
                    ? "cash"
                    : paymentMethod === "online"
                    ? "bank"
                    : paymentMethod,
                fromAccount: paymentDetails.paymentType, // Account ID
                amount: paymentDetails.amount,
                date: paymentDetails.paymentDate,
                description: `Payment received for booking #${selectedTransaction.bookingNumber}`,
                bookingId: selectedTransaction.bookingId,
                bookingNumber: selectedTransaction.bookingNumber,
                customerName: paymentDetails.customerName,
              };

              // Add razorpayPaymentLinkId if available and if payment method is paymentLink
              if (
                paymentMethod === "paymentLink" &&
                transactionData.razorpayPaymentLinkId
              ) {
                bankEntryData.razorpayPaymentLinkId =
                  transactionData.razorpayPaymentLinkId;
              }

              await axios.post("/api/financials/bank/entry", bankEntryData);
            } catch (bankEntryError) {
              console.error("Error recording bank entry:", bankEntryError);
              // Don't throw error, payment is already recorded in transactions
            }
          }

          toast.success("Payment recorded successfully!");
          setTimeout(() => {
            router.push("/dashboard/bookings");
          }, 2000);
        }
      } else if (decodedBookingData) {
        // New booking process
        const bookingFormData = new FormData();

        // Add all the properties from the decoded booking data
        Object.entries(decodedBookingData).forEach(([key, value]) => {
          if (key === "uploadedFiles") {
            // Skip uploadedFiles array as it will contain file objects that can't be properly serialized
            // We'll handle file uploads separately if needed
            return;
          }

          if (typeof value === "object" && value !== null) {
            bookingFormData.append(key, JSON.stringify(value));
          } else if (value !== undefined && value !== null) {
            bookingFormData.append(key, value.toString());
          }
        });

        // Special handling for hall-specific fields
        if (decodedBookingData.propertyType === "hall") {
          // Handle timeSlot (add individual fields)
          if (decodedBookingData.timeSlot) {
            bookingFormData.append(
              "timeSlotName",
              decodedBookingData.timeSlot.name || ""
            );
            bookingFormData.append(
              "timeSlotFromTime",
              decodedBookingData.timeSlot.fromTime || ""
            );
            bookingFormData.append(
              "timeSlotToTime",
              decodedBookingData.timeSlot.toTime || ""
            );
          }

          // Handle groomDetails (add individual fields)
          if (decodedBookingData.groomDetails) {
            bookingFormData.append(
              "groomName",
              decodedBookingData.groomDetails.name || ""
            );
            bookingFormData.append(
              "groomMobileNo",
              decodedBookingData.groomDetails.mobileNo || ""
            );
            bookingFormData.append(
              "groomEmail",
              decodedBookingData.groomDetails.email || ""
            );
            bookingFormData.append(
              "groomAddress",
              decodedBookingData.groomDetails.address || ""
            );
            bookingFormData.append(
              "groomDob",
              decodedBookingData.groomDetails.dob || ""
            );
            bookingFormData.append(
              "groomGender",
              decodedBookingData.groomDetails.gender || ""
            );
            bookingFormData.append(
              "groomVerificationId",
              decodedBookingData.groomDetails.verificationId || ""
            );
          }

          // Handle brideDetails (add individual fields)
          if (decodedBookingData.brideDetails) {
            bookingFormData.append(
              "brideName",
              decodedBookingData.brideDetails.name || ""
            );
            bookingFormData.append(
              "brideMobileNo",
              decodedBookingData.brideDetails.mobileNo || ""
            );
            bookingFormData.append(
              "brideEmail",
              decodedBookingData.brideDetails.email || ""
            );
            bookingFormData.append(
              "brideAddress",
              decodedBookingData.brideDetails.address || ""
            );
            bookingFormData.append(
              "brideDob",
              decodedBookingData.brideDetails.dob || ""
            );
            bookingFormData.append(
              "brideGender",
              decodedBookingData.brideDetails.gender || ""
            );
            bookingFormData.append(
              "brideVerificationId",
              decodedBookingData.brideDetails.verificationId || ""
            );
          }

          // Handle eventType (already handled in the default loop above)

          // Handle services
          if (decodedBookingData.services) {
            bookingFormData.append(
              "services",
              JSON.stringify(decodedBookingData.services)
            );
          }
        }

        // Add payment-specific details
        bookingFormData.append("paymentMethod", paymentDetails.paymentMethod);
        bookingFormData.append("paymentStatus", "completed");

        if (paymentDetails.paymentType) {
          bookingFormData.append("paymentType", paymentDetails.paymentType);
        }

        if (paymentDetails.transactionId) {
          bookingFormData.append("transactionId", paymentDetails.transactionId);
        }

        if (paymentDetails.bank) {
          bookingFormData.append("bank", paymentDetails.bank);
        }

        // For payment links, create the link first
        if (paymentDetails.paymentMethod === "paymentLink") {
          const paymentAmount = parseFloat(paymentDetails.amount);

          const linkResponse = await axios.post(
            `/api/bookings/create-razorpay-payment-link`,
            {
              amount: paymentAmount,
              currency: "INR",
              customer: {
                name: paymentDetails.customerName,
                email: decodedBookingData.email,
                contact: decodedBookingData.mobileNo,
              },
            }
          );

          if (linkResponse.data.success) {
            bookingFormData.append(
              "razorpayPaymentLinkId",
              linkResponse.data.paymentLinkId
            );
            bookingFormData.append("razorpayAmount", paymentAmount.toString());

            // Update paymentDetails with the payment link ID
            paymentDetails.razorpayPaymentLinkId =
              linkResponse.data.paymentLinkId;

            // Add property to indicate partial payment if needed
            if (paymentAmount < parseFloat(formData.payableAmount)) {
              bookingFormData.append("isPartialPayment", "true");
              bookingFormData.append(
                "remainingBalance",
                (parseFloat(formData.payableAmount) - paymentAmount).toString()
              );
            }

            // Open payment link in a new window
            window.open(linkResponse.data.paymentLink, "_blank");

            toast.info("Payment link generated. Waiting for payment...");

            // Poll for payment status
            const pollInterval = setInterval(async () => {
              try {
                const statusResponse = await axios.get(
                  `/api/bookings/check-payment-status/${linkResponse.data.paymentLinkId}`
                );

                if (statusResponse.data.status === "paid") {
                  clearInterval(pollInterval);
                  bookingFormData.append("paymentStatus", "completed");

                  // Create the booking
                  const bookingData = await processBooking(
                    bookingFormData,
                    paymentDetails
                  );

                  if (bookingData.success) {
                    try {
                      // Create bank entry for the payment
                      const bankEntryData = {
                        transactionType: "deposit", // It's income for the business
                        paymentType:
                          paymentMethod === "cod"
                            ? "cash"
                            : paymentMethod === "online"
                            ? "bank"
                            : paymentMethod,
                        fromAccount: paymentDetails.paymentType, // Account ID
                        amount: paymentDetails.amount,
                        date: paymentDetails.paymentDate,
                        description: `Payment received for new booking #${
                          bookingData.bookingNumber || ""
                        }`,
                        bookingId: bookingData.bookingId,
                        bookingNumber: bookingData.bookingNumber || "",
                        customerName: paymentDetails.customerName,
                      };

                      // Add razorpayPaymentLinkId if this is a payment link method
                      if (
                        paymentMethod === "paymentLink" &&
                        paymentDetails.razorpayPaymentLinkId
                      ) {
                        bankEntryData.razorpayPaymentLinkId =
                          paymentDetails.razorpayPaymentLinkId;
                      }

                      await axios.post(
                        "/api/financials/bank/entry",
                        bankEntryData
                      );
                    } catch (bankEntryError) {
                      console.error(
                        "Error recording bank entry:",
                        bankEntryError
                      );
                      // Don't throw error, booking is already processed
                    }
                  }
                } else if (
                  statusResponse.data.status === "cancelled" ||
                  statusResponse.data.status === "expired"
                ) {
                  clearInterval(pollInterval);
                  toast.error("Payment was cancelled or expired");
                  setIsProcessing(false);
                }
              } catch (error) {
                console.error("Error checking payment status:", error);
              }
            }, 5000);

            // Set a timeout to stop polling after a reasonable time
            setTimeout(() => {
              clearInterval(pollInterval);
              if (isProcessing) {
                setIsProcessing(false);
                toast.warn(
                  "Payment time expired. Please try again if payment was made."
                );
              }
            }, 300000); // 5 minutes

            return;
          } else {
            toast.error("Failed to generate payment link");
            setIsProcessing(false);
            return;
          }
        } else {
          try {
            // Process the booking
            const bookingData = await processBooking(
              bookingFormData,
              paymentDetails
            );

            if (bookingData.success) {
              try {
                // Create bank entry for the payment
                const bankEntryData = {
                  transactionType: "deposit", // It's income for the business
                  paymentType:
                    paymentMethod === "cod"
                      ? "cash"
                      : paymentMethod === "online"
                      ? "bank"
                      : paymentMethod,
                  fromAccount: paymentDetails.paymentType, // Account ID
                  amount: paymentDetails.amount,
                  date: paymentDetails.paymentDate,
                  description: `Payment received for new booking #${
                    bookingData.bookingNumber || ""
                  }`,
                  bookingId: bookingData.bookingId,
                  bookingNumber: bookingData.bookingNumber || "",
                  customerName: paymentDetails.customerName,
                };

                // Add razorpayPaymentLinkId if this is a payment link method
                if (
                  paymentMethod === "paymentLink" &&
                  paymentDetails.razorpayPaymentLinkId
                ) {
                  bankEntryData.razorpayPaymentLinkId =
                    paymentDetails.razorpayPaymentLinkId;
                }

                await axios.post("/api/financials/bank/entry", bankEntryData);
              } catch (bankEntryError) {
                console.error("Error recording bank entry:", bankEntryError);
                // Don't throw error, booking is already processed
              }
            }
          } catch (error) {
            console.error("Error processing booking:", error);
            toast.error("Failed to process booking. Please try again.");
            throw error; // Re-throw to be caught by outer catch
          }
        }
      }
    } catch (error) {
      console.error("Error submitting payment:", error);
      toast.error("Failed to process payment. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const processBooking = async (bookingFormData, paymentDetails) => {
    try {
      // Create the booking
      const bookingResponse = await axios.post(
        `/api/bookings/addbooking`,
        bookingFormData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (bookingResponse.data.success) {
        const bookingData = bookingResponse.data.guest;

        // Save transaction data
        try {
          const paymentAmount = parseFloat(paymentDetails.amount);

          // Prepare transaction data
          const transactionData = {
            bookingId: bookingData._id,
            guestId: bookingData.guestId,
            bookingNumber: bookingData.bookingNumber,
            paymentMethod: paymentDetails.paymentMethod,
            amount: paymentAmount,
            transactionId: paymentDetails.transactionId || "",
            paymentDate: paymentDetails.paymentDate || new Date().toISOString(),
            remarks: paymentDetails.remarks || "",
            status: "completed",
            customerName: paymentDetails.customerName,
            payableAmount: parseFloat(formData.payableAmount),
            paymentType: paymentDetails.paymentType || "",
            ...(paymentDetails.razorpayPaymentLinkId && {
              razorpayPaymentLinkId: paymentDetails.razorpayPaymentLinkId,
            }),
            ...(paymentDetails.bank && { bank: paymentDetails.bank }),
          };

          // Save transaction data
          await axios.post("/api/financials/transactions", transactionData);

          toast.success("Booking completed successfully!");

          // Redirect to bookings page
          setTimeout(() => {
            router.push("/dashboard/bookings");
          }, 2000);

          // Return booking data for bank entry
          return {
            success: true,
            bookingId: bookingData._id,
            bookingNumber: bookingData.bookingNumber,
          };
        } catch (transactionError) {
          console.error("Error saving transaction data:", transactionError);
          toast.warn(
            "Booking was successful but there was an error recording the transaction"
          );

          // Still redirect to bookings page
          setTimeout(() => {
            router.push("/dashboard/bookings");
          }, 2000);

          // Return basic booking data even if transaction failed
          return {
            success: true,
            bookingId: bookingData._id,
            bookingNumber: bookingData.bookingNumber,
          };
        }
      } else {
        toast.error(bookingResponse.data.message || "Failed to create booking");
        return { success: false };
      }
    } catch (error) {
      console.error("Error creating booking:", error);

      // Extract error message from the response if available
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        "An error occurred while creating the booking";

      toast.error(errorMessage);

      // Log additional information for debugging
      if (error.response?.data?.stack) {
        console.error("Error stack:", error.response.data.stack);
      }

      return { success: false };
    }
  };

  // Show different fields based on payment method
  const showOnlineFields =
    paymentMethod === "online" || paymentMethod === "paymentLink";
  const showPaymentLinkFields = paymentMethod === "paymentLink";
  const showHotelFields = paymentMethod === "cod";

  // Payment method icons and colors
  const paymentMethodIcons = {
    online: <FaCreditCard className="text-hotel-primary" size={20} />,
    cod: <FaMoneyBillWave className="text-green-500" size={20} />,
    paymentLink: <FaLink className="text-purple-500" size={20} />,
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "success";
      case "pending":
        return "warning";
      default:
        return "default";
    }
  };

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />

      <div className="container py-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Spinner
              animation="border"
              role="status"
              className="text-primary"
              size="lg"
            >
              <span className="visually-hidden">Loading...</span>
            </Spinner>
          </div>
        ) : showCustomerSearch && !selectedTransaction ? (
          // Show customer search form when no booking data and no transaction selected
          <Card shadow="md" className="mb-4 border-0 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-hotel-primary/10 to-hotel-primary/20 py-5">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h2 className="text-xl font-bold mb-0 text-gray-800">
                  Find Existing Booking 🔍
                </h2>
                <div className="search-container w-full md:w-[500px]">
                  <Input
                    type="text"
                    value={customerNameSearch}
                    onChange={(e) => setCustomerNameSearch(e.target.value)}
                    placeholder="Search by customer name..."
                    className="rounded-lg shadow-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        searchTransactionsByCustomerName();
                      }
                    }}
                    aria-label="Search customer by name"
                    size="lg"
                    endContent={
                      customerNameSearch && !isSearching ? (
                        <button
                          className="btn btn-link text-hotel-primary p-0 hover:text-hotel-primary transition-colors"
                          type="button"
                          onClick={searchTransactionsByCustomerName}
                          aria-label="Search"
                        >
                          <FaSearch />
                        </button>
                      ) : isSearching ? (
                        <Spinner animation="border" size="sm" role="status" />
                      ) : null
                    }
                  />
                </div>
              </div>
            </CardHeader>
            <CardBody className="p-0">
              {transactions.length > 0 && (
                <div className="p-5">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">
                      Found Transactions
                    </h3>
                    <Badge className="bg-hotel-primary text-white px-3 py-1 rounded-full">
                      {transactions.length} results
                    </Badge>
                  </div>
                  <div className="overflow-hidden rounded-xl shadow-sm border border-gray-100">
                    <Table
                      aria-label="Transactions table"
                      isStriped
                      shadow="none"
                      selectionMode="none"
                      isHeaderSticky
                      className="mb-4"
                      classNames={{
                        wrapper: "rounded-xl overflow-hidden",
                        table: "min-w-full",
                        th: " text-xs font-semibold text-gray-600 uppercase tracking-wider px-4 py-3",
                        td: "px-4 py-3 text-sm",
                      }}
                    >
                      <TableHeader>
                        <TableColumn>Booking #</TableColumn>
                        <TableColumn>Customer</TableColumn>
                        <TableColumn>Total Amount</TableColumn>
                        <TableColumn>Paid Amount</TableColumn>
                        <TableColumn>Remaining</TableColumn>
                        <TableColumn>Actions</TableColumn>
                      </TableHeader>
                      <TableBody
                        isLoading={isSearching}
                        loadingContent={<Spinner size="sm" />}
                        emptyContent={
                          transactions.length === 0
                            ? "No transactions found"
                            : null
                        }
                        items={paginatedTransactions}
                      >
                        {(transaction) => (
                          <TableRow
                            key={transaction._id}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <TableCell className="font-medium">
                              {transaction.bookingNumber}
                            </TableCell>
                            <TableCell>{transaction.customerName}</TableCell>
                            <TableCell className="font-semibold">
                              ₹{transaction.payableAmount}
                            </TableCell>
                            <TableCell className="text-green-600 font-medium">
                              ₹{transaction.totalPaid}
                            </TableCell>
                            <TableCell className="text-amber-600 font-medium">
                              ₹{transaction.remainingBalance}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                className={`${
                                  transaction.isFullyPaid
                                    ? "bg-gray-200 text-gray-700"
                                    : "bg-hotel-primary text-white shadow-sm hover:shadow-md transition-all"
                                } rounded-full px-4 py-1`}
                                onPress={() =>
                                  handleSelectTransaction(transaction)
                                }
                                disabled={transaction.isFullyPaid}
                              >
                                {transaction.isFullyPaid
                                  ? "Fully Paid"
                                  : "Pay Now"}
                              </Button>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Add Pagination component */}
                  {transactions.length > 0 && (
                    <div className="flex justify-center my-5">
                      <Pagination
                        total={totalPages}
                        initialPage={1}
                        page={currentPage}
                        onChange={handlePageChange}
                        showControls
                        size="md"
                        radius="full"
                        variant="bordered"
                        classNames={{
                          cursor: "bg-hotel-primary text-white shadow-sm",
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
            </CardBody>
          </Card>
        ) : (
          <Card shadow="md" className="w-100 border-0 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-hotel-primary/10 to-hotel-primary/20 py-5">
              <h2 className="text-xl font-bold text-gray-800">
                Payment Details 💳
              </h2>
            </CardHeader>
            <CardBody className="px-4 py-5">
              <div className="space-y-6">
                {/* Booking Summary */}
                <Card
                  shadow="sm"
                  radius="lg"
                  className="bg-gray-50 mb-5 border-0 overflow-hidden"
                >
                  <CardBody className="p-5">
                    <h3 className="text-lg font-bold mb-4 text-gray-800">
                      Booking Summary
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      <div className="p-3 bg-white rounded-lg shadow-sm">
                        <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">
                          Guest Name
                        </p>
                        <p className="font-semibold text-gray-800">
                          {formData.customerName}
                        </p>
                      </div>
                      {selectedTransaction ? (
                        // Display booking details for existing transaction
                        <>
                          <div className="p-3 bg-white rounded-lg shadow-sm">
                            <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">
                              Booking Number
                            </p>
                            <p className="font-semibold text-gray-800">
                              {selectedTransaction.bookingNumber}
                            </p>
                          </div>
                          <div className="p-3 bg-white rounded-lg shadow-sm">
                            <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">
                              Total Amount
                            </p>
                            <p className="font-semibold text-gray-800">
                              ₹{formData.payableAmount}
                            </p>
                          </div>
                          <div className="p-3 bg-white rounded-lg shadow-sm">
                            <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">
                              Total Paid
                            </p>
                            <p className="font-semibold text-green-600">
                              ₹{selectedTransaction.totalPaid}
                            </p>
                          </div>
                          <div className="p-3 bg-white rounded-lg shadow-sm">
                            <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">
                              Remaining Balance
                            </p>
                            <p className="font-semibold text-amber-600">
                              ₹{selectedTransaction.remainingBalance}
                            </p>
                          </div>
                        </>
                      ) : (
                        // Display booking details for new booking
                        <>
                          <div className="p-3 bg-white rounded-lg shadow-sm">
                            <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">
                              Check-in
                            </p>
                            <p className="font-semibold text-gray-800">
                              {new Date(
                                decodedBookingData.checkInDate
                              ).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="p-3 bg-white rounded-lg shadow-sm">
                            <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">
                              Check-out
                            </p>
                            <p className="font-semibold text-gray-800">
                              {new Date(
                                decodedBookingData.checkOutDate
                              ).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="p-3 bg-white rounded-lg shadow-sm">
                            <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">
                              Total Amount
                            </p>
                            <p className="font-semibold text-gray-800">
                              ₹
                              {decodedBookingData.totalAmount.total.toLocaleString()}
                            </p>
                          </div>
                          <div className="p-3 bg-white rounded-lg shadow-sm">
                            <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">
                              Number of Rooms
                            </p>
                            <p className="font-semibold text-gray-800">
                              {decodedBookingData.numberOfRooms}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </CardBody>
                </Card>

                {/* Payment History - Only show for existing transactions */}
                {selectedTransaction && paymentHistory.length > 0 && (
                  <Card
                    shadow="sm"
                    radius="lg"
                    className="mb-5 border-0 overflow-hidden"
                  >
                    <CardHeader className="py-4 px-5 bg-gray-50 border-b border-gray-100">
                      <h3 className="text-lg font-bold text-gray-800">
                        Payment History
                      </h3>
                    </CardHeader>
                    <CardBody className="p-0">
                      <div className="overflow-hidden">
                        <Table
                          aria-label="Payment history table"
                          isStriped
                          shadow="none"
                          selectionMode="none"
                          className="mb-0"
                          classNames={{
                            wrapper: "overflow-x-auto",
                            table: "min-w-full",
                            th: " text-xs font-semibold text-gray-600 uppercase tracking-wider px-4 py-3",
                            td: "px-4 py-3 text-sm",
                          }}
                        >
                          <TableHeader>
                            <TableColumn>Date</TableColumn>
                            <TableColumn>Amount</TableColumn>
                            <TableColumn>Method</TableColumn>
                            <TableColumn>Status</TableColumn>
                          </TableHeader>
                          <TableBody
                            items={paymentHistory.flatMap((transaction) =>
                              transaction.payments.map((payment, idx) => ({
                                ...payment,
                                id: `${transaction._id}-${idx}`,
                              }))
                            )}
                          >
                            {(payment) => (
                              <TableRow
                                key={payment.id}
                                className="hover:bg-gray-50 transition-colors"
                              >
                                <TableCell>
                                  {new Date(
                                    payment.paymentDate
                                  ).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="font-medium">
                                  ₹{payment.amount}
                                </TableCell>
                                <TableCell>
                                  <span className="inline-flex items-center gap-1">
                                    {paymentMethodIcons[
                                      payment.paymentMethod
                                    ] || payment.paymentMethod}
                                    <span className="ml-1">
                                      {payment.paymentMethod}
                                    </span>
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    color={getStatusColor(payment.status)}
                                    variant="flat"
                                    className="capitalize"
                                  >
                                    {payment.status}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </CardBody>
                  </Card>
                )}

                <Divider className="my-6" />

                {/* Payment Method Selection */}
                <div className="mb-5">
                  <label className="block text-sm font-semibold mb-3 text-gray-700">
                    Payment Method
                  </label>
                  <RadioGroup
                    value={paymentMethod}
                    onValueChange={setPaymentMethod}
                    orientation="horizontal"
                    className="flex flex-wrap gap-4"
                  >
                    <Radio
                      value="online"
                      color="primary"
                      className="p-2 relative"
                      classNames={{
                        base: "data-[selected=true]:bg-hotel-primary/10 data-[selected=true]:border-hotel-primary/30 border border-gray-200 rounded-lg transition-all duration-200 p-3 max-w-[180px]",
                        labelWrapper: "w-full",
                        label: "font-medium",
                      }}
                    >
                      <div className="flex flex-col items-center">
                        <FaCreditCard
                          className="text-hotel-primary mb-2"
                          size={24}
                        />
                        <span>Pay Via Online</span>
                      </div>
                    </Radio>
                    <Radio
                      value="cod"
                      color="primary"
                      className="p-2"
                      classNames={{
                        base: "data-[selected=true]:bg-green-50 data-[selected=true]:border-green-200 border border-gray-200 rounded-lg transition-all duration-200 p-3 max-w-[180px]",
                        labelWrapper: "w-full",
                        label: "font-medium",
                      }}
                    >
                      <div className="flex flex-col items-center">
                        <FaMoneyBillWave
                          className="text-green-500 mb-2"
                          size={24}
                        />
                        <span>Pay at Hotel</span>
                      </div>
                    </Radio>
                    <Radio
                      value="paymentLink"
                      color="primary"
                      className="p-2"
                      classNames={{
                        base: "data-[selected=true]:bg-purple-50 data-[selected=true]:border-purple-200 border border-gray-200 rounded-lg transition-all duration-200 p-3 max-w-[180px]",
                        labelWrapper: "w-full",
                        label: "font-medium",
                      }}
                    >
                      <div className="flex flex-col items-center">
                        <FaLink className="text-purple-500 mb-2" size={24} />
                        <span>Generate Payment Link</span>
                      </div>
                    </Radio>
                  </RadioGroup>
                </div>

                {/* Form Fields */}
                <Card
                  shadow="sm"
                  radius="lg"
                  className="border-0 overflow-hidden bg-white"
                >
                  <CardBody className="p-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="mb-2">
                        <label className="block text-sm font-medium mb-2 text-gray-700">
                          Customer Name
                        </label>
                        <Input
                          type="text"
                          value={formData.customerName}
                          onChange={(e) =>
                            handleInputChange("customerName", e.target.value)
                          }
                          className="w-full rounded-lg"
                          readOnly
                          classNames={{
                            input: "bg-gray-50",
                          }}
                        />
                      </div>

                      <div className="mb-2">
                        <label className="block text-sm font-medium mb-2 text-gray-700">
                          Payable Amount(INR)
                        </label>
                        <Input
                          type="text"
                          value={formData.payableAmount}
                          className="w-full rounded-lg"
                          readOnly
                          classNames={{
                            input: "bg-gray-50 font-semibold",
                          }}
                          startContent={
                            <span className="text-gray-500">₹</span>
                          }
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Total payable amount for the booking
                        </p>
                      </div>

                      <div className="mb-2">
                        <label className="block text-sm font-medium mb-2 text-gray-700">
                          Amount(INR) *
                        </label>
                        <Input
                          type="number"
                          value={formData.amount}
                          onChange={(e) =>
                            handleInputChange("amount", e.target.value)
                          }
                          placeholder="Amount"
                          className={`w-full rounded-lg ${
                            errors.amount
                              ? "border-red-300 focus:border-red-500"
                              : ""
                          }`}
                          startContent={
                            <span className="text-gray-500">₹</span>
                          }
                          size="lg"
                        />
                        {errors.amount && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors.amount}
                          </p>
                        )}
                        {showPaymentLinkFields && (
                          <p className="text-xs text-hotel-primary mt-1">
                            This amount will be used to generate the payment
                            link. The guest will only need to pay this amount.
                          </p>
                        )}
                        {!showPaymentLinkFields && (
                          <p className="text-xs text-hotel-primary mt-1">
                            <strong>Partial payment supported.</strong> Enter
                            the amount guest is paying now. Multiple payments
                            can be made later to reach the total amount.
                          </p>
                        )}
                      </div>

                      {/* Only show payment type for online and hotel payments */}
                      {(showOnlineFields || showHotelFields) && (
                        <div className="mb-2">
                          <label className="block text-sm font-medium mb-2 text-gray-700">
                            Payment Type *
                          </label>
                          <Select
                            value={formData.paymentType}
                            onChange={(e) =>
                              handleInputChange("paymentType", e.target.value)
                            }
                            placeholder="Select payment type"
                            className={`w-full rounded-lg ${
                              errors.paymentType
                                ? "border-red-300 focus:border-red-500"
                                : ""
                            }`}
                            size="lg"
                          >
                            {showHotelFields
                              ? cashAccounts.map((account) => (
                                  <SelectItem
                                    key={account._id}
                                    value={account._id}
                                  >
                                    {account.name}
                                  </SelectItem>
                                ))
                              : bankListAccounts.map((account) => (
                                  <SelectItem
                                    key={account._id}
                                    value={account._id}
                                  >
                                    {account.name || account.bankName}
                                  </SelectItem>
                                ))}
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
                          <label className="block text-sm font-medium mb-2 text-gray-700">
                            Bank *
                          </label>
                          <Select
                            value={formData.bank}
                            onChange={(e) =>
                              handleInputChange("bank", e.target.value)
                            }
                            placeholder="Select bank"
                            className={`w-full rounded-lg ${
                              errors.bank
                                ? "border-red-300 focus:border-red-500"
                                : ""
                            }`}
                            size="lg"
                          >
                            {bankListAccounts.map((account) => (
                              <SelectItem
                                key={`bank-${account._id}`}
                                value={account.bankName || account.name}
                              >
                                {account.bankName || account.name}
                              </SelectItem>
                            ))}
                          </Select>
                          {errors.bank && (
                            <p className="text-xs text-red-500 mt-1">
                              {errors.bank}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Only show transaction ID for online payments */}
                      {showOnlineFields && (
                        <div className="mb-2">
                          <label className="block text-sm font-medium mb-2 text-gray-700">
                            Transaction ID/Receipt *
                          </label>
                          <Input
                            type="text"
                            value={formData.transactionId}
                            onChange={(e) =>
                              handleInputChange("transactionId", e.target.value)
                            }
                            placeholder="Enter transaction ID"
                            className={`w-full rounded-lg ${
                              errors.transactionId
                                ? "border-red-300 focus:border-red-500"
                                : ""
                            }`}
                            size="lg"
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
                        <label className="block text-sm font-medium mb-2 text-gray-700">
                          Payment Date *
                        </label>
                        <Input
                          type="date"
                          value={formData.paymentDate}
                          onChange={(e) =>
                            handleInputChange("paymentDate", e.target.value)
                          }
                          className={`w-full rounded-lg ${
                            errors.paymentDate
                              ? "border-red-300 focus:border-red-500"
                              : ""
                          }`}
                          size="lg"
                        />
                        {errors.paymentDate && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors.paymentDate}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Always show remarks */}
                    <div className="mt-4">
                      <label className="block text-sm font-medium mb-2 text-gray-700">
                        Remarks
                      </label>
                      <Textarea
                        value={formData.remarks}
                        onChange={(e) =>
                          handleInputChange("remarks", e.target.value)
                        }
                        placeholder="Additional notes"
                        className="w-full rounded-lg"
                        minRows={3}
                      />
                    </div>

                    {/* Payment link message */}
                    {showPaymentLinkFields && (
                      <div className="mt-5">
                        <div className="p-4 bg-hotel-primary/10 text-hotel-primary rounded-lg border border-hotel-primary/20">
                          <div className="flex items-start gap-3">
                            <FaLink className="mt-1" />
                            <div>
                              <p className="font-medium">Payment Link Info</p>
                              <p className="text-sm mt-1">
                                A payment link for the amount specified will be
                                generated and sent to the guest&apos;s email.
                                The booking will be considered complete only
                                after the payment is received.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardBody>
                </Card>
              </div>
            </CardBody>
            <CardFooter className="flex flex-col sm:flex-row justify-end gap-3 py-4 px-5 bg-gray-50">
              <Button
                color="danger"
                variant="flat"
                onPress={() => router.push("/dashboard/bookings")}
                disabled={isProcessing}
                className="mb-2 mb-sm-0 py-2 px-4 rounded-lg"
                size="lg"
              >
                Cancel
              </Button>
              <Button
                className={`${
                  paymentMethod === "online"
                    ? "bg-hotel-primary"
                    : paymentMethod === "cod"
                    ? "bg-green-500"
                    : "bg-purple-500"
                } text-white py-2 px-5 rounded-lg shadow-sm hover:shadow-md transition-all`}
                onPress={handleSubmitPayment}
                isLoading={isProcessing}
                disabled={isProcessing}
                size="lg"
              >
                {isProcessing
                  ? "Processing..."
                  : selectedTransaction
                  ? "Record Additional Payment"
                  : "Process Payment"}
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </>
  );
};

export default RecordPaymentPage;
