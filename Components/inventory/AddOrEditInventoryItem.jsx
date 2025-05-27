"use client";
import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { usePagePermission } from "../../hooks/usePagePermission";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Textarea } from "../../Components/ui/textarea"

export default function AddOrEditInventory({ itemId }) {
  const hasAddPermission = usePagePermission("Inventory", "add");
  const hasEditPermission = usePagePermission("Inventory", "edit");

  const initialFormState = useMemo(
    () => ({
      supplierName: "",
      category: "",
      subCategory: "",
      brandName: "",
      model: "",
      price: "0",
      gst: "0",
      quantityInStock: "0",
      status: "",
      lowQuantityAlert: "0",
      addQuantity: "0",
      description: "",
    }),
    []
  );

  const [formData, setFormData] = useState(initialFormState);
  const [isInitialized, setIsInitialized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    suppliers: [],
    categories: [],
    subCategories: [],
    brands: [],
  });

  const [filteredSubCategories, setFilteredSubCategories] = useState([]);
  const [filteredBrands, setFilteredBrands] = useState([]);
  const isEditMode = !!itemId;
  // Check appropriate permission based on mode
  const hasPermission = isEditMode ? hasEditPermission : hasAddPermission;
  // Add loading states
  const [selectsLoading, setSelectsLoading] = useState({
    suppliers: true,
    categories: true,
    subCategories: true,
    brands: true,
  });

  // Add helper functions for filtering related items
  const getRelatedSubCategories = (categoryId) => {
    return settings.subCategories.filter(
      (sub) => sub.categoryId === categoryId
    );
  };

  const getRelatedBrands = (subCategoryId) => {
    return settings.brands.filter(
      (brand) => brand.subCategoryId === subCategoryId
    );
  };

  // Add new function to find ID by name
  const findIdByName = (name, collection) => {
    const item = collection.find((item) => item.name === name);
    return item?._id || "";
  };

  // Update the initialization effect
  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        // First load settings
        const settingsResponse = await axios.get(`/api/settings/inventory`);
        if (!mounted) return;

        if (settingsResponse.data.success) {
          const settingsData = settingsResponse.data.settings;
          setSettings(settingsData);

          // If in edit mode, load item data after settings are available
          if (isEditMode && itemId) {
            const itemResponse = await axios.get(`/api/inventory/${itemId}`);
            if (!mounted) return;

            if (itemResponse.data.success) {
              const item = itemResponse.data.data;

              // Convert names back to IDs for the form
              const supplierID = findIdByName(
                item.supplierName,
                settingsData.suppliers
              );
              const categoryID = findIdByName(
                item.category,
                settingsData.categories
              );
              const subCategoryID = findIdByName(
                item.subCategory,
                settingsData.subCategories
              );
              const brandID = findIdByName(item.brandName, settingsData.brands);

              // Set form data with IDs
              setFormData({
                supplierName: supplierID,
                category: categoryID,
                subCategory: subCategoryID,
                brandName: brandID,
                model: item.model || "",
                price: String(item.price || "0"),
                gst: String(item.gst || "0"),
                quantityInStock: String(item.quantityInStock || "0"),
                status: item.status || "",
                lowQuantityAlert: String(item.lowQuantityAlert || "0"),
                description: item.description || "",
                addQuantity: "0",
              });

              // Update filtered collections
              if (categoryID) {
                const relatedSubs = settingsData.subCategories.filter(
                  (sub) => sub.categoryId === categoryID
                );
                setFilteredSubCategories(relatedSubs);
              }

              if (subCategoryID) {
                const relatedBrands = settingsData.brands.filter(
                  (brand) => brand.subCategoryId === subCategoryID
                );
                setFilteredBrands(relatedBrands);
              }
            }
          }
        }
        setIsInitialized(true);
      } catch (error) {
        if (mounted) {
          toast.error("Failed to initialize form");
        }
      } finally {
        if (mounted) {
          setLoading(false);
          setSelectsLoading({
            suppliers: false,
            categories: false,
            subCategories: false,
            brands: false,
          });
        }
      }
    };

    loadData();
    return () => {
      mounted = false;
    };
  }, [itemId, isEditMode]);

  // Handle form data reset
  useEffect(() => {
    if (!isEditMode && isInitialized) {
      setFormData(initialFormState);
      setFilteredSubCategories([]);
      setFilteredBrands([]);
    }
  }, [isEditMode, isInitialized, initialFormState]);

  // Add effect to handle initial loading of related items
  useEffect(() => {
    if (
      isEditMode &&
      settings.categories.length &&
      settings.subCategories.length &&
      settings.brands.length
    ) {
      // If we have a category, load its subcategories
      if (formData.category) {
        const relatedSubCategories = getRelatedSubCategories(formData.category);
        setFilteredSubCategories(relatedSubCategories);

        // If we have a subcategory, load its brands
        if (formData.subCategory) {
          const relatedBrands = getRelatedBrands(formData.subCategory);
          setFilteredBrands(relatedBrands);
        }
      }
    }
  }, [
    isEditMode,
    settings.categories,
    settings.subCategories,
    settings.brands,
    formData.category,
    formData.subCategory,
  ]);

  // Remove or comment out the old fetchItemData and fetchSettings functions

  // Add ref to track previous add quantity value
  const prevAddQuantityRef = React.useRef("0");

  const handleInputChange = (name, value) => {
    const stringValue = String(value ?? "");

    if (name === "addQuantity") {
      const currentStock = parseInt(formData.quantityInStock) || 0;
      const newAddAmount = parseInt(stringValue) || 0;
      const prevAddAmount = parseInt(prevAddQuantityRef.current) || 0;

      // Calculate the difference and update the stock
      const stockDifference = newAddAmount - prevAddAmount;
      const newStock = Math.max(0, currentStock + stockDifference);

      // Update the ref with the new value
      prevAddQuantityRef.current = String(newAddAmount);

      setFormData((prev) => ({
        ...prev,
        addQuantity: String(newAddAmount),
        quantityInStock: String(newStock),
      }));
    } else if (name === "quantityInStock") {
      // Reset add quantity when directly modifying stock
      prevAddQuantityRef.current = "0";
      setFormData((prev) => ({
        ...prev,
        quantityInStock: String(Math.max(0, parseInt(stringValue) || 0)),
        addQuantity: "0",
      }));
    } else if (name === "supplierName") {
      const selectedSupplier = settings.suppliers.find(
        (s) => s._id === stringValue
      );
      setFormData((prev) => ({
        ...prev,
        supplierName: selectedSupplier?._id ?? "",
        gst: String(selectedSupplier?.gstNo ?? "0"),
      }));
    } else if (name === "category") {
      const relatedSubCategories = getRelatedSubCategories(stringValue);
      setFilteredSubCategories(relatedSubCategories);
      setFilteredBrands([]);

      setFormData((prev) => ({
        ...prev,
        category: stringValue,
        subCategory: "",
        brandName: "",
      }));
    } else if (name === "subCategory") {
      const relatedBrands = getRelatedBrands(stringValue);
      setFilteredBrands(relatedBrands);

      setFormData((prev) => ({
        ...prev,
        subCategory: stringValue,
        brandName: "",
      }));
    } else if (name === "brandName") {
      setFormData((prev) => ({
        ...prev,
        brandName: stringValue,
      }));
    } else if (
      name.includes("quantity") ||
      name === "price" ||
      name === "gst"
    ) {
      const numericValue = parseInt(stringValue) || 0;
      setFormData((prev) => ({
        ...prev,
        [name]: String(numericValue),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: stringValue,
      }));
    }
  };

  // Add effect to reset prevAddQuantityRef when form is reset
  useEffect(() => {
    if (!isEditMode) {
      prevAddQuantityRef.current = "0";
    }
  }, [isEditMode]);

  useEffect(() => {
    if (settings.categories.length && settings.subCategories.length) {
      const category = settings.categories.find(
        (c) => c._id === formData.category
      );
      if (category) {
        const relatedSubCategories = settings.subCategories.filter(
          (sub) => sub.categoryId === category._id
        );
        setFilteredSubCategories(relatedSubCategories);
      }
    }
  }, [settings.categories, settings.subCategories, formData.category]);

  const determineStatus = (quantity, lowAlert) => {
    quantity = parseInt(quantity) || 0;
    lowAlert = parseInt(lowAlert) || 0;

    if (quantity === 0) {
      return "outOfStock";
    } else if (quantity <= lowAlert) {
      return "lowStock";
    }
    return "inStock";
  };

  const getNameFromId = (id, collection) => {
    const item = collection.find((item) => item._id === id);
    return item?.name || "";
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Convert IDs to names before submission
      const submitData = {
        supplierName: getNameFromId(formData.supplierName, settings.suppliers),
        category: getNameFromId(formData.category, settings.categories),
        subCategory: getNameFromId(
          formData.subCategory,
          settings.subCategories
        ),
        brandName: getNameFromId(formData.brandName, settings.brands),
        model: formData.model,
        price: parseInt(formData.price) || 0,
        gst: parseInt(formData.gst) || 0,
        quantityInStock: parseInt(formData.quantityInStock) || 0,
        status: determineStatus(
          formData.quantityInStock,
          formData.lowQuantityAlert
        ),
        lowQuantityAlert: parseInt(formData.lowQuantityAlert) || 0,
        description: formData.description || "",
      };

      const endpoint = isEditMode
        ? `/api/inventory/${itemId}`
        : `/api/inventory`;

      const method = isEditMode ? "put" : "post";

      const response = await axios[method](endpoint, submitData);

      if (response.data.success) {
        toast.success(`Item ${isEditMode ? "updated" : "added"} successfully`);
        if (!isEditMode) {
          setFormData(initialFormState);
        }
      }
    } catch (error) {
      console.error("Submission error:", error);
      toast.error(
        `Failed to ${isEditMode ? "update" : "add"} item: ${error.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  // Update validateSelectedValue to handle both string and object IDs
  const validateSelectedValue = (value, collection) => {
    if (!value || !collection?.length) return false;
    return collection.some(
      (item) =>
        item._id === value ||
        item.id === value ||
        item._id === value?._id ||
        item.id === value?.id
    );
  };

  // Add a new effect to handle filtered collections
  useEffect(() => {
    if (settings.subCategories.length && formData.category) {
      const subs = settings.subCategories.filter(
        (sub) => sub.categoryId === formData.category
      );
      setFilteredSubCategories(subs);
    }
  }, [settings.subCategories, formData.category]);

  useEffect(() => {
    if (settings.brands.length && formData.subCategory) {
      const brands = settings.brands.filter(
        (brand) => brand.subCategoryId === formData.subCategory
      );
      setFilteredBrands(brands);
    }
  }, [settings.brands, formData.subCategory]);

  if (!isInitialized) {
    return <div>Loading...</div>;
  }
  if (!hasPermission) {
    return (
      <div className="p-4 text-center">
        You don&apos;t have permission to {isEditMode ? "edit" : "add"}{" "}
        inventory items
      </div>
    );
  }

  return (
    <section
      className="p-4 z-0 flex flex-col relative justify-between gap-4 bg-content1 overflow-auto rounded-large shadow-small w-full  "
      role="region"
      aria-labelledby="inventory-title"
    >
      <h1
        id="inventory-title"
        className="text-2xl text-hotel-primary-text font-semibold mb-8"
      >
        {isEditMode ? "Edit Item" : "Add New Item"}
      </h1>

      <form
        key={itemId || "new"}
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="space-y-4 container"
        role="form"
        aria-label="Add Inventory Form"
      >
        <div role="group" aria-label="Supplier Information">
          <label className="block text-sm mb-2" htmlFor="supplierName">
            Supplier Name
          </label>
          <Select
            id="supplierName"
            isLoading={selectsLoading.suppliers}
            aria-label="Select Supplier"
            placeholder="Select supplier"
            value={formData.supplierName}
            selectedKeys={
              validateSelectedValue(formData.supplierName, settings.suppliers)
                ? [formData.supplierName]
                : []
            }
            onChange={(e) => handleInputChange("supplierName", e.target.value)}
            className="w-1/2"
            disableAnimation={true}
            classNames={{
              base: "w-1/2",
              trigger:
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              listbox: "focus:outline-none focus-visible:outline-none",
              popover: "focus:outline-none focus-visible:outline-none",
            }}
            popoverProps={{
              shouldBlockScroll: true,
              shouldCloseOnBlur: true,
              placement: "bottom",
              classNames: {
                content: "focus-visible:outline-none",
              },
            }}
          >
            {settings.suppliers.map((supplier) => (
              <SelectItem
                key={supplier._id}
                value={supplier._id}
                className="focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {supplier.name}
              </SelectItem>
            ))}
          </Select>
        </div>
        <div
          className="grid grid-cols-2 gap-x-8 gap-y-4"
          role="group"
          aria-label="Inventory Details"
        >
          <div role="group" aria-label="Category Information">
            <label className="block text-sm mb-2" htmlFor="category">
              Category
            </label>
            <Select
              id="category"
              isLoading={selectsLoading.categories}
              aria-label="Select Category"
              placeholder="Select category"
              value={formData.category}
              selectedKeys={
                validateSelectedValue(formData.category, settings.categories)
                  ? [formData.category]
                  : []
              }
              onChange={(e) => handleInputChange("category", e.target.value)}
              className="w-full"
              disableAnimation={true}
              classNames={{
                base: "w-full",
                trigger:
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                listbox: "focus:outline-none focus-visible:outline-none",
                popover: "focus:outline-none focus-visible:outline-none",
              }}
              popoverProps={{
                shouldBlockScroll: true,
                shouldCloseOnBlur: true,
                placement: "bottom",
                classNames: {
                  content: "focus-visible:outline-none",
                },
              }}
            >
              {settings.categories.map((category) => (
                <SelectItem
                  key={category._id}
                  value={category._id}
                  className="focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {category.name}
                </SelectItem>
              ))}
            </Select>
          </div>

          <div role="group" aria-label="Sub Category Information">
            <label className="block text-sm mb-2" htmlFor="subCategory">
              Sub category
            </label>
            <Select
              id="subCategory"
              isLoading={selectsLoading.subCategories}
              aria-label="Select Sub Category"
              placeholder="Select sub category"
              value={formData.subCategory}
              selectedKeys={
                validateSelectedValue(
                  formData.subCategory,
                  filteredSubCategories
                )
                  ? [formData.subCategory]
                  : []
              }
              onChange={(e) => handleInputChange("subCategory", e.target.value)}
              className="w-full"
              disableAnimation={true}
              isDisabled={!formData.category}
            >
              {filteredSubCategories.map((subCategory) => (
                <SelectItem key={subCategory._id} value={subCategory._id}>
                  {subCategory.name}
                </SelectItem>
              ))}
            </Select>
          </div>

          <div role="group" aria-label="Brand Information">
            <label className="block text-sm mb-2" htmlFor="brandName">
              Brand Name
            </label>
            <Select
              id="brandName"
              isLoading={selectsLoading.brands}
              aria-label="Select Brand"
              placeholder="Select brand"
              value={formData.brandName}
              selectedKeys={
                validateSelectedValue(formData.brandName, filteredBrands)
                  ? [formData.brandName]
                  : []
              }
              onChange={(e) => handleInputChange("brandName", e.target.value)}
              className="w-full"
              disableAnimation={true}
              isDisabled={!formData.subCategory}
            >
              {filteredBrands.map((brand) => (
                <SelectItem key={brand._id} value={brand._id}>
                  {brand.name}
                </SelectItem>
              ))}
            </Select>
          </div>

          <div role="group" aria-label="Model Information">
            <label className="block text-sm mb-2" htmlFor="model">
              Model
            </label>
            <Input
              id="model"
              aria-label="Model Input"
              placeholder="Enter model"
              value={formData.model}
              onChange={(e) => handleInputChange("model", e.target.value)}
              className="w-full"
            />
          </div>

          <div role="group" aria-label="Price Information">
            <label className="block text-sm mb-2" htmlFor="price">
              Price
            </label>
            <Input
              id="price"
              aria-label="Price Input"
              type="number"
              placeholder="Enter price"
              value={formData.price}
              onChange={(e) => handleInputChange("price", e.target.value)}
              className="w-full"
              min="0"
              step="1"
            />
          </div>

          <div role="group" aria-label="GST Information">
            <label className="block text-sm mb-2" htmlFor="gst">
              GST
            </label>
            <Input
              id="gst"
              aria-label="GST Input"
              type="text"
              placeholder="Enter GST"
              value={formData.gst}
              onChange={(e) => handleInputChange("gst", e.target.value)}
              className="w-full"
              readOnly={!!formData.supplierName}
            />
          </div>

          <div role="group" aria-label="Quantity Information">
            <label className="block text-sm mb-2" htmlFor="quantityInStock">
              Quantity in Stock
            </label>
            <Input
              id="quantityInStock"
              aria-label="Quantity Input"
              type="number"
              placeholder="Enter quantity in stock"
              value={formData.quantityInStock}
              onChange={(e) =>
                handleInputChange("quantityInStock", e.target.value)
              }
              className="w-full"
              min="0"
              step="1"
            />
          </div>

          <div role="group" aria-label="Status Information">
            <label className="block text-sm mb-2" htmlFor="status">
              Status
            </label>
            <Input
              id="status"
              aria-label="Status Input"
              value={determineStatus(
                formData.quantityInStock,
                formData.lowQuantityAlert
              )}
              className="w-full"
              readOnly
              disabled
            />
          </div>

          <div role="group" aria-label="Low Quantity Alert Information">
            <label className="block text-sm mb-2" htmlFor="lowQuantityAlert">
              Set Low Quantity Alert
            </label>
            <Input
              id="lowQuantityAlert"
              aria-label="Low Quantity Alert Input"
              type="number"
              placeholder="Enter low quantity alert"
              value={formData.lowQuantityAlert}
              onChange={(e) =>
                handleInputChange("lowQuantityAlert", e.target.value)
              }
              className="w-full"
            />
          </div>

          <div role="group" aria-label="Add Quantity Information">
            <label className="block text-sm mb-2" htmlFor="addQuantity">
              Add Quantity
            </label>
            <Input
              id="addQuantity"
              aria-label="Add Quantity Input"
              type="number"
              placeholder="Enter quantity to add"
              value={formData.addQuantity}
              onChange={(e) => handleInputChange("addQuantity", e.target.value)}
              className="w-full"
              min="0"
              step="1"
            />
          </div>
          <div
            className="mt-6"
            role="group"
            aria-label="Description Information"
          >
            <label className="block text-sm mb-2" htmlFor="description">
              Description
            </label>
            <Textarea
              id="description"
              aria-label="Description Input"
              placeholder="Enter description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              className="w-full"
              rows={4}
            />
          </div>
        </div>

        <div
          className="flex justify-center gap-4 "
          role="group"
          aria-label="Form Actions"
        >
          <Button
            type="button"
            className="px-12 bg-hotel-primary-red text-white mt-10"
            aria-label="Cancel Form"
            onFocus={(e) =>
              e.currentTarget.setAttribute("data-focused", "true")
            }
            onBlur={(e) => e.currentTarget.removeAttribute("data-focused")}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="px-12 bg-hotel-primary text-white mt-10"
            isLoading={loading}
            aria-label="Save Form"
            onFocus={(e) =>
              e.currentTarget.setAttribute("data-focused", "true")
            }
            onBlur={(e) => e.currentTarget.removeAttribute("data-focused")}
          >
            {loading ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
    </section>
  );
}
