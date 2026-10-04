import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Mail, Phone, MapPin, Send, ShoppingCart, AlertCircle } from 'lucide-react';
import Navbar from './components/Navbar';
import { useBiscooboo } from './components/context';
import { contactAPI } from './services/supabase-api';

const App = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Refs for scroll navigation
  const menuRef = useRef(null);
  const shopRef = useRef(null);
  const aboutRef = useRef(null);
  const contactRef = useRef(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [contactFormData, setContactFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [contactLoading, setContactLoading] = useState(false);
  const [contactSuccess, setContactSuccess] = useState('');
  const [contactError, setContactError] = useState('');

  const { products, productsLoading, productsError, addToCart, isLoggedIn, addNotification } = useBiscooboo();

  console.log('[App] Render - productsLoading:', productsLoading, 'products:', products?.length);

  // Update navbar refs globally
  useEffect(() => {
    window.scrollRefs = { menuRef, shopRef, aboutRef, contactRef };
  }, []);

  // Handle scroll to section when navigating from other pages
  useEffect(() => {
    if (location.state?.scrollTo) {
      const sectionRef = location.state.scrollTo;
      setTimeout(() => {
        window.scrollRefs[sectionRef]?.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [location.state]);

  if (productsLoading) {
    console.log('[App] Showing loading state');
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-black">
        <div className="text-white text-center">
          <h1 className="text-3xl font-bold mb-4">Loading Biscooboo...</h1>
          <div className="flex justify-center">
            <span style={{
              fontSize: '3rem',
              animation: 'bounce 1s infinite, spin 2s linear infinite',
            }}>🍪</span>
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
      </div>
    );
  }

  if (!products || products.length === 0) {
    console.log('[App] Showing no products - Error:', productsError);
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-black">
        <div className="text-white text-center">
          <h1 className="text-3xl font-bold mb-4">No products available</h1>
          <p className="text-white/60 mb-4">Products: {products?.length || 0}</p>
          <p className="text-white/60 mb-4">Check if your Supabase database is connected and has products.</p>
          {productsError && <p className="text-red-400 text-sm">{productsError}</p>}
        </div>
      </div>
    );
  }

  console.log('[App] Rendering full page with', products.length, 'products');
  const currentProduct = products[currentIndex];
  const themeProduct = products[0];
  const getTextSize = (text) => {
    const length = text.length;
    if (length <= 10) return { sm: '18vw', md: '20vw', lg: '22vw' };
    if (length <= 15) return { sm: '12vw', md: '14vw', lg: '16vw' };
    if (length <= 25) return { sm: '9vw', md: '11vw', lg: '13vw' };
    return { sm: '12vw', md: '14vw', lg: '16vw' };
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % products.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + products.length) % products.length);
  };

  const handleAddToCart = (product) => {
    if (!isLoggedIn) {
      addNotification('Please login to add items to cart', 'warning');
      setTimeout(() => {
        navigate('/login');
      }, 800);
      return;
    }
    addToCart(product);
    addNotification(`${product.name} added to cart!`, 'success');
  };

  const handleContactChange = (e) => {
    const { name, value } = e.target;
    setContactFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setContactSuccess('');
    setContactError('');
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setContactLoading(true);
    setContactError('');
    setContactSuccess('');

    try {
      if (!isLoggedIn) {
        addNotification('Please login before sending a message', 'warning');
        setTimeout(() => {
          navigate('/login');
        }, 800);
        setContactLoading(false);
        return;
      }

      if (!contactFormData.name || !contactFormData.email || !contactFormData.subject || !contactFormData.message) {
        setContactError('Please fill in all fields');
        setContactLoading(false);
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(contactFormData.email)) {
        setContactError('Please enter a valid email address');
        setContactLoading(false);
        return;
      }

      await contactAPI.sendContactForm(contactFormData);
      setContactSuccess('Thank you for your message! We will get back to you soon.');
      setContactFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      setContactError(error.message || 'Failed to send message. Please try again later.');
    } finally {
      setContactLoading(false);
    }
  };



  return (
    <div className="w-full">
      <Navbar bgColor={currentProduct?.bgColor || '#3d2f29'} accentColor={currentProduct?.accentColor || '#D4B79F'} />

      {/* SECTION 1: MENU / HOME CAROUSEL */}
      <div 
        ref={menuRef}
        className="min-h-screen w-full relative overflow-hidden flex flex-col transition-colors duration-1000 ease-in-out"
        style={{ 
          backgroundColor: currentProduct.bgColor,
          backgroundImage: `radial-gradient(circle at center, ${currentProduct.accentColor} 0%, ${currentProduct.bgColor} 80%)`
        }}
      >
        <main className="flex-1 relative flex items-center justify-center">
          
          {/* Background Decorative Images */}
          <AnimatePresence mode="wait">
            <div key={currentProduct.id + "-deco"} className="absolute inset-0 pointer-events-none">
              {currentProduct.decoImages?.topLeft && (
                <motion.img 
                  initial={{ opacity: 0, x: -50, y: -50, rotate: -20 }}
                  animate={{ opacity: 1, x: 0, y: 0, rotate: 0 }}
                  exit={{ opacity: 0, x: -50, y: -50 }}
                  transition={{ duration: 0.8 }}
                  src={currentProduct.decoImages.topLeft}
                  className="absolute -top-12 left-4 sm:-top-16 sm:left-8 md:-top-20 md:left-12 lg:-top-8 lg:left-16 w-[140px] h-[140px] sm:w-[220px] sm:h-[220px] md:w-[320px] md:h-[320px] lg:w-[380px] lg:h-[380px] z-10 object-contain" 
                />
              )}
              {currentProduct.decoImages?.topRight && (
                <motion.img 
                  initial={{ opacity: 0, x: 50, y: -50, rotate: 20 }}
                  animate={{ opacity: 1, x: 0, y: 0, rotate: 0 }}
                  exit={{ opacity: 0, x: 50, y: -50 }}
                  transition={{ duration: 0.8, delay: 0.1 }}
                  src={currentProduct.decoImages.topRight} 
                  className="absolute -top-8 right-20 sm:-top-12 sm:right-32 md:-top-16 md:right-40 lg:-top-12 lg:right-48 w-[120px] h-[120px] sm:w-[170px] sm:h-[170px] md:w-[220px] md:h-[220px] lg:w-[280px] lg:h-[280px] z-10 object-contain" 
                />
              )}
              {currentProduct.decoImages?.bottomRight && (
                <motion.img 
                  initial={{ opacity: 0, x: 50, y: 50, rotate: -10 }}
                  animate={{ opacity: 1, x: 0, y: 0, rotate: 0 }}
                  exit={{ opacity: 0, x: 50, y: 50 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  src={currentProduct.decoImages.bottomRight} 
                  className="absolute -bottom-8 right-20 sm:-bottom-12 sm:right-32 md:-bottom-16 md:right-40 lg:-bottom-20 lg:right-48 w-[120px] h-[120px] sm:w-[170px] sm:h-[170px] md:w-[220px] md:h-[220px] lg:w-[280px] lg:h-[280px] z-10 object-contain" 
                />
              )}
            </div>
          </AnimatePresence>



          {/* Central Main Biscuit Image */}
          <div className="relative z-10 mt-6 sm:mt-8 md:mt-10 px-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentProduct.id + "-mainimage"}
                initial={{ scale: 0.8, opacity: 0, rotate: 50 }}
                animate={{ 
                  scale: 1, 
                  opacity: 1, 
                  rotate: 0,
                  y: [0, -20, 0],
                }}
                exit={{ scale: 1.2, opacity: 0, rotate: 50 }}
                transition={{ 
                  scale: { duration: 0.8, ease: "easeOut" },
                  opacity: { duration: 0.8, ease: "easeOut" },
                  rotate: { duration: 0.8, ease: "easeOut" },
                  y: { duration: 4, ease: "easeInOut", repeat: Infinity }
                }}
                className="w-[280px] h-[280px] sm:w-[350px] sm:h-[350px] md:w-[450px] md:h-[450px] lg:w-[550px] lg:h-[550px] rounded-full overflow-hidden"
              >
                <img 
                  src={currentProduct.mainImage}
                  alt={currentProduct.name}
                  className="w-full h-full object-cover shadow-[0_10px_10px_rgba(0,0,0,0.8)]"
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        {/* Bottom Layout - Info Left, Carousel Right */}
        <div className="relative z-20 container mx-auto px-6 pb-12 flex flex-col md:flex-row items-end justify-between gap-8">
          
          {/* Product Info (Left Bottom) */}
          <div className="md:max-w-md w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentProduct.id + "-content"}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="text-white"
              >
                <h2 className="text-4xl font-black leading-none mb-4 uppercase tracking-tight">
                  {currentProduct.name}
                </h2>
                <p className="text-sm leading-relaxed text-white/60 mb-8 max-w-sm">
                  {currentProduct.description}
                </p>
                
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => handleAddToCart(currentProduct)}
                    className="px-6 py-3 bg-white text-black font-bold rounded-full hover:bg-white/90 transition-all uppercase tracking-wider text-sm"
                  >
                    Add to Cart
                  </button>
                  <div className="text-3xl font-black italic">{currentProduct.price}</div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Carousel & Thumbnails (Right Bottom) */}
          <div className="flex flex-col items-end gap-6">
            <div className="flex gap-4">
              <button 
                onClick={handlePrev}
                className="p-3 border-2 border-white/20 rounded-full text-white hover:bg-white hover:text-black transition-all"
              >
                <ChevronLeft size={24} />
              </button>
              <button 
                onClick={handleNext}
                className="p-3 border-2 border-white/20 rounded-full text-white hover:bg-white hover:text-black transition-all"
              >
                <ChevronRight size={24} />
              </button>
            </div>

            <div className="flex gap-2 p-2 bg-black/20 backdrop-blur-md rounded-2xl border border-white/5">
              {products.map((p, idx) => (
                <div key={p.id} className="group relative">
                  <button
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-20 h-20 rounded-xl overflow-hidden transition-all duration-500 ${currentIndex === idx ? 'scale-110 ring-2 ring-white shadow-2xl' : 'opacity-40 hover:opacity-100 grayscale hover:grayscale-0'}`}
                  >
                    <img src={p.mainImage} alt={p.name} className="w-full h-full object-cover" />
                  </button>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-black/80 backdrop-blur-md text-white text-xs font-semibold rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    {p.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: FEATURED SHOP */}
      <div 
        ref={shopRef}
        className="min-h-screen w-full text-white transition-colors duration-1000 ease-in-out"
        style={{
          backgroundColor: themeProduct?.bgColor || '#000000',
          backgroundImage: themeProduct ? `radial-gradient(circle at center, ${themeProduct.accentColor} 0%, ${themeProduct.bgColor} 80%)` : 'none'
        }}
      >
        <div className="container mx-auto px-6 py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-6xl font-black mb-4 uppercase tracking-tight">
              Featured Cookies
            </h1>
            <p className="text-xl text-white/60 mb-12">
              Discover our most popular premium cookies
            </p>

            {/* Featured Products Grid - Only 2 Products */}
            <div className="grid md:grid-cols-2 gap-8 mb-16">
              {products.slice(0, 2).map((product) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-all group"
                >
                  <div className="w-full h-64 mb-6 overflow-hidden rounded-xl">
                    <img 
                      src={product.mainImage} 
                      alt={product.name} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">{product.name}</h2>
                      <p className="text-white/60 text-sm mb-2">{product.description}</p>
                      <p className="text-white/50 text-xs">{product.flavor}</p>
                    </div>
                    
                    <div>
                      <p className="text-white/60 text-sm mb-2">Price</p>
                      <span className="text-3xl font-black">{product.price}</span>
                    </div>
                    
                    <button 
                      onClick={() => handleAddToCart(product)}
                      className="w-full flex items-center justify-center gap-2 bg-white text-black px-6 py-3 rounded-full font-bold hover:bg-white/90 transition-all text-sm"
                    >
                      <ShoppingCart size={18} />
                      Add to Cart
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* View More Button */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex justify-center"
            >
              <Link
                to="/shop"
                className="px-8 py-4 bg-white text-black font-bold rounded-full hover:bg-white/90 transition-all uppercase tracking-wider text-lg"
              >
                View All Products
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* SECTION 3: ABOUT */}
      <div 
        ref={aboutRef}
        className="min-h-screen w-full text-white transition-colors duration-1000 ease-in-out"
        style={{
          backgroundColor: themeProduct?.bgColor || '#000000',
          backgroundImage: themeProduct ? `radial-gradient(circle at center, ${themeProduct.accentColor} 0%, ${themeProduct.bgColor} 80%)` : 'none'
        }}
      >
        <div className="container mx-auto px-6 py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-6xl font-black mb-8 uppercase tracking-tight">
              About Biscooboo
            </h1>
            
            <div className="grid md:grid-cols-2 gap-12 mb-16">
              <div>
                <h2 className="text-3xl font-bold mb-6">Our Story</h2>
                <p className="text-lg text-white/80 leading-relaxed mb-4">
                  Biscooboo was founded with a simple mission: to create premium cookies that bring joy to every bite. We believe in using only the finest natural ingredients without any compromises.
                </p>
                <p className="text-lg text-white/80 leading-relaxed mb-4">
                  Each cookie is crafted with care and passion, ensuring that every customer experiences the perfect blend of taste, texture, and quality.
                </p>
                <p className="text-lg text-white/80 leading-relaxed">
                  From our humble beginnings, we've grown into a beloved cookie brand trusted by cookie enthusiasts across the region.
                </p>
              </div>

              <div>
                <h2 className="text-3xl font-bold mb-6">Our Values</h2>
                <ul className="space-y-4">
                  <li className="flex items-start gap-4">
                    <span className="text-2xl">🥄</span>
                    <div>
                      <h3 className="font-bold text-xl mb-2">Quality</h3>
                      <p className="text-white/80">Premium ingredients sourced responsibly</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <span className="text-2xl">♥️</span>
                    <div>
                      <h3 className="font-bold text-xl mb-2">Care</h3>
                      <p className="text-white/80">Handcrafted with love and attention to detail</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <span className="text-2xl">🌱</span>
                    <div>
                      <h3 className="font-bold text-xl mb-2">Sustainability</h3>
                      <p className="text-white/80">Eco-friendly practices in all our operations</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10">
              <h2 className="text-3xl font-bold mb-6">Why Choose Biscooboo?</h2>
              <div className="grid md:grid-cols-3 gap-8">
                <div>
                  <h3 className="text-xl font-bold mb-4">✨ Premium Quality</h3>
                  <p className="text-white/80">Only the finest natural ingredients in every batch</p>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-4">🎯 Perfect Taste</h3>
                  <p className="text-white/80">Carefully crafted recipes tested to perfection</p>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-4">📦 Fresh Delivery</h3>
                  <p className="text-white/80">Made fresh and delivered with care to your door</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* SECTION 4: CONTACT */}
      <div 
        ref={contactRef}
        className="min-h-screen w-full text-white transition-colors duration-1000 ease-in-out"
        style={{
          backgroundColor: themeProduct?.bgColor || '#000000',
          backgroundImage: themeProduct ? `radial-gradient(circle at center, ${themeProduct.accentColor} 0%, ${themeProduct.bgColor} 80%)` : 'none'
        }}
      >
        <div className="container mx-auto px-6 py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-6xl font-black mb-4 uppercase tracking-tight">
              Get In Touch
            </h1>
            <p className="text-xl text-white/60 mb-16">
              We'd love to hear from you. Send us a message!
            </p>

            <div className="grid md:grid-cols-2 gap-16 mb-16">
              {/* Contact Information */}
              <div>
                <h2 className="text-3xl font-bold mb-8">Contact Information</h2>
                
                <div className="space-y-8">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex gap-4"
                  >
                    <Mail size={32} className="text-white/60 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-bold text-lg mb-2">Email</h3>
                      <p className="text-white/80 hover:text-white transition-colors cursor-pointer">biscooboocookies@gmail.com</p>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex gap-4"
                  >
                    <Phone size={32} className="text-white/60 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-bold text-lg mb-2">Phone</h3>
                      <p className="text-white/80 hover:text-white transition-colors cursor-pointer">soon</p>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex gap-4"
                  >
                    <MapPin size={32} className="text-white/60 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-bold text-lg mb-2">Location</h3>
                      <p className="text-white/80">
                        Biscooboo- Hyderabad<br />

                      </p>
                    </div>
                  </motion.div>
                </div>

                <div className="mt-12 p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
                  <h3 className="font-bold text-lg mb-4">Business Hours</h3>
                  <ul className="space-y-2 text-white/80">
                    <li>Monday - Friday: 10:00 AM - 6:00 PM</li>
                    <li>Saturday: 10:00 AM - 4:00 PM</li>
                    <li>Sunday: Closed</li>
                  </ul>
                </div>
              </div>

              {/* Contact Form */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                {contactSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400"
                  >
                    {contactSuccess}
                  </motion.div>
                )}

                {contactError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400"
                  >
                    {contactError}
                  </motion.div>
                )}

                <form onSubmit={handleContactSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold mb-2">Name</label>
                    <input
                      type="text"
                      name="name"
                      value={contactFormData.name}
                      onChange={handleContactChange}
                      required
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-white/50 transition-colors"
                      placeholder="Your name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={contactFormData.email}
                      onChange={handleContactChange}
                      required
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-white/50 transition-colors"
                      placeholder="your@email.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2">Subject</label>
                    <input
                      type="text"
                      name="subject"
                      value={contactFormData.subject}
                      onChange={handleContactChange}
                      required
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-white/50 transition-colors"
                      placeholder="How can we help?"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2">Message</label>
                    <textarea
                      name="message"
                      value={contactFormData.message}
                      onChange={handleContactChange}
                      required
                      rows="6"
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-white/50 transition-colors resize-none"
                      placeholder="Your message..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={contactLoading}
                    className="w-full bg-white text-black py-3 rounded-lg font-bold hover:bg-white/90 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send size={18} className="group-hover:translate-x-1 transition-transform" />
                    {contactLoading ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};


export default App;


