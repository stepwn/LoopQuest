const MAX_INVENTORY_SLOTS = 99;

class Inventory {
  constructor() {
    this.slots = [];
  }

  // Add an item to the inventory
  addItem(item) {
    // Check if there is an available slot
    if (this.slots.length >= MAX_INVENTORY_SLOTS) {
      console.log("Inventory is full");
      return;
    }

    // Validate item type or any other constraints
    //console.log(item);
    // Add the item to the inventory slots
    this.slots.push(item);
  }

  // Remove an item from the inventory
  removeItem(item) {
    const index = this.slots.indexOf(item);
    if (index !== -1) {
      this.slots.splice(index, 1);
    }
  }

  // Update the properties of an item in the inventory
  updateItem(item, properties) {
    // Find the item in the inventory slots
    const index = this.slots.indexOf(item);
    if (index !== -1) {
      // Update the item properties
      Object.assign(this.slots[index], properties);
    }
  }

  // Other inventory management methods...

  // Server-side validations and operations for inventory management
}
module.exports = Inventory;