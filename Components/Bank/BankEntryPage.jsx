import React, { useState, useEffect } from "react";
import { Button } from "@heroui/button";
import { Tabs, Tab } from "@heroui/tabs";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import axios from "axios";
import { toast } from "react-toastify";
import { usePagePermission } from "@/hooks/usePagePermission";
// import TableSkeleton from "@/Components/ui/TableSkeleton";

const BankEntryPage = () => {
  // const hasViewPermission = usePagePermission("Financials/Bank", "view");
  const hasAddPermission = usePagePermission("Financials/Bank", "add");
  // const hasEditPermission = usePagePermission("Financials/Bank", "edit");

  const [activeTab, setActiveTab] = useState("entry");
  const [bankEntries, setBankEntries] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    transactionType: "deposit",
    paymentType: "bank",
    fromAccount: "",
    toAccount: "",
    amount: "",
    description: "",
    reference: "",
  });
  const [loading, setLoading] = useState(false);

  // Fetch bank accounts
  const fetchBankAccounts = async () => {
    try {
      const response = await axios.get("/api/financials/bank?isActive=true");
      if (response.data.success) {
        setBankAccounts(response.data.bankAccounts);

        // Set default fromAccount if available
        if (response.data.bankAccounts.length > 0) {
          setFormData((prev) => ({
            ...prev,
            fromAccount: response.data.bankAccounts[0]._id,
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching bank accounts:", error);
      toast.error("Failed to fetch bank accounts");
    }
  };

  // Fetch bank entries
  const fetchBankEntries = async () => {
    try {
      const response = await axios.get("/api/financials/bank/entry");
      if (response.data.success) {
        setBankEntries(response.data.bankEntries);
      }
    } catch (error) {
      console.error("Error fetching bank entries:", error);
      toast.error("Failed to fetch bank entries");
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchBankAccounts();
    fetchBankEntries();
  }, []);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle select changes
  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle tab change
  const handleTabChange = (key) => {
    setActiveTab(key);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split("T")[0],
      transactionType: "deposit",
      paymentType: "bank",
      fromAccount: bankAccounts.length > 0 ? bankAccounts[0]._id : "",
      toAccount: "",
      amount: "",
      description: "",
      reference: "",
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!hasAddPermission) {
      toast.error("You don't have permission to add bank entries");
      return;
    }

    setLoading(true);

    // Validate form
    if (formData.transactionType === "transfer" && !formData.toAccount) {
      toast.error("Please select a destination account for transfer");
      setLoading(false);
      return;
    }

    try {
      // Convert amount to number and handle toAccount
      const dataToSubmit = {
        ...formData,
        amount: Number(formData.amount),
      };

      // Set toAccount to undefined for non-transfer transactions
      if (dataToSubmit.transactionType !== "transfer") {
        dataToSubmit.toAccount = undefined;
      }

      const response = await axios.post(
        "/api/financials/bank/entry",
        dataToSubmit
      );
      if (response.data.success) {
        toast.success("Entry created successfully");
        resetForm();
        fetchBankEntries();
      }
    } catch (error) {
      console.error("Error creating entry:", error);
      toast.error(error.response?.data?.message || "Failed to create entry");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Bank</h1>

      <div className="flex justify-between items-center mb-4">
        <div></div>
        <a href="/dashboard/financials/bank">
          <Button color="primary">Back to Bank Page</Button>
        </a>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <Tabs
          selectedKey={activeTab}
          onSelectionChange={handleTabChange}
          color="warning"
          variant="underlined"
          aria-label="Bank transaction options"
          classNames={{
            tab: "px-4 py-2",
            tabList:
              "gap-6 w-full relative rounded-none p-0 border-b border-divider",
            cursor: "w-full bg-warning",
          }}
        >
          <Tab key="bank" title="Bank" href="/dashboard/financials/bank" />
          <Tab key="entry" title="Entry" />
        </Tabs>

        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4">Add Entries</h2>
          {hasAddPermission ? (
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  type="date"
                  label="Date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                />

                <Select
                  label="Transaction Type"
                  selectedKeys={
                    formData.transactionType ? [formData.transactionType] : []
                  }
                  onChange={(e) =>
                    handleSelectChange("transactionType", e.target.value)
                  }
                  required
                >
                  <SelectItem key="deposit" value="deposit">
                    Deposit
                  </SelectItem>
                  <SelectItem key="withdrawal" value="withdrawal">
                    Withdrawal
                  </SelectItem>
                  <SelectItem key="transfer" value="transfer">
                    Transfer
                  </SelectItem>
                </Select>

                <Select
                  label="Payment Type"
                  selectedKeys={
                    formData.paymentType ? [formData.paymentType] : []
                  }
                  onChange={(e) =>
                    handleSelectChange("paymentType", e.target.value)
                  }
                  required
                >
                  <SelectItem key="bank" value="bank">
                    Bank
                  </SelectItem>
                  <SelectItem key="cash" value="cash">
                    Cash
                  </SelectItem>
                </Select>

                <Select
                  label="From Account"
                  defaultSelectedKeys={
                    formData.fromAccount ? [formData.fromAccount] : []
                  }
                  onSelectionChange={(keys) => {
                    const selectedKey = Array.from(keys)[0];
                    handleSelectChange("fromAccount", selectedKey);
                  }}
                  required
                >
                  {bankAccounts.map((account) => (
                    <SelectItem key={account._id} value={account._id}>
                      {account.type === "bank"
                        ? `${account.bankName} (${account.name})`
                        : account.name}
                    </SelectItem>
                  ))}
                </Select>

                {formData.transactionType === "transfer" && (
                  <Select
                    label="To Account"
                    defaultSelectedKeys={
                      formData.toAccount ? [formData.toAccount] : []
                    }
                    onSelectionChange={(keys) => {
                      const selectedKey = Array.from(keys)[0];
                      handleSelectChange("toAccount", selectedKey);
                    }}
                    required
                  >
                    {bankAccounts
                      .filter((account) => account._id !== formData.fromAccount)
                      .map((account) => (
                        <SelectItem key={account._id} value={account._id}>
                          {account.type === "bank"
                            ? `${account.bankName} (${account.name})`
                            : account.name}
                        </SelectItem>
                      ))}
                  </Select>
                )}

                <Input
                  type="number"
                  label="Amount"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="Enter amount"
                  required
                />

                <Input
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter description"
                />

                <Input
                  label="Reference"
                  name="reference"
                  value={formData.reference}
                  onChange={handleChange}
                  placeholder="Enter reference number"
                />
              </div>

              <div className="flex justify-end mt-6 gap-4">
                <Button color="default" variant="light" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit" color="warning" isLoading={loading}>
                  Save
                </Button>
              </div>
            </form>
          ) : (
            <div className="text-center p-4 text-gray-500">
              You don&#39;t have permission to add bank entries
            </div>
          )}
        </div>
      </div>
      {/* Show entries table if user has view permission */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Entries</h2>
        <Table aria-label="Bank Entries">
          <TableHeader>
            <TableColumn>DATE</TableColumn>
            <TableColumn>TRANSACTION TYPE</TableColumn>
            <TableColumn>FROM ACCOUNT</TableColumn>
            <TableColumn>TO ACCOUNT</TableColumn>
            <TableColumn>AMOUNT</TableColumn>
            <TableColumn>DESCRIPTION</TableColumn>
            <TableColumn>REFERENCE</TableColumn>
          </TableHeader>
          <TableBody>
            {bankEntries.map((entry) => (
              <TableRow key={entry._id}>
                <TableCell>
                  {new Date(entry.date).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  {entry.transactionType.charAt(0).toUpperCase() +
                    entry.transactionType.slice(1)}
                </TableCell>
                <TableCell>
                  {entry.fromAccount?.name ||
                    entry.fromAccount?.bankName ||
                    "N/A"}
                </TableCell>
                <TableCell>
                  {entry.toAccount?.name || entry.toAccount?.bankName || "N/A"}
                </TableCell>
                <TableCell>₹{entry.amount}</TableCell>
                <TableCell>{entry.description || "-"}</TableCell>
                <TableCell>{entry.reference || "-"}</TableCell>
              </TableRow>
            ))}
            {bankEntries.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  No entries found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default BankEntryPage;
