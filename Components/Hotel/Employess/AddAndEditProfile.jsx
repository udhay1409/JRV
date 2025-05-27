"use client";
import { useState, useRef, useEffect } from "react";
import { Select, SelectItem } from "@heroui/select";
import { Input } from "@heroui/input";
import { Avatar } from "@heroui/avatar";
import { Button } from "@heroui/button";

import { Camera } from "lucide-react";
import Image from "next/image";
import EditProfileSkeleton from "./EditProfileSkeleton";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { usePagePermission } from "../../../hooks/usePagePermission";

export default function AddAndEditProfile({ params }) {
  const { employeeId } = params;
  const hasEditPermission = usePagePermission("Employees", "edit");
  const hasAddPermission = usePagePermission("Employees", "add");

  // Check appropriate permission based on whether we're editing or adding
  const hasPermission = employeeId ? hasEditPermission : hasAddPermission;

  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [avatarSrc, setAvatarSrc] = useState("");
  const fileInputRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [employeeData, setEmployeeData] = useState({
    employeeId: "",
    firstName: "",
    lastName: "",
    gender: "",
    dateOfBirth: "",
    email: "",
    mobileNo: "",
    dateOfHiring: "",
    department: "",
    role: "",
    tempRole: "",
    shiftTime: "",
    weekOff: "",
  });

  // Add validation state
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Validation rules
  const validateField = (name, value) => {
    switch (name) {
      case "firstName":
      case "lastName":
        return !value.trim()
          ? "This field is required"
          : !/^[a-zA-Z\s]*$/.test(value)
          ? "Only letters are allowed"
          : "";

      case "email":
        return !value
          ? "Email is required"
          : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
          ? "Invalid email format"
          : "";

      case "mobileNo":
        return !value
          ? "Mobile number is required"
          : !/^\d{10}$/.test(value)
          ? "Must be 10 digits"
          : "";

      case "dateOfBirth":
        if (!value) return "Date of birth is required";
        const age = new Date().getFullYear() - new Date(value).getFullYear();
        return age < 18 ? "Must be at least 18 years old" : "";

      case "dateOfHiring":
        return !value ? "Hiring date is required" : "";

      case "role":
      case "department":
      case "shiftTime":
      case "gender":
      case "weekOff":
        return !value ? "This field is required" : "";

      default:
        return "";
    }
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const [rolesRes, departmentsRes, shiftsRes] = await Promise.all([
          fetch(`/api/rolesAndPermission`),
          fetch(`/api/settings/employeeManagement/departments`),
          fetch(`/api/settings/employeeManagement/shifts`),
        ]);

        const rolesData = await rolesRes.json();
        const departmentsData = await departmentsRes.json();
        const shiftsData = await shiftsRes.json();

        setRoles(rolesData.roles || []);
        setDepartments(departmentsData.departments || []);
        setShifts(shiftsData.shifts || []);

        if (employeeId) {
          const employeeRes = await fetch(
            `/api/employeeManagement/${employeeId}`
          );
          const { employee } = await employeeRes.json();
          setEmployeeData({
            employeeId: employee.employeeId,
            firstName: employee.firstName,
            lastName: employee.lastName,
            gender: employee.gender,
            dateOfBirth: employee.dateOfBirth.split("T")[0],
            email: employee.email,
            mobileNo: employee.mobileNo,
            dateOfHiring: employee.dateOfHiring.split("T")[0],
            department: employee.department._id,
            role: employee.role._id,
            tempRole: employee.role._id,
            shiftTime: employee.shiftTime._id,
            weekOff: employee.weekOff,
          });
          setAvatarSrc(employee.avatar);
          setUploadedFiles(
            employee.documents.map((doc, index) => ({
              file: null,
              name: `Document ${index + 1}`,
              preview: doc,
            }))
          );
        }

        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load necessary data. Please try again.");
        setIsLoading(false);
      }
    }

    fetchData();
  }, [employeeId]);

  if (isLoading) {
    return <EditProfileSkeleton />;
  }

  if (!hasPermission) {
    return (
      <div className="p-4 text-center">
        You don&apos;t have permission to {employeeId ? "edit" : "add"}{" "}
        employees
      </div>
    );
  }

  const handleFileUpload = (event) => {
    const newFiles = Array.from(event.target.files).map((file) => ({
      file,
      name: file.name,
      preview: URL.createObjectURL(file),
    }));
    setUploadedFiles((prev) => [...prev, ...newFiles]);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const newFiles = Array.from(event.dataTransfer.files).map((file) => ({
      file,
      name: file.name,
      preview: URL.createObjectURL(file),
    }));
    setUploadedFiles((prev) => [...prev, ...newFiles]);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const removeFile = (fileName) => {
    setUploadedFiles((prev) => prev.filter((file) => file.name !== fileName));
  };

  const handleAvatarUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarSrc(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerAvatarUpload = () => {
    fileInputRef.current.click();
  };

  // Modify handleChange to include validation
  const handleChange = async (value, name) => {
    let inputValue;

    if (name === "role" || name === "tempRole") {
      inputValue = String(value);
      setEmployeeData((prev) => ({
        ...prev,
        role: inputValue,
        tempRole: inputValue,
      }));
    } else if (
      ["department", "shiftTime", "gender", "weekOff"].includes(name)
    ) {
      inputValue = value || "";
      setEmployeeData((prev) => ({
        ...prev,
        [name]: inputValue,
      }));
    } else {
      inputValue = typeof value === "string" ? value : value.target.value;
      setEmployeeData((prev) => ({
        ...prev,
        [name]: inputValue,
      }));
    }

    // Mark field as touched
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));

    // Validate field
    const error = validateField(name, inputValue);
    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  };

  // Add blur handler for validation
  const handleBlur = (name) => {
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));

    const value = employeeData[name];
    const error = validateField(name, value);
    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  };

  // Modify handleSubmit to include validation
  const handleSubmit = async (event) => {
    event.preventDefault();

    // Validate all fields
    const newErrors = {};
    Object.keys(employeeData).forEach((field) => {
      const error = validateField(field, employeeData[field]);
      if (error) newErrors[field] = error;
    });

    // Mark all fields as touched
    const allTouched = Object.keys(employeeData).reduce(
      (acc, field) => ({
        ...acc,
        [field]: true,
      }),
      {}
    );
    setTouched(allTouched);

    // If there are errors, display them and stop submission
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fix the errors before submitting");
      return;
    }

    try {
      // Continue with the rest of the form submission
      const formData = new FormData();
      // Validate required fields
      const requiredFields = [
        "role",
        "department",
        "shiftTime",
        "gender",
        "weekOff",
      ];
      const missingFields = requiredFields.filter(
        (field) => !employeeData[field]
      );

      if (missingFields.length > 0) {
        toast.error(
          `Please fill in required fields: ${missingFields.join(", ")}`
        );
        return;
      }

      // Add non-select fields
      const basicFields = [
        "firstName",
        "lastName",
        "dateOfBirth",
        "email",
        "mobileNo",
        "dateOfHiring",
      ];
      basicFields.forEach((field) => {
        if (employeeData[field]) {
          formData.append(field, employeeData[field]);
        }
      });

      // Add select fields
      formData.append("gender", employeeData.gender);
      formData.append("weekOff", employeeData.weekOff);

      // Handle role, department, and shift data
      try {
        const role = roles.find((r) => r._id === employeeData.role);
        const department = departments.find(
          (d) => d._id === employeeData.department
        );
        const shift = shifts.find((s) => s._id === employeeData.shiftTime);

        if (!role || !department || !shift) {
          throw new Error("Invalid selection for role, department, or shift");
        }

        formData.append(
          "role",
          JSON.stringify({
            _id: role._id,
            role: role.role,
          })
        );

        formData.append(
          "department",
          JSON.stringify({
            _id: department._id,
            name: department.name,
          })
        );

        formData.append(
          "shiftTime",
          JSON.stringify({
            _id: shift._id,
            name: shift.name,
            startTime: shift.startTime,
            endTime: shift.endTime,
          })
        );

        // Handle files
        const avatarFile = fileInputRef.current?.files[0];
        if (avatarFile) {
          formData.append("avatar", avatarFile);
        } else if (avatarSrc) {
          formData.append("existingAvatar", avatarSrc);
        }

        uploadedFiles.forEach((file) => {
          if (file.file) {
            // New files
            formData.append("documents", file.file);
          } else if (file.preview) {
            // Existing files
            formData.append("existingDocuments", file.preview);
          }
        });

        const response = await fetch(
          `/api/employeeManagement${employeeId ? `/${employeeId}` : ""}`,
          {
            method: employeeId ? "PUT" : "POST",
            body: formData,
          }
        );

        const result = await response.json();

        if (response.ok) {
          // Update tempRole to match role after successful save
          setEmployeeData((prev) => ({
            ...prev,
            tempRole: prev.role,
          }));

          toast.success(
            `Employee ${employeeId ? "updated" : "added"} successfully`
          );
          // If employee update/creation was successful, handle role update
          if (employeeId) {
            // Update user role only when editing existing employee
            try {
              const roleUpdateResponse = await fetch(`/api/auth/updateRole`, {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  email: employeeData.email,
                  roleId: employeeData.role,
                }),
              });

              if (!roleUpdateResponse.ok) {
                throw new Error("Failed to update user role");
              }

              // Update both role and tempRole after successful update
              setEmployeeData((prev) => ({
                ...prev,
                role: employeeData.role,
                tempRole: employeeData.role,
              }));

              toast.success("Employee and role updated successfully");
            } catch (error) {
              console.error("Error updating user role:", error);
              toast.error("Employee updated but failed to update role");
            }
          } else {
            // For new employee
            try {
              // Register new user with role
              const registerResponse = await fetch(`/api/auth/register`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  email: employeeData.email,
                  roleId: employeeData.role,
                }),
              });

              const registerResult = await registerResponse.json();

              if (registerResponse.ok) {
                toast.success(registerResult.message); // This will show the success message from the backend
              } else {
                toast.error(
                  registerResult.message || "Failed to create user account"
                );
              }
            } catch (error) {
              console.error("Error creating user account:", error);
              toast.error("Employee added but failed to create user account");
            }
          }

          // Reset form for new employee
          if (!employeeId) {
            setUploadedFiles([]);
            setAvatarSrc("");
            setEmployeeData({
              employeeId: "",
              firstName: "",
              lastName: "",
              gender: "",
              dateOfBirth: "",
              email: "",
              mobileNo: "",
              dateOfHiring: "",
              department: "",
              role: "",
              tempRole: "",
              shiftTime: "",
              weekOff: "",
            });
          }
        } else {
          toast.error(
            `Failed to ${employeeId ? "update" : "add"} employee: ${
              result.message
            }`
          );
        }
      } catch (error) {
        console.error("Error in form submission:", error);
        toast.error(error.message || "An unexpected error occurred");
      }
    } catch (error) {
      console.error("Error in form submission:", error);
      toast.error(error.message || "An unexpected error occurred");
    }
  };

  return (
    <section
      className="p-4 z-0 flex flex-col relative justify-between gap-4 bg-content1 overflow-auto rounded-large shadow-small w-full "
      role="main"
      aria-labelledby="edit-profile-title"
    >
      <h1 className="text-hotel-primary-text text-2xl font-bold mb-4">
        {employeeId ? "Edit Profile" : "Add Profile"}
      </h1>
      <form onSubmit={handleSubmit}>
        <div className="container mx-auto">
          {/* Avatar section - centered above the grid */}
          <div className="flex justify-center mb-6 2xl:w-[84%]">
            <div className="relative inline-block">
              <Avatar
                src={
                  avatarSrc || "https://i.pravatar.cc/150?u=a092581d4ef9026700d"
                }
                className="w-24 h-24 mx-auto"
                onClick={triggerAvatarUpload}
                role="button"
                aria-label="Click to upload profile picture"
                tabIndex={0}
              />
              <div
                className="absolute bottom-0 right-0 bg-primary rounded-full p-1 cursor-pointer"
                onClick={triggerAvatarUpload}
                aria-label="Upload new avatar"
              >
                <Camera className="w-4 h-4 text-white" />
              </div>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleAvatarUpload}
                aria-label="Avatar upload input"
                name="avatar"
              />
            </div>
          </div>

          {/* Form fields in 2 columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                id="employeeIdLabel"
                htmlFor="EmployeeID"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Employee ID
              </label>
              <Input
                id="EmployeeID"
                value={employeeData.employeeId}
                aria-labelledby="employeeIdLabel"
                className="max-w-lg"
                name="employeeId"
                readOnly
              />
            </div>
            <div>
              <label
                id="positionLabel"
                htmlFor="Role"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Role
              </label>
              <Select
                id="Role"
                placeholder="Select Role"
                aria-labelledby="positionLabel"
                className={`max-w-lg ${
                  touched.role && errors.role ? "border-red-500" : ""
                }`}
                name="role"
                selectedKeys={employeeData.role ? [employeeData.role] : []}
                onChange={(e) => handleChange(e.target.value, "role")}
                onBlur={() => handleBlur("role")}
                errorMessage={touched.role && errors.role}
                isInvalid={touched.role && !!errors.role}
              >
                {roles.map((role) => (
                  <SelectItem key={role._id} value={role._id}>
                    {role.role}
                  </SelectItem>
                ))}
              </Select>
            </div>
            <div>
              <label
                id="firstNameLabel"
                htmlFor="Firstname"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                First name
              </label>
              <Input
                id="Firstname"
                placeholder="Enter first name"
                aria-labelledby="firstNameLabel"
                className={`max-w-lg ${
                  touched.firstName && errors.firstName ? "border-red-500" : ""
                }`}
                name="firstName"
                value={employeeData.firstName}
                onChange={(e) => handleChange(e, "firstName")}
                onBlur={() => handleBlur("firstName")}
                errorMessage={touched.firstName && errors.firstName}
                isInvalid={touched.firstName && !!errors.firstName}
              />
            </div>
            <div>
              <label
                id="lastNameLabel"
                htmlFor="LastName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Last Name
              </label>
              <Input
                id="LastName"
                placeholder="Enter last name"
                aria-labelledby="lastNameLabel"
                className={`max-w-lg ${
                  touched.lastName && errors.lastName ? "border-red-500" : ""
                }`}
                name="lastName"
                value={employeeData.lastName}
                onChange={(e) => handleChange(e, "lastName")}
                onBlur={() => handleBlur("lastName")}
                errorMessage={touched.lastName && errors.lastName}
                isInvalid={touched.lastName && !!errors.lastName}
              />
            </div>
            <div>
              <label
                id="genderLabel"
                htmlFor="Gender"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Gender
              </label>
              <Select
                id="Gender"
                aria-labelledby="genderLabel"
                className={`max-w-lg ${
                  touched.gender && errors.gender ? "border-red-500" : ""
                }`}
                name="gender"
                selectedKeys={employeeData.gender ? [employeeData.gender] : []}
                onChange={(e) => handleChange(e.target.value, "gender")}
                onBlur={() => handleBlur("gender")}
                errorMessage={touched.gender && errors.gender}
                isInvalid={touched.gender && !!errors.gender}
              >
                <SelectItem key="male" value="male" aria-label="Male">
                  Male
                </SelectItem>
                <SelectItem key="female" value="female" aria-label="Female">
                  Female
                </SelectItem>
                <SelectItem key="other" value="other" aria-label="Other">
                  Other
                </SelectItem>
              </Select>
            </div>
            <div>
              <label
                id="dateOfBirthLabel"
                htmlFor="DateofBirth"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Date of Birth
              </label>
              <Input
                type="date"
                id="DateofBirth"
                aria-labelledby="dateOfBirthLabel"
                className={`max-w-lg ${
                  touched.dateOfBirth && errors.dateOfBirth
                    ? "border-red-500"
                    : ""
                }`}
                name="dateOfBirth"
                value={employeeData.dateOfBirth}
                onChange={(e) => handleChange(e, "dateOfBirth")}
                onBlur={() => handleBlur("dateOfBirth")}
                errorMessage={touched.dateOfBirth && errors.dateOfBirth}
                isInvalid={touched.dateOfBirth && !!errors.dateOfBirth}
              />
            </div>
            <div role="group" aria-labelledby="emailLabel">
              <label
                id="emailLabel"
                htmlFor="Email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email
              </label>
              <Input
                type="email"
                id="Email"
                placeholder="Enter email"
                aria-required="true"
                aria-labelledby="emailLabel"
                className={`max-w-lg ${
                  touched.email && errors.email ? "border-red-500" : ""
                }`}
                name="email"
                value={employeeData.email}
                onChange={(e) => handleChange(e, "email")}
                onBlur={() => handleBlur("email")}
                errorMessage={touched.email && errors.email}
                isInvalid={touched.email && !!errors.email}
                isDisabled={!!employeeId} // Disable if employeeId exists (editing mode)
                isReadOnly={!!employeeId} // Make read-only if employeeId exists (editing mode)
              />
            </div>
            <div>
              <label
                id="mobileNoLabel"
                htmlFor="MobileNo"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Mobile No
              </label>
              <Input
                id="MobileNo"
                placeholder="Enter mobile number"
                aria-labelledby="mobileNoLabel"
                className={`max-w-lg ${
                  touched.mobileNo && errors.mobileNo ? "border-red-500" : ""
                }`}
                name="mobileNo"
                value={employeeData.mobileNo}
                onChange={(e) => handleChange(e, "mobileNo")}
                onBlur={() => handleBlur("mobileNo")}
                errorMessage={touched.mobileNo && errors.mobileNo}
                isInvalid={touched.mobileNo && !!errors.mobileNo}
              />
            </div>
            <div>
              <label
                id="dateOfHiringLabel"
                htmlFor="DateofHiring"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Date of Hiring
              </label>
              <Input
                type="date"
                id="DateofHiring"
                aria-labelledby="dateOfHiringLabel"
                className={`max-w-lg ${
                  touched.dateOfHiring && errors.dateOfHiring
                    ? "border-red-500"
                    : ""
                }`}
                name="dateOfHiring"
                value={employeeData.dateOfHiring}
                onChange={(e) => handleChange(e, "dateOfHiring")}
                onBlur={() => handleBlur("dateOfHiring")}
                errorMessage={touched.dateOfHiring && errors.dateOfHiring}
                isInvalid={touched.dateOfHiring && !!errors.dateOfHiring}
              />
            </div>
            <div>
              <label
                id="departmentLabel"
                htmlFor="Department"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Department
              </label>
              <Select
                id="Department"
                aria-labelledby="departmentLabel"
                className={`max-w-lg ${
                  touched.department && errors.department
                    ? "border-red-500"
                    : ""
                }`}
                name="department"
                selectedKeys={
                  employeeData.department ? [employeeData.department] : []
                }
                onChange={(e) => handleChange(e.target.value, "department")}
                onBlur={() => handleBlur("department")}
                errorMessage={touched.department && errors.department}
                isInvalid={touched.department && !!errors.department}
              >
                {departments.map((department) => (
                  <SelectItem key={department._id} value={department._id}>
                    {department.name}
                  </SelectItem>
                ))}
              </Select>
            </div>
            <div>
              <label
                id="shiftTimeLabel"
                htmlFor="ShiftTime"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Shift Time
              </label>
              <Select
                id="ShiftTime"
                aria-labelledby="shiftTimeLabel"
                className={`max-w-lg ${
                  touched.shiftTime && errors.shiftTime ? "border-red-500" : ""
                }`}
                name="shiftTime"
                selectedKeys={
                  employeeData.shiftTime ? [employeeData.shiftTime] : []
                }
                onChange={(e) => handleChange(e.target.value, "shiftTime")}
                onBlur={() => handleBlur("shiftTime")}
                errorMessage={touched.shiftTime && errors.shiftTime}
                isInvalid={touched.shiftTime && !!errors.shiftTime}
              >
                {shifts.map((shift) => (
                  <SelectItem key={shift._id} value={shift._id}>
                    {shift.name}
                  </SelectItem>
                ))}
              </Select>
            </div>
            <div>
              <label
                id="weekoffLabel"
                htmlFor="Weekoff"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Week off
              </label>
              <Select
                id="Weekoff"
                aria-labelledby="weekoffLabel"
                className={`max-w-lg ${
                  touched.weekOff && errors.weekOff ? "border-red-500" : ""
                }`}
                name="weekOff"
                selectedKeys={
                  employeeData.weekOff ? [employeeData.weekOff] : []
                }
                onChange={(e) => handleChange(e.target.value, "weekOff")}
                onBlur={() => handleBlur("weekOff")}
                errorMessage={touched.weekOff && errors.weekOff}
                isInvalid={touched.weekOff && !!errors.weekOff}
              >
                <SelectItem key="sunday" value="sunday">
                  Sunday
                </SelectItem>
                <SelectItem key="saturday" value="saturday">
                  Saturday
                </SelectItem>
                <SelectItem key="monday" value="monday">
                  Monday
                </SelectItem>
                <SelectItem key="tuesday" value="tuesday">
                  Tuesday
                </SelectItem>
                <SelectItem key="wednesday" value="wednesday">
                  Wednesday
                </SelectItem>
                <SelectItem key="thursday" value="thursday">
                  Thursday
                </SelectItem>
                <SelectItem key="friday" value="friday">
                  Friday
                </SelectItem>
              </Select>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm font-semibold mb-2">Upload files</p>
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-4 cursor-pointer"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <div className="text-center">
                <Camera className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-1 text-sm text-gray-600">
                  Drag & drop files here, or click to select files
                </p>
                <p className="text-xs text-gray-500">
                  Supported formats: JPEG, PNG, PDF, Word
                </p>
              </div>
              <input
                type="file"
                className="hidden"
                id="file-upload"
                onChange={handleFileUpload}
                multiple
                name="documents"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <div className="mt-4 flex text-sm text-gray-600">
                  <div className="relative cursor-pointer rounded-md bg-white font-medium text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 hover:text-primary-dark">
                    <span>Upload a file</span>
                  </div>
                  <p className="pl-1">or drag and drop</p>
                </div>
              </label>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm font-semibold mb-2">Uploaded</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {uploadedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-gray-100 p-2 rounded mb-2"
                >
                  <Image
                    src={file.preview}
                    alt={file.name}
                    width={40}
                    height={40}
                    className="object-cover rounded"
                  />
                  <div className="flex-1 ml-2">
                    <span>{file.name}</span>
                  </div>
                  <Button
                    size="sm"
                    color="danger"
                    variant="light"
                    onPress={() => removeFile(file.name)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-6 flex justify-center space-x-4">
            <Button className="bg-hotel-primary-red text-white" type="button">
              Cancel
            </Button>
            <Button className="bg-hotel-primary text-white" type="submit">
              Save
            </Button>
          </div>
        </div>
      </form>
    </section>
  );
}
