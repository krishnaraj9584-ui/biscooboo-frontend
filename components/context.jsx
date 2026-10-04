import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { authAPI, accountsAPI, cartAPI, productsAPI, ordersAPI, promoCodesAPI } from '../services/supabase-api';

// Create the context
const BiscoobooContext = createContext();

// Custom hook to use the context
export const useBiscooboo = () => {
  const context = useContext(BiscoobooContext);
  if (!context) {
    throw new Error('useBiscooboo must be used within BiscoobooProvider');
  }
  return context;
};

// Context Provider Component
export const BiscoobooProvider = ({ children }) => {
  // ==========================================
  // AUTH STATE
  // ==========================================
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // ==========================================
  // PRODUCTS STATE
  // ==========================================
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState(null);
  const [sortBy, setSortBy] = useState('name');
  const [filterCategory, setFilterCategory] = useState('all');

  // ==========================================
  // CART STATE
  // ==========================================
  const [cart, setCart] = useState([]);
  const [cartLoading, setCartLoading] = useState(false);
  const [cartError, setCartError] = useState(null);
  const [quantities, setQuantities] = useState({});

  // ==========================================
  // ORDERS STATE
  // ==========================================
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState(null);

  // ==========================================
  // UI STATE
  // ==========================================
  const [darkMode, setDarkMode] = useState(true);

  // Sample/fallback products in case database is empty
  const FALLBACK_PRODUCTS = [
    {
      id: 'fallback-1',
      name: 'Choco Chip Bliss',
      flavor: 'Chocolate',
      price: 4.99,
      description: 'Premium chocolate chip cookies with Belgian dark chocolate chunks',
      mainImage: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=500',
      bgColor: '#1a1a1a',
      accentColor: '#362318',
      backgroundText: 'CHOCO BLISS',
      showInMenu: true,
      category: 'chocolate',
      decoImages: null
    }
  ];

  // ==========================================
  // Helper to ensure products have all theme fields
  // ==========================================
  const enrichProduct = (product) => {
    // Provide fallback values for missing columns
    return {
      ...product,
      mainImage: product.mainimage || 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=500',
      bgColor: product.bgColor || '#1a1a1a',
      accentColor: product.accentColor || '#362318',
      backgroundText: product.backgroundText || product.name?.toUpperCase() || 'BISCOOBOO',
      decoImages: product.decoimages || null,
      showInMenu: product.showInMenu !== false,
    };
  };

  // ==========================================
  // INITIALIZE APP
  // ==========================================
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('[Init] Starting app initialization...');
        
        // Check for existing user in localStorage
        const user = authAPI.getCurrentUser();
        if (user) {
          console.log('[Init] Found logged-in user:', user?.email);
          setCurrentUser(user);
          setIsLoggedIn(true);
          setIsAdmin(user.admin_access === true);
        }

        // Fetch products directly
        try {
          console.log('[Init] Fetching products from Supabase...');
          setProductsLoading(true);
          const result = await productsAPI.getProducts({});
          console.log('[Init] Products fetched:', result);
          
          if (result?.products && result.products.length > 0) {
            console.log('[Init] Setting', result.products.length, 'products');
            const enrichedProducts = result.products.map(enrichProduct);
            setProducts(enrichedProducts);
            setProductsError(null);
          } else {
            console.warn('[Init] No products returned from API, using fallback');
            setProducts(FALLBACK_PRODUCTS);
            setProductsError('Using sample product. Check Supabase connection.');
          }
        } catch (error) {
          console.error('[Init] Error fetching products:', error);
          setProductsError(error.message || 'Failed to load products');
          console.log('[Init] Using fallback products');
          setProducts(FALLBACK_PRODUCTS);
        } finally {
          setProductsLoading(false);
        }
      } catch (error) {
        console.error('[Init] Error initializing app:', error);
        setAuthError('Failed to initialize application');
      } finally {
        setAuthLoading(false);
      }
    };
    
    initializeApp();
  }, []);

  // ==========================================
  // AUTH METHODS
  // ==========================================
  const login = useCallback(async (email, password) => {
    try {
      setAuthError(null);
      const account = await accountsAPI.getAccountByEmail(email);

      if (!account) {
        throw new Error('Invalid email');
      }

      // PASSWORD VERIFICATION
      if (account.password !== password) {
        throw new Error('Invalid email or password');
      }

      const { password: _, ...userWithoutPassword } = account;
      authAPI.setCurrentUser(userWithoutPassword);
      setCurrentUser(userWithoutPassword);
      setIsLoggedIn(true);
      setIsAdmin(userWithoutPassword.admin_access === true);

      addNotification('Login successful!', 'success');
      return { success: true, user: userWithoutPassword };
    } catch (error) {
      const errorMsg = error.message || 'Login failed';
      setAuthError(errorMsg);
      addNotification(errorMsg, 'error');
      throw error;
    }
  }, []);

  const loginWithGoogle = useCallback(async (googleToken) => {
    try {
      setAuthError(null);
      
      // Decode JWT to get user info (without verification since it's from Google)
      const base64Url = googleToken.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      const tokenData = JSON.parse(jsonPayload);
      const { email, name, picture } = tokenData;
      
      // Check if account exists
      let account = await accountsAPI.getAccountByEmail(email);
      
      if (!account) {
        // Create new account with Google data
        const [firstName, ...lastNameParts] = name.split(' ');
        const lastName = lastNameParts.join(' ') || '';
        
        await accountsAPI.createAccount({
          firstName,
          lastName,
          email,
          password: 'google-oauth-' + Math.random().toString(36).substring(2, 15), // Dummy password
        });
        
        account = await accountsAPI.getAccountByEmail(email);
      }
      
      if (!account) {
        throw new Error('Failed to create or retrieve account');
      }
      
      const { password: _, ...userWithoutPassword } = account;
      authAPI.setCurrentUser(userWithoutPassword);
      setCurrentUser(userWithoutPassword);
      setIsLoggedIn(true);
      setIsAdmin(userWithoutPassword.admin_access === true);
      
      return { success: true, user: userWithoutPassword };
    } catch (error) {
      const errorMsg = error.message || 'Google login failed';
      setAuthError(errorMsg);
      throw error;
    }
  }, []);

  const signup = useCallback(async (userData) => {
    try {
      setAuthError(null);

      // Check if email already exists
      const existingAccount = await accountsAPI.getAccountByEmail(userData.email);
      if (existingAccount) {
        throw new Error('Email already registered. Please login instead.');
      }

      // Create new account
      const result = await accountsAPI.createAccount({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        password: userData.password,
      });

      // Fetch the newly created account
      const newAccount = await accountsAPI.getAccountByEmail(userData.email);
      if (newAccount) {
        const { password: _, ...userWithoutPassword } = newAccount;
        authAPI.setCurrentUser(userWithoutPassword);
        setCurrentUser(userWithoutPassword);
        setIsLoggedIn(true);
        setIsAdmin(userWithoutPassword.admin_access === true);

        addNotification('Account created successfully!', 'success');
        return { success: true, user: userWithoutPassword };
      } else {
        throw new Error('Account created but failed to fetch user data');
      }
    } catch (error) {
      const errorMsg = error.message || 'Signup failed';
      setAuthError(errorMsg);
      addNotification(errorMsg, 'error');
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
      setCurrentUser(null);
      setIsLoggedIn(false);
      setIsAdmin(false);
      setCart([]);
      setQuantities({});
      addNotification('Logged out successfully', 'success');
    } catch (error) {
      const errorMsg = error.message || 'Logout failed';
      setAuthError(errorMsg);
      addNotification(errorMsg, 'error');
    }
  }, []);

  const updateAccountDetails = useCallback(async (accountId, updates) => {
    try {
      setAuthError(null);
      await accountsAPI.updateAccount(accountId, updates);
      const updatedUser = { ...currentUser, ...updates };
      setCurrentUser(updatedUser);
      authAPI.setCurrentUser(updatedUser);
      addNotification('Account updated successfully', 'success');
      return { success: true };
    } catch (error) {
      const errorMsg = error.message || 'Failed to update account';
      setAuthError(errorMsg);
      addNotification(errorMsg, 'error');
      throw error;
    }
  }, [currentUser]);

  // ==========================================
  // PRODUCTS METHODS
  // ==========================================
  const fetchProducts = useCallback(async (filters = {}) => {
    try {
      setProductsLoading(true);
      setProductsError(null);

      const queryFilters = {
        ...filters,
        category: filterCategory !== 'all' ? filterCategory : undefined,
        sort: sortBy,
      };

      const { products: fetchedProducts } = await productsAPI.getProducts(queryFilters);
      const enrichedProducts = (fetchedProducts || []).map(enrichProduct);
      setProducts(enrichedProducts);
    } catch (error) {
      const errorMsg = error.message || 'Failed to fetch products';
      setProductsError(errorMsg);
      console.error('Error fetching products:', error);
    } finally {
      setProductsLoading(false);
    }
  }, [filterCategory, sortBy]);

  const addProduct = useCallback(async (productData) => {
    try {
      setProductsError(null);
      console.log('[addProduct] Starting - isAdmin:', isAdmin);
      
      if (!isAdmin) {
        throw new Error('Only admins can add products');
      }

      console.log('[addProduct] Creating product with data:', productData);
      const response = await productsAPI.createProduct(productData);
      console.log('[addProduct] Product created successfully:', response);
      
      // Refresh products list
      console.log('[addProduct] Refreshing products list');
      await fetchProducts();
      console.log('[addProduct] Products refreshed');
      
      addNotification('Product added successfully', 'success');
      return response;
    } catch (error) {
      const errorMsg = error.message || 'Failed to add product';
      console.error('[addProduct] Error:', error);
      setProductsError(errorMsg);
      addNotification(errorMsg, 'error');
      throw error;
    }
  }, [isAdmin, fetchProducts]);

  const updateProduct = useCallback(async (productId, updates) => {
    try {
      setProductsError(null);
      if (!isAdmin) {
        throw new Error('Only admins can update products');
      }

      await productsAPI.updateProduct(productId, updates);
      setProducts(products.map(p => p.id === productId ? { ...p, ...updates } : p));
      addNotification('Product updated successfully', 'success');
      return { success: true };
    } catch (error) {
      const errorMsg = error.message || 'Failed to update product';
      setProductsError(errorMsg);
      addNotification(errorMsg, 'error');
      throw error;
    }
  }, [isAdmin, products]);

  const deleteProduct = useCallback(async (productId) => {
    try {
      setProductsError(null);
      if (!isAdmin) {
        throw new Error('Only admins can delete products');
      }

      await productsAPI.deleteProduct(productId);
      setProducts(products.filter(p => p.id !== productId));
      addNotification('Product deleted successfully', 'success');
      return { success: true };
    } catch (error) {
      const errorMsg = error.message || 'Failed to delete product';
      setProductsError(errorMsg);
      addNotification(errorMsg, 'error');
      throw error;
    }
  }, [isAdmin, products]);

  // ==========================================
  // CART METHODS
  // ==========================================
  const updateQuantity = useCallback((productId, amount) => {
    setQuantities(prev => ({
      ...prev,
      [productId]: Math.max(1, (prev[productId] || 1) + amount)
    }));
  }, []);

  const fetchCart = useCallback(async () => {
    try {
      setCartLoading(true);
      setCartError(null);
      if (!currentUser?.id) {
        setCart([]);
        return;
      }

      // Fetch cart from accounts/{userId}/cart subcollection
      const { cart: cartItems } = await cartAPI.getUserCart(currentUser.id);
      setCart(cartItems);
    } catch (error) {
      const errorMsg = error.message || 'Failed to load cart';
      setCartError(errorMsg);
      console.error('Error fetching cart:', error);
    } finally {
      setCartLoading(false);
    }
  }, [currentUser?.id]);

  const addToCart = useCallback(async (product, size = 2) => {
    try {
      setCartError(null);
      console.log('[addToCart] Starting add to cart:', { productId: product.id, product: product.name, size });
      
      if (!isLoggedIn) {
        addNotification('Please login to add items to cart', 'warning');
        throw new Error('User not logged in');
      }

      console.log('[addToCart] User logged in, currentUser:', currentUser?.id);

      const quantity = quantities[product.id] || 1;
      
      // Store productId, size, quantity in cart
      const cartItem = {
        productId: product.id,
        quantity,
        size: size || 2,
      };

      console.log('[addToCart] Cart item to add:', cartItem);

      // Check if same product with same size already exists in cart
      const existingItem = cart.find(item => item.productId === product.id && item.size === (size || 2));
      
      if (existingItem) {
        console.log('[addToCart] Item already in cart, updating quantity');
        // Update quantity instead of creating duplicate
        await cartAPI.updateCartItem(currentUser.id, existingItem.id, { quantity: existingItem.quantity + quantity });
      } else {
        // Add new item to Firebase
        console.log('[addToCart] Adding new item to cart');
        await cartAPI.addToCart(currentUser.id, cartItem);
      }

      // Update local state - fetch cart to get complete data with product details
      await fetchCart();

      setQuantities(prev => ({ ...prev, [product.id]: 1 }));
      addNotification(`${product.name} added to cart!`, 'success');
      return { success: true };
    } catch (error) {
      const errorMsg = error.message || 'Failed to add to cart';
      console.error('[addToCart] Error:', errorMsg, error);
      setCartError(errorMsg);
      throw error;
    }
  }, [isLoggedIn, currentUser, quantities, cart, fetchCart]);

  const removeFromCart = useCallback(async (productId) => {
    try {
      setCartError(null);
      if (!isLoggedIn) throw new Error('User not logged in');

      // Find cart item ID
      const cartItem = cart.find(item => item.productId === productId);
      if (!cartItem) throw new Error('Item not found in cart');

      // Remove from Firebase
      await cartAPI.removeFromCart(currentUser.id, cartItem.id);

      // Update local state
      setCart(cart.filter(item => item.productId !== productId));
      addNotification('Item removed from cart', 'success');
    } catch (error) {
      const errorMsg = error.message || 'Failed to remove from cart';
      setCartError(errorMsg);
      addNotification(errorMsg, 'error');
    }
  }, [isLoggedIn, currentUser, cart]);

  const updateCartItemQuantity = useCallback(async (productId, quantity) => {
    try {
      setCartError(null);
      if (!isLoggedIn) throw new Error('User not logged in');
      if (quantity <= 0) {
        await removeFromCart(productId);
        return;
      }

      const cartItem = cart.find(item => item.productId === productId);
      if (!cartItem) throw new Error('Item not found in cart');

      // Update in Firebase (only quantity)
      await cartAPI.updateCartItem(currentUser.id, cartItem.id, {
        quantity,
      });

      // Update local state
      const newSubtotal = (cartItem.price || 0) * quantity;
      setCart(cart.map(item =>
        item.productId === productId
          ? { ...item, quantity, subtotal: newSubtotal }
          : item
      ));
    } catch (error) {
      const errorMsg = error.message || 'Failed to update cart';
      setCartError(errorMsg);
      addNotification(errorMsg, 'error');
    }
  }, [isLoggedIn, currentUser, cart, removeFromCart]);

  const clearCart = useCallback(async () => {
    try {
      setCartError(null);
      if (!isLoggedIn) throw new Error('User not logged in');

      await cartAPI.clearCart(currentUser.id);
      setCart([]);
      addNotification('Cart cleared', 'success');
    } catch (error) {
      const errorMsg = error.message || 'Failed to clear cart';
      setCartError(errorMsg);
      addNotification(errorMsg, 'error');
    }
  }, [isLoggedIn, currentUser]);

  // ==========================================
  // ORDERS METHODS
  // ==========================================
  const fetchOrders = useCallback(async () => {
    try {
      if (!isLoggedIn || !currentUser?.id) {
        setOrdersError('User not logged in');
        return;
      }

      setOrdersLoading(true);
      setOrdersError(null);

      console.log('[fetchOrders] Fetching orders for user:', currentUser.id);
      const userOrders = await ordersAPI.getUserOrders(currentUser.id);
      console.log('[fetchOrders] Got orders:', userOrders);

      // Parse items if they're stored as JSON strings
      const parsedOrders = (userOrders || []).map(order => ({
        ...order,
        items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items,
        shippingaddress: order.shippingaddress || order.shippingAddress,
        shippingAddress: typeof order.shippingaddress === 'string' 
          ? JSON.parse(order.shippingaddress) 
          : order.shippingaddress || order.shippingAddress,
      }));

      setOrders(parsedOrders);
    } catch (error) {
      const errorMsg = error.message || 'Failed to fetch orders';
      console.error('[fetchOrders] Error:', error);
      setOrdersError(errorMsg);
    } finally {
      setOrdersLoading(false);
    }
  }, [isLoggedIn, currentUser?.id]);

  // ==========================================
  // UTILITY METHODS
  // ==========================================
  const getCartTotal = useCallback(() => {
    return cart.reduce((total, item) => total + item.subtotal, 0).toFixed(2);
  }, [cart]);

  const getCartItemCount = useCallback(() => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  }, [cart]);

  const addNotification = useCallback((message, type = 'info') => {
    switch(type) {
      case 'success':
        toast.success(message);
        break;
      case 'error':
        toast.error(message);
        break;
      case 'warning':
        toast.error(message);
        break;
      default:
        toast(message);
    }
  }, []);

  const removeNotification = useCallback((id) => {
    // No longer needed with react-hot-toast
  }, []);

  // ==========================================
  // CONTEXT VALUE
  // ==========================================
  const value = {
    // Auth State & Methods
    currentUser,
    isLoggedIn,
    isAdmin,
    authLoading,
    authError,
    login,
    loginWithGoogle,
    signup,
    logout,
    updateAccountDetails,

    // Products State & Methods
    products,
    productsLoading,
    productsError,
    sortBy,
    setSortBy,
    filterCategory,
    setFilterCategory,
    fetchProducts,
    addProduct,
    updateProduct,
    deleteProduct,

    // Cart State & Methods
    cart,
    cartLoading,
    cartError,
    quantities,
    updateQuantity,
    fetchCart,
    addToCart,
    removeFromCart,
    updateCartItemQuantity,
    clearCart,
    getCartTotal,
    getCartItemCount,

    // Orders State & Methods
    orders,
    ordersLoading,
    ordersError,
    fetchOrders,

    // UI State & Methods
    addNotification,
    darkMode,
    setDarkMode,
  };

  return (
    <BiscoobooContext.Provider value={value}>
      {children}
    </BiscoobooContext.Provider>
  );
};



export default BiscoobooContext;
