import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Package, Calendar, DollarSign, Truck, CheckCircle, AlertCircle } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useBiscooboo } from '../components/context';


const Orders = () => {
  const navigate = useNavigate();
  const { currentUser, isLoggedIn, fetchOrders, orders, ordersLoading, ordersError, products } = useBiscooboo();
  const themeProduct = products && products.length > 0 ? products[0] : null;

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    fetchOrders();
  }, [isLoggedIn, navigate, fetchOrders]);

  const getStatusColor = (status) => {
    const statusMap = {
      pending: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      processing: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      shipped: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
      delivered: 'bg-green-500/20 text-green-300 border-green-500/30',
      cancelled: 'bg-red-500/20 text-red-300 border-red-500/30',
    };
    return statusMap[status?.toLowerCase()] || statusMap.pending;
  };

  const getStatusIcon = (status) => {
    const statusLower = status?.toLowerCase();
    if (statusLower === 'delivered') return <CheckCircle size={16} />;
    if (statusLower === 'shipped') return <Truck size={16} />;
    if (statusLower === 'cancelled') return <AlertCircle size={16} />;
    return <Package size={16} />;
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
      const dateObj = date.toDate ? date.toDate() : new Date(date);
      return dateObj.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'Invalid date';
    }
  };

  return (
    <div 
      className="min-h-screen w-full text-white transition-colors duration-1000 ease-in-out"
      style={{
        backgroundColor: themeProduct?.bgColor || '#000000',
        backgroundImage: themeProduct ? `radial-gradient(circle at center, ${themeProduct.accentColor} 0%, ${themeProduct.bgColor} 80%)` : 'none'
      }}
    >
      <Navbar bgColor={themeProduct?.bgColor} accentColor={themeProduct?.accentColor} />

      <main className="container mx-auto px-6 py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/account')}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ArrowLeft size={24} />
              </button>
              <div>
                <h1 className="text-4xl font-black">Order History</h1>
                <p className="text-white/60">View all your orders and their status</p>
              </div>
            </div>
          </div>

          {/* Error State */}
          {ordersError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex gap-3 items-start"
            >
              <AlertCircle className="text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-red-300 text-sm">{ordersError}</p>
            </motion.div>
          )}

          {/* Loading State */}
          {ordersLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="inline-block animate-spin">
                  <Package size={48} className="text-white/50" />
                </div>
                <p className="text-white/60 mt-4">Loading your orders...</p>
              </div>
            </div>
          ) : orders && orders.length > 0 ? (
            // Orders List
            <div className="space-y-4">
              {orders.map((order, idx) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden hover:border-white/20 transition-all"
                >
                  <div className="p-6">
                    {/* Order Header */}
                    <div className="flex items-start justify-between mb-4 gap-4 flex-col md:flex-row">
                      <div>
                        <h3 className="text-lg font-bold mb-2">Order #{order.id?.substring(0, 8).toUpperCase() || 'N/A'}</h3>
                        <div className="flex items-center gap-4 text-sm text-white/60">
                          <div className="flex items-center gap-1">
                            <Calendar size={14} />
                            {formatDate(order.createdAt)}
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign size={14} />
                            <span className="font-semibold text-white">${order.total?.toFixed(2) || '0.00'}</span>
                          </div>
                        </div>
                      </div>
                      <div className={`px-4 py-2 rounded-lg border flex items-center gap-2 text-sm font-semibold whitespace-nowrap ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        {order.status?.charAt(0).toUpperCase() + order.status?.slice(1).toLowerCase() || 'Pending'}
                      </div>
                    </div>

                    {/* Order Items */}
                    {order.items && order.items.length > 0 && (
                      <div className="mb-4 pb-4 border-t border-white/10">
                        <p className="text-sm text-white/60 mb-3">Items:</p>
                        <div className="space-y-2">
                          {order.items.map((item, itemIdx) => (
                            <div key={itemIdx} className="flex justify-between text-sm">
                              <div>
                                <p className="text-white font-medium">{item.name || 'Product'}</p>
                                <p className="text-white/50">Qty: {item.quantity}</p>
                              </div>
                              <p className="text-white font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Delivery Address */}
                    {order.shippingAddress && (
                      <div className="bg-white/5 rounded-lg p-4 text-sm">
                        <p className="text-white/60 mb-2">Delivery Address:</p>
                        <p className="text-white font-semibold">{order.shippingAddress.name}</p>
                        <p className="text-white/70">{order.shippingAddress.address}</p>
                        <p className="text-white/70">{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            // Empty State
            <div className="text-center py-16">
              <Package size={64} className="mx-auto text-white/30 mb-4" />
              <h3 className="text-xl font-bold mb-2">No Orders Yet</h3>
              <p className="text-white/60 mb-6">You haven't placed any orders yet.</p>
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 rounded-lg font-bold hover:bg-white/90 transition-all"
              >
                <Package size={18} />
                Start Shopping
              </Link>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default Orders;
