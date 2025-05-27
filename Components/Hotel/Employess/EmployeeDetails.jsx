import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { Avatar } from "@heroui/avatar";
import { Card, CardBody } from "@heroui/card";

import { Download, FileText, Image as ImageIcon } from "lucide-react"; // Add new icons
import Image from "next/image";

export default function EmployeeProfileModal({
  isModalOpen,
  onCloseModal,
  employee,
}) {
  if (!employee) {
    return <div>Loading...</div>; // Fallback UI if employee data is not available
  }

  const getFileType = (path) => {
    const extension = path.split(".").pop().toLowerCase();
    switch (extension) {
      case "pdf":
        return "pdf";
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
        return "image";
      default:
        return "other";
    }
  };

  const getDocumentIcon = (path) => {
    const type = getFileType(path);
    switch (type) {
      case "pdf":
        return <FileText size={20} className="text-white" />;
      case "image":
        return <ImageIcon size={20} className="text-white" />;
      default:
        return <FileText size={20} className="text-white" />;
    }
  };

  const getFileName = (path) => {
    return path.split("/").pop();
  };

  const handleDownload = async (documentPath) => {
    try {
      const response = await fetch(documentPath, {
        method: "GET",
        headers: {
          "Content-Type": "application/octet-stream",
        },
      });
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = getFileName(documentPath);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading document:", error);
    }
  };

  return (
    <Modal
      isOpen={isModalOpen} // Updated to 'isOpen'
      onClose={onCloseModal} // Updated to 'onClose'
      size="3xl"
      scrollBehavior="inside"
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h2 className="text-lg font-bold">{employee?.employeeId}</h2>
        </ModalHeader>
        <ModalBody>
          <div className="flex flex-col items-center mb-4">
            <Avatar src={employee?.avatar} className="w-24 h-24" />
            <h3 className="text-xl font-semibold mt-2">{`${employee?.firstName} ${employee?.lastName}`}</h3>
            <p className="text-sm text-gray-500">{employee?.role?.role}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Gender</p>
              <p>{employee?.gender}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Date of Birth</p>
              <p>{employee?.dateOfBirth}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p>{employee?.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Mobile No</p>
              <p>{employee?.mobileNo}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Date of Hiring</p>
              <p>{employee?.dateOfHiring}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Department</p>
              <p>{employee?.department?.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Shift Time</p>
              <p>{employee?.shiftTime?.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Week off</p>
              <p>{employee?.weekOff}</p>
            </div>
          </div>
          <div className="mt-6">
            <h4 className="text-lg font-semibold mb-2">Documents</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {employee.documents.map((doc, index) => (
                <div key={index} className="relative">
                  <Card className="w-full cursor-pointer">
                    <CardBody className="p-0 relative">
                      <div className="absolute top-2 left-2 z-10 bg-black/50 p-2 rounded-full">
                        {getDocumentIcon(doc)}
                      </div>
                      {getFileType(doc) === "image" ? (
                        <Image
                          src={doc}
                          alt={`Document ${index + 1}`}
                          width={300}
                          height={128}
                          className="w-full h-32 object-cover"
                        />
                      ) : (
                        <div className="w-full h-32 bg-gray-200 flex items-center justify-center">
                          {getDocumentIcon(doc)}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                          onPress={() => handleDownload(doc)}
                          style={{ background: "transparent" }}
                        >
                          {" "}
                          <Download size={20} className="text-white" />{" "}
                        </Button>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2">
                        <p className="text-white text-xs truncate">
                          {getFileName(doc)}
                        </p>
                      </div>
                    </CardBody>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="danger" variant="light" onPress={onCloseModal}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
