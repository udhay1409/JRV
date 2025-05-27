import React, { useState, useEffect } from "react";
import { Select, SelectItem } from "@heroui/select";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { toast } from "react-toastify";
import axios from "axios";

const emailProviders = [
  { label: "Gmail", value: "gmail", host: "smtp.gmail.com", port: "587" },
  {
    label: "Outlook/Office365",
    value: "outlook",
    host: "smtp.office365.com",
    port: "587",
  },
  {
    label: "Yahoo Mail",
    value: "yahoo",
    host: "smtp.mail.yahoo.com",
    port: "587",
  },
  { label: "Custom SMTP", value: "custom", host: "", port: "" },
];

const EmailProviderInstructions = ({ selectedProvider }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const instructions = {
    gmail: {
      title: "Gmail Setup Guide",
      steps: [
        {
          title: "1. Enable 2-Step Verification",
          detail:
            "Go to Google Account Security settings and enable 2-Step Verification",
        },
        {
          title: "2. Generate App Password",
          detail:
            "In Google Account → Security → App Passwords, generate a new 16-character password",
        },
        {
          title: "3. Configuration Details",
          detail:
            "Use smtp.gmail.com as host, 587 as port, your Gmail address as username, and the App Password as password",
        },
      ],
    },
    outlook: {
      title: "Outlook/Office365 Setup Guide",
      steps: [
        {
          title: "1. Enable 2-Step Verification",
          detail:
            "Access Microsoft Account Security settings to enable 2-Step Verification",
        },
        {
          title: "2. Create App Password",
          detail:
            "Generate an App Password from Microsoft Account Security settings",
        },
        {
          title: "3. Configuration Details",
          detail:
            "Use smtp.office365.com as host, 587 as port, complete email address as username",
        },
      ],
    },
    yahoo: {
      title: "Yahoo Mail Setup Guide",
      steps: [
        {
          title: "1. Security Setup",
          detail: "Enable 2-Step Verification in Yahoo Account Security",
        },
        {
          title: "2. Generate Password",
          detail: "Create an App Password from Yahoo Account Security settings",
        },
        {
          title: "3. Configuration Details",
          detail:
            "Use smtp.mail.yahoo.com as host, 587 as port, full Yahoo email as username",
        },
      ],
    },
  };

  if (!selectedProvider || selectedProvider === "custom") return null;
  const guide = instructions[selectedProvider];

  return (
    <div className="mt-4 mb-6 transition-all duration-300 ease-in-out">
      <div className="max-w-full lg:w-2/3 mx-auto bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg shadow-sm">
        <div
          className="bg-blue-200 p-4 rounded-t-lg flex justify-between items-center cursor-pointer hover:bg-blue-300 transition-colors duration-200"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center space-x-2">
            <span
              className={`transform transition-transform duration-200 ${
                isExpanded ? "rotate-180" : ""
              }`}
            >
              ▼
            </span>
            <h3 className="text-blue-900 font-medium text-lg">{guide.title}</h3>
          </div>
          <span className="text-blue-600 text-sm">
            {isExpanded ? "Hide Details" : "Show Details"}
          </span>
        </div>

        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            isExpanded ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="p-6 space-y-6">
            {guide.steps.map((step, index) => (
              <div
                key={index}
                className="flex items-start space-x-4 p-4 rounded-lg hover:bg-blue-50 transition-colors duration-200"
              >
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-medium">
                    {index + 1}
                  </div>
                </div>
                <div className="flex-grow">
                  <h4 className="font-medium text-blue-800 text-base mb-2">
                    {step.title}
                  </h4>
                  <p className="text-blue-600 text-sm leading-relaxed">
                    {step.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const EmailConfiguration = () => {
  const [selectedProvider, setSelectedProvider] = useState("custom");
  const [formData, setFormData] = useState({
    smtpPort: "",
    smtpUsername: "",
    smtpPassword: "",
    senderEmail: "",
    smtpHost: "",
  });
  const [testData, setTestData] = useState({
    email: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEmailConfig = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/settings/emailConfiguration`);
        if (response.data.success && response.data.emailConfig) {
          setFormData(response.data.emailConfig);
        }
      } catch (err) {
        setError(err.message || "Failed to load email configuration");
      } finally {
        setLoading(false);
      }
    };

    fetchEmailConfig();
  }, []);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleProviderChange = (value) => {
    setSelectedProvider(value);
    const provider = emailProviders.find((p) => p.value === value);
    if (provider && value !== "custom") {
      setFormData((prev) => ({
        ...prev,
        smtpHost: provider.host,
        smtpPort: provider.port,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaveLoading(true);
      const response = await axios.post(
        `/api/settings/emailConfiguration`,
        formData
      );
      if (response.data.success) {
        toast.success("Email configuration saved successfully");
      }
    } catch (err) {
      setError(err.message || "Failed to save settings");
      toast.error(err.message || "Failed to save settings");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testData.email || !testData.email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    try {
      setTestLoading(true);
      setError(null);
      const response = await axios.put(`/api/settings/emailConfiguration`, {
        testEmail: testData.email,
        message: testData.message,
      });
      if (response.data.success) {
        setError(null);
        toast.success("Test email sent successfully");
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.details ||
        err.message ||
        "Failed to send test email";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setTestLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[811px] bg-white rounded-lg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00529C]"></div>
      </div>
    );
  }

  return (
    <section className="mx-auto space-y-8 bg-white rounded-lg p-4 md:p-8 shadow-sm min-h-[811px]">
      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-lg mb-4">
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="py-3">
          <div className="mb-6 flex flex-col md:flex-row md:items-center">
            <label className="w-full md:w-1/2 mb-2 md:mb-0">
              Email Provider
            </label>
            <Select
              className="w-full md:w-1/3"
              value={selectedProvider}
              onChange={(e) => handleProviderChange(e.target.value)}
              aria-label="Select email provider"
            >
              {emailProviders.map((provider) => (
                <SelectItem key={provider.value} value={provider.value}>
                  {provider.label}
                </SelectItem>
              ))}
            </Select>
          </div>

          <EmailProviderInstructions selectedProvider={selectedProvider} />

          <div className="mb-4 flex">
            <label htmlFor="smtpHost" className="w-1/2 mb-2 items-center">
              SMTP Host
            </label>
            <div className="w-1/3">
              <Input
                id="smtpHost"
                value={formData.smtpHost}
                onChange={handleChange}
                placeholder="smtp.gmail.com"
              />
            </div>
          </div>
          <div className="mb-4 flex">
            <label htmlFor="smtpPort" className="w-1/2 mb-2 items-center">
              SMTP Port
            </label>
            <Input
              id="smtpPort"
              value={formData.smtpPort}
              onChange={handleChange}
              placeholder="Enter SMTP Port"
              type="number"
              className="w-1/3"
            />
          </div>
          <div className="flex mb-4">
            <label htmlFor="smtpUsername" className="w-1/2 mb-2 items-center">
              SMTP Username
            </label>
            <Input
              id="smtpUsername"
              value={formData.smtpUsername}
              onChange={handleChange}
              placeholder="Enter SMTP Username"
              className="w-1/3"
            />
          </div>
          <div className="flex mb-4">
            <label htmlFor="smtpPassword" className="w-1/2 mb-2 items-center">
              SMTP Password
            </label>
            <Input
              id="smtpPassword"
              value={formData.smtpPassword}
              onChange={handleChange}
              type="password"
              placeholder="Enter SMTP Password"
              className="w-1/3"
            />
          </div>

          <div>
            <h2 className="text-lg font-[500]">Email Setting</h2>
            <div className="flex my-3">
              <label htmlFor="senderEmail" className="w-1/2 mb-2 items-center">
                Sender
              </label>
              <Input
                id="senderEmail"
                value={formData.senderEmail}
                onChange={handleChange}
                placeholder="noreply@example.com"
                className="w-1/3"
              />
            </div>
          </div>

          <div className="my-4">
            <h2 className="text-lg font-[500]">Send Test Message</h2>
            <div className="flex my-3">
              <label htmlFor="test-email" className="w-1/2 mb-2 items-center">
                Test Email
              </label>
              <Input
                id="test-email"
                value={testData.email}
                onChange={(e) =>
                  setTestData((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="test@example.com"
                className="w-1/3"
              />
            </div>
            <div className="flex my-3 gap-4">
              <label htmlFor="test-message" className="w-1/2 mb-2 items-center">
                Write Message
              </label>
              <Input
                id="test-message"
                value={testData.message}
                onChange={(e) =>
                  setTestData((prev) => ({ ...prev, message: e.target.value }))
                }
                placeholder="Write your Content"
                className="w-1/3"
              />
              <Button
                className="bg-hotel-primary text-white w-1/12 rounded-full"
                onClick={handleTestEmail}
                isLoading={testLoading}
              >
                {testLoading ? "Sending..." : "Send"}
              </Button>
            </div>
          </div>
        </div>
        <div className="flex justify-end mt-auto">
          <Button
            type="submit"
            className="min-w-40 mt-6 bg-hotel-primary text-white rounded-full"
            isLoading={saveLoading}
          >
            {saveLoading ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
    </section>
  );
};

export default EmailConfiguration;
