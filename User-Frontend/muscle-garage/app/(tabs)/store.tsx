import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, ScrollView, FlatList, Image, TouchableOpacity, TextInput, Animated, StyleSheet, ActivityIndicator, Modal, SafeAreaView, PanResponder, BackHandler, Linking } from 'react-native';
import Reanimated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import MultiSlider from '@ptomasroos/react-native-multi-slider';
import * as ExpoLinking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { useLocalSearchParams } from 'expo-router';
import { Colors } from '@/constants/colors';
import { API_URL } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { useLiquidTabBarScrollHandler } from '@/components/shared/tabBarVisibility';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  createdAt?: string;
  updatedAt?: string;
  images?: string[];
  rating?: number;
  reviews?: number;
}

interface CartItem extends Product {
  quantity: number;
}

interface Order {
  _id: string;
  customerName: string;
  email: string;
  products: Array<{ productName: string; quantity: number; priceAtPurchase: number }>;
  status: 'Unfulfilled' | 'In Progress' | 'Fulfilled';
  orderTotal: number;
  paymentMethod: string;
  createdAt: string;
  shippingCost: number;
}

interface NepalWardRow {
  province_en: string;
  district_en: string;
  municipality_en: string;
  ward_en: string;
  province_np?: string;
  district_np?: string;
  municipality_np?: string;
  ward_np?: string;
}

const NEPAL_WARD_ROWS: NepalWardRow[] = require('@/assets/nepal-ward-level-full.json');

