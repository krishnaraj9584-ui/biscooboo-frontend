import { supabase } from "../supabase";

// ============================================
// PRODUCTS API
// ============================================

export const productsAPI = {
  // Get all products with filters and sorting
  getProducts: async (filters = {}) => {
    try {
      let query = supabase.from('products').select('id, name, description, flavor, price, category, mainimage, decoimages');

      // Filter by category
      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      // Add ordering
      if (filters.sort === 'price-low') {
        query = query.order('price', { ascending: true });
      } else if (filters.sort === 'price-high') {
        query = query.order('price', { ascending: false });
      } else {
        query = query.order('name', { ascending: true });
      }

      const { data, error } = await query;

      if (error) throw error;

      return {
        products: data || [],
        total: data?.length || 0,
      };
    } catch (error) {
      console.error('Error fetching products:', error);
      throw new Error(error.message);
    }
  },

  // Get single product by ID
  getProduct: async (productId) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, description, flavor, price, category, mainimage, decoimages')
        .eq('id', productId)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Product not found');

      return { product: data };
    } catch (error) {
      console.error('Error fetching product:', error);
      throw new Error(error.message);
    }
  },

  // Get all products (no filters)
  getAllProducts: async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, description, flavor, price, category, mainimage, decoimages');

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching all products:', error);
      throw new Error(error.message);
    }
  },

  // Create new product (admin only)
  createProduct: async (productData) => {
    try {
      // Only include columns that exist in the actual database
      console.log('[createProduct] Inserting product:', productData);
      
      const { data, error } = await supabase
        .from('products')
        .insert([{
          name: productData.name,
          description: productData.description || null,
          flavor: productData.flavor || null,
          price: productData.price,
          category: productData.category || null,
          mainimage: productData.mainimage || null,
          decoimages: productData.decoimages || null,
        }])
        .select();

      if (error) {
        console.error('[createProduct] Supabase error:', error);
        throw error;
      }

      console.log('[createProduct] Product created:', data);
      return {
        id: data[0].id,
        message: 'Product created successfully',
      };
    } catch (error) {
      console.error('Error creating product:', error);
      throw new Error(error.message);
    }
  },

  // Update product (admin only)
  updateProduct: async (productId, updates) => {
    try {
      // Only include columns that exist in the actual database
      const safeUpdates = {};
      if (updates.name !== undefined) safeUpdates.name = updates.name;
      if (updates.description !== undefined) safeUpdates.description = updates.description;
      if (updates.flavor !== undefined) safeUpdates.flavor = updates.flavor;
      if (updates.price !== undefined) safeUpdates.price = updates.price;
      if (updates.category !== undefined) safeUpdates.category = updates.category;
      if (updates.mainimage !== undefined) safeUpdates.mainimage = updates.mainimage;
      if (updates.decoimages !== undefined) safeUpdates.decoimages = updates.decoimages;

      const { error } = await supabase
        .from('products')
        .update(safeUpdates)
        .eq('id', productId);

      if (error) throw error;

      return { success: true, message: 'Product updated successfully' };
    } catch (error) {
      console.error('Error updating product:', error);
      throw new Error(error.message);
    }
  },

  // Delete product (admin only)
  deleteProduct: async (productId) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      return { success: true, message: 'Product deleted successfully' };
    } catch (error) {
      console.error('Error deleting product:', error);
      throw new Error(error.message);
    }
  },
};

// ============================================
// ACCOUNTS/USERS API
// ============================================

