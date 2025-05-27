"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import axios from "axios";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Spinner } from "@heroui/spinner";
import { Divider } from "@heroui/divider";

import { toast } from "react-toastify";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });
import "react-quill/dist/quill.snow.css";

export default function PolicyEditor() {
  const [termsAndConditions, setTermsAndConditions] = useState("");
  const [paymentPolicy, setPaymentPolicy] = useState("");
  const [privacyPolicy, setPrivacyPolicy] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPolicy();
  }, []);

  const fetchPolicy = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`/api/settings/policy`);
      if (data.success) {
        setTermsAndConditions(data.policy.termsAndConditions || "");
        setPaymentPolicy(data.policy.paymentPolicy || "");
        setPrivacyPolicy(data.policy.privacyPolicy || "");
      } else {
        throw new Error(data.message || "Failed to fetch policy");
      }
    } catch (error) {
      console.error("Error fetching policy:", error);
      setError(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("termsAndConditions", termsAndConditions);
      formData.append("paymentPolicy", paymentPolicy);
      formData.append("privacyPolicy", privacyPolicy);

      const { data } = await axios.post(`/api/settings/policy`, formData);

      if (data.success) {
        toast.success("Policies saved successfully");
      } else {
        throw new Error(data.message || "Failed to save policy");
      }
    } catch (error) {
      console.error("Error saving policy:", error);
      setError(error.response?.data?.message || error.message);
    } finally {
      setSaving(false);
    }
  };

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link"],
      ["clean"],
    ],
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  // if (error) {
  //   return <div className="text-center text-red-500">Error: {error}</div>;
  // }

  return (
    <div className=" mx-auto space-y-8 bg-white rounded-lg p-8 shadow-sm min-h-[811px]">
      <h1 className="text-hotel-primary-text text-2xl font-bold mb-6">
        Edit Hotel Policies
      </h1>

      <Card className="mb-6">
        <CardHeader>
          <h2 className="text-hotel-primary-text text-xl font-semibold mb-0">
            Terms & Conditions
          </h2>
        </CardHeader>
        <Divider />
        <CardBody>
          <ReactQuill
            theme="snow"
            value={termsAndConditions}
            onChange={setTermsAndConditions}
            modules={modules}
            className="h-[200px]"
          />
        </CardBody>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <h2 className="text-hotel-primary-text text-xl font-semibold mb-0">
            Payment Policy
          </h2>
        </CardHeader>
        <Divider />
        <CardBody>
          <ReactQuill
            theme="snow"
            value={paymentPolicy}
            onChange={setPaymentPolicy}
            modules={modules}
            className="h-[200px]"
          />
        </CardBody>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <h2 className="text-hotel-primary-text text-xl font-semibold mb-0">
            Cancellation Policy
          </h2>
        </CardHeader>
        <Divider />
        <CardBody>
          <ReactQuill
            theme="snow"
            value={privacyPolicy}
            onChange={setPrivacyPolicy}
            modules={modules}
            className="h-[200px]"
          />
        </CardBody>
      </Card>

      <div className="flex justify-end mt-6">
        <Button
          className="bg-hotel-primary text-white text-md"
          onClick={handleSave}
          isLoading={saving}
        >
          {saving ? "Saving..." : "Save Policies"}
        </Button>
      </div>
    </div>
  );
}