const StoreScreen = () => {
  const SORT_OPTIONS = [
    { key: 'alpha-asc', label: 'Alphabet A-Z' },
    { key: 'alpha-desc', label: 'Alphabet Z-A' },
    { key: 'price-asc', label: 'Price low to high' },
    { key: 'price-desc', label: 'Price high to low' },
    { key: 'date-asc', label: 'Date old to new' },
    { key: 'date-desc', label: 'Date new to old' },
  ] as const;

  const auth = useAuth();
  const params = useLocalSearchParams<{ paymentSuccess?: string; paymentTs?: string }>();
  const scrollHandler = useLiquidTabBarScrollHandler();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Product | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [orderHistoryOpen, setOrderHistoryOpen] = useState(false);
  const [confirmation, setConfirmation] = useState<any>(null);
  const [placing, setPlacing] = useState(false);
  const [toast, setToast] = useState('');
  const [filters, setFilters] = useState({ cats: new Set<string>(), inStock: false, min: 0, max: 50000, sort: 'date-desc' });
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [checkout, setCheckout] = useState({ name: '', email: '', phone: '', province: '', district: '', municipality: '', ward: '', address: '', paymentMethod: 'Online' });
  const [locationDropdowns, setLocationDropdowns] = useState({ provinceOpen: false, districtOpen: false, municipalityOpen: false, wardOpen: false });

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [historyBadgeCount, setHistoryBadgeCount] = useState(0);
  const knownOrderStatusesRef = useRef<Record<string, Order['status']>>({});
  const drawerX = useRef(new Animated.Value(400)).current;
  const detailFadeAnim = useRef(new Animated.Value(1)).current;
  const SHIPPING = 100;

  // Reset selected image when product changes
  useEffect(() => {
    if (selected) {
      setSelectedImageIndex(0);
    }
  }, [selected]);

  useEffect(() => {
    if (selected) {
      detailFadeAnim.setValue(0.5);
    }
  }, [selectedImageIndex, selected, detailFadeAnim]);

  useEffect(() => {
    fetchProducts();
  }, []);

  // Handle back button for modals
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (selected) {
        setSelected(null);
        return true;
      }
      if (cartOpen) {
        setCartOpen(false);
        return true;
      }
      return false;
    });
    return () => backHandler.remove();
  }, [selected, cartOpen]);

  useEffect(() => {
    if (auth.user) {
      setCheckout(prev => ({
        ...prev,
        name: auth.user?.fullname || '',
        email: auth.user?.email || '',
        phone: auth.user?.phone || '',
      }));
    }
  }, [auth.user]);

  useEffect(() => {
    if (params.paymentSuccess === '1') {
      setCart([]);
      setCartOpen(false);
      setCheckoutOpen(false);
      setSelected(null);
      setConfirmation(null);
      fetchOrders(false);
    }
  }, [params.paymentSuccess, params.paymentTs]);



  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/products`);
      const data = await res.json();
      if (data.success) setProducts(data.products || []);
      else setError('Failed to load products');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async (showLoader = true) => {
    try {
      if (showLoader) setOrdersLoading(true);
      const res = await fetch(`${API_URL}/orders/user/history?email=${encodeURIComponent(auth.user?.email || '')}`);
      const data = await res.json();
      if (data.success) {
        const incomingOrders: Order[] = data.orders || [];
        const nextStatuses: Record<string, Order['status']> = {};
        const hadPreviousSnapshot = Object.keys(knownOrderStatusesRef.current).length > 0;
        let newEntityCount = 0;

        incomingOrders.forEach((order) => {
          nextStatuses[order._id] = order.status;
          const previousStatus = knownOrderStatusesRef.current[order._id];
          if (!previousStatus) {
            newEntityCount += 1;
          }
        });

        knownOrderStatusesRef.current = nextStatuses;
        setOrders(incomingOrders);

        if (hadPreviousSnapshot && newEntityCount > 0 && !orderHistoryOpen) {
          setHistoryBadgeCount((prev) => prev + newEntityCount);
        }
      }
    } catch (e: any) {
      console.error('Failed to fetch orders:', e.message);
    } finally {
      if (showLoader) setOrdersLoading(false);
    }
  };

  useEffect(() => {
    if (orderHistoryOpen && auth.user) {
      setHistoryBadgeCount(0);
      fetchOrders();
    }
  }, [orderHistoryOpen, auth.user]);

  useEffect(() => {
    if (!auth.user) return;

    fetchOrders(false);
    const intervalId = setInterval(() => {
      if (!orderHistoryOpen) {
        fetchOrders(false);
      }
    }, 30000);

    return () => clearInterval(intervalId);
  }, [auth.user, orderHistoryOpen]);

  const formatRs = (num: number) => `Rs. ${num.toLocaleString('en-IN')}`;
  const categories = Array.from(new Set(products.map((p) => p.category)));

  const provinces = useMemo(
    () => Array.from(new Set(NEPAL_WARD_ROWS.map((row) => row.province_en.trim()))).sort((a, b) => a.localeCompare(b)),
    []
  );

  const districts = useMemo(() => {
    if (!checkout.province) return [];
    return Array.from(
      new Set(
        NEPAL_WARD_ROWS
          .filter((row) => row.province_en.trim() === checkout.province)
          .map((row) => row.district_en.trim())
      )
    ).sort((a, b) => a.localeCompare(b));
  }, [checkout.province]);

  const municipalities = useMemo(() => {
    if (!checkout.province || !checkout.district) return [];
    return Array.from(
      new Set(
        NEPAL_WARD_ROWS
          .filter(
            (row) =>
              row.province_en.trim() === checkout.province &&
              row.district_en.trim() === checkout.district
          )
          .map((row) => row.municipality_en.trim())
      )
    ).sort((a, b) => a.localeCompare(b));
  }, [checkout.province, checkout.district]);

  const wards = useMemo(() => {
    if (!checkout.province || !checkout.district || !checkout.municipality) return [];
    return Array.from(
      new Set(
        NEPAL_WARD_ROWS
          .filter(
            (row) =>
              row.province_en.trim() === checkout.province &&
              row.district_en.trim() === checkout.district &&
              row.municipality_en.trim() === checkout.municipality
          )
          .map((row) => row.ward_en.trim())
      )
    ).sort((a, b) => {
      const an = Number(a);
      const bn = Number(b);
      if (!Number.isNaN(an) && !Number.isNaN(bn)) return an - bn;
      return a.localeCompare(b);
    });
  }, [checkout.province, checkout.district, checkout.municipality]);

  const filtered = useMemo(() => {
    let result = products.filter((p) => (!filters.cats.size || filters.cats.has(p.category)) && (!filters.inStock || p.stock > 0) && p.price >= filters.min && p.price <= filters.max);

    const getProductTimestamp = (product: Product) => {
      const source = product.createdAt || product.updatedAt;
      const ts = source ? new Date(source).getTime() : 0;
      return Number.isNaN(ts) ? 0 : ts;
    };

    if (filters.sort === 'price-asc') result.sort((a, b) => a.price - b.price);
    else if (filters.sort === 'price-desc') result.sort((a, b) => b.price - a.price);
    else if (filters.sort === 'alpha-asc') result.sort((a, b) => a.name.localeCompare(b.name));
    else if (filters.sort === 'alpha-desc') result.sort((a, b) => b.name.localeCompare(a.name));
    else if (filters.sort === 'date-asc') result.sort((a, b) => getProductTimestamp(a) - getProductTimestamp(b));
    else if (filters.sort === 'date-desc') result.sort((a, b) => getProductTimestamp(b) - getProductTimestamp(a));

    return result;
  }, [products, filters]);

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const total = subtotal + (cart.length ? SHIPPING : 0);
  const priceUpperBound = useMemo(() => {
    const maxPrice = products.reduce((acc, item) => Math.max(acc, item.price || 0), 0);
    const rounded = Math.ceil(maxPrice / 500) * 500;
    return Math.max(2000, rounded || 2000);
  }, [products]);

  useEffect(() => {
    setFilters((prev) => {
      // On initial load or when products change, set max to priceUpperBound
      const nextMax = priceUpperBound;
      const nextMin = Math.min(prev.min, nextMax);
      if (nextMin === prev.min && nextMax === prev.max) return prev;
      return { ...prev, min: nextMin, max: nextMax };
    });
  }, [priceUpperBound]);

  const isCheckoutComplete = useMemo(
    () =>
      checkout.name.trim().length > 0 &&
      checkout.email.trim().length > 0 &&
      checkout.phone.trim().length > 0 &&
      checkout.province.trim().length > 0 &&
      checkout.district.trim().length > 0 &&
      checkout.municipality.trim().length > 0 &&
      checkout.ward.trim().length > 0 &&
      checkout.address.trim().length > 0 &&
      checkout.paymentMethod.trim().length > 0 &&
      cart.length > 0,
    [checkout, cart.length]
  );

  const handleAddToCart = (product: Product, qty: number) => {
    const existing = cart.find((i) => i._id === product._id);
    if (existing) {
      setCart(cart.map((i) => (i._id === product._id ? { ...i, quantity: Math.min(product.stock, i.quantity + qty) } : i)));
    } else {
      setCart([...cart, { ...product, quantity: qty }]);
    }
    setSelected(null);
    showToast(`${product.name} added to cart`);
  };

  const handleRemoveFromCart = (id: string) => {
    setCart(cart.filter((i) => i._id !== id));
  };

  const handleBuyNow = (product: Product, qty: number) => {
    handleAddToCart(product, qty);
    setCartOpen(false);
    setCheckoutOpen(true);
  };

  const placeOrder = async () => {
    if (!isCheckoutComplete) {
      showToast('Please fill all fields');
      return;
    }
    if (cart.length === 0) {
      showToast('Cart is empty');
      return;
    }

    try {
      setPlacing(true);
      const appRedirectUrl = ExpoLinking.createURL('/payment-callback');
      const res = await fetch(`${API_URL}/orders/khalti/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: checkout.name.trim(),
          email: checkout.email.trim(),
          phone: checkout.phone.trim(),
          location: `Ward ${checkout.ward}, ${checkout.municipality}, ${checkout.district}, ${checkout.province}`,
          address: checkout.address.trim(),
          products: cart.map((i) => ({ productId: i._id, quantity: i.quantity })),
          returnUrl: `${API_URL}/payment/khalti/redirect?deeplink=${encodeURIComponent(appRedirectUrl)}`,
        }),
      });
      const data = await res.json();
      if (data.success && data.paymentUrl) {
        const result = await WebBrowser.openAuthSessionAsync(
          data.paymentUrl,
          appRedirectUrl
        );

        if (result.type === 'success' && result.url) {
          // Close checkout popup before handling payment callback redirect.
          setCheckoutOpen(false);
          setCart([]);
          await ExpoLinking.openURL(result.url);
        } else if (result.type === 'cancel' || result.type === 'dismiss') {
          showToast('Payment was cancelled');
        }
      } else {
        showToast(data.message || 'Failed to place order');
      }
    } catch (e: any) {
      showToast('Error placing order');
    } finally {
      setPlacing(false);
    }
  };

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(''), 3000);
  };

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Get status color
  const getStatusColor = (status: string) => {
    if (status === 'Fulfilled') return '#4caf50';
    if (status === 'In Progress') return '#ff9800';
    return '#f44336';
  };

  const renderCard = ({ item }: { item: Product }) => (
    <TouchableOpacity style={styles.card} onPress={() => setSelected(item)}>
      <View style={styles.cardImage}>
        {item.images?.[0] ? (
          <Image source={{ uri: item.images[0] }} style={{ width: '100%', height: '100%' }} />
        ) : (
          <View style={{ width: '100%', height: '100%', backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name="image" size={40} color="#444" />
          </View>
        )}
        {item.stock === 0 && (
          <View style={styles.outBadge}>
            <Text style={styles.outText}>Out of Stock</Text>
          </View>
        )}
        {item.stock < 5 && item.stock > 0 && (
          <View style={[styles.outBadge, { backgroundColor: '#ff9800' }]}>
            <Text style={styles.outText}>Only {item.stock} left</Text>
          </View>
        )}
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.name}
        </Text>
        <View style={styles.cardMeta}>
          <Text style={styles.cardPrice}>{formatRs(item.price)}</Text>
          {item.rating && (
            <View style={styles.rating}>
              <Ionicons name="star" size={14} color="#ffd700" />
              <Text style={styles.ratingText}>{item.rating}</Text>
            </View>
          )}
        </View>
        <Text style={styles.cardCategory}>{item.category}</Text>
        <TouchableOpacity 
          style={[styles.cardBtn, item.stock === 0 && styles.cardBtnDisabled]}
          onPress={(e) => {
            e.stopPropagation();
            if (item.stock > 0) {
              handleAddToCart(item, 1);
            }
          }}
          disabled={item.stock === 0}
        >
          <Ionicons name="cart" size={16} color={item.stock === 0 ? '#666' : '#000'} />
          <Text style={[styles.cardBtnText, item.stock === 0 && { color: '#666' }]}>
            {item.stock === 0 ? 'Out of Stock' : 'Quick Add'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderDetail = () => {
    const product = selected;

    const handleImageLoad = () => {
      Animated.timing(detailFadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    };

    const handleSwipe = (dx: number) => {
      if (!product || !product.images || product.images.length <= 1) return;
      const images = product.images;
      
      if (dx > 50) {
        // Swiped right - show previous image
        setSelectedImageIndex(prev => (prev - 1 + images.length) % images.length);
      } else if (dx < -50) {
        // Swiped left - show next image
        setSelectedImageIndex(prev => (prev + 1) % images.length);
      }
    };

    const panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderRelease: (evt, gestureState) => {
        handleSwipe(gestureState.dx);
      },
    });

    if (!product) return null;

    return (
      <Modal visible animationType="none" transparent={false} onRequestClose={() => setSelected(null)}>
        <SafeAreaView style={styles.mainContainer}>
          <View style={styles.detailBox}>
            <View style={styles.detailHeader}>
              <TouchableOpacity style={styles.backBtn} onPress={() => setSelected(null)}>
                <Ionicons name="chevron-back" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.detailTitle}>Details</Text>
              <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.detailScroll} contentContainerStyle={styles.detailScrollContent}>
            {/* Main Image with Swipe Support */}
            <View {...panResponder.panHandlers} style={styles.detailImageContainer}>
              {product.images?.[selectedImageIndex] ? (
                <Animated.View style={[{ opacity: detailFadeAnim }, styles.detailImage]}>
                  <Image 
                    key={`image-${selectedImageIndex}`}
                    source={{ uri: product.images[selectedImageIndex] }} 
                    style={styles.detailImage} 
                    // cache="force-cache"
                    onLoad={handleImageLoad}
                  />
                </Animated.View>
              ) : (
                <View style={[styles.detailImage, { justifyContent: 'center', alignItems: 'center' }]}>
                  <Ionicons name="image" size={60} color="#444" />
                </View>
              )}
              {product.images && product.images.length > 1 && (
                <View style={styles.imageIndicator}>
                  <Text style={styles.imageIndicatorText}>
                    {selectedImageIndex + 1} / {product.images.length}
                  </Text>
                </View>
              )}
            </View>

            {/* Gallery - Right below main image */}
            {product.images && product.images.length > 1 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.galleryScroll}>
                {product.images.map((img, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.galleryThumb, selectedImageIndex === idx && styles.galleryThumbActive]}
                    onPress={() => setSelectedImageIndex(idx)}
                  >
                    <Image source={{ uri: img }} style={styles.galleryThumbImage} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* Product Details */}
            <View style={styles.detailContent}>
              <Text style={styles.detailProductName}>{product.name}</Text>
              <Text style={styles.detailPrice}>{formatRs(product.price)}</Text>

              {/* Category Only */}
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>{product.category}</Text>
              </View>

              <Text style={styles.detailDescLabel}>Description</Text>
              <Text style={styles.detailDesc}>{product.description}</Text>
            </View>
            </ScrollView>

            {product.stock > 0 && (
              <QuantityPicker
                max={product.stock}
                onAdd={(qty) => handleAddToCart(product, qty)}
                onBuyNow={(qty) => handleBuyNow(product, qty)}
              />
            )}
            {product.stock === 0 && (
              <TouchableOpacity style={[styles.primaryBtn, styles.disabledBtn]} disabled>
                <Text style={styles.primaryText}>Out of Stock</Text>
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
    </Modal>
    );
  };

  const renderCartDrawer = () => (
    <Modal visible={cartOpen} animationType="slide" transparent={false} onRequestClose={() => setCartOpen(false)}>
      <SafeAreaView style={styles.container}>
        <View style={styles.drawerHead}>
          <TouchableOpacity style={styles.backBtn} onPress={() => setCartOpen(false)}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.drawerTitle}>Cart ({cartCount})</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={{ flex: 1 }}>
          {cart.length === 0 ? (
            <View style={{ alignItems: 'center', marginTop: 30 }}>
              <Ionicons name="cart-outline" size={48} color="#444" />
              <Text style={{ color: Colors.lightGray, marginTop: 12 }}>Your cart is empty</Text>
            </View>
          ) : (
            cart.map((item) => (
              <View key={item._id} style={styles.cartItem}>
                <View style={styles.cartItemImage}>
                  {item.images?.[0] ? (
                    <Image source={{ uri: item.images[0] }} style={{ width: '100%', height: '100%' }} />
                  ) : (
                    <Ionicons name="image" size={24} color="#444" />
                  )}
                </View>

                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.cartItemName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.cartItemPrice}>{formatRs(item.price)}</Text>
                  <View style={styles.cartQtyRow}>
                    <TouchableOpacity
                      style={styles.qtySmallBtn}
                      onPress={() => setCart(cart.map((i) => (i._id === item._id ? { ...i, quantity: Math.max(1, i.quantity - 1) } : i)))}
                    >
                      <Text style={styles.qtySmallText}>âˆ’</Text>
                    </TouchableOpacity>
                    <Text style={styles.qtyValue}>{item.quantity}</Text>
                    <TouchableOpacity
                      style={styles.qtySmallBtn}
                      onPress={() => setCart(cart.map((i) => (i._id === item._id ? { ...i, quantity: Math.min(i.stock, i.quantity + 1) } : i)))}
                    >
                      <Text style={styles.qtySmallText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity style={styles.cartRemoveBtn} onPress={() => handleRemoveFromCart(item._id)}>
                  <Ionicons name="trash-outline" size={18} color="#f44336" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>

        {cart.length > 0 && (
          <View style={styles.cartSummary}>
            <Row label="Subtotal" value={formatRs(subtotal)} />
            <Row label="Shipping" value={formatRs(SHIPPING)} />
            <Row label="Total" value={formatRs(total)} bold />
            <TouchableOpacity style={styles.primaryBtn} onPress={() => { setCartOpen(false); setCheckoutOpen(true); }}>
              <Text style={styles.primaryText}>Proceed to Checkout</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );

  const renderCheckout = () => (
    <Modal visible={checkoutOpen} animationType="slide" transparent={false} onRequestClose={() => setCheckoutOpen(false)}>
      <SafeAreaView style={styles.container}>
        <View style={styles.checkoutCard}>
          <View style={styles.checkoutHeader}>
            <Text style={styles.checkoutTitle}>Checkout</Text>
            <TouchableOpacity onPress={() => setCheckoutOpen(false)}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
            <Label text="Full Name" />
            <Input placeholder="John Doe" value={checkout.name} onChangeText={(v: string) => setCheckout({ ...checkout, name: v })} />

            <Label text="Email" />
            <Input placeholder="john@example.com" keyboardType="email-address" value={checkout.email} onChangeText={(v: string) => setCheckout({ ...checkout, email: v })} />

            <Label text="Phone" />
            <Input placeholder="+977 98..." keyboardType="phone-pad" value={checkout.phone} onChangeText={(v: string) => setCheckout({ ...checkout, phone: v })} />

            <Label text="Province" />
            <TouchableOpacity
              style={styles.dropdownBtn}
              onPress={() => setLocationDropdowns({ ...locationDropdowns, provinceOpen: !locationDropdowns.provinceOpen })}
            >
              <Text style={[styles.dropdownBtnText, !checkout.province && styles.dropdownPlaceholder]}>
                {checkout.province || 'Select Province'}
              </Text>
              <Ionicons name={locationDropdowns.provinceOpen ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.lightGray} />
            </TouchableOpacity>
            {locationDropdowns.provinceOpen && (
              <ScrollView style={styles.dropdownMenu} nestedScrollEnabled>
                {provinces.map((province) => (
                  <TouchableOpacity
                    key={province}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setCheckout({ ...checkout, province, district: '', municipality: '', ward: '', address: '' });
                      setLocationDropdowns({ ...locationDropdowns, provinceOpen: false });
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{province}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {checkout.province && (
              <>
                <Label text="District" />
                <TouchableOpacity
                  style={styles.dropdownBtn}
                  onPress={() => setLocationDropdowns({ ...locationDropdowns, districtOpen: !locationDropdowns.districtOpen })}
                >
                  <Text style={[styles.dropdownBtnText, !checkout.district && styles.dropdownPlaceholder]}>
                    {checkout.district || 'Select District'}
                  </Text>
                  <Ionicons name={locationDropdowns.districtOpen ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.lightGray} />
                </TouchableOpacity>
                {locationDropdowns.districtOpen && (
                  <ScrollView style={styles.dropdownMenu} nestedScrollEnabled>
                    {districts.map((district) => (
                      <TouchableOpacity
                        key={district}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setCheckout({ ...checkout, district, municipality: '', ward: '', address: '' });
                          setLocationDropdowns({ ...locationDropdowns, districtOpen: false });
                        }}
                      >
                        <Text style={styles.dropdownItemText}>{district}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </>
            )}

            {checkout.district && (
              <>
                <Label text="Municipality" />
                <TouchableOpacity
                  style={styles.dropdownBtn}
                  onPress={() => setLocationDropdowns({ ...locationDropdowns, municipalityOpen: !locationDropdowns.municipalityOpen })}
                >
                  <Text style={[styles.dropdownBtnText, !checkout.municipality && styles.dropdownPlaceholder]}>
                    {checkout.municipality || 'Select Municipality'}
                  </Text>
                  <Ionicons name={locationDropdowns.municipalityOpen ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.lightGray} />
                </TouchableOpacity>
                {locationDropdowns.municipalityOpen && (
                  <ScrollView style={styles.dropdownMenu} nestedScrollEnabled>
                    {municipalities.map((municipality) => (
                      <TouchableOpacity
                        key={municipality}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setCheckout({ ...checkout, municipality, ward: '', address: '' });
                          setLocationDropdowns({ ...locationDropdowns, municipalityOpen: false });
                        }}
                      >
                        <Text style={styles.dropdownItemText}>{municipality}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </>
            )}

            {checkout.municipality && (
              <>
                <Label text="Ward" />
                <TouchableOpacity
                  style={styles.dropdownBtn}
                  onPress={() => setLocationDropdowns({ ...locationDropdowns, wardOpen: !locationDropdowns.wardOpen })}
                >
                  <Text style={[styles.dropdownBtnText, !checkout.ward && styles.dropdownPlaceholder]}>
                    {checkout.ward ? `Ward ${checkout.ward}` : 'Select Ward'}
                  </Text>
                  <Ionicons name={locationDropdowns.wardOpen ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.lightGray} />
                </TouchableOpacity>
                {locationDropdowns.wardOpen && (
                  <ScrollView style={styles.dropdownMenu} nestedScrollEnabled>
                    {wards.map((ward) => (
                      <TouchableOpacity
                        key={ward}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setCheckout({ ...checkout, ward });
                          setLocationDropdowns({ ...locationDropdowns, wardOpen: false });
                        }}
                      >
                        <Text style={styles.dropdownItemText}>{`Ward ${ward}`}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </>
            )}

            {checkout.ward && (
              <>
                <Label text="Address" />
                <Input placeholder="Enter your street address..." value={checkout.address} onChangeText={(v: string) => setCheckout({ ...checkout, address: v })} />
              </>
            )}

            <Label text="Payment Method" />
            <View style={styles.paymentOptions}>
              <View style={[styles.paymentOption, styles.paymentOptionActive]}>
                <View style={[styles.radio, styles.radioActive]} />
                <Text style={styles.paymentText}>Khalti</Text>
              </View>
            </View>

            <View style={styles.orderSummary}>
              <Text style={styles.summaryTitle}>Order Summary</Text>
              {cart.map((item) => (
                <Row key={item._id} label={`${item.name} x${item.quantity}`} value={formatRs(item.quantity * item.price)} />
              ))}
              <View style={styles.divider} />
              <Row label="Subtotal" value={formatRs(subtotal)} />
              <Row label="Shipping" value={formatRs(SHIPPING)} />
              <Row label="Total" value={formatRs(total)} bold />
            </View>
          </ScrollView>

          <TouchableOpacity
            style={[styles.primaryBtn, { marginTop: 12 }, (!isCheckoutComplete || placing) && styles.disabledBtn]}
            onPress={placeOrder}
            disabled={!isCheckoutComplete || placing}
          >
            <Text style={styles.primaryText}>{placing ? 'Placing...' : 'Place Order'}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );

  const renderConfirmation = () =>
    confirmation && (
      <View style={styles.confirmOverlay}>
        <View style={styles.confirmBox}>
          <Ionicons name="checkmark-circle" size={48} color={Colors.primary} />
          <Text style={styles.confirmTitle}>Order Confirmed!</Text>
          <Text style={styles.confirmId}>Order ID: {confirmation.order?.id || confirmation.order?._id}</Text>
          <View style={styles.confirmDivider} />
          <Text style={styles.confirmLabel}>Payment Method</Text>
          <Text style={styles.confirmValue}>{confirmation.order?.paymentMethod}</Text>
          <Text style={styles.confirmLabel}>Total</Text>
          <Text style={styles.confirmTotal}>{formatRs((confirmation.order?.orderTotal || 0) + (confirmation.order?.shippingCost || 0))}</Text>
          <TouchableOpacity style={[styles.primaryBtn, { marginTop: 16 }, {paddingHorizontal:15}]} onPress={() => setConfirmation(null)}>
            <Text style={styles.primaryText}>Continue Shopping</Text>
          </TouchableOpacity>
        </View>
      </View>
    );

  const renderOrderHistory = () => (
    <Modal visible={orderHistoryOpen} animationType="slide">
      <View style={styles.container}>
        <View style={styles.historyHeader}>
          <TouchableOpacity onPress={() => setOrderHistoryOpen(false)}>
            <Ionicons name="chevron-back" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.historyTitle}>Order History</Text>
          <View style={{ width: 28 }} />
        </View>

        {ordersLoading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : orders.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 }}>
            <Ionicons name="receipt-outline" size={48} color="#444" />
            <Text style={{ color: Colors.lightGray, marginTop: 12, fontSize: 16 }}>No orders yet</Text>
            <Text style={{ color: Colors.darkGray, marginTop: 6 }}>Your purchases will appear here</Text>
          </View>
        ) : (
          <FlatList
            data={orders}
            renderItem={({ item: order }) => (
              <TouchableOpacity
                style={styles.orderCard}
                onPress={() => setSelectedOrder(selectedOrder?._id === order._id ? null : order)}
              >
                <View style={styles.orderCardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.orderId}>Order #{order._id.slice(-8).toUpperCase()}</Text>
                    <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
                  </View>
                  <View style={[styles.orderStatusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                    <Text style={styles.orderStatusText}>{order.status}</Text>
                  </View>
                </View>

                <View style={styles.orderMeta}>
                  <Text style={styles.orderMetaText}>{order.products.length} item{order.products.length !== 1 ? 's' : ''}</Text>
                  <Text style={styles.orderMetaText}>â€¢</Text>
                  <Text style={styles.orderMetaText}>{formatRs(order.orderTotal + order.shippingCost)}</Text>
                </View>

                {selectedOrder?._id === order._id && (
                  <View style={styles.orderDetails}>
                    <Text style={styles.detailsTitle}>Items</Text>
                    {order.products.map((prod, idx) => (
                      <View key={idx} style={styles.productRow}>
                        <View>
                          <Text style={styles.prodName}>{prod.productName}</Text>
                          <Text style={styles.prodQty}>Qty: {prod.quantity}</Text>
                        </View>
                        <Text style={styles.prodPrice}>{formatRs(prod.priceAtPurchase * prod.quantity)}</Text>
                      </View>
                    ))}
                    <View style={styles.orderSummaryBox}>
                      <Row label="Subtotal" value={formatRs(order.orderTotal)} />
                      <Row label="Shipping" value={formatRs(order.shippingCost)} />
                      <Row label="Total" value={formatRs(order.orderTotal + order.shippingCost)} bold />
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item._id}
            contentContainerStyle={{ paddingBottom: 60 }}
          />
        )}
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.mainContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Supplements</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => { setHistoryBadgeCount(0); setOrderHistoryOpen(true); }}>
            <Ionicons name="receipt" size={22} color="#fff" />
            {historyBadgeCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{historyBadgeCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => setCartOpen(true)}>
            <Ionicons name="cart" size={22} color="#fff" />
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryScrollContent}
      >
        <TouchableOpacity style={styles.filterClearBtn} onPress={() => setFilters({ cats: new Set(), inStock: false, min: 0, max: priceUpperBound, sort: 'date-desc' })}>
          <Ionicons name="close-circle" size={16} color={Colors.primary} style={{ marginRight: 6 }} />
          <Text style={styles.filterClearText}>Clear</Text>
        </TouchableOpacity>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.categoryChip, filters.cats.has(cat) && styles.categoryChipActive]}
            onPress={() => {
              const next = new Set(filters.cats);
              next.has(cat) ? next.delete(cat) : next.add(cat);
              setFilters({ ...filters, cats: next });
            }}
          >
            <Text style={styles.categoryChipText}>{cat}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={[styles.categoryChip, filters.inStock && styles.categoryChipActive]} onPress={() => setFilters({ ...filters, inStock: !filters.inStock })}>
          <Text style={styles.categoryChipText}>In Stock</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.filtersRow}>
        <View style={styles.priceFilter}>
          <View style={styles.priceHeaderRow}>
            <Text style={styles.filterLabel}>Price Range</Text>
            {/* <Text style={styles.priceRangeText}>{formatRs(filters.min)} - {formatRs(filters.max)}</Text> */}
          </View>

          <View style={styles.rangeLabelsRow}>
            <Text style={styles.rangeValueText}>Min: {formatRs(filters.min)}</Text>
            <Text style={styles.rangeValueText}>Max: {formatRs(filters.max)}</Text>
          </View>
          <View style={styles.priceSlider}>
            <MultiSlider
              values={[filters.min, filters.max]}
              min={0}
              max={priceUpperBound}
              step={100}
              sliderLength={200}
              onValuesChange={(values) => {
                const nextMin = Math.max(0, Math.min(values[0] ?? 0, values[1] ?? priceUpperBound));
                const nextMax = Math.min(priceUpperBound, Math.max(values[0] ?? 0, values[1] ?? priceUpperBound));
                setFilters((prev) => ({ ...prev, min: nextMin, max: nextMax }));
              }}
              selectedStyle={styles.multiSliderSelectedTrack}
              unselectedStyle={styles.multiSliderUnselectedTrack}
              trackStyle={styles.multiSliderTrack}
              markerStyle={styles.multiSliderMarker}
              containerStyle={styles.multiSliderContainer}
            />
          </View>
        </View>

        <View style={styles.sortDropdownContainer}>
          <TouchableOpacity
            style={styles.sortDropdownButton}
            onPress={() => setSortDropdownOpen((prev) => !prev)}
          >
            <Text style={styles.sortDropdownText} numberOfLines={1}>
              {SORT_OPTIONS.find((opt) => opt.key === filters.sort)?.label || 'Sort'}
            </Text>
            <Ionicons
              name={sortDropdownOpen ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={Colors.lightGray}
            />
          </TouchableOpacity>

          {sortDropdownOpen && (
            <View style={styles.sortDropdownMenu}>
              {SORT_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  style={[
                    styles.sortDropdownItem,
                    filters.sort === opt.key && styles.sortDropdownItemActive,
                  ]}
                  onPress={() => {
                    setFilters({ ...filters, sort: opt.key });
                    setSortDropdownOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.sortDropdownItemText,
                      filters.sort === opt.key && styles.sortDropdownItemTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>

      {loading && (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      )}
      {error && <Text style={styles.errorText}>{error}</Text>}

      {!selected && !loading && (
        <Reanimated.FlatList
          data={filtered}
          renderItem={renderCard}
          keyExtractor={(item) => item._id}
          numColumns={2}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          style={styles.gridList}
          columnWrapperStyle={styles.gridWrapper}
          contentContainerStyle={styles.gridContent}
          ListEmptyComponent={<Text style={[styles.errorText, { marginTop: 40 }]}>No products found</Text>}
        />
      )}

      {renderDetail()}
      {renderCartDrawer()}
      {checkoutOpen && renderCheckout()}
      {renderConfirmation()}
      {renderOrderHistory()}
      {toast && (
        <View style={styles.toast}>
          <Ionicons name="checkmark-circle" size={18} color={Colors.primary} style={{ marginRight: 8 }} />
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const QuantityPicker = ({
  max,
  onAdd,
  onBuyNow,
  disabled,
}: {
  max: number;
  onAdd: (qty: number) => void;
  onBuyNow?: (qty: number) => void;
  disabled?: boolean;
}) => {
  const [qty, setQty] = useState(1);
  const canDecrease = !disabled && qty > 1;
  const canIncrease = !disabled && qty < (max || 1);

  useEffect(() => setQty(1), [max]);

  return (
    <View style={styles.qtyPickerContainer}>
      <Text style={styles.qtyLabel}>Quantity</Text>
      <View style={styles.qtyControls}>
        <TouchableOpacity
          style={[styles.qtyBtn, !canDecrease && styles.qtyBtnDisabled]}
          disabled={!canDecrease}
          onPress={() => setQty(Math.max(1, qty - 1))}
        >
          <Ionicons name="remove" size={18} color={canDecrease ? Colors.primary : Colors.darkGray} />
        </TouchableOpacity>

        <View style={styles.qtyDisplayBox}>
          <Text style={styles.qtyDisplay}>{qty}</Text>
        </View>

        <TouchableOpacity
          style={[styles.qtyBtn, !canIncrease && styles.qtyBtnDisabled]}
          disabled={!canIncrease}
          onPress={() => setQty(Math.min(max || 1, qty + 1))}
        >
          <Ionicons name="add" size={18} color={canIncrease ? Colors.primary : Colors.darkGray} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.primaryBtn, { marginTop: 12, opacity: disabled ? 0.5 : 1 }]}
        disabled={disabled}
        onPress={() => onAdd(qty)}
      >
        <Text style={styles.primaryText}>{disabled ? 'Out of Stock' : 'Add to Cart'}</Text>
      </TouchableOpacity>
      {!!onBuyNow && (
        <TouchableOpacity
          style={[styles.buyNowBtn, { opacity: disabled ? 0.5 : 1 }]}
          disabled={disabled}
          onPress={() => onBuyNow(qty)}
        >
          <Text style={styles.buyNowText}>{disabled ? 'Out of Stock' : 'Buy Now'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const Row = ({ label, value, bold }: { label: string; value: string; bold?: boolean }) => (
  <View style={styles.row}>
    <Text style={[styles.rowLabel, bold && styles.rowBold]}>{label}</Text>
    <Text style={[styles.rowValue, bold && styles.rowBold]}>{value}</Text>
  </View>
);

const Label = ({ text }: { text: string }) => <Text style={styles.label}>{text}</Text>;
const Input = (props: any) => (
  <TextInput
    {...props}
    style={[styles.input, props.style]}
    placeholderTextColor={Colors.darkGray}
    blurOnSubmit={false}
    returnKeyType="next"
  />
);

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: Colors.background, paddingTop: 30, fontFamily: 'Poppins' },
  container: { flex: 1, backgroundColor: Colors.background, paddingHorizontal: 14, paddingTop: 30, fontFamily: 'Poppins' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 12, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#222' },
  title: { color: '#fff', fontSize: 28, fontWeight: '800', letterSpacing: -0.5, fontFamily: 'Poppins' },
  headerButtons: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: { padding: 10, borderRadius: 12, borderWidth: 1, borderColor: '#333', position: 'relative' },
  historyUpdateDot: { position: 'absolute', top: 4, right: 4, width: 10, height: 10, borderRadius: 5, backgroundColor: '#ff9800', borderWidth: 1, borderColor: '#111' },
  cartBadge: { position: 'absolute', top: -6, right: -6, backgroundColor: Colors.primary, borderRadius: 99, width: 20, height: 20, justifyContent: 'center', alignItems: 'center' },
  cartBadgeText: { color: '#000', fontWeight: '800', fontSize: 11, fontFamily: 'Poppins' },
  
  categoryScroll: { marginBottom: 12, flexGrow: 0, minHeight: 38 },
  categoryScrollContent: { paddingHorizontal: 20, alignItems: 'center' },
  filterClearBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 30, paddingHorizontal: 10, borderRadius: 16, borderWidth: 1, borderColor: Colors.primary, marginRight: 6 },
  filterClearText: { color: Colors.primary, fontWeight: '600', fontSize: 11, fontFamily: 'Poppins' },
  categoryChip: { height: 30, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, borderColor: '#333', marginRight: 6, justifyContent: 'center', alignItems: 'center' },
  categoryChipActive: { backgroundColor: Colors.primary + '20', borderColor: Colors.primary },
  categoryChipText: { color: '#fff', fontWeight: '600', fontSize: 12, fontFamily: 'Poppins' },
  
  filtersRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 8, paddingHorizontal: 20, zIndex: 2000, elevation: 20 },
  priceFilter: { flex: 1, backgroundColor: '#1a1a1a', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8 },
  priceHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  filterLabel: { color: Colors.lightGray, fontWeight: '600', fontSize: 12, fontFamily: 'Poppins' },
  priceRangeText: { color: '#fff', fontWeight: '700', fontSize: 11, fontFamily: 'Poppins' },
  rangeLabelsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  rangeValueText: { color: Colors.lightGray, fontSize: 11, fontWeight: '600', fontFamily: 'Poppins' },
  priceSlider: { alignItems: 'center', marginTop: 4 },
  multiSliderContainer: { width: '100%', height: 28, paddingHorizontal: 0 },
  multiSliderTrack: { height: 4, borderRadius: 99 },
  multiSliderSelectedTrack: { backgroundColor: Colors.primary },
  multiSliderUnselectedTrack: { backgroundColor: '#3a3a3a' },
  multiSliderMarker: { width: 16, height: 16, borderRadius: 8, backgroundColor: Colors.primary, borderWidth: 1, borderColor: '#111',top:1.5 },
  priceInput: { backgroundColor: '#222', color: '#fff', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6, width: 60, marginHorizontal: 6, fontWeight: '600', fontSize: 12 },
  sortDropdownContainer: { flex: 1, marginLeft: 12, position: 'relative', zIndex: 3000, elevation: 30 },
  sortDropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  sortDropdownText: { color: '#fff', fontWeight: '600', fontSize: 12, flex: 1, marginRight: 8, fontFamily: 'Poppins' },
  sortDropdownMenu: {
    position: 'absolute',
    top: 44,
    left: 0,
    right: 0,
    backgroundColor: '#1f1f1f',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    overflow: 'hidden',
    zIndex: 4000,
    elevation: 40,
  },
  sortDropdownItem: { paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#2a2a2a' },
  sortDropdownItemActive: { backgroundColor: Colors.primary + '20' },
  sortDropdownItemText: { color: '#fff', fontSize: 12, fontWeight: '500', fontFamily: 'Poppins' },
  sortDropdownItemTextActive: { color: Colors.primary, fontWeight: '700' },
  
  card: { flex: 0.48, marginBottom: 14, borderRadius: 14, overflow: 'hidden', backgroundColor: Colors.cardBackground },
  cardImage: { width: '100%', aspectRatio: 1, backgroundColor: '#111', position: 'relative' },
  outBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: '#e53935', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  outText: { color: '#fff', fontWeight: '700', fontSize: 11, fontFamily: 'Poppins' },
  cardBody: { padding: 12 },
  cardTitle: { color: '#fff', fontWeight: '700', fontSize: 14, lineHeight: 18, minHeight: 36, fontFamily: 'Poppins' },
  cardMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  cardPrice: { color: Colors.primary, fontWeight: '800', fontSize: 15 },
  rating: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2f2f2f', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  ratingText: { color: '#fff', fontWeight: '600', fontSize: 12, marginLeft: 4, fontFamily: 'Poppins' },
  cardCategory: { color: Colors.lightGray, fontSize: 11, marginTop: 4, fontWeight: '500', fontFamily: 'Poppins' },
  cardBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary, borderRadius: 10, paddingVertical: 10, marginTop: 10, gap: 6 },
  cardBtnDisabled: { backgroundColor: '#444', opacity: 0.6 },
  cardBtnText: { color: '#000', fontWeight: '800', fontSize: 13, fontFamily: 'Poppins' },
  
  overlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', alignItems: 'center', justifyContent: 'flex-end', zIndex: 1000, pointerEvents: 'auto' },
  confirmOverlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', alignItems: 'center', justifyContent: 'center', zIndex: 1002, pointerEvents: 'auto', paddingHorizontal: 16 },
  
  detailBox: { width: '100%', height: '95%', backgroundColor: Colors.cardBackground, borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: 'hidden', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16 },
  detailHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, paddingHorizontal: 2 },
  detailScroll: { flex: 1, marginTop: 12 },
  detailScrollContent: { paddingHorizontal: 2, paddingBottom: 8 },
  detailTitle: { color: '#fff', fontSize: 18, fontWeight: '800', fontFamily: 'Poppins' },
  backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  detailImageContainer: { width: '100%', aspectRatio: 1, borderRadius: 14, overflow: 'hidden', backgroundColor: '#111', marginBottom: 16 },
  detailImage: { width: '100%', height: '100%' },
  detailContent: { marginBottom: 16 },
  detailProductName: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 8, fontFamily: 'Poppins' },
  detailPrice: { color: Colors.primary, fontSize: 20, fontWeight: '800', marginBottom: 12, fontFamily: 'Poppins' },
  detailMetaRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  metaItem: { flex: 1, backgroundColor: '#2f2f2f', padding: 12, borderRadius: 10 },
  metaLabel: { color: Colors.lightGray, fontSize: 11, fontWeight: '600', fontFamily: 'Poppins' },
  metaValue: { color: '#fff', fontSize: 14, fontWeight: '800', marginTop: 4 },
  detailDescLabel: { color: Colors.lightGray, fontSize: 12, fontWeight: '700', marginBottom: 6, fontFamily: 'Poppins' },
  detailDesc: { color: '#fff', lineHeight: 20, marginBottom: 16, fontFamily: 'Poppins' },
  thumbImage: { width: 80, height: 80, borderRadius: 10, marginRight: 10, backgroundColor: '#111' },
  
  drawer: { position: 'absolute', top: 0, right: 0, bottom: 0, width: '85%', backgroundColor: Colors.cardBackground, zIndex: 1001, borderLeftWidth: 1, borderLeftColor: '#333', maxWidth: 400 },
  drawerHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#333' },
  drawerTitle: { color: '#fff', fontSize: 18, fontWeight: '800', fontFamily: 'Poppins' },
  cartItem: { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: '#222', alignItems: 'center' },
  cartItemImage: { width: 70, height: 70, borderRadius: 10, backgroundColor: '#111', overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  cartItemName: { color: '#fff', fontWeight: '700', fontSize: 13, fontFamily: 'Poppins' },
  cartItemPrice: { color: Colors.primary, fontWeight: '700', fontSize: 13, marginTop: 4, fontFamily: 'Poppins' },
  cartQtyRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 6 },
  qtySmallBtn: { width: 28, height: 28, borderRadius: 6, borderWidth: 1, borderColor: '#444', alignItems: 'center', justifyContent: 'center' },
  qtySmallText: { color: '#fff', fontWeight: '700', fontSize: 14, fontFamily: 'Poppins' },
  qtyValue: { color: '#fff', fontWeight: '700', minWidth: 28, textAlign: 'center', fontFamily: 'Poppins' },
  cartRemoveBtn: { padding: 8 },
  cartSummary: { paddingHorizontal: 14, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#333' },
  
  checkoutCard: { width: '100%', height: '98%', maxHeight: '98%', backgroundColor: Colors.cardBackground, borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: 'hidden', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16 },
  checkoutHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#333' },
  checkoutTitle: { color: '#fff', fontSize: 18, fontWeight: '800', fontFamily: 'Poppins' },
  label: { color: Colors.lightGray, fontSize: 12, fontWeight: '700', marginTop: 12, fontFamily: 'Poppins' },
  input: { backgroundColor: '#2b2b2b', color: '#fff', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: '#333', marginTop: 6, fontWeight: '500', fontFamily: 'Poppins' },
  dropdownBtn: { backgroundColor: '#2b2b2b', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, borderWidth: 1, borderColor: '#333', marginTop: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dropdownBtnText: { color: '#fff', fontWeight: '500', fontSize: 14, fontFamily: 'Poppins', flex: 1 },
  dropdownPlaceholder: { color: Colors.darkGray },
  dropdownMenu: { backgroundColor: '#1f1f1f', borderRadius: 10, borderWidth: 1, borderColor: '#333', marginTop: 2, maxHeight: 240, zIndex: 1000, elevation: 10 },
  dropdownItem: { paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#333' },
  dropdownItemText: { color: '#fff', fontWeight: '500', fontSize: 13, fontFamily: 'Poppins' },
  locationList: { marginTop: 6, backgroundColor: '#2f2f2f', borderRadius: 10, overflow: 'hidden', maxHeight: 150 },
  locationItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#333', gap: 8 },
  locationText: { color: '#fff', fontWeight: '500', flex: 1, fontFamily: 'Poppins' },
  selectedLocation: { flexDirection: 'row', alignItems: 'center', marginTop: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: Colors.primary + '15', borderRadius: 10, gap: 8 },
  selectedLocationText: { color: Colors.primary, fontWeight: '600', fontFamily: 'Poppins' },
  paymentOptions: { marginTop: 12, flexDirection: 'row', gap: 12, justifyContent: 'space-between' },
  paymentOption: { 
    flex: 1,
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    paddingVertical: 14, 
    paddingHorizontal: 16,
    borderWidth: 2, 
    borderColor: '#333',
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
    gap: 10,
  },
  paymentOptionActive: { 
    backgroundColor: Colors.primary + '25',
    borderColor: Colors.primary,
    borderWidth: 2
  },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#666' },
  radioActive: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  paymentText: { color: '#fff', fontWeight: '600', fontSize: 13, textAlign: 'center', fontFamily: 'Poppins' },
  orderSummary: { marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#333' },
  summaryTitle: { color: '#fff', fontWeight: '700', marginBottom: 8, fontSize: 13, fontFamily: 'Poppins' },
  divider: { height: 1, backgroundColor: '#333', marginVertical: 8 },
  
  confirmBox: { width: '100%', maxWidth: 380, backgroundColor: Colors.cardBackground, borderRadius: 16, padding: 20, alignItems: 'center' },
  confirmTitle: { color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 12, fontFamily: 'Poppins' },
  confirmId: { color: Colors.lightGray, fontSize: 13, marginTop: 6, fontFamily: 'Poppins' },
  confirmDivider: { height: 1, backgroundColor: '#333', width: '100%', marginVertical: 12 },
  confirmLabel: { color: Colors.lightGray, fontSize: 12, fontWeight: '600', marginTop: 8, fontFamily: 'Poppins' },
  confirmValue: { color: '#fff', fontSize: 14, fontWeight: '600', marginTop: 2, fontFamily: 'Poppins' },
  confirmTotal: { color: Colors.primary, fontSize: 18, fontWeight: '800', marginTop: 4, fontFamily: 'Poppins' },
  
  primaryBtn: { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  disabledBtn: { opacity: 0.5 },
  primaryText: { color: '#000', fontWeight: '800', fontSize: 15, fontFamily: 'Poppins' },
  buyNowBtn: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  buyNowText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 15,
    fontFamily: 'Poppins',
  },
  
  qtyPickerContainer: { paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#333' },
  qtyLabel: { color: Colors.lightGray, fontSize: 12, fontWeight: '700', marginBottom: 10, letterSpacing: 0.5, fontFamily: 'Poppins' },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.cardBackground,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#333',
    paddingHorizontal: 10,
    paddingVertical: 9,
    marginBottom: 12,
  },
  qtyBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.primary + '15',
    borderWidth: 2,
    borderColor: Colors.primary + '40',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnDisabled: { opacity: 0.35, backgroundColor: Colors.darkGray + '20', borderColor: Colors.darkGray + '30' },
  qtyDisplayBox: {
    minWidth: 85,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primary + '50',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  qtyDisplay: { color: Colors.primary, fontSize: 20, fontWeight: '800', textAlign: 'center', fontFamily: 'Poppins', letterSpacing: -0.5 },
  
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  rowLabel: { color: Colors.lightGray, fontWeight: '600', fontSize: 13, fontFamily: 'Poppins' },
  rowValue: { color: '#fff', fontWeight: '600', fontSize: 13, fontFamily: 'Poppins' },
  rowBold: { fontWeight: '800', fontSize: 14, color: '#fff' },
  
  gridList: { paddingHorizontal: 20 },
  gridWrapper: { justifyContent: 'space-between', gap: 10 },
  gridContent: { paddingBottom: 140 },
  errorText: { color: Colors.error, textAlign: 'center', marginTop: 20, fontWeight: '600', fontFamily: 'Poppins' },
  
  toast: { position: 'absolute', top: 30, alignSelf: 'center', backgroundColor: '#2f2f2f', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, zIndex: 1002, flexDirection: 'row', alignItems: 'center' },
  toastText: { color: '#fff', fontWeight: '600', fontSize: 13, fontFamily: 'Poppins' },
  
  historyHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#222' },
  historyTitle: { color: '#fff', fontSize: 20, fontWeight: '800', fontFamily: 'Poppins' },
  orderCard: { marginHorizontal: 14, marginVertical: 8, backgroundColor: Colors.cardBackground, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#333' },
  orderCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  orderStatusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  orderStatusText: { color: '#fff', fontWeight: '700', fontSize: 11 },
  orderId: { color: '#fff', fontWeight: '800', fontSize: 14, fontFamily: 'Poppins' },
  orderDate: { color: Colors.lightGray, fontSize: 11, marginTop: 2, fontFamily: 'Poppins' },
  orderMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  orderMetaText: { color: Colors.lightGray, fontSize: 12, fontWeight: '500', fontFamily: 'Poppins' },
  orderDetails: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#333' },
  detailsTitle: { color: '#fff', fontWeight: '700', fontSize: 13, marginBottom: 8, fontFamily: 'Poppins' },
  productRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#222' },
  prodName: { color: '#fff', fontWeight: '600', fontSize: 13, fontFamily: 'Poppins' },
  prodQty: { color: Colors.lightGray, fontSize: 11, marginTop: 2, fontFamily: 'Poppins' },
  prodPrice: { color: Colors.primary, fontWeight: '700', fontSize: 13, fontFamily: 'Poppins' },
  orderSummaryBox: { marginTop: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#333' },

  // Gallery styles
  galleryScroll: { marginVertical: 12, marginHorizontal: -16, paddingHorizontal: 16 },
  galleryThumb: { width: 80, height: 80, borderRadius: 10, marginRight: 8, overflow: 'hidden', borderWidth: 2, borderColor: '#333' },
  galleryThumbActive: { borderColor: Colors.primary },
  galleryThumbImage: { width: '100%', height: '100%' },

  // Image indicator
  imageIndicator: { position: 'absolute', bottom: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  imageIndicatorText: { color: '#fff', fontWeight: '600', fontSize: 12 },

  // New category badge
  categoryBadge: { backgroundColor: Colors.primary + '20', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, alignSelf: 'flex-start', marginTop: 12, marginBottom: 16, borderWidth: 1, borderColor: Colors.primary },
  categoryBadgeText: { color: Colors.primary, fontWeight: '700', fontSize: 12 },
});

export default StoreScreen;
