import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Plus, Minus, ChevronDown, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useBiscooboo } from '../components/context';

const Shop = () => {
  const navigate = useNavigate();
  const {
    products,
    productsLoading,
    productsError,
    sortBy,
    setSortBy,
    filterCategory,
    setFilterCategory,
    fetchProducts,
    quantities,
    updateQuantity,
    addToCart,
    isLoggedIn,
    addNotification,
  } = useBiscooboo();

  const [showSortMenu, setShowSortMenu] = useState(false);
  const [selectedSizes, setSelectedSizes] = useState({});
  const themeProduct = products && products.length > 0 ? products[0] : null;

  useEffect(() => {
    fetchProducts();
  }, [sortBy, filterCategory, fetchProducts]);

  const handleAddToCart = async (product) => {
    try {
      if (!isLoggedIn) {
        addNotification('Please login to add items to cart', 'warning');
        setTimeout(() => {
          navigate('/login');
        }, 800);
        return;
      }
      const selectedSize = selectedSizes[product.id] || 2;
      await addToCart(product, selectedSize);
      const quantity = quantities[product.id] || 1;
      addNotification(`${product.name} (${selectedSize} pcs x${quantity}) added to cart!`, 'success');
    } catch (error) {
      console.error('Error adding to cart:', error);
      addNotification(`Failed to add ${product.name} to cart`, 'error');
    }
  };

  const calculatePrice = (basePrice, quantity, size = 2) => {
    let price = 0;
    
    // Handle both string (e.g., "₹ 250/-") and numeric (e.g., 250) prices
    if (typeof basePrice === 'string') {
      price = parseFloat(basePrice.replace(/[^\d.]/g, '') || 0);
    } else if (typeof basePrice === 'number') {
      price = basePrice;
    }
    
    // Apply size multiplier: 2 pcs = 1x, 4 pcs = 2x, 6 pcs = 3x
    const sizeMultiplier = size / 2;
    return (price * quantity * sizeMultiplier).toFixed(2);
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
          <h1 className="text-5xl md:text-6xl font-black mb-4 uppercase tracking-tight">
            Shop Cookies
          </h1>
          <p className="text-xl text-white/60 mb-12">
            Choose from our delicious selection of premium cookies
          </p>

          {/* Error Display */}
          {productsError && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl flex gap-3 items-start"
            >
              <AlertCircle className="text-red-400 mt-1 flex-shrink-0" />
              <p className="text-red-300">{productsError}</p>
            </motion.div>
          )}

          {/* Filters & Sort Section */}
          <div className="flex flex-col md:flex-row gap-4 mb-12 items-start md:items-center justify-between">
            {/* Filter */}
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => setFilterCategory('all')}
                className={`px-4 py-2 rounded-full font-semibold transition-all ${
                  filterCategory === 'all'
                    ? 'bg-white text-black'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterCategory('chocolate')}
                className={`px-4 py-2 rounded-full font-semibold transition-all ${
                  filterCategory === 'chocolate'
                    ? 'bg-white text-black'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                Chocolate
              </button>
              <button
                onClick={() => setFilterCategory('fruit')}
                className={`px-4 py-2 rounded-full font-semibold transition-all ${
                  filterCategory === 'fruit'
                    ? 'bg-white text-black'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                Fruit
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-full text-white hover:bg-white/20 transition-all flex items-center gap-2"
              >
                Sort: {sortBy === 'name' ? 'Name' : sortBy === 'price-low' ? 'Price: Low to High' : 'Price: High to Low'}
                <ChevronDown size={16} />
              </button>

              {showSortMenu && (
                <div className="absolute right-0 top-full mt-2 bg-black/90 backdrop-blur-md rounded-lg border border-white/20 overflow-hidden z-10">
                  <button
                    onClick={() => {
                      setSortBy('name');
                      setShowSortMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-white/10 transition-colors text-white"
                  >
                    Name (A-Z)
                  </button>
                  <button
                    onClick={() => {
                      setSortBy('price-low');
                      setShowSortMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-white/10 transition-colors text-white"
                  >
                    Price: Low to High
                  </button>
                  <button
                    onClick={() => {
                      setSortBy('price-high');
                      setShowSortMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-white/10 transition-colors text-white"
                  >
                    Price: High to Low
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Products Grid */}
          {productsLoading ? (
            <div className="text-center text-white/60 py-20">
              <div className="inline-block">
                <div style={{
                  fontSize: '2.5rem',
                  animation: 'bounce 1s infinite, spin 2s linear infinite',
                  marginBottom: '1rem'
                }}>🍪</div>
                <p className="mt-4 text-lg">Loading products...</p>
              </div>
              <style>{`
                @keyframes bounce {
                  0%, 100% { transform: translateY(0); }
                  50% { transform: translateY(-10px); }
                }
                @keyframes spin {
                  from { transform: rotate(0deg); }
                  to { transform: rotate(360deg); }
                }
              `}</style>
            </div>
          ) : products && products.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-8 mb-16">
              {products.map((product) => {
                const quantity = quantities[product.id] || 1;
                const selectedSize = selectedSizes[product.id] || 2;
                const totalPrice = calculatePrice(product.price, quantity, selectedSize);
                
                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-all"
                  >
                    <div className="flex flex-col gap-6">
                      <div className="w-full">
                        <img
                          src={product.mainImage}
                          alt={product.name}
                          className="w-full h-40 object-cover rounded-xl"
                        />
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <h2 className="text-2xl font-bold mb-2">{product.name}</h2>
                          <p className="text-white/60 mb-2 text-sm">{product.description}</p>
                          <p className="text-white/50 text-xs">{product.flavor}</p>
                        </div>

                        <div className="border-t border-white/20 pt-4">
                          <p className="text-white/60 text-xs mb-2 font-semibold">Price</p>
                          <span className="text-3xl font-black">{product.price}</span>
                        </div>

                        <div className="border-t border-white/20 pt-4">
                          <p className="text-white font-bold mb-3 text-sm block">📦 SELECT PIECE SIZE:</p>
                          <div className="flex gap-2 flex-wrap">
                            {[2, 4, 6].map((size) => (
                              <button
                                key={size}
                                onClick={() => setSelectedSizes(prev => ({...prev, [product.id]: size}))}
                                className={`px-5 py-2 font-bold text-base rounded-lg transition-all ${
                                  selectedSize === size
                                    ? 'bg-yellow-400 text-black shadow-lg'
                                    : 'bg-white/20 text-white border-2 border-white/40'
                                }`}
                              >
                                {size} pcs
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="border-t border-white/20 pt-4">
                          <p className="text-white/60 text-xs mb-1">
                            Total: ₹ {totalPrice}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-4 border-t border-white/20 pt-4">
                          <div className="flex items-center bg-white/10 rounded-full px-3 py-2 gap-2">
                            <button
                              onClick={() => updateQuantity(product.id, -1)}
                              className="p-1 hover:bg-white/20 rounded transition-colors"
                              title="Decrease quantity"
                            >
                              <Minus size={16} />
                            </button>
                            <span className="w-8 text-center font-bold text-sm">
                              {quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(product.id, 1)}
                              className="p-1 hover:bg-white/20 rounded transition-colors"
                              title="Increase quantity"
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                          
                          <button
                            onClick={() => {
                              addNotification('Item added to cart!', 'success');
                              setTimeout(() => {
                                navigate('/cart');
                              }, 800);
                            }}
                            className="flex items-center gap-2 bg-yellow-400 text-black px-6 py-2 rounded-full font-bold hover:bg-yellow-300 transition-all text-sm"
                          >
                            <ShoppingCart size={18} />
                            Add to Cart
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20">
              <ShoppingCart size={64} className="mx-auto text-white/30 mb-4" />
              <h2 className="text-2xl font-bold mb-2">No products found</h2>
              <p className="text-white/60">Try changing your filters</p>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default Shop;
