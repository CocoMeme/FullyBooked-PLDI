import * as SQLite from 'expo-sqlite';

let db = null;

export const initNotificationsDB = async () => {
  try {
    if (!db) {
      console.log('Opening notifications database...');
      db = await SQLite.openDatabaseAsync('notifications.db');
      
      // First, check if we need to add the type column
      const tableInfo = await db.getAllAsync(
        "SELECT sql FROM sqlite_master WHERE type='table' AND name='notifications';"
      );

      if (tableInfo.length > 0) {
        // Check if type column exists
        const hasTypeColumn = tableInfo[0].sql.toLowerCase().includes('type text');
        
        if (!hasTypeColumn) {
          console.log('Adding type column to notifications table...');
          try {
            // Add new column to existing table
            await db.execAsync(
              "ALTER TABLE notifications ADD COLUMN type TEXT DEFAULT 'ORDER_STATUS_UPDATE';"
            );
            console.log('Type column added successfully');
          } catch (alterError) {
            console.error('Error adding type column:', alterError);
            
            // If altering fails, recreate the table
            console.log('Recreating notifications table...');
            await db.execAsync('DROP TABLE IF EXISTS notifications;');
            await createNotificationsTable();
          }
        }
      } else {
        // Table doesn't exist, create it
        await createNotificationsTable();
      }
      
      // Always check for and create sale_books tables
      try {
        const saleBookTableInfo = await db.getAllAsync(
          "SELECT sql FROM sqlite_master WHERE type='table' AND name='sale_books';"
        );
        
        if (saleBookTableInfo.length === 0) {
          console.log('Creating sale_books tables...');
          await createSaleBooksTable();
        } else {
          console.log('sale_books tables already exist');
        }
      } catch (saleBookError) {
        console.error('Error checking for sale_books table:', saleBookError);
        // Try to create the tables anyway
        try {
          await createSaleBooksTable();
        } catch (createError) {
          console.error('Error creating sale_books tables:', createError);
          // Continue execution - we'll handle errors at the usage site
        }
      }
      
      return db;
    }
    return db;
  } catch (error) {
    console.error('Notifications DB initialization error:', error);
    throw error;
  }
};

const createNotificationsTable = async () => {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      type TEXT DEFAULT 'ORDER_STATUS_UPDATE',
      data TEXT,
      read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('Notifications table created successfully');
};

// Create a table to track sale books and which users have been notified
const createSaleBooksTable = async () => {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS sale_books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      book_id TEXT NOT NULL,
      book_title TEXT NOT NULL,
      price REAL NOT NULL,
      discount_price REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(book_id)
    );
  `);
  
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS sale_book_notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      book_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      notified INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(book_id, user_id)
    );
  `);
  console.log('Sale books tables created successfully');
};

// Initialize all tables
export const initAllTables = async () => {
  if (!db) {
    db = await initNotificationsDB();
  }
  
  try {
    await createNotificationsTable();
    await createSaleBooksTable();
    return true;
  } catch (error) {
    console.error('Error initializing all tables:', error);
    return false;
  }
};

export const saveNotification = async (userId, title, body, data = {}, type = 'ORDER_STATUS_UPDATE') => {
  if (!db) {
    db = await initNotificationsDB();
  }

  try {
    console.log(`Saving ${type} notification to SQLite:`, {
      userId,
      title,
      body,
      data: JSON.stringify(data)
    });

    await db.runAsync(
      'INSERT INTO notifications (user_id, title, body, data, type) VALUES (?, ?, ?, ?, ?)',
      [userId, title, body, JSON.stringify(data), type]
    );
    
    // Log the saved notification
    const lastNotification = await db.getFirstAsync(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY id DESC LIMIT 1',
      [userId]
    );
    console.log('Successfully saved notification:', lastNotification);
  } catch (error) {
    console.error('Error saving notification:', error);
    throw error;
  }
};

