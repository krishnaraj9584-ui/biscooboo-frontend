import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, MapPin, Edit2, Save, X, LogOut, AlertCircle } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useBiscooboo } from '../components/context';

const Account = () => {
  const navigate = useNavigate();
  const { currentUser, isLoggedIn, logout, updateAccountDetails, addNotification, products } = useBiscooboo();
  const themeProduct = products && products.length > 0 ? products[0] : null;

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    address: currentUser?.address || '',
    city: currentUser?.city || '',
    state: currentUser?.state || '',
    zipCode: currentUser?.zipCode || '',
    country: currentUser?.country || '',
  });

  React.useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
    }
  }, [isLoggedIn, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');

    try {
      // Validate required fields
      if (!formData.name || !formData.address || !formData.city || !formData.state || !formData.zipCode || !formData.country) {
        setError('Please fill in all required fields (Name, Address, City, State, ZIP Code, and Country are mandatory)');
        setLoading(false);
        return;
      }

      await updateAccountDetails(currentUser.id, formData);
      setIsEditing(false);
    } catch (err) {
      setError(err.message || 'Failed to update account');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      await logout();
      navigate('/');
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
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center border-2 border-white/20">
                <User size={32} />
              </div>
              <div>
                <h1 className="text-4xl font-black">Account Details</h1>
                <p className="text-white/60">Manage your profile information</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-2 rounded-lg transition-colors"
            >
              <LogOut size={18} />
              Logout
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

          <div className="grid md:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="md:col-span-2">
              <div className="bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Personal Information</h2>
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      <Edit2 size={16} />
                      Edit
                    </button>
                  )}
                </div>

                {isEditing ? (
                  // Edit Mode
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">Full Name *</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder:text-white/40 focus:outline-none focus:border-white/40 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2">Email *</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        disabled
                        className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white/50 opacity-60 cursor-not-allowed"
                      />
                      <p className="text-xs text-white/40 mt-1">Email cannot be changed</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2">Phone</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="+91 00000 00000"
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder:text-white/40 focus:outline-none focus:border-white/40 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2">Address *</label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="Street address"
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder:text-white/40 focus:outline-none focus:border-white/40 transition-colors"
                      />
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-semibold mb-2">City *</label>
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          placeholder="City"
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder:text-white/40 focus:outline-none focus:border-white/40 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2">State *</label>
                        <input
                          type="text"
                          name="state"
                          value={formData.state}
                          onChange={handleInputChange}
                          placeholder="State"
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder:text-white/40 focus:outline-none focus:border-white/40 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2">ZIP Code *</label>
                        <input
                          type="text"
                          name="zipCode"
                          value={formData.zipCode}
                          onChange={handleInputChange}
                          placeholder="000000"
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder:text-white/40 focus:outline-none focus:border-white/40 transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2">Country *</label>
                      <input
                        type="text"
                        name="country"
                        value={formData.country}
                        onChange={handleInputChange}
                        placeholder="Country"
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder:text-white/40 focus:outline-none focus:border-white/40 transition-colors"
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={handleSave}
                        disabled={loading}
                        className="flex-1 flex items-center justify-center gap-2 bg-white text-black py-2 rounded-lg font-bold hover:bg-white/90 transition-all disabled:opacity-50"
                      >
                        <Save size={18} />
                        {loading ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setError('');
                        }}
                        className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg font-bold transition-colors"
                      >
                        <X size={18} />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div className="space-y-4">
                    {/* Address Incomplete Warning */}
                    {(!formData.address || !formData.city || !formData.state || !formData.zipCode || !formData.country) && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg flex gap-3 items-start"
                      >
                        <AlertCircle className="text-amber-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-amber-300 font-semibold text-sm">Incomplete Address</p>
                          <p className="text-amber-300/70 text-xs mt-1">You need to complete your address information before placing an order.</p>
                        </div>
                      </motion.div>
                    )}

                    <div>
                      <p className="text-white/60 text-sm mb-1">Full Name</p>
                      <p className="text-lg font-semibold">{formData.name || 'N/A'}</p>
                    </div>

                    <div>
                      <p className="text-white/60 text-sm mb-1">Email</p>
                      <p className="text-lg font-semibold flex items-center gap-2">
                        <Mail size={16} /> {formData.email}
                      </p>
                    </div>

                    <div>
                      <p className="text-white/60 text-sm mb-1">Phone</p>
                      <p className="text-lg font-semibold flex items-center gap-2">
                        <Phone size={16} /> {formData.phone || 'Not provided'}
                      </p>
                    </div>

                    <div>
                      <p className="text-white/60 text-sm mb-1">Address</p>
                      <p className="text-lg font-semibold flex items-center gap-2">
                        <MapPin size={16} /> {formData.address || 'Not provided'}
                      </p>
                    </div>

                    {(formData.city || formData.state || formData.zipCode || formData.country) && (
                      <div>
                        <p className="text-white/60 text-sm mb-1">Location</p>
                        <p className="text-lg font-semibold">
                          {formData.city || ''}{formData.city && formData.state ? ', ' : ''}{formData.state || ''} {formData.zipCode || ''}
                          {formData.country && `, ${formData.country}`}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Account Status */}
              <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                <h3 className="font-bold mb-4">Account Status</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/60">Status</span>
                    <span className="font-semibold text-green-400">Active</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Role</span>
                    <span className="font-semibold capitalize">{currentUser?.role || 'Customer'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Member Since</span>
                    <span className="font-semibold">
                      {currentUser?.createdAt 
                        ? new Date(currentUser.createdAt).toLocaleDateString()
                        : 'N/A'
                      }
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Links */}
              <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                <h3 className="font-bold mb-4">Quick Links</h3>
                <div className="space-y-2">
                  <Link
                    to="/shop"
                    className="block px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm"
                  >
                    Shop Cookies
                  </Link>
                  <Link
                    to="/cart"
                    className="block px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm"
                  >
                    My Cart
                  </Link>
                  <Link
                    to="/orders"
                    className="block px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm"
                  >
                    Order History
                  </Link>
                  {currentUser?.role === 'admin' && (
                    <Link
                      to="/admin"
                      className="block px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm"
                    >
                      Admin Dashboard
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Account;
