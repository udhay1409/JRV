import React, { useState } from "react";
import { Form, ProgressBar, Row, Col } from "react-bootstrap";
import {
  FaUpload,
  FaTimesCircle,
  FaImage,
  FaTrash,
  FaSave,
} from "react-icons/fa";
import axios from "axios";
import { toast } from "react-toastify";

import GalleryTable from "./GalleryTable";

const Gallery = ({ hasAddPermission, hasEditPermission, hasDeletePermission }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  const handleDragOver = (e) => {
    if (!hasAddPermission) return;
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    if (!hasAddPermission) return;
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (!hasAddPermission) {
      toast.error("You don't have permission to add images");
      return;
    }
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileUpload = (e) => {
    if (!hasAddPermission) {
      toast.error("You don't have permission to add images");
      return;
    }
    const files = Array.from(e.target.files);
    handleFiles(files);
  };

  const handleFiles = (files) => {
    const validFiles = Array.from(files).filter((file) => {
      const isValid =
        file.type.startsWith("image/") && file.size <= 100 * 1024 * 1024;
      return isValid;
    });

    const newFiles = validFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      progress: 0,
      status: "uploading",
      size: formatFileSize(file.size),
      error: null,
    }));
    setUploadedFiles((prev) => [...prev, ...newFiles]);
    simulateUpload(newFiles);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const simulateUpload = (files) => {
    files.forEach((file, index) => {
      const interval = setInterval(() => {
        setUploadedFiles((prev) => {
          const newFiles = [...prev];
          const fileIndex = newFiles.findIndex(
            (f) => f.preview === file.preview
          );
          if (fileIndex !== -1) {
            if (newFiles[fileIndex].progress >= 100) {
              clearInterval(interval);
              newFiles[fileIndex].status = "completed";
            } else {
              newFiles[fileIndex].progress += 10;
            }
          }
          return newFiles;
        });
      }, 500);
    });
  };

  const removeFile = (preview) => {
    if (!hasAddPermission) {
      toast.error("You don't have permission to remove images");
      return;
    }
    setUploadedFiles((prev) => prev.filter((file) => file.preview !== preview));
  };

  const handleSave = async () => {
    if (!hasAddPermission) {
      toast.error("You don't have permission to add images");
      return;
    }

    if (uploadedFiles.length === 0) {
      setSaveStatus("error");
      return;
    }

    setIsSaving(true);
    setSaveStatus("saving");

    try {
      const formData = new FormData();
      uploadedFiles.forEach((file) => {
        formData.append("images", file.file);
      });

      await axios.post("/api/web-settings/gallery", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setSaveStatus("success");
      setUploadedFiles([]);
      toast.success("Images uploaded successfully!");
      
      // Trigger reload after 2 seconds
      setTimeout(() => {
        setReloadTrigger((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      setSaveStatus("error");
      toast.error("Failed to upload images");
    } finally {
      setIsSaving(false);
    }
  };

  const getSaveButtonStyles = () => {
    if (saveStatus === "success") {
      return "bg-green-500 hover:bg-green-600";
    }
    if (isSaving) {
      return "bg-hotel-primary cursor-not-allowed";
    }
    return "bg-hotel-primary hover:bg-hotel-primary/60";
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {hasAddPermission && (
        <>
          <h2 className="text-2xl font-bold mb-4">Gallery Upload</h2>

          <div
            className={`border-2 border-dashed p-6 text-center rounded-lg mb-4 ${
              isDragging ? "bg-gray-50 border-blue-500" : "border-gray-300"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Form.Control
              type="file"
              id="fileUpload"
              className="d-none"
              onChange={handleFileUpload}
              multiple
              accept="image/*"
            />
            <Form.Label htmlFor="fileUpload" className="mb-0 cursor-pointer">
              <div
                className="uploadingcenter d-flex flex-column align-items-center  justify-content-center"
                style={{ justifyItems: "center" }}
              >
                <FaUpload className="text-4xl text-gray-400 mb-3" />
                <p className="text-lg font-semibold mb-2">
                  Drop your images here or click to browse
                </p>
                <p className="text-sm text-gray-500">
                  Supports: JPEG, PNG, GIF 
                </p>
              </div>
            </Form.Label>
          </div>

          {uploadedFiles.length > 0 && (
            <div className="mt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Uploaded Files</h3>
                <div className="flex gap-3 items-center">
                  <button
                    className="px-4 py-2 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 flex items-center transition-colors duration-200"
                    onClick={() => setUploadedFiles([])}
                  >
                    <FaTrash className="mr-2" /> Clear All
                  </button>
                  <button
                    disabled={isSaving || uploadedFiles.length === 0}
                    onClick={handleSave}
                    className={`px-4 py-2 rounded-lg text-white flex items-center gap-2 transition-all duration-200 ${getSaveButtonStyles()} 
                      ${
                        isSaving || uploadedFiles.length === 0
                          ? "opacity-60 cursor-not-allowed"
                          : "transform hover:-translate-y-0.5"
                      }`}
                  >
                    <FaSave className={`${isSaving ? "animate-spin" : ""}`} />
                    <span>
                      {isSaving
                        ? "Saving..."
                        : saveStatus === "success"
                        ? "Saved!"
                        : "Save Changes"}
                    </span>
                  </button>
                </div>
              </div>

              {saveStatus === "error" && (
                <div className="bg-red-50 text-red-500 p-3 rounded-lg mb-3 flex items-center">
                  <FaTimesCircle className="mr-2" />
                  Error saving changes. Please try again.
                </div>
              )}

              <Row className="g-4">
                {uploadedFiles.map((file, index) => (
                  <Col key={file.preview} xs={12} sm={6} md={4} lg={3}>
                    <div className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300">
                      <div className="relative">
                        <img
                          src={file.preview}
                          alt={`Preview ${index}`}
                          className="w-100 h-48 object-cover"
                        />
                        <button
                          onClick={() => removeFile(file.preview)}
                          className="absolute top-2 right-2 p-2 rounded-full bg-white text-red-500 hover:bg-gray-100"
                        >
                          <FaTimesCircle />
                        </button>
                      </div>
                      <div className="p-3 bg-gray-50">
                        <div className="flex items-center mb-2">
                          <FaImage className="text-gray-400 mr-2" />
                          <p className="text-sm text-gray-600 truncate flex-1">
                            {file.file.name}
                          </p>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                          <span>{file.size}</span>
                          <span>
                            {file.status === "completed"
                              ? "Completed"
                              : "Uploading..."}
                          </span>
                        </div>
                        <ProgressBar
                          now={file.progress}
                          variant={
                            file.status === "completed" ? "success" : "primary"
                          }
                          className="h-1"
                        />
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>
            </div>
          )}
        </>
      )}

      <div className="rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-semibold mb-6 text-gray-800">
          Hero Sections List
        </h2>
        <GalleryTable 
          key={reloadTrigger} 
          hasDeletePermission={hasDeletePermission}
        />
      </div>
    </div>
  );
};

export default Gallery;
