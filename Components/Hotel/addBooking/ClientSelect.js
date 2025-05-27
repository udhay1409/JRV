"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";

const Select = dynamic(() => import("react-select"), {
  ssr: false,
  loading: () => <div>Loading...</div>,
});

const ClientSelect = ({ inputId, ...props }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return <Select instanceId={inputId} {...props} />;
};

export default ClientSelect;