export const getNotifications = async (userId) => {
  if (!db) {
    db = await initNotificationsDB();
  }

  try {
    const notifications = await db.getAllAsync(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    return notifications.map(n => ({
      ...n,
      data: JSON.parse(n.data || '{}')
    }));
  } catch (error) {
    console.error('Error getting notifications:', error);
    throw error;
  }
};

export const getUnreadCount = async (userId) => {
  if (!db) {
    db = await initNotificationsDB();
  }

  try {
    const result = await db.getFirstAsync(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read = 0',
      [userId]
    );
    return result?.count || 0;
  } catch (error) {
    console.error('Error getting unread count:', error);
    throw error;
  }
};

export const markAsRead = async (notificationId) => {
  if (!db) {
    db = await initNotificationsDB();
  }

  try {
    await db.runAsync(
      'UPDATE notifications SET read = 1 WHERE id = ?',
      [notificationId]
    );
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

export const dropNotificationsDB = async () => {
  try {
    if (db) {
      await db.closeAsync();
      db = null;
    }
    await SQLite.deleteAsync('notifications.db');
    console.log('Notifications database dropped successfully');
  } catch (error) {
    console.error('Error dropping notifications database:', error);
    throw error;
  }
};

export const clearAllNotifications = async (userId) => {
  if (!db) {
    db = await initNotificationsDB();
  }

  try {
    await db.runAsync(
      'DELETE FROM notifications WHERE user_id = ?',
      [userId]
    );
    console.log('All notifications cleared successfully');
  } catch (error) {
    console.error('Error clearing notifications:', error);
    throw error;
  }
};

// Add new methods for filtering notifications by type
export const getNotificationsByType = async (userId, type) => {
  if (!db) {
    db = await initNotificationsDB();
  }

  try {
    const notifications = await db.getAllAsync(
      'SELECT * FROM notifications WHERE user_id = ? AND type = ? ORDER BY created_at DESC',
      [userId, type]
    );
    return notifications.map(n => ({
      ...n,
      data: JSON.parse(n.data || '{}')
    }));
  } catch (error) {
    console.error(`Error getting ${type} notifications:`, error);
    throw error;
  }
};

// Save a book on sale to the database
export const saveSaleBook = async (book) => {
  if (!db) {
    db = await initNotificationsDB();
  }

  try {
    console.log('Saving sale book to database:', book.title);
    
    // First check if the table exists
    try {
      const tableCheck = await db.getAllAsync(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='sale_books';"
      );
      
      // If table doesn't exist, create it first
      if (tableCheck.length === 0) {
        console.log('sale_books table does not exist yet, creating it now...');
        await createSaleBooksTable();
      }
    } catch (tableCheckError) {
      console.error('Error checking for sale_books table:', tableCheckError);
      // Try to create the tables anyway
      await createSaleBooksTable();
    }
    
    // Now try to save the book data
    await db.runAsync(
      'INSERT OR REPLACE INTO sale_books (book_id, book_title, price, discount_price) VALUES (?, ?, ?, ?)',
      [book._id, book.title, book.price, book.discountPrice]
    );
    
    console.log('Sale book successfully saved to database:', book.title);
    return true;
  } catch (error) {
    console.error('Error saving sale book:', error);
    // Log more details about the error to help with debugging
    if (error.message) {
      console.error('Error message:', error.message);
    }
    return false;
  }
};

// Record that a user has been notified about a book on sale
export const markUserNotifiedAboutSaleBook = async (bookId, userId) => {
  if (!db) {
    db = await initNotificationsDB();
  }

  try {
    // Check if the table exists first
    try {
      const tableCheck = await db.getAllAsync(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='sale_book_notifications';"
      );
      
      // If table doesn't exist, create it first
      if (tableCheck.length === 0) {
        console.log('sale_book_notifications table does not exist yet, creating it now...');
        await createSaleBooksTable();
      }
    } catch (tableCheckError) {
      console.error('Error checking for sale_book_notifications table:', tableCheckError);
      // Try to create the tables anyway
      await createSaleBooksTable();
    }
    
    await db.runAsync(
      'INSERT OR REPLACE INTO sale_book_notifications (book_id, user_id, notified) VALUES (?, ?, 1)',
      [bookId, userId]
    );
    
    console.log(`User ${userId} marked as notified about book ${bookId}`);
    return true;
  } catch (error) {
    console.error('Error marking user as notified:', error);
    if (error.message) {
      console.error('Error message:', error.message);
    }
    return false;
  }
};

// Get sale books that a user hasn't been notified about yet
export const getUnnotifiedSaleBooks = async (userId) => {
  if (!db) {
    db = await initNotificationsDB();
  }

  try {
    // Check if the tables exist first
    try {
      const saleBookTableCheck = await db.getAllAsync(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='sale_books';"
      );
      const notificationsTableCheck = await db.getAllAsync(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='sale_book_notifications';"
      );
      
      // If either table doesn't exist, create them both
      if (saleBookTableCheck.length === 0 || notificationsTableCheck.length === 0) {
        console.log('One or more sale book tables do not exist yet, creating them now...');
        await createSaleBooksTable();
      }
    } catch (tableCheckError) {
      console.error('Error checking for sale book tables:', tableCheckError);
      // Try to create the tables anyway
      await createSaleBooksTable();
    }
    
    // Find books that are on sale but this user hasn't been notified about yet
    const books = await db.getAllAsync(`
      SELECT sb.* FROM sale_books sb
      LEFT JOIN sale_book_notifications sbn 
        ON sb.book_id = sbn.book_id AND sbn.user_id = ?
      WHERE sbn.id IS NULL OR sbn.notified = 0
      ORDER BY sb.created_at DESC
    `, [userId]);
    
    console.log(`Found ${books.length} unnotified sale books for user ${userId}`);
    return books;
  } catch (error) {
    console.error('Error getting unnotified sale books:', error);
    if (error.message) {
      console.error('Error message:', error.message);
    }
    return [];
  }
};