export const accountsAPI = {
  // Get all accounts (admin only)
  getAllAccounts: async () => {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('id, email, name, phone, admin_access');

      if (error) throw error;

      return {
        accounts: data || [],
        total: data?.length || 0,
      };
    } catch (error) {
      console.error('Error fetching accounts:', error);
      throw new Error(error.message);
    }
  },

  // Get account by ID
  getAccount: async (accountId) => {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('id, email, name, phone, admin_access')
        .eq('id', accountId)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Account not found');

      return { account: data };
    } catch (error) {
      console.error('Error fetching account:', error);
      throw new Error(error.message);
    }
  },

  // Get account by email (for login)
  getAccountByEmail: async (email) => {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('email', email)
        .single();

      if (error && error.code === 'PGRST116') {
        return null;
      }
      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error fetching account by email:', error);
      throw new Error(error.message);
    }
  },

  // Update account profile (non-password fields)
  updateAccount: async (accountId, updates) => {
    try {
      const { password, ...safeUpdates } = updates;
      
      const { error } = await supabase
        .from('accounts')
        .update(safeUpdates)
        .eq('id', accountId);

      if (error) throw error;

      return { success: true, message: 'Account updated successfully' };
    } catch (error) {
      console.error('Error updating account:', error);
      throw new Error(error.message);
    }
  },

  // Update admin_access status (admin only)
  updateAdminAccess: async (accountId, adminAccess) => {
    try {
      const { error } = await supabase
        .from('accounts')
        .update({
          admin_access: adminAccess,
        })
        .eq('id', accountId);

      if (error) throw error;

      return { success: true, message: 'Admin access updated' };
    } catch (error) {
      console.error('Error updating admin access:', error);
      throw new Error(error.message);
    }
  },

  // Create new account (admin function)
  createAccount: async (accountData) => {
    try {
      // Combine firstName and lastName into name field, or use provided name
      const fullName = accountData.firstName && accountData.lastName
        ? `${accountData.firstName} ${accountData.lastName}`
        : accountData.name || '';

      const { data, error } = await supabase
        .from('accounts')
        .insert([{
          email: accountData.email,
          name: fullName,
          password: accountData.password,
          phone: accountData.phone || null,
          admin_access: accountData.admin_access || false,
        }])
        .select();

      if (error) throw error;

      return {
        id: data[0].id,
        message: 'Account created successfully',
      };
    } catch (error) {
      console.error('Error creating account:', error);
      throw new Error(error.message);
    }
  },

  // Delete account (admin only)
  deleteAccount: async (accountId) => {
    try {
      const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', accountId);

      if (error) throw error;

      return { success: true, message: 'Account deleted successfully' };
    } catch (error) {
      console.error('Error deleting account:', error);
      throw new Error(error.message);
    }
  },
};

// ============================================
// CART API
// ============================================

