import * as SQLite from 'expo-sqlite';
import { initAllTables } from './notificationsDB';

let db = null;

export const initDatabase = async () => {
  try {
    // Initialize the main cart database
    if (!db) {
      console.log('Opening cart database...');
      db = await SQLite.openDatabaseAsync('cartdb.db');
      console.log('Cart database opened successfully', db);

      // First create the table if it doesn't exist (with original schema)
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS cart_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          product_id TEXT NOT NULL,
          product_name TEXT NOT NULL,
          product_price REAL NOT NULL,
          discountPrice REAL, -- Reintroduce discountPrice column
          product_image TEXT,
          quantity INTEGER DEFAULT 1,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('Cart database initialized successfully');
    }
    
    // Initialize the notifications database and all its tables
    try {
      console.log('Initializing notification database tables...');
      await initAllTables();
      console.log('Notification database tables initialized successfully');
    } catch (notifError) {
      console.error('Error initializing notification database tables:', notifError);
      // Continue with the app initialization even if notification tables fail
    }
    
    return db;
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
};

export const saveCartItem = async (item, quantity) => {
    if (!db) {
      throw new Error('Database not initialized');
    }
  
    try {
      console.log('Saving item to SQLite:', JSON.stringify(item,null,2));
      console.log('Quantity:', quantity);
  
      // Validate product_id
      if (!item.product_id) {
        throw new Error('Missing product_id in item');
      }
  
      // Check if the item already exists in the cart
      const existingItem = await db.getFirstAsync(
        'SELECT * FROM cart_items WHERE product_id = ?',
        [item.product_id]
      );
      console.log('Existing item:', existingItem);
  
      if (existingItem) {
        // ✅ If the item exists, update its quantity and possibly discountPrice (if present in the new item)
        const discountPrice = item.discountPrice || existingItem.discountPrice;
        await db.runAsync(
          'UPDATE cart_items SET quantity = ?, discountPrice = ? WHERE product_id = ?',
          [quantity, discountPrice, item.product_id]
        );
        console.log(`Updated quantity for product_id: ${item.product_id} to ${quantity}`);
      } else {
        // ✅ Extract real values from the item
        const product_name = item.title || item.product_name || 'Unknown Item';
        const product_price = item.price || item.product_price || 0;
        const product_image = item.coverImage?.[0] || item.product_image || '';
        // Extract discount price if available
        const discountPrice = item.discountPrice || (item.tag === 'Sale' ? item.discountPrice : null);
  
        // ✅ Insert a new item into the cart
        await db.runAsync(
          `INSERT INTO cart_items (
            product_id,
            product_name,
            product_price,
            discountPrice,
            product_image,
            quantity
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            item.product_id,
            product_name,
            product_price,
            discountPrice,
            product_image,
            quantity,
          ]
        );
        console.log(`Inserted new item with product_id: ${item.product_id}`);
      }
    } catch (error) {
      console.error('Error saving cart item:', error);
      throw error;
    }
  };
  
// Retrieve all items from the cart
export const getCartItems = async () => {
  if (!db) {
    throw new Error('Database not initialized');
  }

  try {
    const items = await db.getAllAsync('SELECT * FROM cart_items ORDER BY timestamp DESC');
    console.log('Retrieved cart items:', items);

    // Map database rows to item structure
    return items.map((item) => ({
      product_id: item.product_id,
      product_name: item.product_name,
      product_price: item.product_price,
      discountPrice: item.discountPrice,
      product_image: item.product_image,
      quantity: item.quantity,
    }));
  } catch (error) {
    console.error('Error retrieving cart items:', error);
    throw error;
  }
};

// Clear all items from the cart
export const clearCartItems = async () => {
  if (!db) {
    throw new Error('Database not initialized');
  }

  try {
    await db.runAsync('DELETE FROM cart_items');
    console.log('Cleared all cart items');
  } catch (error) {
    console.error('Error clearing cart items:', error);
    throw error;
  }
};

// Update the quantity of an item in the cart
export const updateCartItemQuantity = async (productId, quantity) => {
  if (!db) {
    throw new Error('Database not initialized');
  }

  try {
    // First, make sure we keep any existing discountPrice value
    const existingItem = await db.getFirstAsync(
      'SELECT discountPrice FROM cart_items WHERE product_id = ?',
      [productId]
    );
    
    // Then update with the quantity (preserving discount price)
    await db.runAsync(
      'UPDATE cart_items SET quantity = ? WHERE product_id = ?',
      [quantity, productId]
    );
    
    console.log(`Quantity updated in database for product ID: ${productId} to ${quantity}`);
  } catch (error) {
    console.error('Error updating cart item quantity in database:', error);
    throw error;
  }
};

// Delete an item from the cart
export const deleteCartItem = async (productId) => {
  if (!db) {
    throw new Error('Database not initialized');
  }

  try {
    await db.runAsync('DELETE FROM cart_items WHERE product_id = ?', [productId]);
    console.log(`Deleted item with product_id: ${productId}`);
  } catch (error) {
    console.error('Error deleting cart item:', error);
    throw error;
  }
};

// Get the total count of items in the cart
export const getCartItemCount = async () => {
  if (!db) {
    throw new Error('Database not initialized');
  }

  try {
    const result = await db.getFirstAsync('SELECT SUM(quantity) as total FROM cart_items');
    console.log('Total cart item count:', result?.total || 0);
    return result?.total || 0;
  } catch (error) {
    console.error('Error getting cart item count:', error);
    throw error;
  }
};

// Get the total quantity of items in the cart
export const getCartTotalCount = async () => {
  if (!db) {
    throw new Error('Database not initialized');
  }

  try {
    const result = await db.getFirstAsync(
      'SELECT SUM(quantity) as total FROM cart_items'
    );
    console.log('Total quantity of items in cart:', result?.total || 0);
    return result?.total || 0;
  } catch (error) {
    console.error('Error getting cart total count:', error);
    throw error;
  }
};