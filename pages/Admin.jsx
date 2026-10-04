import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Edit2, Trash2, Eye, EyeOff, AlertCircle, CheckCircle,
  ShoppingCart, Users, Package, TrendingUp, X, Mail, Shield, Trash,
  Truck, CheckCircle2, AlertTriangle, Bell, Archive
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useBiscooboo } from '../components/context';
import { accountsAPI, contactAPI, ordersAPI, notificationsAPI } from '../services/supabase-api';

const Admin = () => {
  const navigate = useNavigate();
  const {
    products,
    currentUser,
    isAdmin,
    addProduct,
    updateProduct,
    deleteProduct,
    addNotification,
  } = useBiscooboo();

  const [activeTab, setActiveTab] = useState('products');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  // Accounts State
  const [accounts, setAccounts] = useState([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);

  // Messages State
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyText, setReplyText] = useState('');

  // Orders State
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingOrderStatus, setUpdatingOrderStatus] = useState(false);

  // Notifications State
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    flavor: '',
    description: '',
    price: '',
    category: 'chocolate',
    mainImage: '',
    backgroundText: '',
    bgColor: '#1a0f0a',
    accentColor: '#4d3324',
    textColor: '#ffffff',
    decoImages: {
      topLeft: '',
      topRight: '',
      bottomRight: '',
    },
    showInMenu: true,
  });

  const themeProduct = products && products.length > 0 ? products[0] : null;

  React.useEffect(() => {
    if (!isAdmin) {
      navigate('/');
    } else {
      // Load accounts, messages, orders, and notifications when entering admin panel
      if (activeTab === 'accounts') fetchAccounts();
      if (activeTab === 'messages') fetchMessages();
      if (activeTab === 'orders') fetchAllOrders();
      if (activeTab === 'notifications') fetchAdminNotifications();
    }
  }, [isAdmin, navigate, activeTab]);

  // ==========================================
  // ACCOUNTS METHODS
  // ==========================================
  const fetchAccounts = async () => {
    try {
      setAccountsLoading(true);
      const { accounts: fetchedAccounts } = await accountsAPI.getAllAccounts();
      setAccounts(fetchedAccounts);
    } catch (err) {
      addNotification(err.message || 'Failed to fetch accounts', 'error');
    } finally {
      setAccountsLoading(false);
    }
  };

  const handleToggleAdmin = async (accountId, currentStatus) => {
    try {
      await accountsAPI.updateAdminAccess(accountId, !currentStatus);
      setAccounts(accounts.map(acc =>
        acc.id === accountId ? { ...acc, admin_access: !currentStatus } : acc
      ));
      addNotification('Admin access updated', 'success');
    } catch (err) {
      addNotification(err.message || 'Failed to update admin access', 'error');
    }
  };

  const handleDeleteAccount = async (accountId) => {
    if (accountId === currentUser.id) {
      addNotification('Cannot delete your own account', 'error');
      return;
    }
    if (window.confirm('Are you sure you want to delete this account?')) {
      try {
        await accountsAPI.deleteAccount(accountId);
        setAccounts(accounts.filter(acc => acc.id !== accountId));
        addNotification('Account deleted successfully', 'success');
      } catch (err) {
        addNotification(err.message || 'Failed to delete account', 'error');
      }
    }
  };

  // ==========================================
  // MESSAGES METHODS
  // ==========================================
  const fetchMessages = async () => {
    try {
      setMessagesLoading(true);
      const { messages: fetchedMessages } = await contactAPI.getAllMessages();
      setMessages(fetchedMessages);
    } catch (err) {
      addNotification(err.message || 'Failed to fetch messages', 'error');
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleMarkAsRead = async (messageId) => {
    try {
      await contactAPI.markMessageAsRead(messageId);
      setMessages(messages.map(msg =>
        msg.id === messageId ? { ...msg, read: true } : msg
      ));
      addNotification('Message marked as read', 'success');
    } catch (err) {
      addNotification(err.message || 'Failed to mark as read', 'error');
    }
  };

  const handleSendReply = async (messageId) => {
    if (!replyText.trim()) {
      addNotification('Please enter a reply', 'error');
      return;
    }
    try {
      await contactAPI.replyToMessage(messageId, replyText);
      setMessages(messages.map(msg =>
        msg.id === messageId ? { ...msg, replied: true, reply: replyText } : msg
      ));
      setReplyText('');
      setSelectedMessage(null);
      addNotification('Reply sent successfully', 'success');
    } catch (err) {
      addNotification(err.message || 'Failed to send reply', 'error');
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      try {
        await contactAPI.deleteMessage(messageId);
        setMessages(messages.filter(msg => msg.id !== messageId));
        setSelectedMessage(null);
        addNotification('Message deleted', 'success');
      } catch (err) {
        addNotification(err.message || 'Failed to delete message', 'error');
      }
    }
  };

  // ==========================================
  // ORDERS METHODS
  // ==========================================
  const fetchAllOrders = async () => {
    try {
      setOrdersLoading(true);
      const { orders: fetchedOrders } = await ordersAPI.getAllOrders();
      setOrders(fetchedOrders);
    } catch (err) {
      addNotification(err.message || 'Failed to fetch orders', 'error');
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (accountId, orderId, newStatus) => {
    try {
      setUpdatingOrderStatus(true);
      await ordersAPI.updateOrderStatus(orderId, newStatus);
      
      // Update local state
      const updatedOrders = orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      );
      setOrders(updatedOrders);
      
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
      
      addNotification('Order status updated successfully', 'success');
    } catch (err) {
      addNotification(err.message || 'Failed to update order status', 'error');
    } finally {
      setUpdatingOrderStatus(false);
    }
  };

  // ==========================================
  // NOTIFICATIONS METHODS
  // ==========================================
  const fetchAdminNotifications = async () => {
    try {
      setNotificationsLoading(true);
      const { notifications: fetchedNotifications } = await notificationsAPI.getAdminNotifications();
      setNotifications(fetchedNotifications);
    } catch (err) {
      addNotification(err.message || 'Failed to fetch notifications', 'error');
    } finally {
      setNotificationsLoading(false);
    }
  };

  const handleMarkNotificationAsRead = async (notificationId) => {
    try {
      await notificationsAPI.markAsRead(notificationId);
      setNotifications(notifications.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      ));
      if (selectedNotification?.id === notificationId) {
        setSelectedNotification({ ...selectedNotification, read: true });
      }
      addNotification('Notification marked as read', 'success');
    } catch (err) {
      addNotification(err.message || 'Failed to mark notification as read', 'error');
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      await notificationsAPI.deleteNotification(notificationId);
      setNotifications(notifications.filter(notif => notif.id !== notificationId));
      if (selectedNotification?.id === notificationId) {
        setSelectedNotification(null);
      }
      addNotification('Notification deleted', 'success');
    } catch (err) {
      addNotification(err.message || 'Failed to delete notification', 'error');
    }
  };

  // ==========================================
  // PRODUCTS METHODS
  // ==========================================
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDecoImageChange = (position, value) => {
    setFormData(prev => ({
      ...prev,
      decoImages: {
        ...prev.decoImages,
        [position]: value
      }
    }));
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setError('');

    try {
      console.log('[handleAddProduct] Form submitted');
      console.log('[handleAddProduct] Form data:', formData);
      
      // Only require fields that exist in the database
      if (!formData.name || !formData.price) {
        const errorMsg = 'Please fill in all required fields (Name, Price)';
        console.warn('[handleAddProduct] Validation failed:', errorMsg);
        setError(errorMsg);
        return;
      }
      
      console.log('Form Data showInMenu:', formData.showInMenu);
      // Ensure showInMenu is a boolean, not a string
      const productData = {
        name: formData.name,
        description: formData.description || null,
        flavor: formData.flavor || null,
        price: parseFloat(formData.price) || 0,
        category: formData.category || null,
        mainimage: formData.mainImage || null,
        decoimages: formData.decoImages || null,
      };

      console.log('[handleAddProduct] Product data to submit:', productData);

      if (editingProduct) {
        console.log('[handleAddProduct] Updating existing product:', editingProduct.id);
        await updateProduct(editingProduct.id, productData);
        setEditingProduct(null);
      } else {
        console.log('[handleAddProduct] Adding new product');
        await addProduct(productData);
      }

      setFormData({
        name: '',
        flavor: '',
        description: '',
        price: '',
        category: 'chocolate',
        mainImage: '',
        backgroundText: '',
        bgColor: '#1a0f0a',
        accentColor: '#4d3324',
        textColor: '#ffffff',
        decoImages: {
          topLeft: '',
          topRight: '',
          bottomRight: '',
        },
        showInMenu: true,
      });
      setShowAddModal(false);
      console.log('[handleAddProduct] Form reset and modal closed');
    } catch (err) {
      const errorMsg = err.message || 'Failed to save product';
      console.error('[handleAddProduct] Error:', err);
      setError(errorMsg);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct(productId);
      } catch (err) {
        setError(err.message || 'Failed to delete product');
      }
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      flavor: product.flavor || '',
      description: product.description || '',
      price: product.price || '',
      category: product.category || 'chocolate',
      mainImage: product.mainImage || '',
      backgroundText: product.backgroundText || '',
      bgColor: product.bgColor || '#1a0f0a',
      accentColor: product.accentColor || '#4d3324',
      textColor: product.textColor || '#ffffff',
      decoImages: {
        topLeft: product.decoImages?.topLeft || '',
        topRight: product.decoImages?.topRight || '',
        bottomRight: product.decoImages?.bottomRight || '',
      },
      showInMenu: product.showInMenu !== false,
    });
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingProduct(null);
    setError('');
    setFormData({
      name: '',
      flavor: '',
      description: '',
      price: '',
      category: 'chocolate',
      mainImage: '',
      backgroundText: '',
      bgColor: '#1a0f0a',
      accentColor: '#4d3324',
      textColor: '#ffffff',
      decoImages: {
        topLeft: '',
        topRight: '',
        bottomRight: '',
      },
      showInMenu: true,
    });
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.flavor?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#1a1a1a] to-[#2a2a2a] text-white">
      <Navbar bgColor={themeProduct?.bgColor} accentColor={themeProduct?.accentColor} />

      <main className="container mx-auto px-6 py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-8">
            <h1 className="text-5xl md:text-6xl font-black mb-2">Admin Dashboard</h1>
            <p className="text-white/60">Manage your Biscooboo store</p>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-4 mb-12">
            <motion.div
              whileHover={{ y: -5 }}
              className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm mb-1">Total Products</p>
                  <p className="text-3xl font-black">{products.length}</p>
                </div>
                <Package className="text-white/30" size={32} />
              </div>
            </motion.div>

            <motion.div
              whileHover={{ y: -5 }}
              className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm mb-1">Total Accounts</p>
                  <p className="text-3xl font-black">{accounts.length}</p>
                </div>
                <Users className="text-white/30" size={32} />
              </div>
            </motion.div>

            <motion.div
              whileHover={{ y: -5 }}
              className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm mb-1">Messages</p>
                  <p className="text-3xl font-black">{messages.length}</p>
                </div>
                <Mail className="text-white/30" size={32} />
              </div>
            </motion.div>

            <motion.div
              whileHover={{ y: -5 }}
              className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm mb-1">Unread Messages</p>
                  <p className="text-3xl font-black">{messages.filter(m => !m.read).length}</p>
                </div>
                <AlertCircle className="text-white/30" size={32} />
              </div>
            </motion.div>

            <motion.div
              whileHover={{ y: -5 }}
              className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm mb-1">Total Orders</p>
                  <p className="text-3xl font-black">{orders.length}</p>
                </div>
                <ShoppingCart className="text-white/30" size={32} />
              </div>
            </motion.div>

            <motion.div
              whileHover={{ y: -5 }}
              className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm mb-1">Unread Notifications</p>
                  <p className="text-3xl font-black">{notifications.filter(n => !n.read).length}</p>
                </div>
                <Bell className="text-white/30" size={32} />
              </div>
            </motion.div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-8 border-b border-white/10 overflow-x-auto">
            <button
              onClick={() => setActiveTab('products')}
              className={`px-6 py-3 font-bold border-b-2 transition-all whitespace-nowrap ${
                activeTab === 'products'
                  ? 'border-white text-white'
                  : 'border-transparent text-white/60 hover:text-white'
              }`}
            >
              Products
            </button>
            <button
              onClick={() => setActiveTab('accounts')}
              className={`px-6 py-3 font-bold border-b-2 transition-all whitespace-nowrap ${
                activeTab === 'accounts'
                  ? 'border-white text-white'
                  : 'border-transparent text-white/60 hover:text-white'
              }`}
            >
              Accounts
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              className={`px-6 py-3 font-bold border-b-2 transition-all whitespace-nowrap ${
                activeTab === 'messages'
                  ? 'border-white text-white'
                  : 'border-transparent text-white/60 hover:text-white'
              }`}
            >
              Messages
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-6 py-3 font-bold border-b-2 transition-all whitespace-nowrap ${
                activeTab === 'orders'
                  ? 'border-white text-white'
                  : 'border-transparent text-white/60 hover:text-white'
              }`}
            >
              Orders
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`px-6 py-3 font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'notifications'
                  ? 'border-white text-white'
                  : 'border-transparent text-white/60 hover:text-white'
              }`}
            >
              <Bell size={18} />
              Notifications
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </button>
          </div>

          {/* Products Tab */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder:text-white/40 focus:outline-none focus:border-white/40"
                />
                <button
                  onClick={() => {
                    setEditingProduct(null);
                    setFormData({
                      name: '',
                      flavor: '',
                      description: '',
                      price: '',
                      category: 'chocolate',
                      mainImage: '',
                      backgroundText: '',
                      bgColor: '#1a0f0a',
                      accentColor: '#4d3324',
                      textColor: '#ffffff',
                      decoImages: {
                        topLeft: '',
                        topRight: '',
                        bottomRight: '',
                      },
                      showInMenu: true,
                    });
                    setShowAddModal(true);
                  }}
                  className="flex items-center gap-2 bg-white text-black px-6 py-2 rounded-lg font-bold hover:bg-white/90 transition-all w-full md:w-auto justify-center"
                >
                  <Plus size={18} />
                  Add Product
                </button>
              </div>

              {/* Products Grid */}
              <div className="grid md:grid-cols-2 gap-6">
                {filteredProducts.map(product => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10 hover:border-white/20 transition-all"
                  >
                    <div className="flex gap-4">
                      <img
                        src={product.mainImage}
                        alt={product.name}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-1">{product.name}</h3>
                        <p className="text-white/60 text-sm mb-1">{product.flavor}</p>
                        <p className="text-white/50 text-xs mb-2">{product.backgroundText}</p>
                        <p className="font-bold text-xl mb-3">₹ {product.price}</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="flex-1 flex items-center justify-center gap-1 bg-white/10 hover:bg-white/20 text-white py-1 rounded text-sm transition-colors"
                          >
                            <Edit2 size={14} />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="flex-1 flex items-center justify-center gap-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 py-1 rounded text-sm transition-colors"
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Accounts Tab */}
          {activeTab === 'accounts' && (
            <div className="space-y-6">
              {accountsLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block">
                    <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-white/5 border-b border-white/10">
                      <tr>
                        <th className="text-left px-4 py-3 font-bold">Name</th>
                        <th className="text-left px-4 py-3 font-bold">Email</th>
                        <th className="text-left px-4 py-3 font-bold">Admin Access</th>
                        <th className="text-left px-4 py-3 font-bold">Joined</th>
                        <th className="text-left px-4 py-3 font-bold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {accounts.map((account) => (
                        <tr key={account.id} className="bg-white/5 hover:bg-white/10 transition-colors">
                          <td className="px-4 py-3">{account.name || 'N/A'}</td>
                          <td className="px-4 py-3 text-white/60">{account.email}</td>
                          <td className="px-4 py-3">
                            <div className="relative group inline-block">
                              <button
                                onClick={() => handleToggleAdmin(account.id, account.admin_access)}
                                className={`flex items-center gap-1 px-3 py-1 rounded text-sm font-semibold transition-all ${
                                  account.admin_access
                                    ? 'bg-green-500/20 text-green-400'
                                    : 'bg-white/10 text-white/60 hover:bg-white/20'
                                }`}
                              >
                                <Shield size={14} />
                                {account.admin_access ? 'Yes' : 'No'}
                              </button>
                              {/* Tooltip */}
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-black/90 backdrop-blur-md text-white text-xs font-semibold rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                {account.admin_access ? 'Remove admin access' : 'Grant admin access'}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-white/60 text-sm">
                            {account.createdAt ? new Date(account.createdAt).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-4 py-3">
                            <div className="relative group inline-block">
                              <button
                                onClick={() => handleDeleteAccount(account.id)}
                                disabled={account.id === currentUser.id}
                                className="text-red-400 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                <Trash size={16} />
                              </button>
                              {/* Tooltip */}
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-black/90 backdrop-blur-md text-white text-xs font-semibold rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                {account.id === currentUser.id ? 'Cannot delete your own account' : 'Delete account'}
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Messages Tab */}
          {activeTab === 'messages' && (
            <div className="grid md:grid-cols-3 gap-6">
              {/* Messages List */}
              <div className="md:col-span-1">
                {messagesLoading ? (
                  <div className="text-center py-8">
                    <div className="inline-block">
                      <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[600px] overflow-y-auto">
                    {messages.length === 0 ? (
                      <p className="text-white/60 text-center py-8">No messages</p>
                    ) : (
                      messages.map((message) => (
                        <motion.button
                          key={message.id}
                          onClick={() => setSelectedMessage(message)}
                          className={`w-full text-left p-4 rounded-lg transition-all border ${
                            selectedMessage?.id === message.id
                              ? 'bg-white/10 border-white/20'
                              : `border-white/10 ${
                                  message.read ? 'bg-white/5' : 'bg-blue-500/10 border-blue-500/30'
                                } hover:bg-white/10`
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            {!message.read && (
                              <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm truncate">{message.name}</p>
                              <p className="text-white/60 text-xs truncate">{message.subject}</p>
                              <p className="text-white/40 text-xs mt-1">
                                {new Date(message.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </motion.button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Message Details */}
              <div className="md:col-span-2">
                {selectedMessage ? (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10 space-y-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-2xl font-bold mb-2">{selectedMessage.subject}</h3>
                        <p className="text-white/60 mb-1">From: {selectedMessage.name}</p>
                        <p className="text-white/60 text-sm mb-1">Email: {selectedMessage.email}</p>
                        <p className="text-white/40 text-xs">
                          {new Date(selectedMessage.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {!selectedMessage.read && (
                          <button
                            onClick={() => handleMarkAsRead(selectedMessage.id)}
                            className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded text-sm hover:bg-blue-500/30 transition-colors"
                          >
                            Mark as Read
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteMessage(selectedMessage.id)}
                          className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded transition-colors"
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <p className="text-white/80 whitespace-pre-wrap">{selectedMessage.message}</p>
                    </div>

                    {selectedMessage.replied ? (
                      <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/20">
                        <p className="text-green-400 text-sm font-bold mb-2">✓ Replied</p>
                        <p className="text-white/80 whitespace-pre-wrap text-sm">{selectedMessage.reply}</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold">Send Reply</label>
                        <textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Type your reply..."
                          rows="4"
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder:text-white/40 focus:outline-none focus:border-white/40 resize-none"
                        />
                        <button
                          onClick={() => handleSendReply(selectedMessage.id)}
                          className="w-full px-4 py-2 bg-white text-black rounded-lg font-bold hover:bg-white/90 transition-all"
                        >
                          Send Reply
                        </button>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <div className="bg-white/5 backdrop-blur-md rounded-2xl p-12 border border-white/10 text-center">
                    <Mail size={48} className="mx-auto text-white/30 mb-4" />
                    <p className="text-white/60">Select a message to view details</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="grid md:grid-cols-3 gap-6">
              {/* Orders List */}
              <div className="md:col-span-1">
                {ordersLoading ? (
                  <div className="text-center py-8">
                    <div className="inline-block">
                      <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[600px] overflow-y-auto">
                    {orders.length === 0 ? (
                      <p className="text-white/60 text-center py-8">No orders yet</p>
                    ) : (
                      orders.map((order) => (
                        <motion.button
                          key={order.id}
                          onClick={() => setSelectedOrder(order)}
                          className={`w-full text-left p-4 rounded-lg transition-all border ${
                            selectedOrder?.id === order.id
                              ? 'bg-white/10 border-white/20'
                              : 'border-white/10 bg-white/5 hover:bg-white/10'
                          }`}
                        >
                          <div className="space-y-2">
                            <div className="flex items-start justify-between">
                              <p className="font-bold text-sm truncate">Order #{order.id?.substring(0, 8).toUpperCase()}</p>
                              <div className={`px-2 py-1 rounded text-xs font-bold whitespace-nowrap ${
                                order.status === 'processing' ? 'bg-blue-500/20 text-blue-300' :
                                order.status === 'shipped' ? 'bg-cyan-500/20 text-cyan-300' :
                                order.status === 'delivered' ? 'bg-green-500/20 text-green-300' :
                                'bg-red-500/20 text-red-300'
                              }`}>
                                {order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1).toLowerCase() : ""}
                              </div>
                            </div>
                            <p className="text-white/60 text-xs">{order.accountName}</p>
                            <p className="text-white/60 text-xs">₹ {order.total?.toFixed(2)}</p>
                          </div>
                        </motion.button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Order Details */}
              <div className="md:col-span-2">
                {selectedOrder ? (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10 space-y-4"
                  >
                    {/* Order Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-2xl font-bold mb-2">Order #{selectedOrder.id?.substring(0, 8).toUpperCase()}</h3>
                        <p className="text-white/60 mb-1">Customer: {selectedOrder.accountName}</p>
                        <p className="text-white/60 text-sm mb-1">Email: {selectedOrder.accountEmail}</p>
                        <p className="text-white/40 text-xs">
                          {selectedOrder.createdAt ? new Date(selectedOrder.createdAt.toDate ? selectedOrder.createdAt.toDate() : selectedOrder.createdAt).toLocaleString() : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-3xl font-bold">₹ {selectedOrder.total?.toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="h-[1px] bg-white/10"></div>

                    {/* Order Items */}
                    {selectedOrder.items && selectedOrder.items.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-bold mb-3">Order Items</h4>
                        {selectedOrder.items.map((item, idx) => (
                          <div key={idx} className="bg-white/5 rounded-lg p-3 flex justify-between items-start">
                            <div>
                              <p className="font-semibold">{item.name}</p>
                              <p className="text-white/60 text-sm">{item.flavor}</p>
                              <p className="text-white/50 text-xs">Qty: {item.quantity}</p>
                            </div>
                            <p className="font-semibold">₹ {(item.price * item.quantity).toFixed(2)}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Shipping Address */}
                    {selectedOrder.shippingAddress && (
                      <div className="space-y-3 border-t border-white/10 pt-4">
                        <h4 className="font-bold">Shipping Address</h4>
                        <div className="bg-white/5 rounded-lg p-4 space-y-1 text-sm">
                          <p className="font-semibold">{selectedOrder.shippingAddress.name}</p>
                          <p className="text-white/70">{selectedOrder.shippingAddress.address}</p>
                          <p className="text-white/70">{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.zipCode}</p>
                          <p className="text-white/70">{selectedOrder.shippingAddress.country}</p>
                          <p className="text-white/60 text-xs mt-2">Phone: {selectedOrder.shippingAddress.phone}</p>
                        </div>
                      </div>
                    )}

                    {/* Status Update */}
                    <div className="border-t border-white/10 pt-4 space-y-3">
                      <h4 className="font-bold">Update Order Status</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {['processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
                          <button
                            key={status}
                            onClick={() => handleUpdateOrderStatus(selectedOrder.accountId, selectedOrder.id, status)}
                            disabled={updatingOrderStatus || selectedOrder.status === status}
                            className={`px-3 py-2 rounded-lg font-semibold text-sm transition-all ${
                              selectedOrder.status === status
                                ? 'bg-white/20 text-white'
                                : 'bg-white/10 hover:bg-white/20 text-white/80 hover:text-white'
                            } disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1`}
                          >
                            {status === 'processing' && <AlertCircle size={14} />}
                            {status === 'shipped' && <Truck size={14} />}
                            {status === 'delivered' && <CheckCircle2 size={14} />}
                            {status === 'cancelled' && <AlertTriangle size={14} />}
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="bg-white/5 backdrop-blur-md rounded-2xl p-12 border border-white/10 text-center">
                    <ShoppingCart size={48} className="mx-auto text-white/30 mb-4" />
                    <p className="text-white/60">Select an order to view details</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              {notificationsLoading ? (
                <div className="text-center py-12">
                  <div className="inline-block">
                    <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="bg-white/5 backdrop-blur-md rounded-2xl p-12 border border-white/10 text-center">
                  <Bell size={48} className="mx-auto text-white/30 mb-4" />
                  <p className="text-white/60">No notifications yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notification, idx) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.05 }}
                      onClick={() => setSelectedNotification(notification)}
                      className={`p-6 rounded-xl border transition-all cursor-pointer ${
                        selectedNotification?.id === notification.id
                          ? 'bg-white/10 border-white/20'
                          : notification.read
                          ? 'bg-white/5 border-white/10 hover:bg-white/10'
                          : 'bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex-shrink-0">
                              {notification.type === 'new_order' ? (
                                <ShoppingCart className="text-blue-400" size={20} />
                              ) : notification.type === 'order_update' ? (
                                <Truck className="text-cyan-400" size={20} />
                              ) : (
                                <Bell className="text-white/60" size={20} />
                              )}
                            </div>
                            <div>
                              <h4 className="font-bold text-white">{notification.title}</h4>
                              {!notification.read && (
                                <span className="inline-block ml-2 px-2 py-0.5 bg-blue-500 text-white text-xs font-bold rounded">
                                  NEW
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="text-white/70 text-sm mb-2">{notification.message}</p>
                          <p className="text-white/40 text-xs">
                            {notification.createdAt ? new Date(notification.createdAt.toDate ? notification.createdAt.toDate() : notification.createdAt).toLocaleString() : 'N/A'}
                          </p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          {!notification.read && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkNotificationAsRead(notification.id);
                              }}
                              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded transition-colors"
                            >
                              <CheckCircle size={16} />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteNotification(notification.id);
                            }}
                            className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded transition-colors"
                          >
                            <Trash size={16} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Add/Edit Product Modal */}
          <AnimatePresence>
            {showAddModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-gradient-to-b from-[#1a1a1a] to-[#2a2a2a] border border-white/10 rounded-2xl p-8 max-w-3xl w-full max-h-[95vh] overflow-y-auto"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-3xl font-black">
                      {editingProduct ? 'Edit Product' : 'Add New Product'}
                    </h2>
                    <button
                      onClick={handleCloseModal}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <X size={24} />
                    </button>
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex gap-3 items-start"
                    >
                      <AlertCircle className="text-red-400 mt-0.5 flex-shrink-0" />
                      <p className="text-red-300 text-sm">{error}</p>
                    </motion.div>
                  )}

                  <form onSubmit={handleAddProduct} className="space-y-4">
                    {/* Basic Info Section */}
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <h3 className="font-bold mb-4 text-white/80">Basic Information</h3>
                      
                      <div>
                        <label className="block text-sm font-semibold mb-2">Product Name *</label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="e.g., CHOCO COOKIES"
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder:text-white/40 focus:outline-none focus:border-white/40"
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <div>
                          <label className="block text-sm font-semibold mb-2">Flavor</label>
                          <input
                            type="text"
                            name="flavor"
                            value={formData.flavor}
                            onChange={handleInputChange}
                            placeholder="e.g., chocolate flavour"
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder:text-white/40 focus:outline-none focus:border-white/40"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold mb-2">Category</label>
                          <select
                            name="category"
                            value={formData.category}
                            onChange={handleInputChange}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-white/40"
                          >
                            <option value="chocolate">Chocolate</option>
                            <option value="fruit">Fruit</option>
                            <option value="cream">Cream</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                      </div>

                      <div className="mt-4">
                        <label className="block text-sm font-semibold mb-2">Description</label>
                        <textarea
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          placeholder="Product description..."
                          rows="3"
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder:text-white/40 focus:outline-none focus:border-white/40 resize-none"
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <div>
                          <label className="block text-sm font-semibold mb-2">Price (₹) *</label>
                          <input
                            type="number"
                            name="price"
                            value={formData.price}
                            onChange={handleInputChange}
                            placeholder="100"
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder:text-white/40 focus:outline-none focus:border-white/40"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold mb-2">Show in Menu</label>
                          <select
                            name="showInMenu"
                            value={formData.showInMenu ? 'true' : 'false'}
                            onChange={(e) => setFormData(prev => ({ 
                              ...prev, 
                              showInMenu: e.target.value === 'true' 
                            }))}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-white/40"
                          >
                            <option value="true">Yes</option>
                            <option value="false">No</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Images Section */}
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <h3 className="font-bold mb-4 text-white/80">Images</h3>
                      
                      <div>
                        <label className="block text-sm font-semibold mb-2">Main Product Image *</label>
                        <input
                          type="url"
                          name="mainImage"
                          value={formData.mainImage}
                          onChange={handleInputChange}
                          placeholder="https://example.com/image.jpg"
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder:text-white/40 focus:outline-none focus:border-white/40"
                        />
                        {formData.mainImage && (
                          <div className="mt-3 rounded-lg overflow-hidden">
                            <img
                              src={formData.mainImage}
                              alt="Preview"
                              className="w-full h-32 object-cover"
                              onError={(e) => {
                                e.target.src = 'https://via.placeholder.com/300x300?text=Invalid+Image';
                              }}
                            />
                          </div>
                        )}
                      </div>

                      <div className="mt-4">
                        <label className="block text-sm font-semibold mb-2">Background Text</label>
                        <input
                          type="text"
                          name="backgroundText"
                          value={formData.backgroundText}
                          onChange={handleInputChange}
                          placeholder="e.g., CHOCOLATE"
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder:text-white/40 focus:outline-none focus:border-white/40"
                        />
                      </div>

                      <div className="mt-4">
                        <label className="block text-sm font-semibold mb-3">Decorative Images (URLs)</label>
                        <div className="grid md:grid-cols-3 gap-3">
                          <div>
                            <label className="text-xs text-white/60 mb-1 block">Top Left</label>
                            <input
                              type="url"
                              value={formData.decoImages.topLeft}
                              onChange={(e) => handleDecoImageChange('topLeft', e.target.value)}
                              placeholder="https://..."
                              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder:text-white/40 focus:outline-none focus:border-white/40 text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-white/60 mb-1 block">Top Right</label>
                            <input
                              type="url"
                              value={formData.decoImages.topRight}
                              onChange={(e) => handleDecoImageChange('topRight', e.target.value)}
                              placeholder="https://..."
                              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder:text-white/40 focus:outline-none focus:border-white/40 text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-white/60 mb-1 block">Bottom Right</label>
                            <input
                              type="url"
                              value={formData.decoImages.bottomRight}
                              onChange={(e) => handleDecoImageChange('bottomRight', e.target.value)}
                              placeholder="https://..."
                              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder:text-white/40 focus:outline-none focus:border-white/40 text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Colors Section */}
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <h3 className="font-bold mb-4 text-white/80">Colors</h3>
                      
                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-semibold mb-2">Background Color</label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              name="bgColor"
                              value={formData.bgColor}
                              onChange={handleInputChange}
                              className="w-12 h-10 rounded-lg cursor-pointer"
                            />
                            <input
                              type="text"
                              value={formData.bgColor}
                              onChange={handleInputChange}
                              name="bgColor"
                              className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-white/40"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold mb-2">Accent Color</label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              name="accentColor"
                              value={formData.accentColor}
                              onChange={handleInputChange}
                              className="w-12 h-10 rounded-lg cursor-pointer"
                            />
                            <input
                              type="text"
                              value={formData.accentColor}
                              onChange={handleInputChange}
                              name="accentColor"
                              className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-white/40"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold mb-2">Text Color</label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              name="textColor"
                              value={formData.textColor}
                              onChange={handleInputChange}
                              className="w-12 h-10 rounded-lg cursor-pointer"
                            />
                            <input
                              type="text"
                              value={formData.textColor}
                              onChange={handleInputChange}
                              name="textColor"
                              className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-white/40"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                      <button
                        type="submit"
                        className="flex-1 bg-white text-black py-3 rounded-lg font-bold hover:bg-white/90 transition-all"
                      >
                        {editingProduct ? 'Update Product' : 'Add Product'}
                      </button>
                      <button
                        type="button"
                        onClick={handleCloseModal}
                        className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 rounded-lg font-bold transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>
    </div>
  );
};

export default Admin;