export const cartAPI = {
  // Get user's cart with product details
  getUserCart: async (accountId) => {
    try {
      console.log('[getUserCart] Fetching cart for accountId:', accountId);
      
      const { data: cartData, error: cartError } = await supabase
        .from('cart')
        .select('*')
        .eq('accountid', accountId);

      if (cartError) {
        console.error('[getUserCart] Supabase error:', cartError);
        throw cartError;
      }

      console.log('[getUserCart] Got cart data:', { itemCount: cartData?.length });

      // Fetch product details for each cart item
      const cartItems = await Promise.all(
        (cartData || []).map(async (cartItem) => {
          try {
            const { data: product, error: prodError } = await supabase
              .from('products')
              .select('id, name, description, flavor, price, category, mainimage, decoimages')
              .eq('id', cartItem.productid)
              .single();

            if (prodError) throw prodError;

            return {
              id: cartItem.id,
              productId: cartItem.productid,
              quantity: cartItem.quantity,
              size: cartItem.size || 2,
              name: product?.name || 'Product Unavailable',
              price: product?.price || 0,
              flavor: product?.flavor || 'Unknown',
              mainImage: product?.mainimage || 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=500',
              subtotal: (product?.price || 0) * cartItem.quantity,
            };
          } catch (err) {
            console.warn(`Failed to fetch product ${cartItem.productId}:`, err);
            return {
              id: cartItem.id,
              productId: cartItem.productid,
              quantity: cartItem.quantity,
              name: 'Product Unavailable',
              price: 0,
              subtotal: 0,
            };
          }
        })
      );

      const totalValue = cartItems.reduce((sum, item) => sum + item.subtotal, 0);

      return {
        cart: cartItems,
        total: cartItems.length,
        cartValue: totalValue,
      };
    } catch (error) {
      console.error('Error fetching cart:', error);
      throw new Error(error.message);
    }
  },

  // Add item to cart
  addToCart: async (accountId, cartItem) => {
    try {
      console.log('[addToCart] Adding item:', { accountId, cartItem });
      console.log('[addToCart] Attempting insert with columns: accountid, productid, quantity, size');
      
      const insertData = {
        accountid: accountId,
        productid: cartItem.productId,
        quantity: cartItem.quantity,
        size: cartItem.size || 2,
      };
      
      console.log('[addToCart] Insert data:', insertData);
      
      const { data, error } = await supabase
        .from('cart')
        .insert([insertData])
        .select();

      if (error) {
        console.error('[addToCart] Supabase error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          status: error.status,
        });
        throw error;
      }

      console.log('[addToCart] Item added successfully:', data);
      return {
        id: data[0].id,
        message: 'Item added to cart',
      };
    } catch (error) {
      console.error('[addToCart] Error adding to cart:', error.message);
      throw new Error(error.message || 'Failed to add item to cart');
    }
  },

  // Update cart item quantity
  updateCartItem: async (accountId, cartItemId, updates) => {
    try {
      console.log('[updateCartItem] Updating item:', { cartItemId, updates });
      
      const { error } = await supabase
        .from('cart')
        .update({
          quantity: updates.quantity,
        })
        .eq('id', cartItemId);

      if (error) {
        console.error('[updateCartItem] Supabase error:', error);
        throw error;
      }

      console.log('[updateCartItem] Item updated successfully');
      return { success: true, message: 'Cart item updated' };
    } catch (error) {
      console.error('[updateCartItem] Error updating cart item:', error);
      throw new Error(error.message);
    }
  },

  // Remove item from cart
  removeFromCart: async (accountId, cartItemId) => {
    try {
      console.log('[removeFromCart] Removing item:', { cartItemId });
      
      const { error } = await supabase
        .from('cart')
        .delete()
        .eq('id', cartItemId);

      if (error) {
        console.error('[removeFromCart] Supabase error:', error);
        throw error;
      }

      console.log('[removeFromCart] Item removed successfully');
      return { success: true, message: 'Item removed from cart' };
    } catch (error) {
      console.error('[removeFromCart] Error removing from cart:', error);
      throw new Error(error.message);
    }
  },

  // Clear entire cart
  clearCart: async (accountId) => {
    try {
      console.log('[clearCart] Clearing cart for accountId:', accountId);
      
      const { error } = await supabase
        .from('cart')
        .delete()
        .eq('accountid', accountId);

      if (error) {
        console.error('[clearCart] Supabase error:', error);
        throw error;
      }

      console.log('[clearCart] Cart cleared successfully');
      return { success: true, message: 'Cart cleared' };
    } catch (error) {
      console.error('[clearCart] Error clearing cart:', error);
      throw new Error(error.message);
    }
  },
};

// ============================================
// AUTHENTICATION API (Using Accounts Collection)
// ============================================

