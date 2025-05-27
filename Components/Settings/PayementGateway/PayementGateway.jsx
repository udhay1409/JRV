"use client";

import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Button } from "@heroui/button";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";

export default function RazorPayConfig() {
  const [apiKey, setApiKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [initialApiKey, setInitialApiKey] = useState("");
  const [initialSecretKey, setInitialSecretKey] = useState("");
  const [isLoading, setIsLoading] = useState(false); // Handles both fetching and saving states
  const [action, setAction] = useState(""); // Tracks whether we're "Fetching" or "Saving"

  useEffect(() => {
    fetchRazorpayKeys(); // Fetch the keys when the component loads
  }, []);

  const fetchRazorpayKeys = async () => {
    setIsLoading(true);
    setAction("Fetching");
    try {
      const { data } = await axios.get(`/api/settings/payementGateway`);
      setApiKey(data.apiKey);
      setSecretKey(data.secretKey);
      setInitialApiKey(data.apiKey);
      setInitialSecretKey(data.secretKey);
      toast.success("Keys fetched successfully");
    } catch (error) {
      console.error("Error fetching Razorpay keys:", error);
      toast.error(
        error.response?.data?.error || "Failed to fetch Razorpay keys"
      );
    } finally {
      setIsLoading(false);
      setAction("");
    }
  };

  const handleSave = async () => {
    if (!apiKey || !secretKey) {
      toast.error("Please fill in both API key and Secret key");
      return;
    }

    if (!apiKey.startsWith("rzp_") || apiKey.length < 20) {
      toast.error("Invalid Razorpay API key format");
      return;
    }

    setIsLoading(true);
    setAction("Saving");

    try {
      const { data } = await axios.post(`/api/settings/payementGateway`, {
        apiKey,
        secretKey,
      });

      setInitialApiKey(apiKey);
      setInitialSecretKey(secretKey);
      toast.success(data.message);
    } catch (error) {
      console.error("Error saving configuration:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to update configuration";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
      setAction("");
    }
  };

  const isSaveEnabled =
    apiKey &&
    secretKey &&
    (apiKey !== initialApiKey || secretKey !== initialSecretKey);

  return (
    <>
      <section className=" mx-auto space-y-8 bg-white rounded-lg p-8 shadow-sm min-h-[811px]">
        <div className="p-3">
          <h3 className="text-3xl font-bold mb-6">Razor Pay Configuration</h3>
          <form>
            <div className="row mb-4">
              <div className="col-md-6 mb-3 mb-md-0">
                <label htmlFor="apiKey" className="form-label font-semibold">
                  Razor Api Key
                </label>
                <input
                  type="text"
                  className="form-control bg-white"
                  id="apiKey"
                  placeholder="Razor Pay Api Key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="secretKey" className="form-label font-semibold">
                  Razorpay Secret Key
                </label>
                <input
                  type="text"
                  className="form-control bg-white"
                  id="secretKey"
                  placeholder="Razor Pay Secret Key"
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="d-flex justify-content-end">
              <Button
                type="button"
                radius="full"
                className={`bg-hotel-primary text-white w-[150px] ${
                  isSaveEnabled
                    ? "bg-hotel-primary  hover:bg-hotel-primary "
                    : "disabled"
                }`}
                onClick={action === "" ? handleSave : null}
                disabled={isLoading || (!isSaveEnabled && action === "")}
              >
                {isLoading ? `${action}...` : "Save"}
              </Button>
            </div>
          </form>
        </div>
      </section>
    </>
  );
}
