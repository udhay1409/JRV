import ComplementarySettings from '../model/settings/inventory/complementarySchema';
import inventorySchema from '../model/hotelDb/inventory/inventorySchema';
import { getModel } from "./getModel";


async function updateComplementaryInventory( bookingData) {
  try {
    // Register models with their schemas
    const ComplementaryModel =getModel("ComplementarySettings", ComplementarySettings);
    const InventoryModel = getModel("Inventory", inventorySchema);

    // Get complementary settings for each room in the booking
    const complementaryPromises = bookingData.rooms.map(async (room) => {
      const settings = await ComplementaryModel.findOne({
        "items.roomCategory": room._id
      });
      return { room, settings };
    });

    const roomResults = await Promise.all(complementaryPromises);

    // Process each room's complementary items
    for (const { room, settings } of roomResults) {
      if (!settings?.items?.length) {
        console.log(`No complementary items found for room ${room.number}`);
        continue;
      }

      const complementaryItems = settings.items.filter(
        item => item.roomCategory.toString() === room._id.toString()
      );

      // Update inventory for each complementary item
      for (const item of complementaryItems) {
        try {
          const inventoryItem = await InventoryModel.findOne({
            category: item.category,
            subCategory: item.subCategory,
            brandName: item.brandName
          });

          if (!inventoryItem) {
            console.log(`Inventory item not found for ${item.brandName}`);
            continue;
          }

          // Check if we have enough inventory
          if (inventoryItem.quantityInStock < item.quantity) {
            console.log(`Insufficient inventory for ${item.brandName} (${inventoryItem.quantityInStock} < ${item.quantity})`);
            continue;
          }

          // Update inventory quantity
          inventoryItem.quantityInStock -= item.quantity;
          await inventoryItem.save();
          
          // Update complementary item status
          item.lastInventoryUpdate = new Date();
          item.inventoryUpdateStatus = 'completed';
          await settings.save();

          console.log(`Successfully updated inventory for ${item.brandName} in room ${room.number}`);
        } catch (error) {
          console.error(`Error updating inventory for item ${item.brandName}:`, error);
          item.inventoryUpdateStatus = 'failed';
          await settings.save();
        }
      }
    }

    return true;
  } catch (error) {
    console.error("Error updating complementary inventory:", error);
    return false;
  }
}

export { updateComplementaryInventory };
