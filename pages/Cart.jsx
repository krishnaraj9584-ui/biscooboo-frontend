import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ChevronLeft,
  AlertCircle,
  Tag
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useBiscooboo } from '../components/context';
import { ordersAPI, promoCodesAPI } from '../services/supabase-api';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const Cart = () => {
  const navigate = useNavigate();

  const {
    cart,
    cartLoading,
    cartError,
    removeFromCart,
    updateCartItemQuantity,
    clearCart,
    isLoggedIn,
    currentUser,
    fetchCart,
    products,
    addNotification,
  } = useBiscooboo();

  const themeProduct = products && products.length > 0
    ? products[0]
    : null;

  const [processingCheckout, setProcessingCheckout] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState('');
  const [selectedPcs, setSelectedPcs] = useState({});

  // Check API URL
  useEffect(() => {
    console.log('API_URL:', API_URL);

    if (!API_URL) {
      console.error(
        'VITE_API_URL is missing. Add it to your frontend .env.local and Vercel environment variables.'
      );
    }
  }, []);

  // Load cart when user logs in
  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
    } else if (currentUser?.id) {
      fetchCart();
    }
  }, [
    isLoggedIn,
    currentUser?.id,
    navigate,
    fetchCart
  ]);

  // -----------------------------
  // EMAIL TEMPLATE
  // -----------------------------
  const buildEmailTemplate = (orderData) => {
    const itemsRows = orderData.items.map(item => `
      <tr>
        <td style="padding:10px; border-bottom:1px solid #eee;">
          <div style="display:flex; align-items:center; gap:10px;">

            <img
              src="${item.image || 'https://via.placeholder.com/60'}"
              style="width:60px; height:60px; object-fit:cover; border-radius:6px;"
            />

            <div>
              <div style="font-weight:bold;">
                ${item.name}
              </div>

              <div style="font-size:12px; color:#555;">
                Flavor: ${item.flavor || 'N/A'}<br/>
                Size: ${item.size || 2} pcs
              </div>
            </div>

          </div>
        </td>

        <td style="padding:10px; border-bottom:1px solid #eee; text-align:center;">
          ${item.quantity}
        </td>

        <td style="padding:10px; border-bottom:1px solid #eee; text-align:right;">
          ₹${Number(item.price).toFixed(2)}
        </td>

        <td style="padding:10px; border-bottom:1px solid #eee; text-align:right; font-weight:bold;">
          ₹${(
            Number(item.price) * Number(item.quantity)
          ).toFixed(2)}
        </td>
      </tr>
    `).join('');

    return `
      <div style="font-family:Arial,sans-serif;background:#f6f6f6;padding:20px;">

        <div style="max-width:650px;margin:auto;background:white;padding:20px;border-radius:10px;">

          <h2 style="margin-bottom:5px;">
            🛒 Thank You for Your Order
          </h2>

          <p style="color:#555;">
            We'll send tracking info once your order ships.
          </p>

          <hr/>

          <h3 style="margin-bottom:10px;">
            Order #${orderData.orderId}
          </h3>

          <table
            width="100%"
            cellspacing="0"
            cellpadding="0"
            style="border-collapse:collapse;"
          >
            <thead>
              <tr style="background:#f0f0f0;">
                <th style="padding:10px;text-align:left;">
                  Product
                </th>

                <th style="padding:10px;text-align:center;">
                  Qty
                </th>

                <th style="padding:10px;text-align:right;">
                  Price
                </th>

                <th style="padding:10px;text-align:right;">
                  Subtotal
                </th>
              </tr>
            </thead>

            <tbody>
              ${itemsRows}
            </tbody>
          </table>

          <div style="margin-top:20px;">

            <p style="display:flex;justify-content:space-between;">
              <span>Shipping</span>
              <span>₹${Number(orderData.shipping || 0).toFixed(2)}</span>
            </p>

            <p style="display:flex;justify-content:space-between;">
              <span>Taxes</span>
              <span>₹${Number(orderData.tax || 0).toFixed(2)}</span>
            </p>

            <hr/>

            <p style="display:flex;justify-content:space-between;font-size:18px;font-weight:bold;">
              <span>Total</span>
              <span>₹${Number(orderData.total || 0).toFixed(2)}</span>
            </p>

          </div>

          <hr/>

          <p style="font-size:12px;color:#777;">
            Sent to <strong>${orderData.email}</strong><br/>
            You received this email because you placed an order.
          </p>

        </div>
      </div>
    `;
  };

  // -----------------------------
  // PRICE PARSER
  // -----------------------------
  const parsePrice = (price) => {
    if (typeof price === 'number') {
      return price;
    }

    if (typeof price === 'string') {
      const parsed = parseFloat(
        price.replace(/[^\d.]/g, '')
      );

      return Number.isNaN(parsed) ? 0 : parsed;
    }

    return 0;
  };

  // -----------------------------
  // CART SUBTOTAL
  // -----------------------------
  const calculateCartSubtotal = () => {
    return cart.reduce((total, item) => {
      const basePrice = parsePrice(item.price);

      const selectedSize =
        selectedPcs[item.productId] ||
        item.size ||
        2;

      const pricePerUnit =
        basePrice * (selectedSize / 2);

      return total +
        pricePerUnit * Number(item.quantity);
    }, 0);
  };

  // -----------------------------
  // DISCOUNT
  // -----------------------------
  const calculateDiscount = () => {
    if (!appliedPromo) {
      return 0;
    }

    const subtotal = calculateCartSubtotal();

    if (appliedPromo.discountType === 'percentage') {
      return (
        subtotal *
        Number(appliedPromo.discount)
      ) / 100;
    }

    return Math.min(
      Number(appliedPromo.discount) || 0,
      subtotal
    );
  };

  // -----------------------------
  // FINAL TOTAL
  // -----------------------------
  const calculateFinalTotal = () => {
    const subtotal = calculateCartSubtotal();
    const discount = calculateDiscount();

    return Math.max(
      0,
      subtotal - discount
    );
  };

  // -----------------------------
  // CHECKOUT
  // -----------------------------
  const handleCheckout = async () => {
    if (processingCheckout) {
      return;
    }

    setProcessingCheckout(true);

    try {
      // Check login
      if (!currentUser?.id) {
        addNotification(
          'Please login to proceed with checkout',
          'warning'
        );

        setProcessingCheckout(false);

        setTimeout(() => {
          navigate('/login');
        }, 800);

        return;
      }

      // Check API URL
      if (!API_URL) {
        throw new Error(
          'VITE_API_URL is not configured.'
        );
      }

      // Check Razorpay
      if (!window.Razorpay) {
        throw new Error(
          'Razorpay SDK is not loaded. Please check your Razorpay script.'
        );
      }

      // -----------------------------
      // SELECT ADDRESS
      // -----------------------------
      const selectedAddress =
        currentUser?.selectedAddress || {
          name: currentUser?.name || 'N/A',
          phone: currentUser?.phone || 'N/A',
          address: currentUser?.address || '',
          city: currentUser?.city || '',
          state: currentUser?.state || '',
          zipCode: currentUser?.zipCode || '',
          country: currentUser?.country || 'India',
        };

      // -----------------------------
      // VALIDATE ADDRESS
      // -----------------------------
      if (
        !selectedAddress.address ||
        !selectedAddress.city ||
        !selectedAddress.state ||
        !selectedAddress.zipCode ||
        !selectedAddress.country
      ) {
        addNotification(
          'Please add or select a delivery address before placing an order',
          'error'
        );

        setProcessingCheckout(false);

        setTimeout(() => {
          navigate('/address-selection');
        }, 1200);

        return;
      }

      // -----------------------------
      // CALCULATE TOTAL
      // -----------------------------
      const subtotal = calculateCartSubtotal();
      const discount = calculateDiscount();
      const finalTotal = calculateFinalTotal();

      // Razorpay amount in paise
      const amountInPaise = Math.round(
        finalTotal * 100
      );

      if (amountInPaise < 100) {
        throw new Error(
          'Minimum order amount is ₹1.'
        );
      }

      // -----------------------------
      // PREPARE ORDER DATA
      // -----------------------------
      const orderData = {
        items: cart.map(item => {
          const selectedSize =
            selectedPcs[item.productId] ||
            item.size ||
            2;

          const basePrice =
            parsePrice(item.price);

          const price =
            basePrice *
            (selectedSize / 2);

          return {
            productId: item.productId,
            name: item.name,
            flavor: item.flavor || null,
            size: selectedSize,
            price,
            quantity: Number(item.quantity),
            subtotal:
              price *
              Number(item.quantity),
            image:
              item.mainImage ||
              item.image ||
              null,
          };
        }),

        subtotal,

        discount,

        promoCode:
          appliedPromo?.code || null,

        total: finalTotal,

        status: 'processing',

        shippingAddress: {
          name:
            selectedAddress.name ||
            currentUser.name ||
            'N/A',

          email:
            currentUser.email ||
            'N/A',

          phone:
            selectedAddress.phone ||
            currentUser.phone ||
            'N/A',

          address:
            selectedAddress.address ||
            'N/A',

          city:
            selectedAddress.city ||
            'N/A',

          state:
            selectedAddress.state ||
            'N/A',

          zipCode:
            selectedAddress.zipCode ||
            'N/A',

          country:
            selectedAddress.country ||
            'N/A',
        },
      };

      console.log(
        'Creating Razorpay order:',
        amountInPaise
      );

      // -----------------------------
      // STEP 1
      // CREATE RAZORPAY ORDER
      // -----------------------------
      const { data } = await axios.post(
        `${API_URL}/create-order`,
        {
          amount: amountInPaise,
          currency: 'INR',
          receipt: `biscooboo_${Date.now()}`
        }
      );

      if (!data?.id) {
        throw new Error(
          'Backend did not return a Razorpay order ID.'
        );
      }

      console.log(
        'Razorpay order created:',
        data.id
      );

      // -----------------------------
      // RAZORPAY KEY
      // -----------------------------
      const razorpayKeyId =
        import.meta.env
          .VITE_RAZORPAY_KEY_ID;

      if (!razorpayKeyId) {
        throw new Error(
          'Razorpay Key ID is not configured.'
        );
      }

      // -----------------------------
      // STEP 2
      // RAZORPAY OPTIONS
      // -----------------------------
      const options = {
        key: razorpayKeyId,

        amount: data.amount,

        currency: data.currency || 'INR',

        name: 'Biscooboo 🍪',

        description: 'Order Payment',

        order_id: data.id,

        handler: async function (response) {
          try {
            console.log(
              'Razorpay payment response:',
              response
            );

            // -----------------------------
            // STEP 3
            // VERIFY PAYMENT
            // -----------------------------
            const verificationResponse =
              await axios.post(
                `${API_URL}/verify-payment`,
                {
                  razorpay_order_id:
                    response.razorpay_order_id,

                  razorpay_payment_id:
                    response.razorpay_payment_id,

                  razorpay_signature:
                    response.razorpay_signature,
                }
              );

            if (
              !verificationResponse.data
                ?.verified
            ) {
              addNotification(
                'Payment verification failed. Please contact support.',
                'error'
              );

              setProcessingCheckout(false);
              return;
            }

            console.log(
              'Payment verified successfully'
            );

            // -----------------------------
            // STEP 4
            // SAVE ORDER TO SUPABASE
            // -----------------------------
            const result =
              await ordersAPI.createOrder(
                currentUser.id,
                {
                  ...orderData,

                  paymentId:
                    response.razorpay_payment_id,

                  razorpayOrderId:
                    response.razorpay_order_id,

                  status: 'confirmed',
                }
              );

            console.log(
              'Order saved:',
              result
            );

            // -----------------------------
            // STEP 5
            // SEND EMAIL
            // -----------------------------
            try {
              const emailContent =
                buildEmailTemplate({
                  orderId: result.orderId,
                  email: currentUser.email,
                  items: orderData.items,
                  shipping: 0,
                  tax: 0,
                  total: orderData.total,
                });

              await axios.post(
                `${API_URL}/send-order-email`,
                {
                  email: currentUser.email,
                  subject:
                    `Order #${result.orderId}`,
                  message: emailContent,
                }
              );
            } catch (emailError) {
              // Don't fail the order if email fails
              console.error(
                'Email sending failed:',
                emailError
              );
            }

            // -----------------------------
            // STEP 6
            // PROMO USAGE
            // -----------------------------
            if (appliedPromo?.id) {
              try {
                await promoCodesAPI
                  .incrementPromoCodeUsage(
                    appliedPromo.id
                  );
              } catch (promoError) {
                console.error(
                  'Promo usage update failed:',
                  promoError
                );
              }
            }

            // -----------------------------
            // STEP 7
            // CLEAR CART
            // -----------------------------
            await clearCart();

            addNotification(
              'Payment successful & order placed!',
              'success'
            );

            navigate('/orders');

          } catch (error) {
            console.error(
              'Payment completion error:',
              error
            );

            addNotification(
              `Failed to complete order: ${
                error.response?.data?.error ||
                error.message
              }`,
              'error'
            );

            setProcessingCheckout(false);
          }
        },

        prefill: {
          name:
            currentUser.name || '',

          email:
            currentUser.email || '',

          contact:
            currentUser.phone || '',
        },

        theme: {
          color: '#000000',
        },

        modal: {
          ondismiss: function () {
            console.log(
              'Razorpay checkout closed'
            );

            setProcessingCheckout(false);
          },
        },
      };

      // -----------------------------
      // STEP 8
      // OPEN RAZORPAY
      // -----------------------------
      const razorpay =
        new window.Razorpay(options);

      razorpay.on(
        'payment.failed',
        function (response) {
          console.error(
            'Razorpay payment failed:',
            response
          );

          addNotification(
            response.error?.description ||
              'Payment failed. Please try again.',
            'error'
          );

          setProcessingCheckout(false);
        }
      );

      razorpay.open();

    } catch (error) {
      console.error(
        'Checkout error:',
        error
      );

      const backendError =
        error.response?.data?.error;

      addNotification(
        `Failed to proceed with checkout: ${
          backendError || error.message
        }`,
        'error'
      );

      setProcessingCheckout(false);
    }
  };

  // -----------------------------
  // APPLY PROMO
  // -----------------------------
  const handleApplyPromoCode = async () => {
    if (!promoCode.trim()) {
      setPromoError(
        'Please enter a promo code'
      );
      return;
    }

    setPromoLoading(true);
    setPromoError('');

    try {
      const promo =
        await promoCodesAPI.validatePromoCode(
          promoCode.trim()
        );

      setAppliedPromo(promo);
      setPromoCode('');

      addNotification(
        `Promo code "${promo.code}" applied successfully!`,
        'success'
      );

    } catch (error) {
      setPromoError(
        error.message
      );

      addNotification(
        error.message,
        'error'
      );

    } finally {
      setPromoLoading(false);
    }
  };

  // -----------------------------
  // REMOVE PROMO
  // -----------------------------
  const removePromoCode = () => {
    setAppliedPromo(null);
    setPromoCode('');
    setPromoError('');

    addNotification(
      'Promo code removed',
      'info'
    );
  };

  return (
    <div
      className="min-h-screen w-full text-white transition-colors duration-1000 ease-in-out"
      style={{
        backgroundColor:
          themeProduct?.bgColor ||
          '#000000',

        backgroundImage:
          themeProduct
            ? `radial-gradient(circle at center, ${themeProduct.accentColor} 0%, ${themeProduct.bgColor} 80%)`
            : 'none'
      }}
    >
      <Navbar
        bgColor={themeProduct?.bgColor}
        accentColor={themeProduct?.accentColor}
      />

      <main className="container mx-auto px-6 py-16 md:py-24">

        <motion.div
          initial={{
            opacity: 0,
            y: 20
          }}
          animate={{
            opacity: 1,
            y: 0
          }}
          transition={{
            duration: 0.6
          }}
        >

          <Link
            to="/"
            className="flex items-center gap-2 text-white/60 hover:text-white mb-8 transition-colors w-fit"
          >
            <ChevronLeft size={20} />
            Back to Shop
          </Link>

          <h1 className="text-5xl md:text-6xl font-black mb-4 uppercase tracking-tight flex items-center gap-4">
            <ShoppingCart size={40} />
            Shopping Cart
          </h1>

          {cartError && (
            <motion.div
              initial={{
                opacity: 0,
                y: -20
              }}
              animate={{
                opacity: 1,
                y: 0
              }}
              className="mt-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl flex gap-3 items-start"
            >
              <AlertCircle className="text-red-400 mt-1 flex-shrink-0" />

              <p className="text-red-300">
                {cartError}
              </p>
            </motion.div>
          )}

          {cartLoading ? (

            <div className="text-center text-white/60 py-20">

              <div className="inline-block">

                <div
                  style={{
                    fontSize: '2.5rem',
                    animation:
                      'bounce 1s infinite, spin 2s linear infinite',
                    marginBottom: '1rem'
                  }}
                >
                  🍪
                </div>

                <p className="mt-4 text-lg">
                  Loading cart...
                </p>

              </div>

              <style>{`
                @keyframes bounce {
                  0%, 100% {
                    transform: translateY(0);
                  }

                  50% {
                    transform: translateY(-10px);
                  }
                }

                @keyframes spin {
                  from {
                    transform: rotate(0deg);
                  }

                  to {
                    transform: rotate(360deg);
                  }
                }
              `}</style>

            </div>

          ) : cart.length === 0 ? (

            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-12 border border-white/10 text-center mt-8">

              <div className="mb-8">

                <ShoppingCart
                  size={64}
                  className="mx-auto text-white/50 mb-4"
                />

                <h2 className="text-2xl font-bold mb-2">
                  Your Cart is Empty
                </h2>

                <p className="text-white/60 mb-8">
                  Start shopping and add some delicious cookies to your cart!
                </p>

              </div>

              <Link
                to="/"
                className="inline-block bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-white/90 transition-all"
              >
                Continue Shopping
              </Link>

            </div>

          ) : (

            <div className="space-y-8 mt-8">

              {/* CART ITEMS */}

              <div className="bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10 space-y-4">

                {cart.map(item => {

                  const selectedSize =
                    selectedPcs[item.productId] ||
                    item.size ||
                    2;

                  const basePrice =
                    parsePrice(item.price);

                  const pricePerUnit =
                    basePrice *
                    (selectedSize / 2);

                  const itemTotal =
                    pricePerUnit *
                    Number(item.quantity);

                  return (
                    <motion.div
                      key={item.productId}
                      initial={{
                        opacity: 0,
                        y: 10
                      }}
                      animate={{
                        opacity: 1,
                        y: 0
                      }}
                      exit={{
                        opacity: 0,
                        x: -100
                      }}
                      className="flex gap-6 p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                    >

                      <div className="w-24 h-24 flex-shrink-0 bg-white/10 rounded-lg flex items-center justify-center">

                        {item.mainImage ? (

                          <img
                            src={item.mainImage}
                            alt={item.name}
                            className="w-full h-full object-cover rounded-lg"
                          />

                        ) : (

                          <ShoppingCart
                            size={32}
                            className="text-white/40"
                          />

                        )}

                      </div>

                      <div className="flex-1 flex flex-col justify-between">

                        <div>

                          <h3 className="text-xl font-bold">
                            {item.name}
                          </h3>

                          <p className="text-white/60 text-sm">
                            {item.flavor}
                          </p>

                          <div className="flex items-center gap-3 mt-3">

                            <p className="text-white/50 text-xs">
                              Size:
                            </p>

                            <div className="flex gap-2">

                              {[2, 4, 6].map(qty => (

                                <button
                                  key={qty}
                                  onClick={() =>
                                    setSelectedPcs(
                                      prev => ({
                                        ...prev,
                                        [item.productId]:
                                          qty
                                      })
                                    )
                                  }
                                  className={`px-3 py-1 text-xs font-semibold rounded transition-all ${
                                    selectedSize === qty
                                      ? 'bg-white text-black'
                                      : 'bg-white/10 text-white hover:bg-white/20'
                                  }`}
                                >
                                  {qty} pcs
                                </button>

                              ))}

                            </div>

                          </div>

                        </div>

                        <p className="text-lg font-bold">

                          <span className="text-white/60 text-sm">
                            ₹ {pricePerUnit.toFixed(2)}
                          </span>

                          <span className="text-white/60 text-sm ml-2">
                            (₹ {itemTotal.toFixed(2)} total)
                          </span>

                        </p>

                      </div>

                      <div className="flex flex-col gap-3 justify-between">

                        <div className="flex items-center bg-white/10 rounded-full px-2 py-1 gap-2">

                          <button
                            onClick={() =>
                              updateCartItemQuantity(
                                item.productId,
                                item.quantity - 1
                              )
                            }
                            className="p-1 hover:bg-white/20 rounded transition-colors"
                            title="Decrease quantity"
                          >
                            <Minus size={14} />
                          </button>

                          <span className="text-center font-bold text-sm whitespace-nowrap">
                            {item.quantity}
                          </span>

                          <button
                            onClick={() =>
                              updateCartItemQuantity(
                                item.productId,
                                item.quantity + 1
                              )
                            }
                            className="p-1 hover:bg-white/20 rounded transition-colors"
                            title="Increase quantity"
                          >
                            <Plus size={14} />
                          </button>

                        </div>

                        <button
                          onClick={() =>
                            removeFromCart(
                              item.productId
                            )
                          }
                          className="p-2 bg-red-500/20 hover:bg-red-500/40 rounded transition-colors text-red-400 flex items-center gap-2 justify-center"
                          title="Remove from cart"
                        >
                          <Trash2 size={16} />

                          <span className="text-xs font-semibold">
                            Remove
                          </span>
                        </button>

                      </div>

                    </motion.div>
                  );

                })}

              </div>

              {/* ORDER SUMMARY */}

              <div className="grid md:grid-cols-3 gap-8">

                <div className="md:col-span-2">

                  <button
                    onClick={() => clearCart()}
                    className="w-full text-left px-6 py-3 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors font-semibold"
                  >
                    Clear Cart
                  </button>

                </div>

                <motion.div
                  initial={{
                    opacity: 0,
                    x: 20
                  }}
                  animate={{
                    opacity: 1,
                    x: 0
                  }}
                  className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10"
                >

                  <h2 className="text-2xl font-bold mb-6">
                    Order Summary
                  </h2>

                  {/* PROMO */}

                  <div className="mb-6 pb-6 border-b border-white/10">

                    {!appliedPromo ? (

                      <div className="space-y-3">

                        <label className="flex items-center gap-2 text-sm font-semibold text-white/80">

                          <Tag size={16} />

                          Have a promo code?

                        </label>

                        <div className="flex gap-2">

                          <input
                            type="text"
                            value={promoCode}
                            onChange={(e) => {
                              setPromoCode(
                                e.target.value
                              );
                              setPromoError('');
                            }}
                            onKeyDown={(e) => {
                              if (
                                e.key === 'Enter'
                              ) {
                                handleApplyPromoCode();
                              }
                            }}
                            placeholder="Enter promo code"
                            className="flex-1 px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors"
                          />

                          <button
                            onClick={
                              handleApplyPromoCode
                            }
                            disabled={
                              promoLoading ||
                              !promoCode.trim()
                            }
                            className="px-4 py-2 bg-white text-black rounded-lg font-semibold hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                          >
                            {promoLoading
                              ? 'Checking...'
                              : 'Apply'}
                          </button>

                        </div>

                        {promoError && (
                          <p className="text-red-400 text-xs">
                            {promoError}
                          </p>
                        )}

                      </div>

                    ) : (

                      <motion.div
                        initial={{
                          opacity: 0,
                          scale: 0.95
                        }}
                        animate={{
                          opacity: 1,
                          scale: 1
                        }}
                        className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center justify-between"
                      >

                        <div>

                          <p className="text-green-400 font-semibold flex items-center gap-2">

                            <Tag size={16} />

                            {appliedPromo.code}

                          </p>

                          <p className="text-green-300/60 text-xs mt-1">
                            {appliedPromo.description}
                          </p>

                        </div>

                        <button
                          onClick={
                            removePromoCode
                          }
                          className="text-green-400 hover:text-green-300 text-xs font-semibold"
                        >
                          Remove
                        </button>

                      </motion.div>

                    )}

                  </div>

                  {/* TOTALS */}

                  <div className="space-y-3 mb-6 text-sm">

                    <div className="flex justify-between text-white/60">

                      <span>
                        Subtotal
                      </span>

                      <span>
                        ₹ {calculateCartSubtotal().toFixed(2)}
                      </span>

                    </div>

                    {appliedPromo && (

                      <motion.div
                        initial={{
                          opacity: 0,
                          height: 0
                        }}
                        animate={{
                          opacity: 1,
                          height: 'auto'
                        }}
                        className="flex justify-between text-green-400"
                      >

                        <span>
                          {appliedPromo.discountType ===
                          'percentage'
                            ? `Discount (${appliedPromo.discount}%)`
                            : 'Discount'}
                        </span>

                        <span>
                          -₹ {calculateDiscount().toFixed(2)}
                        </span>

                      </motion.div>

                    )}

                    <div className="flex justify-between text-white/60">

                      <span>
                        Shipping
                      </span>

                      <span>
                        ₹ 0.00
                      </span>

                    </div>

                    <div className="flex justify-between text-white/60">

                      <span>
                        Tax
                      </span>

                      <span>
                        ₹ 0.00
                      </span>

                    </div>

                    <div className="h-[1px] bg-white/10"></div>

                    <div className="flex justify-between text-2xl font-bold pt-3">

                      <span>
                        Total
                      </span>

                      <span>
                        ₹ {calculateFinalTotal().toFixed(2)}
                      </span>

                    </div>

                  </div>

                  {/* CHECKOUT */}

                  <button
                    onClick={handleCheckout}
                    disabled={
                      processingCheckout ||
                      !cart.length
                    }
                    className="w-full bg-yellow-400 text-black py-3 rounded-full font-bold text-lg hover:bg-yellow-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processingCheckout
                      ? 'Processing...'
                      : 'Buy Now'}
                  </button>

                  <Link
                    to="/"
                    className="w-full mt-3 text-center bg-white/10 hover:bg-white/20 text-white py-3 rounded-full font-bold transition-colors inline-block"
                  >
                    Continue Shopping
                  </Link>

                </motion.div>

              </div>

            </div>

          )}

        </motion.div>

      </main>

    </div>
  );
};

export default Cart;
