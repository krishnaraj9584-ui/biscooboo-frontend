import React from 'react';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import { useBiscooboo } from '../components/context';

const About = () => {
  const { products } = useBiscooboo();
  const themeProduct = products && products.length > 0 ? products[0] : null;

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
      </main>
    </div>
  );
};

export default About;