export const authAPI = {
  // Login using email and password
  login: async (email, password) => {
    try {
      const account = await accountsAPI.getAccountByEmail(email);

      if (!account) {
        throw new Error('Invalid email or password');
      }

      const { password: _, ...accountWithoutPassword } = account;

      return {
        success: true,
        account: accountWithoutPassword,
        message: 'Login successful',
      };
    } catch (error) {
      console.error('Login error:', error);
      throw new Error(error.message);
    }
  },

  // Logout (client-side only)
  logout: async () => {
    try {
      localStorage.removeItem('currentUser');
      return { success: true, message: 'Logged out successfully' };
    } catch (error) {
      console.error('Logout error:', error);
      throw new Error(error.message);
    }
  },

  // Get current user from localStorage
  getCurrentUser: () => {
    try {
      const user = localStorage.getItem('currentUser');
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },

  // Store current user
  setCurrentUser: (user) => {
    try {
      localStorage.setItem('currentUser', JSON.stringify(user));
      return true;
    } catch (error) {
      console.error('Error setting current user:', error);
      return false;
    }
  },
};

// ============================================
// CONTACT API
// ============================================

export const contactAPI = {
  // Send contact form submission
  sendContactForm: async (formData) => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .insert([{
          ...formData,
          read: false,
          replied: false,
        }])
        .select();

      if (error) throw error;

      return { success: true, message: 'Message sent successfully' };
    } catch (error) {
      console.error('Error sending contact form:', error);
      throw new Error(error.message);
    }
  },

  // Get all contact messages (admin only)
  getAllMessages: async () => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*');

      if (error) throw error;

      return {
        messages: data || [],
        total: data?.length || 0,
      };
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw new Error(error.message);
    }
  },

  // Get unread messages (admin only)
  getUnreadMessages: async () => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('read', false);

      if (error) throw error;

      return {
        messages: data || [],
        total: data?.length || 0,
      };
    } catch (error) {
      console.error('Error fetching unread messages:', error);
      throw new Error(error.message);
    }
  },

  // Mark message as read
  markMessageAsRead: async (messageId) => {
    try {
      const { error } = await supabase
        .from('contacts')
        .update({
          read: true,
        })
        .eq('id', messageId);

      if (error) throw error;

      return { success: true, message: 'Message marked as read' };
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw new Error(error.message);
    }
  },

  // Add reply to message
  replyToMessage: async (messageId, reply) => {
    try {
      const { error } = await supabase
        .from('contacts')
        .update({
          replied: true,
          reply,
        })
        .eq('id', messageId);

      if (error) throw error;

      return { success: true, message: 'Reply sent successfully' };
    } catch (error) {
      console.error('Error replying to message:', error);
      throw new Error(error.message);
    }
  },

  // Delete message
  deleteMessage: async (messageId) => {
    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', messageId);

      if (error) throw error;

      return { success: true, message: 'Message deleted successfully' };
    } catch (error) {
      console.error('Error deleting message:', error);
      throw new Error(error.message);
    }
  },
};

// ============================================
// NEWSLETTER API
// ============================================

export const newsletterAPI = {
  // Subscribe to newsletter
  subscribe: async (email) => {
    try {
      const { data: existing, error: findError } = await supabase
        .from('newsletter')
        .select('id')
        .eq('email', email)
        .single();

      if (!findError && existing) {
        throw new Error('Email already subscribed');
      }

      const { data, error } = await supabase
        .from('newsletter')
        .insert([{
          email,
          createdAt: new Date().toISOString(),
        }])
        .select();

      if (error) throw error;

      return { success: true, message: 'Subscribed successfully' };
    } catch (error) {
      console.error('Error subscribing to newsletter:', error);
      throw new Error(error.message);
    }
  },

  // Unsubscribe from newsletter
  unsubscribe: async (email) => {
    try {
      const { data, error } = await supabase
        .from('newsletter')
        .delete()
        .eq('email', email);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error unsubscribing from newsletter:', error);
      throw new Error(error.message);
    }
  },

  // Check subscription status
  checkSubscriptionStatus: async (email) => {
    try {
      const { data, error } = await supabase
        .from('newsletter')
        .select('id')
        .eq('email', email)
        .single();

      if (error && error.code === 'PGRST116') {
        return { subscribed: false };
      }
      if (error) throw error;

      return { subscribed: !!data };
    } catch (error) {
      console.error('Error checking subscription status:', error);
      throw new Error(error.message);
    }
  },
};

// ============================================
// ORDERS API
// ============================================

