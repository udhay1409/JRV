import React, { useState, useEffect } from "react";
import { Select, SelectItem } from "@heroui/select";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Trash2, PenSquare } from "lucide-react";
import { toast } from "react-toastify";
import axios from "axios";

const ComplimentarySettings = () => {
  // Add editMode state
  const [editMode, setEditMode] = useState(false);
  const [editItemId, setEditItemId] = useState(null);

  const [loading, setLoading] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [inventoryData, setInventoryData] = useState([]);
  const [formRows, setFormRows] = useState([
    {
      id: 1,
      roomCategory: "",
      category: "",
      subCategory: "",
      brandName: "",
      quantity: 1,
    },
  ]);
  const [tableData, setTableData] = useState([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);

      // Using Promise.all to fetch data concurrently
      const [roomsResponse, inventoryResponse, complementaryResponse] =
        await Promise.all([
          axios.get(`/api/rooms`),
          axios.get(`/api/inventory`),
          axios.get(`/api/settings/inventory/complementary`),
        ]);

      if (roomsResponse.data.success) {
        setRooms(roomsResponse.data.rooms);
      }

      if (inventoryResponse.data.success) {
        setInventoryData(inventoryResponse.data.data);
      }

      if (complementaryResponse.data.success) {
        setTableData(complementaryResponse.data.settings?.items || []);
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to fetch initial data"
      );
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Get unique categories from inventory
  const categories = [...new Set(inventoryData.map((item) => item.category))];

  // Get subcategories for selected category
  const getSubcategories = (category) => {
    return [
      ...new Set(
        inventoryData
          .filter((item) => item.category === category)
          .map((item) => item.subCategory)
      ),
    ];
  };

  // Get brands for selected subcategory
  const getBrands = (category, subCategory) => {
    return inventoryData.filter(
      (item) => item.category === category && item.subCategory === subCategory
    );
  };

  const handleInputChange = (index, field, value) => {
    const newFormRows = [...formRows];
    const selectedValue = value.target?.value || value;

    newFormRows[index] = {
      ...newFormRows[index],
      [field]: selectedValue,
    };

    // Reset dependent fields when category changes
    if (field === "category") {
      newFormRows[index].subCategory = "";
      newFormRows[index].brandName = "";
    }
    // Reset brand when subcategory changes
    if (field === "subCategory") {
      newFormRows[index].brandName = "";
    }

    setFormRows(newFormRows);
  };

  const handleRoomCategoryChange = (value) => {
    const newFormRows = [...formRows];
    newFormRows[0] = {
      ...newFormRows[0],
      roomCategory: value, // Now sending room ID instead of name
    };
    setFormRows(newFormRows);
  };

  const resetForm = () => {
    setFormRows([
      {
        id: 1,
        roomCategory: "",
        category: "",
        subCategory: "",
        brandName: "",
        quantity: 1,
      },
    ]);
    setEditMode(false);
    setEditItemId(null);
  };

  // Add handleEditClick function
  const handleEditClick = (item) => {
    setFormRows([
      {
        id: 1,
        roomCategory: item.roomCategory._id, // Use the room ID
        category: item.category,
        subCategory: item.subCategory,
        brandName: item.brandName,
        quantity: item.quantity,
      },
    ]);
    setEditMode(true);
    setEditItemId(item._id);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const currentRow = formRows[0];

      if (
        !currentRow.roomCategory ||
        !currentRow.category ||
        !currentRow.subCategory ||
        !currentRow.brandName ||
        !currentRow.quantity
      ) {
        toast.error("Please fill in all required fields");
        return;
      }

      const payload = {
        roomCategory: currentRow.roomCategory,
        category: currentRow.category,
        subCategory: currentRow.subCategory,
        brandName: currentRow.brandName,
        quantity: currentRow.quantity,
      };

      let response;

      if (editMode) {
        response = await axios.put(`/api/settings/inventory/complementary`, {
          id: editItemId,
          data: payload,
        });
      } else {
        response = await axios.post(
          `/api/settings/inventory/complementary`,
          payload
        );
      }

      if (response.data.success) {
        toast.success(
          `Settings ${editMode ? "updated" : "saved"} successfully`
        );
        resetForm();
        await fetchInitialData();
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          `Failed to ${editMode ? "update" : "save"} settings`
      );
      console.error("Save error:", error);
    } finally {
      setLoading(false);
    }
  };

  const addNewRow = () => {
    setFormRows([...formRows, { id: formRows.length + 1, quantity: 1 }]);
  };

  const handleQuantityChange = (index, value) => {
    const newFormRows = [...formRows];
    newFormRows[index] = {
      ...newFormRows[index],
      quantity: Math.max(1, parseInt(value) || 1), // Ensure quantity is at least 1
    };
    setFormRows(newFormRows);
  };

  const handleDelete = async (itemId) => {
    try {
      setLoading(true);
      const response = await axios.delete(
        `/api/settings/inventory/complementary`,
        {
          data: { id: itemId },
        }
      );

      if (response.data.success) {
        toast.success("Item deleted successfully");
        await fetchInitialData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete item");
      console.error("Delete error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Add this function for handling edit

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header Section */}
      <div className="mb-8 border-b border-gray-200 pb-5">
        <h2 className="text-2xl font-semibold text-[#111827]">
          Complimentary Settings
        </h2>
        <p className="text-sm text-[#6B7280] mt-1">
          Configure complimentary items for different room categories
        </p>
      </div>

      {/* Main Form Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="space-y-6">
          {/* Room Category Selection */}
          <div className="max-w-md">
            <label
              className="block text-sm font-medium text-[#4B5563] mb-2"
              id="room-category-label"
            >
              Room Category
              <span className="text-red-500 ml-1">*</span>
            </label>
            <Select
              placeholder="Select Room"
              variant="bordered"
              radius="sm"
              aria-labelledby="room-category-label"
              aria-required="true"
              selectedKeys={
                formRows[0].roomCategory ? [formRows[0].roomCategory] : []
              }
              onChange={(e) => handleRoomCategoryChange(e.target.value)}
              isDisabled={loading}
              classNames={{
                base: "w-full",
                trigger:
                  "h-11 bg-white border-[#E5E7EB] data-[hover=true]:border-[#00529C]",
                value: "text-[#4B5563]",
                label: "text-[#4B5563]",
                popover: "z-[1000]", // Ensure popover is always on top
              }}
            >
              {rooms.map((room) => (
                <SelectItem key={room._id} value={room._id}>
                  {room.name}
                </SelectItem>
              ))}
            </Select>
          </div>

          {/* Complementary Items Form */}
          {formRows.map((row, index) => (
            <div
              key={row.id}
              className="bg-gray-50 rounded-lg p-4 border border-gray-100"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label
                    className="block text-sm font-medium text-[#4B5563] mb-2"
                    id={`category-label-${index}`}
                  >
                    Category
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <Select
                    placeholder="Select Category"
                    variant="bordered"
                    radius="sm"
                    selectedKeys={row.category ? [row.category] : []}
                    onChange={(e) => handleInputChange(index, "category", e)}
                    aria-labelledby={`category-label-${index}`}
                    aria-required="true"
                    isDisabled={loading}
                    classNames={{
                      base: "w-full",
                      trigger:
                        "h-11 bg-white border-[#E5E7EB] data-[hover=true]:border-[#00529C]",
                      value: "text-[#4B5563]",
                      label: "text-[#4B5563]",
                      popover: "z-[1000]",
                    }}
                  >
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </Select>
                </div>

                <div>
                  <label
                    className="block text-sm font-medium text-[#4B5563] mb-2"
                    id={`subcategory-label-${index}`}
                  >
                    Sub Category
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <Select
                    placeholder="Select Sub Category"
                    variant="bordered"
                    radius="sm"
                    selectedKeys={row.subCategory ? [row.subCategory] : []}
                    onChange={(e) => handleInputChange(index, "subCategory", e)}
                    aria-labelledby={`subcategory-label-${index}`}
                    aria-required="true"
                    aria-disabled={!row.category || loading}
                    isDisabled={!row.category || loading}
                    classNames={{
                      base: "w-full",
                      trigger:
                        "h-11 bg-white border-[#E5E7EB] data-[hover=true]:border-[#00529C]",
                      value: "text-[#4B5563]",
                      label: "text-[#4B5563]",
                      popover: "z-[1000]",
                    }}
                  >
                    {row.category &&
                      getSubcategories(row.category).map((subCategory) => (
                        <SelectItem key={subCategory} value={subCategory}>
                          {subCategory}
                        </SelectItem>
                      ))}
                  </Select>
                </div>

                <div>
                  <label
                    className="block text-sm font-medium text-[#4B5563] mb-2"
                    id={`brand-label-${index}`}
                  >
                    Brand
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <Select
                    placeholder="Select Brand"
                    variant="bordered"
                    radius="sm"
                    selectedKeys={row.brandName ? [row.brandName] : []}
                    onChange={(e) => handleInputChange(index, "brandName", e)}
                    aria-labelledby={`brand-label-${index}`}
                    aria-required="true"
                    aria-disabled={!row.subCategory || loading}
                    isDisabled={!row.subCategory || loading}
                    classNames={{
                      base: "w-full",
                      trigger:
                        "h-11 bg-white border-[#E5E7EB] data-[hover=true]:border-[#00529C]",
                      value: "text-[#4B5563]",
                      label: "text-[#4B5563]",
                      popover: "z-[1000]",
                    }}
                  >
                    {row.category &&
                      row.subCategory &&
                      getBrands(row.category, row.subCategory).map((brand) => (
                        <SelectItem
                          key={brand.brandName}
                          value={brand.brandName}
                        >
                          {brand.brandName}
                        </SelectItem>
                      ))}
                  </Select>
                </div>

                <div>
                  <label
                    className="block text-sm font-medium text-[#4B5563] mb-2"
                    id={`quantity-label-${index}`}
                  >
                    Quantity
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="1"
                      value={row.quantity}
                      onChange={(e) =>
                        handleQuantityChange(index, e.target.value)
                      }
                      aria-labelledby={`quantity-label-${index}`}
                      aria-required="true"
                      variant="bordered"
                      radius="sm"
                      classNames={{
                        input: "bg-white text-[#4B5563]",
                        inputWrapper:
                          "h-11 border-[#E5E7EB] data-[hover=true]:border-[#00529C]",
                      }}
                    />
                    {index === formRows.length - 1 && (
                      <Button
                        onPress={addNewRow}
                        isIconOnly
                        className="bg-hotel-primary text-white h-11 w-11"
                        radius="sm"
                        aria-label="Add new row"
                      >
                        +
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-6 border-t border-gray-100">
            <Button
              variant="bordered"
              radius="full"
              className="h-11 px-6 font-medium border-[#E5E7EB] text-[#4B5563]"
              isDisabled={loading}
              aria-label="Reset form"
              onPress={resetForm}
            >
              {editMode ? "Cancel" : "Reset"}
            </Button>
            <Button
              color="primary"
              className="h-11 px-6 font-medium bg-hotel-primary "
              radius="full"
              isLoading={loading}
              aria-label="Save changes"
              onPress={handleSave}
            >
              {editMode ? "Update" : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6">
          <h3 className="text-lg font-medium text-[#111827] mb-4">
            Configured Items
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full" role="grid">
              <thead>
                <tr className="bg-gray-50">
                  <th className="py-3 px-4 text-sm font-medium text-[#4B5563] text-left">
                    Room Category
                  </th>
                  <th className="py-3 px-4 text-sm font-medium text-[#4B5563] text-left">
                    Category
                  </th>
                  <th className="py-3 px-4 text-sm font-medium text-[#4B5563] text-left">
                    Sub Category
                  </th>
                  <th className="py-3 px-4 text-sm font-medium text-[#4B5563] text-left">
                    Brand
                  </th>
                  <th className="py-3 px-4 text-sm font-medium text-[#4B5563] text-left">
                    Quantity
                  </th>
                  <th className="py-3 px-4 text-sm font-medium text-[#4B5563] text-left">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tableData.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="py-4 px-4 text-sm text-[#4B5563]">
                      {item.roomCategory?.name || "Unknown Room"}
                    </td>
                    <td className="py-4 px-4 text-sm text-[#4B5563]">
                      {item.category}
                    </td>
                    <td className="py-4 px-4 text-sm text-[#4B5563]">
                      {item.subCategory}
                    </td>
                    <td className="py-4 px-4 text-sm text-[#4B5563]">
                      {item.brandName}
                    </td>
                    <td className="py-4 px-4 text-sm text-[#4B5563]">
                      {item.quantity}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex gap-3">
                        <Button
                          isIconOnly
                          variant="light"
                          className="text-red-500 hover:text-red-600"
                          aria-label={`Delete ${item.brandName} from ${item.roomCategory?.name}`}
                          onPress={() => handleDelete(item._id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <Button
                          isIconOnly
                          variant="light"
                          className="text-[#00529C] hover:text-[#0063BC]"
                          aria-label={`Edit ${item.brandName} from ${item.roomCategory?.name}`}
                          onPress={() => handleEditClick(item)}
                        >
                          <PenSquare className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplimentarySettings;
