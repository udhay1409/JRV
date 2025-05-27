import { NextResponse } from "next/server";
import { getHotelDatabase } from "../../../../utils/config/hotelConnection";
import InventorySettings from "../../../../utils/model/settings/inventory/inventorySchema.js";
import { getModel } from "../../../../utils/helpers/getModel";

// GET all inventory settings
export async function GET() {
  try {
    await getHotelDatabase();
    const InventoryModel = getModel("InventorySettings", InventorySettings);
    
    const settings = await InventoryModel.findOne({}) || new InventoryModel({});
    if (!Array.isArray(settings.electricityTypes)) settings.electricityTypes = [];
    return NextResponse.json({
      success: true,
      settings: settings || {
        suppliers: [],
        categories: [],
        subCategories: [],
        brands: [],
        electricityTypes: []
      }
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// POST new item (supplier/category/subcategory/brand)
export async function POST(request) {
  try {
    await getHotelDatabase();
    const InventoryModel = getModel("InventorySettings", InventorySettings);
    
    const { type, data } = await request.json();
    let settings = await InventoryModel.findOne({}) || new InventoryModel({});
    if (!Array.isArray(settings.electricityTypes)) settings.electricityTypes = [];
    
    switch (type) {
      case 'supplier':
        settings.suppliers.push(data);
        break;
      case 'category':
        settings.categories.push({ name: data.name });
        break;
      case 'subcategory':
        if (!data.categoryId) throw new Error('Category ID is required');
        settings.subCategories.push({
          name: data.name,
          categoryId: data.categoryId
        });
        break;
      case 'brand':
        if (!data.subCategoryId) throw new Error('Subcategory ID is required');
        settings.brands.push({
          name: data.name,
          subCategoryId: data.subCategoryId
        });
        break;
      case 'electricityType':
        // Prevent duplicate electricityType names (case-insensitive)
        if (settings.electricityTypes.some(type => type.name.toLowerCase() === data.name.toLowerCase())) {
          return NextResponse.json({
            success: false,
            error: 'Electricity/Generator Type with this name already exists.'
          }, { status: 400 });
        }
        settings.electricityTypes.push({ name: data.name });
        break;
      default:
        throw new Error('Invalid type');
    }
    
    await settings.save();
    return NextResponse.json({ success: true, settings }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// PUT update existing item
export async function PUT(request) {
  try {
    await getHotelDatabase();
    const InventoryModel = getModel("InventorySettings", InventorySettings);
    
    const { type, id, data } = await request.json();
    const settings = await InventoryModel.findOne({});
    if (!Array.isArray(settings.electricityTypes)) settings.electricityTypes = [];
    
    if (!settings) {
      return NextResponse.json({
        success: false,
        message: "Settings not found"
      }, { status: 404 });
    }
    
    switch (type) {
      case 'supplier':
        const supplier = settings.suppliers.id(id);
        if (supplier) Object.assign(supplier, data);
        break;
      case 'category':
        const category = settings.categories.id(id);
        if (category) {
          category.name = data.name;
          category.subCategories = data.subCategories || category.subCategories;
          category.brands = data.brands || category.brands;
        }
        break;
      case 'subcategory':
        const categoryForSub = settings.categories.find(c => c.name === data.categoryName);
        if (!categoryForSub) throw new Error('Category not found');
        const subCategory = categoryForSub.subCategories.id(id);
        if (subCategory) subCategory.name = data.name;
        break;
      case 'brand':
        const categoryForBrand = settings.categories.find(c => c.name === data.categoryName);
        if (!categoryForBrand) throw new Error('Category not found');
        const brand = categoryForBrand.brands.id(id);
        if (brand) brand.name = data.name;
        break;
      case 'electricityType':
        // Prevent duplicate electricityType names (case-insensitive) on update
        if (settings.electricityTypes.some(type => type.name.toLowerCase() === data.name.toLowerCase() && type._id.toString() !== id)) {
          return NextResponse.json({
            success: false,
            error: 'Electricity/Generator Type with this name already exists.'
          }, { status: 400 });
        }
        const electricityType = settings.electricityTypes.id(id);
        if (electricityType) electricityType.name = data.name;
        break;
      default:
        throw new Error('Invalid type');
    }
    
    await settings.save();
    return NextResponse.json({ success: true, settings }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// DELETE item
export async function DELETE(request) {
  try {
    await getHotelDatabase();
    const InventoryModel = getModel("InventorySettings", InventorySettings);
    
    const { type, id } = await request.json();
    const settings = await InventoryModel.findOne({});
    if (!Array.isArray(settings.electricityTypes)) settings.electricityTypes = [];
    
    if (!settings) {
      return NextResponse.json({
        success: false,
        message: "Settings not found"
      }, { status: 404 });
    }
    
    switch (type) {
      case 'supplier':
        settings.suppliers.pull(id);
        break;
        
      case 'category':
        // Get all subcategories for this category
        const relatedSubCategories = settings.subCategories.filter(
          sub => sub.categoryId.toString() === id
        );
        
        // Get all subcategory IDs
        const subCategoryIds = relatedSubCategories.map(sub => sub._id.toString());
        
        // Remove related brands
        settings.brands = settings.brands.filter(
          brand => !subCategoryIds.includes(brand.subCategoryId.toString())
        );
        
        // Remove related subcategories
        settings.subCategories = settings.subCategories.filter(
          sub => sub.categoryId.toString() !== id
        );
        
        // Remove the category
        settings.categories.pull(id);
        break;
        
      case 'subcategory':
        // Remove related brands first
        settings.brands = settings.brands.filter(
          brand => brand.subCategoryId.toString() !== id
        );
        
        // Remove the subcategory
        settings.subCategories.pull(id);
        break;
        
      case 'brand':
        settings.brands.pull(id);
        break;
        
      case 'electricityType':
        settings.electricityTypes.pull(id);
        break;
        
      default:
        throw new Error('Invalid type');
    }
    
    await settings.save();
    return NextResponse.json({ success: true, settings }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}