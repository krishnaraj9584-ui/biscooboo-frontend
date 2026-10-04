import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Plus, Check, Home, Building2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useBiscooboo } from '../components/context';

const EMPTY_ADDRESS_FORM = {
  label: 'Home',
  name: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  country: 'India',
  landmark: '',
};

const normalizeAddresses = (currentUser) => {
  if (!currentUser) {
    return [];
  }

  const savedAddresses = Array.isArray(currentUser.addresses) ? currentUser.addresses : [];

  if (savedAddresses.length > 0) {
    return savedAddresses;
  }

  if (currentUser.address || currentUser.city || currentUser.state || currentUser.zipCode || currentUser.country) {
    return [{
      id: 'default-address',
      label: 'Home',
      name: currentUser.name || '',
      phone: currentUser.phone || '',
      address: currentUser.address || '',
      city: currentUser.city || '',
      state: currentUser.state || '',
      zipCode: currentUser.zipCode || '',
      country: currentUser.country || 'India',
      landmark: currentUser.landmark || '',
    }];
  }

  return [];
};

const AddressSelection = () => {
  const navigate = useNavigate();
  const { currentUser, isLoggedIn, updateAccountDetails, addNotification, products } = useBiscooboo();
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(EMPTY_ADDRESS_FORM);
  const themeProduct = products && products.length > 0 ? products[0] : null;

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    const saved = normalizeAddresses(currentUser);
    setAddresses(saved);
    if (currentUser?.selectedAddress) {
      setSelectedAddressId(currentUser.selectedAddress.id || '');
    } else if (saved.length > 0) {
      setSelectedAddressId(saved[0].id);
    }
  }, [currentUser, isLoggedIn, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const persistSelectedAddress = async (address) => {
    if (!currentUser) return;

    const updatedUser = {
      ...currentUser,
      selectedAddress: address,
      addresses: addresses,
      name: currentUser.name || address.name || '',
      phone: currentUser.phone || address.phone || '',
      address: address.address || currentUser.address || '',
      city: address.city || currentUser.city || '',
      state: address.state || currentUser.state || '',
      zipCode: address.zipCode || currentUser.zipCode || '',
      country: address.country || currentUser.country || 'India',
      landmark: address.landmark || currentUser.landmark || '',
    };

    await updateAccountDetails(currentUser.id, updatedUser);
  };

  const handleSelectAddress = async (addressId) => {
    const chosenAddress = addresses.find(address => address.id === addressId);
    if (!chosenAddress) return;

    setSelectedAddressId(addressId);

    try {
      await persistSelectedAddress(chosenAddress);
      addNotification('Delivery address selected', 'success');
    } catch (error) {
      addNotification(error.message || 'Failed to update delivery address', 'error');
    }
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (!formData.name || !formData.phone || !formData.address || !formData.city || !formData.state || !formData.zipCode || !formData.country) {
        addNotification('Please fill all required address fields', 'error');
        return;
      }

      const newAddress = {
        id: `addr-${Date.now()}`,
        label: formData.label || 'Home',
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        country: formData.country,
        landmark: formData.landmark,
      };

      const updatedAddresses = [...addresses, newAddress];
      const updatedUser = {
        ...currentUser,
        addresses: updatedAddresses,
        selectedAddress: newAddress,
        name: currentUser?.name || newAddress.name,
        phone: currentUser?.phone || newAddress.phone,
        address: newAddress.address,
        city: newAddress.city,
        state: newAddress.state,
        zipCode: newAddress.zipCode,
        country: newAddress.country,
        landmark: newAddress.landmark,
      };

      await updateAccountDetails(currentUser.id, updatedUser);
      setAddresses(updatedAddresses);
      setSelectedAddressId(newAddress.id);
      setShowForm(false);
      setFormData(EMPTY_ADDRESS_FORM);
      addNotification('New address saved successfully', 'success');
      navigate('/cart');
    } catch (error) {
      addNotification(error.message || 'Failed to save address', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full text-white transition-colors duration-1000 ease-in-out"
      style={{
        backgroundColor: themeProduct?.bgColor || '#000000',
        backgroundImage: themeProduct ? `radial-gradient(circle at center, ${themeProduct.accentColor} 0%, ${themeProduct.bgColor} 80%)` : 'none',
      }}
    >
      <Navbar bgColor={themeProduct?.bgColor} accentColor={themeProduct?.accentColor} />

      <main className="container mx-auto px-6 py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          <div className="mb-8 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => navigate('/cart')}
              className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
            >
              <ArrowLeft size={18} />
              Back to cart
            </button>
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg font-semibold hover:bg-white/90 transition-all"
            >
              <Plus size={18} />
              Add address
            </button>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md p-6 md:p-8">
            <div className="mb-8">
              <p className="text-sm uppercase tracking-[0.2em] text-white/60">Delivery</p>
              <h1 className="text-4xl md:text-5xl font-black mt-2">Choose a delivery address</h1>
            </div>

            {!addresses.length ? (
              <div className="rounded-2xl border border-dashed border-white/20 p-8 text-center text-white/70">
                <MapPin className="mx-auto mb-4 text-white/50" size={40} />
                <p className="text-xl font-semibold mb-2">No saved addresses yet</p>
                <p className="text-sm text-white/60">Add your first delivery location to continue with checkout.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {addresses.map((address) => (
                  <button
                    key={address.id}
                    type="button"
                    onClick={() => handleSelectAddress(address.id)}
                    className={`w-full text-left rounded-2xl border p-5 transition-all ${
                      selectedAddressId === address.id
                        ? 'border-white bg-white/10 shadow-lg shadow-black/20'
                        : 'border-white/10 bg-black/10 hover:border-white/20 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-full bg-white/10 p-2">
                          {address.label?.toLowerCase().includes('office') || address.label?.toLowerCase().includes('work') ? (
                            <Building2 size={18} />
                          ) : (
                            <Home size={18} />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-lg font-bold">{address.label || 'Home'}</p>
                            {selectedAddressId === address.id && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-green-500/20 text-green-300 px-2 py-0.5 text-xs font-semibold">
                                <Check size={12} />
                                Selected
                              </span>
                            )}
                          </div>
                          <p className="text-white/80 mt-1 font-medium">{address.name}</p>
                          <p className="text-white/70 text-sm mt-2">
                            {address.address}
                          </p>
                          <p className="text-white/70 text-sm">
                            {address.city}, {address.state} - {address.zipCode}
                          </p>
                          <p className="text-white/70 text-sm">{address.country}</p>
                          {address.landmark && (
                            <p className="text-white/60 text-xs mt-1">Landmark: {address.landmark}</p>
                          )}
                          <p className="text-white/70 text-sm mt-2">Phone: {address.phone}</p>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {showForm && (
              <motion.form
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={handleSaveAddress}
                className="mt-8 rounded-2xl border border-white/10 bg-black/10 p-5 space-y-4"
              >
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Address Label</label>
                    <input
                      type="text"
                      name="label"
                      value={formData.label}
                      onChange={handleInputChange}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-white/40"
                      placeholder="Home / Office"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Full Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-white/40"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Phone *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-white/40"
                      placeholder="Phone number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Country *</label>
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-white/40"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Street address *</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-white/40"
                    placeholder="House no., street, area"
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
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-white/40"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">State *</label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-white/40"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">ZIP / PIN *</label>
                    <input
                      type="text"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleInputChange}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-white/40"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Landmark</label>
                  <input
                    type="text"
                    name="landmark"
                    value={formData.landmark}
                    onChange={handleInputChange}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-white/40"
                    placeholder="Nearby landmark"
                  />
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 rounded-lg border border-white/20 text-white/80 hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 rounded-lg bg-white text-black font-semibold hover:bg-white/90 transition-all disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save address'}
                  </button>
                </div>
              </motion.form>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default AddressSelection;
