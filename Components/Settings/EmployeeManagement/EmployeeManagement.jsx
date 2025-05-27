"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { ChevronDown, Trash2, PenSquare } from "lucide-react";

const generateTimeOptions = () => {
  const options = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const time = `${hour.toString().padStart(2, "0")}:${minute
        .toString()
        .padStart(2, "0")}`;
      options.push({ value: time, label: time });
    }
  }
  return options;
};

const timeOptions = generateTimeOptions();

export default function EmployeeManagement() {
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [shifts, setShifts] = useState([]);
  const [newShift, setNewShift] = useState({
    name: "",
    startTime: "",
    endTime: "",
  });
  const [departmentInput, setDepartmentInput] = useState("");
  const [isCreatingDepartment, setIsCreatingDepartment] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [editingShift, setEditingShift] = useState(null);
  const [showDepartments, setShowDepartments] = useState(false); // Update 1
  const departmentInputRef = useRef(null);
  const [filteredDepartments, setFilteredDepartments] = useState([]);

  useEffect(() => {
    fetchDepartments();
    fetchShifts();
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        departmentInputRef.current &&
        !departmentInputRef.current.contains(event.target)
      ) {
        setIsCreatingDepartment(false);
        setShowDepartments(false); // Update 4
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchDepartments = async () => {
    const response = await fetch(
      `/api/settings/employeeManagement/departments`
    );
    const data = await response.json();
    if (data.success) {
      setDepartments(data.departments);
    }
  };

  const fetchShifts = async () => {
    const response = await fetch(`/api/settings/employeeManagement/shifts`);
    const data = await response.json();
    if (data.success) {
      setShifts(data.shifts);
    }
  };

  const handleSaveShift = async () => {
    const method = editingShift ? "PUT" : "POST";
    const body = editingShift
      ? { ...newShift, id: editingShift._id }
      : { ...newShift, department: selectedDepartment };

    const response = await fetch(`/api/settings/employeeManagement/shifts`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (data.success) {
      fetchShifts();
      setNewShift({ name: "", startTime: "", endTime: "" });
      setEditingShift(null);
    }
  };

  const handleDeleteShift = async (id) => {
    const response = await fetch(`/api/settings/employeeManagement/shifts`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = await response.json();
    if (data.success) {
      fetchShifts();
    }
  };

  const handleDepartmentInputChange = (value) => {
    setDepartmentInput(value);

    // Filter departments based on input
    const filtered = departments.filter((dept) =>
      dept.name.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredDepartments(filtered);

    const matchingDepartment = departments.find(
      (dept) => dept.name.toLowerCase() === value.toLowerCase()
    );
    if (matchingDepartment) {
      setSelectedDepartment(matchingDepartment._id);
      setIsCreatingDepartment(false);
    } else {
      setSelectedDepartment("");
      setIsCreatingDepartment(true);
    }
  };

  useEffect(() => {
    setFilteredDepartments(departments);
  }, [departments]);

  const handleCreateDepartment = async () => {
    const response = await fetch(
      `/api/settings/employeeManagement/departments`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: departmentInput }),
      }
    );
    const data = await response.json();
    if (data.success) {
      fetchDepartments();
      setSelectedDepartment(data.department._id);
      setIsCreatingDepartment(false);
    }
  };

  const handleEditDepartment = async (id, newName) => {
    const response = await fetch(
      `/api/settings/employeeManagement/departments`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name: newName }),
      }
    );
    const data = await response.json();
    if (data.success) {
      fetchDepartments();
      setDepartmentInput("");
      setEditingDepartment(null);
    }
  };

  const handleDeleteDepartment = async (id) => {
    const response = await fetch(
      `/api/settings/employeeManagement/departments`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      }
    );
    const data = await response.json();
    if (data.success) {
      fetchDepartments();
      if (selectedDepartment === id) {
        setSelectedDepartment("");
        setDepartmentInput("");
      }
    }
  };

  const handleEditShift = (shift) => {
    setEditingShift(shift);
    setNewShift({
      name: shift.name,
      startTime: shift.startTime,
      endTime: shift.endTime,
    });
  };

  return (
    <div className=" mx-auto space-y-8 bg-white rounded-lg p-8 shadow-sm min-h-[811px]">
      <div className="space-y-8">
        <div className="flex items-center" ref={departmentInputRef}>
          <label
            htmlFor="department-input"
            className="block text-[15px] font-medium text-[#111111] mb-2 w-1/3 items-center mt-2"
          >
            Department
          </label>
          <div className="relative w-1/3">
            <Input
              id="department-input"
              placeholder="Select or create department"
              value={departmentInput}
              onChange={(e) => handleDepartmentInputChange(e.target.value)}
              className="w-full"
              onClick={() => setShowDepartments(true)} // Update 2
              endContent={
                <ChevronDown
                  className={`w-4 h-4 text-[#70707B] cursor-pointer transition-transform duration-200 ${
                    showDepartments ? "rotate-180" : ""
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDepartments(!showDepartments); // Update 2
                  }}
                />
              }
            />
            {showDepartments && filteredDepartments.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-[240px] overflow-y-auto">
                {filteredDepartments.map((dept) => (
                  <div
                    key={dept._id}
                    className="flex justify-between items-center p-2 hover:bg-gray-50 transition-colors duration-150 cursor-pointer border-b border-gray-100 last:border-b-0"
                  >
                    {editingDepartment === dept._id ? (
                      <Input
                        value={departmentInput}
                        onChange={(e) => setDepartmentInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            handleEditDepartment(dept._id, departmentInput);
                            setEditingDepartment(null);
                            setShowDepartments(false);
                          }
                        }}
                        className="w-2/3"
                        autoFocus
                      />
                    ) : (
                      <span
                        className="flex-1 px-2 py-1 hover:bg-gray-100 rounded"
                        onClick={() => {
                          setDepartmentInput(dept.name);
                          setSelectedDepartment(dept._id);
                          setShowDepartments(false);
                        }}
                      >
                        {dept.name}
                      </span>
                    )}
                    <div className="flex items-center">
                      <Button
                        size="sm"
                        isIconOnly
                        className="bg-transparent hover:bg-gray-100"
                        onPress={() => {
                          setEditingDepartment(dept._id);
                          setDepartmentInput(dept.name);
                        }}
                      >
                        <PenSquare className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        isIconOnly
                        className="bg-transparent hover:bg-gray-100"
                        onPress={() => {
                          handleDeleteDepartment(dept._id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {showDepartments &&
              filteredDepartments.length === 0 &&
              departmentInput && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-2 text-gray-500">
                  No departments found. Type to create new.
                </div>
              )}
          </div>
          {(isCreatingDepartment || editingDepartment) && (
            <Button
              className="ml-2 bg-hotel-primary  text-white font-medium px-4 h-[42px] rounded-lg"
              onClick={() => {
                if (editingDepartment) {
                  handleEditDepartment(editingDepartment, departmentInput);
                  setEditingDepartment(null);
                } else {
                  handleCreateDepartment();
                }
              }}
            >
              {editingDepartment ? "Update" : "Create"}
            </Button>
          )}
        </div>

        <div>
          <h2 className="text-[15px] font-medium text-[#111111] mb-6">
            Working Shifts
          </h2>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div>
              <label
                htmlFor="shift-name"
                className="block text-[15px] font-medium text-[#111111] mb-2"
              >
                Shift Name
              </label>
              <Input
                id="shift-name"
                placeholder="Shift Name"
                value={newShift.name}
                onChange={(e) =>
                  setNewShift({ ...newShift, name: e.target.value })
                }
                classNames={{
                  base: "h-[42px]",
                  mainWrapper: "h-[42px]",
                  input: "text-[14px]",
                  inputWrapper:
                    "h-[42px] bg-white shadow-none border-1 border-[#E4E4E7] hover:border-[#E4E4E7] px-3",
                }}
              />
            </div>
            <div>
              <label
                htmlFor="start-time"
                className="block text-[15px] font-medium text-[#111111] mb-2"
              >
                Shift Start Time
              </label>
              <Dropdown>
                <DropdownTrigger>
                  <Input
                    id="start-time"
                    placeholder="Start Time"
                    value={newShift.startTime}
                    readOnly
                    className="w-full"
                    endContent={
                      <ChevronDown className="w-4 h-4 text-[#70707B]" />
                    }
                  />
                </DropdownTrigger>
                <DropdownMenu
                  aria-label="Start Time"
                  className="max-h-[300px] overflow-y-auto"
                  items={timeOptions}
                >
                  {(item) => (
                    <DropdownItem
                      key={item.value}
                      onPress={() =>
                        setNewShift({ ...newShift, startTime: item.value })
                      }
                    >
                      {item.label}
                    </DropdownItem>
                  )}
                </DropdownMenu>
              </Dropdown>
            </div>
            <div>
              <label
                htmlFor="end-time"
                className="block text-[15px] font-medium text-[#111111] mb-2"
              >
                Shift End Time
              </label>
              <Dropdown>
                <DropdownTrigger>
                  <Input
                    id="end-time"
                    placeholder="End Time"
                    value={newShift.endTime}
                    readOnly
                    className="w-full"
                    endContent={
                      <ChevronDown className="w-4 h-4 text-[#70707B]" />
                    }
                  />
                </DropdownTrigger>
                <DropdownMenu
                  aria-label="End Time"
                  className="max-h-[300px] overflow-y-auto"
                  items={timeOptions}
                >
                  {(item) => (
                    <DropdownItem
                      key={item.value}
                      onPress={() =>
                        setNewShift({ ...newShift, endTime: item.value })
                      }
                    >
                      {item.label}
                    </DropdownItem>
                  )}
                </DropdownMenu>
              </Dropdown>
            </div>
          </div>
          <div className="flex justify-center">
            <Button
              className="bg-hotel-primary text-lg text-white font-medium w-[180px] px-12 h-[42px] rounded-lg"
              onClick={handleSaveShift}
            >
              {editingShift ? "Update" : "Save"}
            </Button>
          </div>
        </div>

        <div className="bg-[#F9FAFB] rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E4E4E7]">
                <th className="text-left py-4 px-6 text-[14px] font-medium text-[#111111]">
                  Shift Name
                </th>
                <th className="text-left py-4 px-6 text-[14px] font-medium text-[#111111]">
                  Shift Timings
                </th>
                <th className="text-right py-4 px-6 text-[14px] font-medium text-[#111111]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {shifts.map((shift, index) => (
                <tr
                  key={index}
                  className="border-b border-[#E4E4E7] last:border-0"
                >
                  <td className="py-4 px-6 text-[14px] text-[#111111]">
                    {shift.name}
                  </td>
                  <td className="py-4 px-6 text-[14px] text-[#111111]">
                    {shift.startTime} - {shift.endTime}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button
                      className="text-[#70707B] hover:text-red-500 p-1"
                      onClick={() => handleDeleteShift(shift._id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      className="text-[#70707B] hover:text-blue-500 p-1 ml-2"
                      onClick={() => handleEditShift(shift)}
                    >
                      <PenSquare className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
