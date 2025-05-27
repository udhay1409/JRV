"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { ChevronDown, Trash2, PenSquare } from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import Complementary from "./Complimentary.jsx";
import {
  validateGSTNumber,
  validateMobileNumber,
  validateEmail,
  validatePinCode,
  validateRequired,
} from "@/utils/validations";

export default function Inventory() {
  const [activeTab, setActiveTab] = useState("inventory");
  const [formData, setFormData] = useState({
    supplierName: "",
    gstNo: "",
    firstName: "",
    lastName: "",
    mobileNo: "",
    landlineNo: "",
    emailId: "",
    doorNo: "",
    streetName: "",
    pinCode: "",
    district: "",
    state: "",
    country: "",
    categoryName: "",
    subCategoryName: "",
    brandName: "",
  });

  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  const [supplierInput, setSupplierInput] = useState("");
  const [categoryInput, setCategoryInput] = useState("");
  const [subCategoryInput, setSubCategoryInput] = useState("");
  const [brandInput, setBrandInput] = useState("");

  const [showSuppliers, setShowSuppliers] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [showSubCategories, setShowSubCategories] = useState(false);
  const [showBrands, setShowBrands] = useState(false);

  const [isCreatingSupplier, setIsCreatingSupplier] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [isCreatingSubCategory, setIsCreatingSubCategory] = useState(false);
  const [isCreatingBrand, setIsCreatingBrand] = useState(false);

  const [editingSupplier, setEditingSupplier] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingSubCategory, setEditingSubCategory] = useState(null);
  const [editingBrand, setEditingBrand] = useState(null);

  const supplierInputRef = useRef(null);
  const categoryInputRef = useRef(null);
  const subCategoryInputRef = useRef(null);
  const brandInputRef = useRef(null);

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedSubCategories, setSelectedSubCategories] = useState([]);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [isBrandInputActive, setIsBrandInputActive] = useState(false);

  const [errors, setErrors] = useState({
    supplierName: "",
    gstNo: "",
    firstName: "",
    lastName: "",
    mobileNo: "",
    emailId: "",
    pinCode: "",
    district: "",
    state: "",
    country: "",
  });

  const [electricityTypeInput, setElectricityTypeInput] = useState("");
  const [electricityTypes, setElectricityTypes] = useState([]);
  const [showElectricityTypes, setShowElectricityTypes] = useState(false);
  const [isCreatingElectricityType, setIsCreatingElectricityType] =
    useState(false);
  const [editingElectricityType, setEditingElectricityType] = useState(null);
  const electricityTypeInputRef = useRef(null);

  useEffect(() => {
    fetchInventorySettings();
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        supplierInputRef.current &&
        !supplierInputRef.current.contains(event.target)
      ) {
        setShowSuppliers(false);
        setIsCreatingSupplier(false);
      }
      if (
        categoryInputRef.current &&
        !categoryInputRef.current.contains(event.target)
      ) {
        setShowCategories(false);
        setIsCreatingCategory(false);
      }
      if (
        subCategoryInputRef.current &&
        !subCategoryInputRef.current.contains(event.target)
      ) {
        setShowSubCategories(false);
        setIsCreatingSubCategory(false);
      }
      if (
        brandInputRef.current &&
        !brandInputRef.current.contains(event.target)
      ) {
        setShowBrands(false);
        setIsCreatingBrand(false);
      }
      if (
        electricityTypeInputRef.current &&
        !electricityTypeInputRef.current.contains(event.target)
      ) {
        setShowElectricityTypes(false);
        if (!electricityTypeInput.trim()) {
          setIsCreatingElectricityType(false);
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [electricityTypeInput]);

  const fetchInventorySettings = async () => {
    try {
      const response = await axios.get(`/api/settings/inventory`);
      if (response.data.success) {
        const { settings } = response.data;
        setSuppliers(settings.suppliers || []);
        setCategories(settings.categories || []);
        setSubCategories(settings.subCategories || []);
        setBrands(settings.brands || []);
        setElectricityTypes(settings.electricityTypes || []);
      }
    } catch (error) {
      toast.error("Failed to fetch inventory settings");
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCategorySelect = (category, e = null) => {
    // Make event parameter optional
    if (e) {
      e.stopPropagation();
    }
    if (selectedCategory?._id === category._id) {
      setSelectedCategory(null);
      setCategoryInput("");
    } else {
      setSelectedCategory(category);
      setCategoryInput(category.name);
    }
    setSelectedSubCategories([]);
    setSubCategoryInput("");
  };

  const handleSubCategorySelect = (subCategory, e = null) => {
    if (e) {
      e.stopPropagation();
    }

    if (isBrandInputActive) {
      // Single selection for brand context
      setSelectedSubCategories([subCategory]);
      setSubCategoryInput(subCategory.name);
    } else {
      // Multi-select logic for inventory settings
      setSelectedSubCategories((prev) => {
        const isSelected = prev.some((sc) => sc._id === subCategory._id);
        const updatedSelection = isSelected
          ? prev.filter((sc) => sc._id !== subCategory._id)
          : [...prev, subCategory];
        setSubCategoryInput(updatedSelection.map((sc) => sc.name).join(", "));
        return updatedSelection;
      });
    }
  };

  const handleBrandSelect = (brand) => {
    setSelectedBrands((prev) => {
      const isSelected = prev.some((b) => b._id === brand._id);
      if (isSelected) {
        return prev.filter((b) => b._id !== brand._id);
      } else {
        return [...prev, brand];
      }
    });
  };

  const handleSupplierInputChange = (value) => {
    setSupplierInput(value);
    setIsCreatingSupplier(
      !suppliers.some((sup) => sup.name.toLowerCase() === value.toLowerCase())
    );
  };

  const handleCategoryInputChange = (value) => {
    setCategoryInput(value);
    // Only create if the value doesn't match any existing category
    setIsCreatingCategory(
      !categories.some((cat) => cat.name.toLowerCase() === value.toLowerCase())
    );
    // Show categories list when typing
    setShowCategories(true);
    // Clear selection if input doesn't match selected category
    if (selectedCategory && selectedCategory.name !== value) {
      setSelectedCategory(null);
    }
  };

  const handleSubCategoryInputChange = (value) => {
    setSubCategoryInput(value);
    // Only create if the value doesn't match any existing subcategory
    setIsCreatingSubCategory(
      !subCategories.some(
        (sub) => sub.name.toLowerCase() === value.toLowerCase()
      )
    );
    // Show subcategories list when typing
    setShowSubCategories(true);
    // Clear selection if input doesn't match selected subcategory
    if (selectedSubCategories[0] && selectedSubCategories[0].name !== value) {
      setSelectedSubCategories([]);
    }
  };

  const handleBrandInputChange = (value) => {
    setBrandInput(value);
    setIsCreatingBrand(
      !brands.some((brand) => brand.name.toLowerCase() === value.toLowerCase())
    );
  };

  const handleSaveSupplier = async () => {
    if (!supplierInput.trim()) return;

    try {
      if (editingSupplier) {
        const response = await axios.put(`/api/settings/inventory`, {
          type: "supplier",
          id: editingSupplier.id,
          data: {
            name: supplierInput,
            gstNo: formData.gstNo,
            contactPerson: {
              firstName: formData.firstName,
              lastName: formData.lastName,
              mobileNo: formData.mobileNo,
              landlineNo: formData.landlineNo,
              emailId: formData.emailId,
            },
            address: {
              doorNo: formData.doorNo,
              streetName: formData.streetName,
              pinCode: formData.pinCode,
              district: formData.district,
              state: formData.state,
              country: formData.country,
            },
          },
        });
        if (response.data.success) {
          toast.success("Supplier updated successfully");
          setEditingSupplier(null);
        }
      } else {
        const response = await axios.post(`/api/settings/inventory`, {
          type: "supplier",
          data: {
            name: supplierInput,
            gstNo: formData.gstNo,
            contactPerson: {
              firstName: formData.firstName,
              lastName: formData.lastName,
              mobileNo: formData.mobileNo,
              landlineNo: formData.landlineNo,
              emailId: formData.emailId,
            },
            address: {
              doorNo: formData.doorNo,
              streetName: formData.streetName,
              pinCode: formData.pinCode,
              district: formData.district,
              state: formData.state,
              country: formData.country,
            },
          },
        });
        if (response.data.success) {
          toast.success("Supplier added successfully");
        }
      }
      setSupplierInput("");
      resetFormData();
      await fetchInventorySettings();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to save supplier");
    }
  };

  const handleSaveCategory = async () => {
    if (!categoryInput.trim()) return;

    try {
      const categoryData = {
        name: categoryInput,
      };

      if (editingCategory) {
        await axios.put(`/api/settings/inventory`, {
          type: "category",
          id: editingCategory._id,
          data: categoryData,
        });
        setEditingCategory(null);
      } else {
        await axios.post(`/api/settings/inventory`, {
          type: "category",
          data: categoryData,
        });
      }

      toast.success(
        `Category ${editingCategory ? "updated" : "added"} successfully`
      );
      setCategoryInput("");
      await fetchInventorySettings();
    } catch (error) {
      console.error(error);
      toast.error(`Failed to ${editingCategory ? "update" : "add"} category`);
    }
  };

  const handleSaveSubCategory = async () => {
    if (!subCategoryInput.trim() || !selectedCategory) {
      toast.error("Both category and subcategory are required");
      return;
    }

    try {
      const subCategoryData = {
        name: subCategoryInput,
        categoryId: selectedCategory._id,
      };

      if (editingSubCategory) {
        await axios.put(`/api/settings/inventory`, {
          type: "subcategory",
          id: editingSubCategory._id,
          data: subCategoryData,
        });
        setEditingSubCategory(null);
      } else {
        await axios.post(`/api/settings/inventory`, {
          type: "subcategory",
          data: subCategoryData,
        });
      }

      toast.success(
        `Subcategory ${editingSubCategory ? "updated" : "added"} successfully`
      );
      setSubCategoryInput("");
      await fetchInventorySettings();
    } catch (error) {
      console.error(error);
      toast.error(
        `Failed to ${editingSubCategory ? "update" : "add"} subcategory`
      );
    }
  };

  const handleSaveBrand = async () => {
    if (!brandInput.trim() || selectedSubCategories.length !== 1) {
      toast.error("Both a single subcategory and brand name are required");
      return;
    }

    try {
      const brandData = {
        name: brandInput,
        subCategoryId: selectedSubCategories[0]._id, // This is the key change
      };

      if (editingBrand) {
        await axios.put(`/api/settings/inventory`, {
          type: "brand",
          id: editingBrand._id,
          data: brandData,
        });
        setEditingBrand(null);
      } else {
        await axios.post(`/api/settings/inventory`, {
          type: "brand",
          data: brandData,
        });
      }

      toast.success(`Brand ${editingBrand ? "updated" : "added"} successfully`);
      setBrandInput("");
      setSelectedSubCategories([]); // Clear selected subcategory after saving
      await fetchInventorySettings();
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data?.error ||
          `Failed to ${editingBrand ? "update" : "add"} brand`
      );
    }
  };

  const handleDeleteSupplier = async (id) => {
    try {
      const response = await axios.delete(`/api/settings/inventory`, {
        data: {
          type: "supplier",
          id,
        },
      });
      if (response.data.success) {
        toast.success("Supplier deleted successfully");
        await fetchInventorySettings();
      }
    } catch (error) {
      toast.error("Failed to delete supplier");
    }
  };

  const handleDeleteCategory = async (id) => {
    try {
      const response = await axios.delete(`/api/settings/inventory`, {
        data: {
          type: "category",
          id,
        },
      });
      if (response.data.success) {
        toast.success("Category deleted successfully");
        await fetchInventorySettings();
      }
    } catch (error) {
      toast.error("Failed to delete category");
    }
  };

  const handleDeleteSubCategory = async (id) => {
    try {
      const response = await axios.delete(`/api/settings/inventory`, {
        data: {
          type: "subcategory",
          id,
        },
      });
      if (response.data.success) {
        toast.success("Subcategory deleted successfully");
        await fetchInventorySettings();
      }
    } catch (error) {
      toast.error("Failed to delete subcategory");
    }
  };

  const handleDeleteBrand = async (id) => {
    try {
      const response = await axios.delete(`/api/settings/inventory`, {
        data: {
          type: "brand",
          id,
        },
      });
      if (response.data.success) {
        toast.success("Brand deleted successfully");
        await fetchInventorySettings();
      }
    } catch (error) {
      toast.error("Failed to delete brand");
    }
  };

  const validateForm = () => {
    const newErrors = {
      supplierName: validateRequired(supplierInput, "Supplier name"),
      gstNo: validateGSTNumber(formData.gstNo),
      firstName: validateRequired(formData.firstName, "First name"),
      lastName: validateRequired(formData.lastName, "Last name"),
      mobileNo: validateMobileNumber(formData.mobileNo),
      emailId: validateEmail(formData.emailId),
      pinCode: validatePinCode(formData.pinCode),
      district: validateRequired(formData.district, "District"),
      state: validateRequired(formData.state, "State"),
      country: validateRequired(formData.country, "Country"),
    };

    setErrors(newErrors);
    return !Object.values(newErrors).some((error) => error !== "");
  };

  const resetFormData = () => {
    setFormData({
      supplierName: "",
      gstNo: "",
      firstName: "",
      lastName: "",
      mobileNo: "",
      landlineNo: "",
      emailId: "",
      doorNo: "",
      streetName: "",
      pinCode: "",
      district: "",
      state: "",
      country: "",
      categoryName: "",
      subCategoryName: "",
      brandName: "",
    });
    setErrors({});
  };

  const handleSaveSupplierDetails = async () => {
    if (!validateForm()) {
      toast.error("Please fix the validation errors");
      return;
    }

    try {
      const supplierData = {
        name: supplierInput,
        gstNo: formData.gstNo,
        contactPerson: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          mobileNo: formData.mobileNo,
          landlineNo: formData.landlineNo,
          emailId: formData.emailId,
        },
        address: {
          doorNo: formData.doorNo,
          streetName: formData.streetName,
          pinCode: formData.pinCode,
          district: formData.district,
          state: formData.state,
          country: formData.country,
        },
      };

      if (editingSupplier) {
        await axios.put(`/api/settings/inventory`, {
          type: "supplier",
          id: editingSupplier._id,
          data: supplierData,
        });
        setEditingSupplier(null);
      } else {
        await axios.post(`/api/settings/inventory`, {
          type: "supplier",
          data: supplierData,
        });
      }

      toast.success(
        `Supplier ${editingSupplier ? "updated" : "added"} successfully`
      );
      resetFormData();
      setSupplierInput("");
      await fetchInventorySettings();
    } catch (error) {
      toast.error(`Failed to ${editingSupplier ? "update" : "add"} supplier`);
    }
  };

  const handleSaveInventorySettings = async () => {
    try {
      if (categoryInput.trim()) await handleSaveCategory();
      if (subCategoryInput.trim()) await handleSaveSubCategory();
      if (brandInput.trim()) await handleSaveBrand();
      toast.success("Inventory settings saved successfully");
    } catch (error) {
      toast.error("Failed to save inventory settings");
    }
  };

  const handleEditSupplier = (supplier) => {
    setEditingSupplier(supplier);
    setSupplierInput(supplier.name);
    setFormData({
      ...formData,
      gstNo: supplier.gstNo,
      firstName: supplier.contactPerson?.firstName || "",
      lastName: supplier.contactPerson?.lastName || "",
      mobileNo: supplier.contactPerson?.mobileNo || "",
      landlineNo: supplier.contactPerson?.landlineNo || "",
      emailId: supplier.contactPerson?.emailId || "",
      doorNo: supplier.address?.doorNo || "",
      streetName: supplier.address?.streetName || "",
      pinCode: supplier.address?.pinCode || "",
      district: supplier.address?.district || "",
      state: supplier.address?.state || "",
      country: supplier.address?.country || "",
    });
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryInput(category.name);
    if (category.subCategories?.[0]) {
      setSubCategoryInput(category.subCategories[0].name);
    }
    if (category.brands?.[0]) {
      setBrandInput(category.brands[0].name);
    }
  };

  const handleSaveElectricityType = async () => {
    if (!electricityTypeInput.trim()) return;
    try {
      if (editingElectricityType) {
        // Edit
        await axios.put(`/api/settings/inventory`, {
          type: "electricityType",
          id: editingElectricityType._id,
          data: { name: electricityTypeInput },
        });
        toast.success("Type updated successfully");
      } else {
        // Create
        await axios.post(`/api/settings/inventory`, {
          type: "electricityType",
          data: { name: electricityTypeInput },
        });
        toast.success("Type added successfully");
      }
      setElectricityTypeInput("");
      setEditingElectricityType(null);
      setIsCreatingElectricityType(false);
      fetchInventorySettings();
    } catch (error) {
      toast.error("Failed to save type");
    }
  };

  const handleEditElectricityType = (type) => {
    setEditingElectricityType(type);
    setElectricityTypeInput(type.name);
    setIsCreatingElectricityType(false);
    setShowElectricityTypes(false);
  };

  const handleDeleteElectricityType = async (id) => {
    try {
      await axios.delete(`/api/settings/inventory`, {
        data: { type: "electricityType", id },
      });
      toast.success("Type deleted successfully");
      fetchInventorySettings();
    } catch (error) {
      toast.error("Failed to delete type");
    }
  };

  const renderSupplierSection = () => (
    <div ref={supplierInputRef}>
      <label className="block text-sm text-[#4B5563] mb-2">Supplier Name</label>
      <div className="relative">
        <Input
          placeholder="Search or create supplier"
          value={supplierInput}
          onChange={(e) => handleSupplierInputChange(e.target.value)}
          onClick={() => setShowSuppliers(true)}
          isInvalid={!!errors.supplierName}
          errorMessage={errors.supplierName}
          endContent={
            <ChevronDown
              className="w-4 h-4 text-[#70707B] cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setShowSuppliers(!showSuppliers);
              }}
            />
          }
        />
        {showSuppliers && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {suppliers.map((supplier) => (
              <div
                key={supplier._id}
                className="flex justify-between items-center p-2 hover:bg-gray-100"
              >
                <span className="flex-1 px-2">{supplier.name}</span>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    isIconOnly
                    className="bg-transparent hover:bg-gray-200"
                    onPress={() => handleEditSupplier(supplier)}
                  >
                    <PenSquare className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    isIconOnly
                    className="bg-transparent hover:bg-gray-200"
                    onPress={() => handleDeleteSupplier(supplier._id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {isCreatingSupplier && (
        <Button
          className="mt-2 bg-[#00529C] text-white"
          onPress={handleSaveSupplier}
        >
          Create Supplier
        </Button>
      )}
    </div>
  );

  const renderCategorySection = () => (
    <div ref={categoryInputRef}>
      <label className="block text-sm text-[#4B5563] mb-2">Category Name</label>
      <div className="relative">
        <Input
          placeholder="Search or select category"
          value={categoryInput}
          onChange={(e) => handleCategoryInputChange(e.target.value)}
          onClick={() => setShowCategories(true)}
          endContent={<ChevronDown />}
        />
        {showCategories && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {categories
              .filter((category) =>
                category.name
                  .toLowerCase()
                  .includes(categoryInput.toLowerCase())
              )
              .map((category) => (
                <div
                  key={category._id}
                  className={`flex justify-between items-center p-2 hover:bg-gray-100 cursor-pointer ${
                    selectedCategory?._id === category._id ? "bg-blue-100" : ""
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCategorySelect(category, e);
                  }}
                >
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCategory?._id === category._id}
                      onChange={(e) => handleCategorySelect(category, e)}
                      onClick={(e) => e.stopPropagation()}
                      className="form-checkbox h-4 w-4 text-[#00529C]"
                    />
                    <span className="flex-1 px-2">{category.name}</span>
                  </label>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      isIconOnly
                      className="bg-transparent hover:bg-gray-200"
                      onPress={() => {
                        handleEditCategory(category);
                      }}
                    >
                      <PenSquare className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      isIconOnly
                      className="bg-transparent hover:bg-gray-200"
                      onPress={() => {
                        handleDeleteCategory(category._id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
      {isCreatingCategory && (
        <Button
          className="mt-2 bg-[#00529C] text-white"
          onPress={handleSaveCategory}
        >
          Create Category
        </Button>
      )}
    </div>
  );

  const renderSubCategorySection = () => (
    <div ref={subCategoryInputRef}>
      <label className="block text-sm text-[#4B5563] mb-2">
        Sub category Name
      </label>
      <div className="relative">
        <Input
          placeholder="Search or select subcategory"
          value={subCategoryInput}
          onChange={(e) => handleSubCategoryInputChange(e.target.value)}
          onClick={() => setShowSubCategories(true)}
          disabled={!selectedCategory}
          endContent={<ChevronDown />}
        />
        {showSubCategories && selectedCategory && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {subCategories
              .filter(
                (sc) =>
                  sc.categoryId === selectedCategory._id &&
                  sc.name.toLowerCase().includes(subCategoryInput.toLowerCase())
              )
              .map((subCategory) => (
                <div
                  key={subCategory._id}
                  className={`flex justify-between items-center p-2 hover:bg-gray-100 cursor-pointer ${
                    selectedSubCategories.some(
                      (sc) => sc._id === subCategory._id
                    )
                      ? "bg-blue-100"
                      : ""
                  }`}
                >
                  <label className="flex items-center space-x-2 cursor-pointer flex-1">
                    <input
                      type="checkbox"
                      checked={selectedSubCategories.some(
                        (sc) => sc._id === subCategory._id
                      )}
                      onChange={(e) => handleSubCategorySelect(subCategory, e)}
                      className="form-checkbox h-4 w-4 text-[#00529C]"
                    />
                    <span>{subCategory.name}</span>
                  </label>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      isIconOnly
                      className="bg-transparent hover:bg-gray-200"
                      onPress={() => {
                        setEditingSubCategory(subCategory);
                        setSubCategoryInput(subCategory.name);
                      }}
                    >
                      <PenSquare className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      isIconOnly
                      className="bg-transparent hover:bg-gray-200"
                      onPress={() => handleDeleteSubCategory(subCategory._id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
      {isCreatingSubCategory && selectedCategory && (
        <Button
          className="mt-2 bg-[#00529C] text-white"
          onPress={handleSaveSubCategory}
        >
          Create Subcategory
        </Button>
      )}
    </div>
  );

  const renderBrandSection = () => (
    <div ref={brandInputRef}>
      <label className="block text-sm text-[#4B5563] mb-2">Brand Name</label>
      <div className="relative">
        <Input
          placeholder="Search or create brand"
          value={brandInput}
          onChange={(e) => handleBrandInputChange(e.target.value)}
          onClick={() => setShowBrands(true)}
          disabled={selectedSubCategories.length === 0}
          endContent={<ChevronDown />}
        />
        {showBrands && selectedSubCategories.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {brands
              .filter(
                (b) =>
                  selectedSubCategories.some(
                    (sc) => sc._id === b.subCategoryId
                  ) && b.name.toLowerCase().includes(brandInput.toLowerCase())
              )
              .map((brand) => (
                <div
                  key={brand._id}
                  className={`flex justify-between items-center p-2 hover:bg-gray-100 cursor-pointer ${
                    selectedBrands.some((b) => b._id === brand._id)
                      ? "bg-blue-100"
                      : ""
                  }`}
                >
                  <label className="flex items-center space-x-2 cursor-pointer flex-1">
                    <input
                      type="checkbox"
                      checked={selectedBrands.some((b) => b._id === brand._id)}
                      onChange={() => handleBrandSelect(brand)}
                      className="form-checkbox h-4 w-4 text-[#00529C]"
                    />
                    <span>{brand.name}</span>
                  </label>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      isIconOnly
                      className="bg-transparent hover:bg-gray-200"
                      onPress={() => {
                        setEditingBrand(brand);
                        setBrandInput(brand.name);
                      }}
                    >
                      <PenSquare className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      isIconOnly
                      className="bg-transparent hover:bg-gray-200"
                      onPress={() => handleDeleteBrand(brand._id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
      {isCreatingBrand && selectedSubCategories.length > 0 && (
        <Button
          className="mt-2 bg-[#00529C] text-white"
          onPress={handleSaveBrand}
        >
          Create Brand
        </Button>
      )}
      {selectedBrands.length > 0 && (
        <div className="mt-2">
          <p className="text-sm text-[#4B5563]">Selected Brands:</p>
          <div className="flex flex-wrap gap-2 mt-1">
            {selectedBrands.map((brand) => (
              <span
                key={brand._id}
                className="bg-[#E5E7EB] text-[#4B5563] px-2 py-1 rounded-md text-sm"
              >
                {brand.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderElectricityTypeSection = () => (
    <div ref={electricityTypeInputRef}>
      <label className="block text-sm text-[#4B5563] mb-2">
        Electricity / Generator Type
      </label>
      <div className="relative">
        <Input
          placeholder="Create Type"
          value={electricityTypeInput}
          onChange={(e) => {
            setElectricityTypeInput(e.target.value);
            setIsCreatingElectricityType(
              e.target.value.trim() !== "" &&
                !electricityTypes.some(
                  (type) =>
                    type.name.toLowerCase() === e.target.value.toLowerCase()
                ) &&
                !editingElectricityType
            );
            if (e.target.value.trim() !== "") {
              setShowElectricityTypes(true);
            } else {
              setShowElectricityTypes(false);
              setIsCreatingElectricityType(false);
            }
          }}
          onClick={() => {
            if (
              electricityTypeInput.trim() !== "" ||
              electricityTypes.length > 0
            ) {
              setShowElectricityTypes(true);
            }
          }}
          onBlur={() => {
            if (electricityTypeInput.trim() === "") {
              setIsCreatingElectricityType(false);
            }
          }}
          endContent={
            <ChevronDown
              className="w-4 h-4 text-[#70707B] cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                if (electricityTypes.length > 0) {
                  setShowElectricityTypes(!showElectricityTypes);
                } else if (electricityTypeInput.trim() !== "") {
                  setShowElectricityTypes(true);
                }
              }}
            />
          }
        />
        {showElectricityTypes && !editingElectricityType && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {electricityTypes
              .filter((type) =>
                type.name
                  .toLowerCase()
                  .includes(electricityTypeInput.toLowerCase())
              )
              .map((type) => (
                <div
                  key={type._id}
                  className="flex justify-between items-center p-2 hover:bg-gray-100 cursor-pointer"
                >
                  <span
                    className="flex-1 px-2"
                    onClick={() => {
                      setElectricityTypeInput(type.name);
                      setShowElectricityTypes(false);
                    }}
                  >
                    {type.name}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      isIconOnly
                      className="bg-transparent hover:bg-gray-200"
                      onPress={() => handleEditElectricityType(type)}
                    >
                      <PenSquare className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      isIconOnly
                      className="bg-transparent hover:bg-gray-200"
                      onPress={() => handleDeleteElectricityType(type._id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            {electricityTypes.filter((type) =>
              type.name
                .toLowerCase()
                .includes(electricityTypeInput.toLowerCase())
            ).length === 0 &&
              electricityTypeInput.trim() !== "" && (
                <div className="p-2 text-gray-500">No matching types found</div>
              )}
          </div>
        )}
      </div>
      {(isCreatingElectricityType || editingElectricityType) &&
        electricityTypeInput.trim() !== "" && (
          <Button
            className="mt-2 bg-[#00529C] text-white"
            onPress={handleSaveElectricityType}
          >
            {editingElectricityType ? "Update Type" : "Create Type"}
          </Button>
        )}
      {editingElectricityType && (
        <Button
          className="mt-2 ml-2 bg-gray-300 text-gray-800"
          onPress={() => {
            setEditingElectricityType(null);
            setElectricityTypeInput("");
          }}
        >
          Cancel
        </Button>
      )}
    </div>
  );

  return (
    <div className=" mx-auto space-y-8 bg-white rounded-lg p-8 shadow-sm">
      <div className="flex mb-8 border rounded-lg overflow-hidden w-[400px] mx-auto bg-white shadow-sm">
        <button
          className={`flex-1 py-3 text-center font-medium text-sm transition-colors ${
            activeTab === "inventory"
              ? "bg-hotel-primary  text-white"
              : "bg-white text-[#4B5563] hover:bg-gray-50"
          }`}
          onClick={() => setActiveTab("inventory")}
        >
          Inventory
        </button>
        <button
          className={`flex-1 py-3 text-center font-medium text-sm transition-colors ${
            activeTab === "complimentary"
              ? "bg-hotel-primary  text-white"
              : "bg-white text-[#4B5563] hover:bg-gray-50"
          }`}
          onClick={() => setActiveTab("complimentary")}
        >
          Complimentary
        </button>
      </div>

      {activeTab === "inventory" ? (
        <div>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>{renderSupplierSection()}</div>
              <div>
                <label className="block text-sm text-[#4B5563] mb-2">
                  GST No
                </label>
                <Input
                  placeholder="Gst no"
                  value={formData.gstNo}
                  onChange={(e) => handleChange("gstNo", e.target.value)}
                  isInvalid={!!errors.gstNo}
                  errorMessage={errors.gstNo}
                  variant="bordered"
                  radius="sm"
                  classNames={{
                    input: "bg-white text-[#4B5563]",
                    inputWrapper: `border-[#E5E7EB] hover:border-[#00529C] ${
                      errors.gstNo ? "border-red-500" : ""
                    }`,
                  }}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-[#4B5563] mb-2">
                Contact Person
              </label>
              <div className="grid grid-cols-2 gap-6">
                <Input
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={(e) => handleChange("firstName", e.target.value)}
                  isInvalid={!!errors.firstName}
                  errorMessage={errors.firstName}
                  variant="bordered"
                  radius="sm"
                  classNames={{
                    input: "bg-white text-[#4B5563]",
                    inputWrapper: `border-[#E5E7EB] hover:border-[#00529C] ${
                      errors.firstName ? "border-red-500" : ""
                    }`,
                  }}
                />
                <Input
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={(e) => handleChange("lastName", e.target.value)}
                  isInvalid={!!errors.lastName}
                  errorMessage={errors.lastName}
                  variant="bordered"
                  radius="sm"
                  classNames={{
                    input: "bg-white text-[#4B5563]",
                    inputWrapper: `border-[#E5E7EB] hover:border-[#00529C] ${
                      errors.lastName ? "border-red-500" : ""
                    }`,
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div>
                <label className="block text-sm text-[#4B5563] mb-2">
                  Mobile no
                </label>
                <Input
                  placeholder="Mobile no"
                  value={formData.mobileNo}
                  onChange={(e) => handleChange("mobileNo", e.target.value)}
                  isInvalid={!!errors.mobileNo}
                  errorMessage={errors.mobileNo}
                  variant="bordered"
                  radius="sm"
                  classNames={{
                    input: "bg-white text-[#4B5563]",
                    inputWrapper: `border-[#E5E7EB] hover:border-[#00529C] ${
                      errors.mobileNo ? "border-red-500" : ""
                    }`,
                  }}
                />
              </div>
              <div>
                <label className="block text-sm text-[#4B5563] mb-2">
                  Landline No
                </label>
                <Input
                  placeholder="Landline no"
                  value={formData.landlineNo}
                  onChange={(e) => handleChange("landlineNo", e.target.value)}
                  variant="bordered"
                  radius="sm"
                  classNames={{
                    input: "bg-whitetext-[#4B5563]",
                    inputWrapper: "border-[#E5E7EB] hover:border-[#00529C]",
                  }}
                />
              </div>
              <div>
                <label className="block text-sm text-[#4B5563] mb2">
                  Email ID
                </label>
                <Input
                  placeholder="Email Id"
                  value={formData.emailId}
                  onChange={(e) => handleChange("emailId", e.target.value)}
                  isInvalid={!!errors.emailId}
                  errorMessage={errors.emailId}
                  variant="bordered"
                  radius="sm"
                  classNames={{
                    input: "bg-white text-[#4B5563]",
                    inputWrapper: `border-[#E5E7EB] hover:border-[#00529C] ${
                      errors.emailId ? "border-red-500" : ""
                    }`,
                  }}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-[#4B5563] mb-2">
                Address
              </label>
              <div className="grid grid-cols-2 gap-6">
                <Input
                  placeholder="Door No."
                  value={formData.doorNo}
                  onChange={(e) => handleChange("doorNo", e.target.value)}
                  variant="bordered"
                  radius="sm"
                  classNames={{
                    input: "bg-white text-[#4B5563]",
                    inputWrapper: "border-[#E5E7EB] hover:border-[#00529C]",
                  }}
                />

                <Input
                  placeholder="Street Name"
                  value={formData.streetName}
                  onChange={(e) => handleChange("streetName", e.target.value)}
                  variant="bordered"
                  radius="sm"
                  classNames={{
                    input: "bg-white text-[#4B5563]",
                    inputWrapper: "border-[#E5E7EB] hover:border-[#00529C]",
                  }}
                />
              </div>
              <div className="grid grid-cols-2 gap-6 mt-4">
                <Input
                  placeholder="Pin code"
                  value={formData.pinCode}
                  onChange={(e) => handleChange("pinCode", e.target.value)}
                  isInvalid={!!errors.pinCode}
                  errorMessage={errors.pinCode}
                  variant="bordered"
                  radius="sm"
                  classNames={{
                    input: "bg-white text-[#4B5563]",
                    inputWrapper: `border-[#E5E7EB] hover:border-[#00529C] ${
                      errors.pinCode ? "border-red-500" : ""
                    }`,
                  }}
                />
                <Input
                  placeholder="District"
                  value={formData.district}
                  onChange={(e) => handleChange("district", e.target.value)}
                  isInvalid={!!errors.district}
                  errorMessage={errors.district}
                  variant="bordered"
                  radius="sm"
                  classNames={{
                    input: "bg-white text-[#4B5563]",
                    inputWrapper: `border-[#E5E7EB] hover:border-[#00529C] ${
                      errors.district ? "border-red-500" : ""
                    }`,
                  }}
                />
              </div>
              <div className="grid grid-cols-2 gap-6 mt-4">
                <Input
                  placeholder="State"
                  value={formData.state}
                  onChange={(e) => handleChange("state", e.target.value)}
                  isInvalid={!!errors.state}
                  errorMessage={errors.state}
                  variant="bordered"
                  radius="sm"
                  classNames={{
                    input: "bg-white text-[#4B5563]",
                    inputWrapper: `border-[#E5E7EB] hover:border-[#00529C] ${
                      errors.state ? "border-red-500" : ""
                    }`,
                  }}
                />
                <Input
                  placeholder="Country"
                  value={formData.country}
                  onChange={(e) => handleChange("country", e.target.value)}
                  isInvalid={!!errors.country}
                  errorMessage={errors.country}
                  variant="bordered"
                  radius="sm"
                  classNames={{
                    input: "bg-white text-[#4B5563]",
                    inputWrapper: `border-[#E5E7EB] hover:border-[#00529C] ${
                      errors.country ? "border-red-500" : ""
                    }`,
                  }}
                />
              </div>
            </div>

            <div className="flex justify-center pt-4">
              <Button
                color="primary"
                className="bg-hotel-primary px-12 h-11 font-medium"
                radius="full"
                onPress={handleSaveSupplierDetails}
              >
                Save
              </Button>
            </div>
          </div>

          <div className="space-y-6 pt-8 ">
            <div>
              <h2 className="text-xl font-semibold text-[#111827]">
                Inventory Settings
              </h2>
              <p className="text-sm text-[#6B7280] mt-1">
                Manage your inventory categories
              </p>
            </div>

            <div className="space-y-4">
              <div>{renderCategorySection()}</div>
              <div>{renderSubCategorySection()}</div>
              <div>{renderBrandSection()}</div>
              <div>{renderElectricityTypeSection()}</div>
            </div>

            {/* <div className="flex justify-center pt-4">
              <Button
                color="primary"
                className="bg-hotel-primary  px-12 h-11 font-medium"
                radius="full"
                onClick={handleSaveInventorySettings}
              >
                Save
              </Button>
            </div> */}
          </div>
        </div>
      ) : (
        <Complementary />
      )}
    </div>
  );
}