export const ordersAPI = {
  createOrder: async (userId, orderData) => {
    try {
      // Map camelCase fields to lowercase database columns
      const dbOrder = {
        userid: userId,
        status: orderData.status || 'pending',
        items: orderData.items,
        total: orderData.total,
        discount: orderData.discount || null,
        promocode: orderData.promoCode || null,
        shippingaddress: orderData.shippingAddress || null,
      };

      console.log('[ordersAPI.createOrder] Inserting order:', dbOrder);

      const { data, error } = await supabase
        .from('orders')
        .insert([dbOrder])
        .select();

      if (error) throw error;

      console.log('[ordersAPI.createOrder] Order created successfully:', data[0]);
      return { orderId: data[0].id, success: true };
    } catch (error) {
      console.error('[ordersAPI.createOrder] Error:', error);
      throw new Error(error.message);
    }
  },

  getOrderById: async (orderId) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Order not found');

      return { id: data.id, ...data };
    } catch (error) {
      console.error('Error fetching order:', error);
      throw new Error(error.message);
    }
  },

  getUserOrders: async (userId) => {
    try {
      console.log('[ordersAPI.getUserOrders] Fetching orders for user:', userId);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('userid', userId);

      if (error) throw error;

      console.log('[ordersAPI.getUserOrders] Found orders:', data?.length || 0);
      return (data || []).map(doc => ({ id: doc.id, ...doc }));
    } catch (error) {
      console.error('[ordersAPI.getUserOrders] Error:', error);
      throw new Error(error.message);
    }
  },

  getAllOrders: async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*');

      if (error) throw error;

      return {
        orders: (data || []).map(doc => ({ id: doc.id, ...doc })),
        total: data?.length || 0
      };
    } catch (error) {
      console.error('Error fetching all orders:', error);
      throw new Error(error.message);
    }
  },

  updateOrderStatus: async (orderId, newStatus) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: newStatus,
        })
        .eq('id', orderId);

      if (error) throw error;

      return { success: true, message: 'Order status updated' };
    } catch (error) {
      console.error('Error updating order status:', error);
      throw new Error(error.message);
    }
  },

  deleteOrder: async (orderId) => {
    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (error) throw error;

      return { success: true, message: 'Order deleted' };
    } catch (error) {
      console.error('Error deleting order:', error);
      throw new Error(error.message);
    }
  }
};

// ============================================
// NOTIFICATIONS API
// ============================================

export const notificationsAPI = {
  createNotification: async (notificationData) => {
    try {
      const dbNotification = {
        userid: notificationData.userId,
        type: notificationData.type || 'general',
        title: notificationData.title || 'Notification',
        message: notificationData.message,
        read: false,
      };

      console.log('[notificationsAPI.createNotification] Creating:', dbNotification);

      const { data, error } = await supabase
        .from('notifications')
        .insert([dbNotification])
        .select();

      if (error) throw error;

      console.log('[notificationsAPI.createNotification] Created successfully');
      return { notificationId: data[0].id, success: true };
    } catch (error) {
      console.error('[notificationsAPI.createNotification] Error:', error);
      throw new Error(error.message);
    }
  },

  getUserNotifications: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('userId', userId);

      if (error) throw error;

      return (data || []).map(doc => ({ id: doc.id, ...doc }));
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw new Error(error.message);
    }
  },

  markAsRead: async (notificationId) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw new Error(error.message);
    }
  },

  getAdminNotifications: async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*');

      if (error) throw error;

      return {
        notifications: (data || []).map(doc => ({ id: doc.id, ...doc })),
        total: data?.length || 0
      };
    } catch (error) {
      console.error('Error fetching admin notifications:', error);
      throw new Error(error.message);
    }
  },

  deleteNotification: async (notificationId) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      return { success: true, message: 'Notification deleted' };
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw new Error(error.message);
    }
  },

  getUnreadNotifications: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('userId', userId)
        .eq('read', false)
        .order('createdAt', { ascending: false });

      if (error) throw error;

      return {
        notifications: (data || []).map(doc => ({ id: doc.id, ...doc })),
        total: data?.length || 0
      };
    } catch (error) {
      console.error('Error fetching unread notifications:', error);
      throw new Error(error.message);
    }
  }
};

