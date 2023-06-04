define(['jquery'], function($) {
    const MAX_INVENTORY_SLOTS = 99;
  
    class Inventory {
      constructor(player) {
        this.slots = [];
        this.player = player;
        this.currentPage = 1;
        this.previousButton = document.getElementById('invprevious');
        this.nextButton = document.getElementById('invnext');
        this.invPage = document.getElementById('invPage');
        this.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
      this.previousButton.addEventListener('click', () => {
        this.changePage(this.currentPage - 1);
      });
  
      this.nextButton.addEventListener('click', () => {
        this.changePage(this.currentPage + 1);
      });
      this.updateUI();
      }
  
      // Add an item to the inventory
      addItem(item) {
        // Check if there is an available slot
        if (this.slots.length >= MAX_INVENTORY_SLOTS) {
          console.log("Inventory is full");
          return;
        }
  
        // Validate item type or any other constraints
  
        // Add the item to the inventory slots
        this.slots.push(item);
  
        // Update the UI to reflect the inventory change
        this.updateUI();
      }
  
      // Remove an item from the inventory
      removeItem(item) {
        const index = this.slots.indexOf(item);
        if (index !== -1) {
          this.slots.splice(index, 1);
  
          // Update the UI to reflect the inventory change
          this.updateUI();
        }
      }
  
      // Update the properties of an item in the inventory
      updateItem(item, properties) {
        // Find the item in the inventory slots
        const index = this.slots.indexOf(item);
        if (index !== -1) {
          // Update the item properties
          Object.assign(this.slots[index], properties);
  
          // Update the UI to reflect the inventory change
          this.updateUI();
        }
      }
  
      // Other inventory management methods...
      syncInventory(data) {
        // Clear the current inventory slots
        this.slots = [];
    
        // Populate the inventory with the received data
        for (const itemData of data) {
            let item;
            let itemSprite;
    
            if (itemData.itemKind === Types.Entities.MUSICBOX) {
                // Create a MusicBox item instance
                itemSprite = new Sprite(itemData.sprite);
                item = new Items.MusicBox(itemData.id, itemSprite, itemData.musicUrl);
            } else {
                // Create a regular item instance
                itemSprite = new Sprite(itemData.sprite);
                item = new Item(itemData.id, itemData.itemKind, itemSprite);
            }
    
            this.slots.push(item);
        }
    
        // Update the UI to reflect the synchronized inventory
        this.updateUI();
    }
  
     // Update the UI to reflect the current inventory state
updateUI() {
    const inventoryItemsElement = document.getElementById('inventory-items');
    const inventoryPageButtonsElement = document.getElementById('inventoryPageButtons');
    inventoryItemsElement.innerHTML = '';
    //inventoryPageButtonsElement.style.display = 'none';
    var itemsPerPage = 17*8; // Number of items to display per page
    if(this.isMobile){
        itemsPerPage = 14;
    }
    //itemsPerPage = 14;
        const startIndex = (this.currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
  
    for (let i = startIndex; i < endIndex && i < this.slots.length; i++) {
      const item = this.slots[i];
      const itemElement = document.createElement('div');
      itemElement.classList.add('inventory-item');
      itemElement.classList.add('clickable');
      itemElement.innerHTML = `
        <img src="${item.sprite.b64icon}" style="display:block;" alt="${item.itemKind}" />
        <button>use</button>
      `;
  
      itemElement.addEventListener('mouseup', () => {
        item.use(this.player);
        this.removeItem(item);
      });
  
      inventoryItemsElement.appendChild(itemElement);
    }
    this.invPage.innerText = this.currentPage;
    this.totalPages = Math.ceil(this.slots.length / itemsPerPage);
    if (this.totalPages > 1) {
      inventoryPageButtonsElement.style.display = 'block';
      
  
      if (this.currentPage === 1) {
        this.previousButton.classList.add('disabled');
      } else {
        this.previousButton.classList.remove('disabled');
      }
  
      if (this.currentPage === this.totalPages) {
        this.nextButton.classList.add('disabled');
      } else {
        this.nextButton.classList.remove('disabled');
      }
    }
  }
  
  changePage(page) {
    console.log(page);
    // Perform actions to change the page, such as updating the current page variable, and then call updateUI() again
    if(page < 1){
        //page = 1;
    }
    else if(page > this.totalPages){
        //page = this.totalPages;
    }
    else{
        this.currentPage = page;
        this.updateUI();
    }
  }
  
      
  
      
    }
  
    return Inventory;
  });
  