// ============================================
// PROMO CODES API
// ============================================

export const promoCodesAPI = {
  validatePromoCode: async (promoCode) => {
    try {
      console.log('[validatePromoCode] Looking for code:', promoCode);
      
      const { data, error } = await supabase
        .from('promoCodes')
        .select('id, code, discount, discounttype, expiresat, active, usagelimit, usagecount')
        .eq('code', promoCode.toUpperCase())
        .single();

      console.log('[validatePromoCode] Query result:', { data, error });

      if (error && error.code === 'PGRST116') {
        throw new Error('Promo code not found');
      }
      if (error) throw error;

      // Check if active
      if (!data.active) {
        throw new Error('Promo code is not active');
      }

      // Check if expired (use lowercase column name)
      if (data.expiresat && new Date(data.expiresat) < new Date()) {
        throw new Error('Promo code has expired');
      }

      // Check usage limit
      if (data.usagelimit && data.usagecount >= data.usagelimit) {
        throw new Error('Promo code has reached its usage limit');
      }

      return { valid: true, discount: data.discount, discountType: data.discounttype, code: data.code, id: data.id };
    } catch (error) {
      console.error('[validatePromoCode] Error:', error);
      throw new Error(error.message);
    }
  },

  incrementPromoCodeUsage: async (promoCodeId) => {
    try {
      // First, get the current usage count
      const { data: promoData, error: fetchError } = await supabase
        .from('promoCodes')
        .select('usagecount')
        .eq('id', promoCodeId)
        .single();

      if (fetchError) throw fetchError;

      // Increment and update
      const newUsageCount = (promoData.usagecount || 0) + 1;
      const { data, error } = await supabase
        .from('promoCodes')
        .update({ usagecount: newUsageCount })
        .eq('id', promoCodeId)
        .select();

      if (error) throw error;
      return { success: true, newUsageCount };
    } catch (error) {
      console.error('[incrementPromoCodeUsage] Error:', error);
      throw new Error(error.message);
    }
  },

  createPromoCode: async (promoData) => {
    try {
      const { data, error } = await supabase
        .from('promoCodes')
        .insert([{
          ...promoData,
          createdat: new Date().toISOString(),
          usagecount: 0
        }])
        .select();

      if (error) throw error;

      return { couponId: data[0].id, success: true };
    } catch (error) {
      console.error('Error creating promo code:', error);
      throw new Error(error.message);
    }
  },

  getPromoCodeStats: async (promoCode) => {
    try {
      const { data, error } = await supabase
        .from('promoCodes')
        .select('code, discount, discounttype, usagelimit, usagecount, active, expiresat')
        .eq('code', promoCode.toUpperCase())
        .single();

      if (error) throw error;

      return {
        code: data.code,
        discount: data.discount,
        discountType: data.discounttype,
        usageLimit: data.usagelimit,
        usageCount: data.usagecount,
        remainingUses: data.usagelimit ? (data.usagelimit - data.usagecount) : null,
        isActive: data.active,
        expiresAt: data.expiresat
      };
    } catch (error) {
      console.error('[getPromoCodeStats] Error:', error);
      throw new Error(error.message);
    }
  },

  getAllActivePromoCodes: async () => {
    try {
      const { data, error } = await supabase
        .from('promoCodes')
        .select('code, discount, discounttype, usagelimit, usagecount, active, expiresat')
        .eq('active', true)
        .order('createdat', { ascending: false });

      if (error) throw error;

      return data.map(promo => ({
        code: promo.code,
        discount: promo.discount,
        discountType: promo.discounttype,
        usageLimit: promo.usagelimit,
        usageCount: promo.usagecount,
        remainingUses: promo.usagelimit ? (promo.usagelimit - promo.usagecount) : null,
        expiresAt: promo.expiresat
      }));
    } catch (error) {
      console.error('[getAllActivePromoCodes] Error:', error);
      throw new Error(error.message);
    }
  }
};