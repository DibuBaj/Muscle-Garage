import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ScrollView, TextInput, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { API_URL } from '@/constants/api';

const SHIPPING = 100;
const mockUser = { name: 'Alex Johnson', email: 'alex@example.com', phone: '+977 9800000000' };
const categories = ['Whey Protein','Creatine','Pre-Workout','Plant Protein','Multivitamin','Fish Oil','BCAA','Other'];

const formatRs = (v:number) => `Rs ${Number(v||0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

type Product = {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  images: string[];
};

type CartItem = { id: string; name: string; price: number; quantity: number; image?: string; stock: number };

type OrderPayload = {
  customerName: string;
  phone: string;
  email: string;
  location: string;
  paymentMethod: string;
  products: { productId: string; quantity: number }[];
};

const StoreScreen = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ cats: new Set<string>(), inStock: false, min: 0, max: 20000, sort: 'newest' });
  const [selected, setSelected] = useState<Product | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [checkout, setCheckout] = useState({ name: mockUser.name, email: mockUser.email, phone: mockUser.phone, location: '', paymentMethod: 'Cash on Delivery' });
  const [locQuery, setLocQuery] = useState('');
  const [locOptions, setLocOptions] = useState<string[]>([]);
  const [placing, setPlacing] = useState(false);
  const [confirmation, setConfirmation] = useState<any>(null);
  const locTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const drawerX = useRef(new Animated.Value(420)).current;

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`${API_URL}/products`);
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed to load products');
      setProducts(data.products || []);
    } catch (err:any) {
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!locQuery) { setLocOptions([]); return; }
    if (locTimer.current) clearTimeout(locTimer.current);
    locTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locQuery)}&addressdetails=1&limit=5`);
        const data = await res.json();
        setLocOptions((data || []).map((d:any) => d.display_name));
      } catch (e) {
        console.log('Location fetch failed');
      }
    }, 300);
  }, [locQuery]);

  useEffect(() => {
    Animated.spring(drawerX, { toValue: cartOpen ? 0 : 420, useNativeDriver: true, bounciness: 0, speed: 20 }).start();
  }, [cartOpen]);

  const filtered = useMemo(() => {
    let list = [...products];
    if (filters.cats.size) list = list.filter((p) => filters.cats.has(p.category));
    if (filters.inStock) list = list.filter((p) => p.stock > 0);
    list = list.filter((p) => p.price >= filters.min && p.price <= filters.max + 0.0001);
    switch (filters.sort) {
      case 'price-asc': list.sort((a,b)=>a.price-b.price); break;
      case 'price-desc': list.sort((a,b)=>b.price-a.price); break;
      case 'name': list.sort((a,b)=>a.name.localeCompare(b.name)); break;
      default: list.sort((a,b)=> (b as any).createdAt?.localeCompare?.((a as any).createdAt) || 0);
    }
    return list;
  }, [products, filters]);

  const cartCount = cart.reduce((s,i)=>s+i.quantity,0);
  const subtotal = cart.reduce((s,i)=>s+i.quantity*i.price,0);
  const total = subtotal + (cart.length ? SHIPPING : 0);

  const showToast = (msg:string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2600);
  };

  const addToCart = (p:Product, qty=1) => {
    if (p.stock === 0) return;
    setCart((prev) => {
      const existing = prev.find((i) => i.id === p._id);
      if (existing) {
        const nextQty = Math.min(existing.quantity + qty, p.stock);
        return prev.map((i) => i.id === p._id ? { ...i, quantity: nextQty } : i);
      }
      return [...prev, { id: p._id, name: p.name, price: p.price, quantity: Math.min(qty, p.stock), image: p.images?.[0], stock: p.stock }];
    });
    showToast('Added to cart');
  };

  const updateQty = (id:string, delta:number) => {
    setCart((prev) => prev.map((i) => {
      if (i.id !== id) return i;
      const product = products.find((p) => p._id === id);
      const max = product ? product.stock : i.stock;
      const next = Math.max(1, Math.min(i.quantity + delta, max));
      return { ...i, quantity: next };
    }));
  };

  const removeItem = (id:string) => setCart((prev) => prev.filter((i)=>i.id!==id));

  const placeOrder = async () => {
    if (!cart.length) { showToast('Cart is empty'); return; }
    if (!checkout.name || !checkout.email || !checkout.phone || !checkout.location) {
      showToast('Please fill all fields');
      return;
    }
    const payload:OrderPayload = {
      customerName: checkout.name,
      email: checkout.email,
      phone: checkout.phone,
      location: checkout.location,
      paymentMethod: checkout.paymentMethod,
      products: cart.map((c) => ({ productId: c.id, quantity: c.quantity })),
    };
    try {
      setPlacing(true);
      const res = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setConfirmation({ order: data.order, total });
        setCart([]);
        setCheckoutOpen(false);
        setCartOpen(false);
        showToast('Order placed');
      } else {
        showToast(data.message || 'Failed to place order');
      }
    } catch (err:any) {
      showToast(err.message || 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  const renderCard = ({ item }: { item: Product }) => (
    <TouchableOpacity style={styles.card} onPress={() => setSelected(item)}>
      <View style={styles.imageWrap}>
        <Image source={{ uri: item.images?.[0] }} style={styles.image} />
        {item.stock === 0 && <View style={styles.outBadge}><Text style={styles.outText}>Out of Stock</Text></View>}
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.name}</Text>
        <View style={styles.cardRow}>
          <Text style={styles.cardPrice}>{formatRs(item.price)}</Text>
          <TouchableOpacity style={[styles.addBtn, item.stock===0 && { opacity: 0.4 }]} disabled={item.stock===0} onPress={() => addToCart(item,1)}>
            <Text style={styles.addBtnText}>{item.stock===0 ? 'Out' : 'Add'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const Detail = () => {
    if (!selected) return null;
    return (
      <View style={styles.detail}>
        <TouchableOpacity onPress={() => setSelected(null)} style={styles.backRow}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
          <Text style={{ color: '#fff', marginLeft: 6 }}>Back</Text>
        </TouchableOpacity>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 12 }}>
          {selected.images?.map((img, idx) => (
            <Image key={idx} source={{ uri: img }} style={styles.detailImg} />
          ))}
        </ScrollView>
        <Text style={styles.detailTitle}>{selected.name}</Text>
        <Text style={styles.detailPrice}>{formatRs(selected.price)}</Text>
        <Text style={styles.detailDesc}>{selected.description}</Text>
        <Text style={{ color: Colors.lightGray, marginVertical: 6 }}>Stock: {selected.stock}</Text>
        <QuantityPicker
          max={selected.stock}
          onAdd={(qty) => addToCart(selected, qty)}
          disabled={selected.stock===0}
        />
      </View>
    );
  };

  const CartDrawer = () => (
    <Animated.View style={[styles.drawer, { transform: [{ translateX: drawerX }] }]}> 
      <View style={styles.drawerHead}>
        <Text style={styles.drawerTitle}>Cart ({cartCount})</Text>
        <TouchableOpacity onPress={() => setCartOpen(false)}><Ionicons name="close" size={22} color="#fff" /></TouchableOpacity>
      </View>
      <ScrollView style={{ flex: 1 }}>
        {cart.length === 0 && <Text style={{ color: Colors.lightGray }}>Cart is empty.</Text>}
        {cart.map((item) => (
          <View key={item.id} style={styles.cartRow}>
            <Image source={{ uri: item.image }} style={styles.cartImg} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>{item.name}</Text>
              <Text style={{ color: Colors.lightGray, fontSize: 12 }}>{formatRs(item.price)}</Text>
              <View style={styles.qtyRow}>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(item.id, -1)}><Text style={styles.qtyText}>-</Text></TouchableOpacity>
                <Text style={{ color: '#fff', marginHorizontal: 8 }}>{item.quantity}</Text>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(item.id, 1)}><Text style={styles.qtyText}>+</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => removeItem(item.id)}><Text style={{ color: Colors.error, marginLeft: 10 }}>Remove</Text></TouchableOpacity>
              </View>
            </View>
            <Text style={{ color: '#fff', fontWeight: '700' }}>{formatRs(item.quantity * item.price)}</Text>
          </View>
        ))}
      </ScrollView>
      <View style={styles.drawerFoot}>
        <Row label="Subtotal" value={formatRs(subtotal)} />
        <Row label="Shipping" value={formatRs(cart.length ? SHIPPING : 0)} />
        <Row label="Total" value={formatRs(total)} bold />
        <TouchableOpacity style={[styles.primaryBtn, { opacity: cart.length ? 1 : 0.4 }]} disabled={!cart.length} onPress={() => setCheckoutOpen(true)}>
          <Text style={styles.primaryText}>Checkout</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setCartOpen(false)}>
          <Text style={{ color: Colors.primary, textAlign: 'center', marginTop: 8 }}>Continue shopping</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  const Checkout = () => (
    <View style={styles.overlay}>
      <View style={styles.checkoutCard}>
        <View style={styles.checkoutHead}>
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>Checkout</Text>
          <TouchableOpacity onPress={() => setCheckoutOpen(false)}><Ionicons name="close" size={22} color="#fff" /></TouchableOpacity>
        </View>
        <ScrollView style={{ maxHeight: 420 }}>
          <Label text="Full Name" />
          <Input value={checkout.name} onChangeText={(v)=>setCheckout({ ...checkout, name: v })} />
          <Label text="Email" />
          <Input value={checkout.email} onChangeText={(v)=>setCheckout({ ...checkout, email: v })} />
          <Label text="Phone" />
          <Input value={checkout.phone} onChangeText={(v)=>setCheckout({ ...checkout, phone: v })} />
          <Label text="Location" />
          <Input value={checkout.location} onChangeText={(v)=>{ setCheckout({ ...checkout, location: v }); setLocQuery(v); }} />
          {locOptions.length > 0 && (
            <View style={styles.dropdown}>
              {locOptions.map((opt, idx) => (
                <TouchableOpacity key={idx} onPress={() => { setCheckout({ ...checkout, location: opt }); setLocQuery(''); setLocOptions([]); }}>
                  <Text style={styles.dropdownItem}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          <Label text="Payment Method" />
          <View style={styles.segment}>
            {['Cash on Delivery','Online'].map((pm) => (
              <TouchableOpacity key={pm} style={[styles.segmentBtn, checkout.paymentMethod===pm && styles.segmentActive]} onPress={()=>setCheckout({ ...checkout, paymentMethod: pm })}>
                <Text style={{ color: '#fff' }}>{pm}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {checkout.paymentMethod === 'Online' && <Text style={{ color: Colors.lightGray, marginBottom: 8 }}>Online payment integration coming soon.</Text>}

          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>Order Summary</Text>
            {cart.map((item) => (
              <Row key={item.id} label={`${item.name} x ${item.quantity}`} value={formatRs(item.quantity * item.price)} />
            ))}
            <Row label="Subtotal" value={formatRs(subtotal)} />
            <Row label="Shipping" value={formatRs(cart.length ? SHIPPING : 0)} />
            <Row label="Total" value={formatRs(total)} bold />
          </View>
        </ScrollView>
        <TouchableOpacity style={[styles.primaryBtn, { marginTop: 12 }]} onPress={placeOrder} disabled={placing}>
          <Text style={styles.primaryText}>{placing ? 'Placing...' : 'Place Order'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const Confirmation = () => confirmation && (
    <View style={styles.overlay}>
      <View style={styles.confirmBox}>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>Order Confirmed</Text>
        <Text style={{ color: Colors.lightGray, marginTop: 6 }}>Order ID: {confirmation.order?.id || confirmation.order?._id}</Text>
        <Text style={{ color: Colors.lightGray, marginTop: 6 }}>Payment: {confirmation.order?.paymentMethod}</Text>
        <Text style={{ color: '#fff', marginTop: 12, fontWeight: '700' }}>Total: {formatRs((confirmation.order?.orderTotal||0)+(confirmation.order?.shippingCost||0))}</Text>
        <TouchableOpacity style={[styles.primaryBtn, { marginTop: 12 }]} onPress={()=>setConfirmation(null)}>
          <Text style={styles.primaryText}>Continue Shopping</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Supplement Store</Text>
        <TouchableOpacity style={styles.cartBtn} onPress={() => setCartOpen(true)}>
          <Ionicons name="cart" size={22} color="#fff" />
          {cartCount > 0 && <View style={styles.cartBadge}><Text style={styles.cartBadgeText}>{cartCount}</Text></View>}
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        <TouchableOpacity style={styles.clearBtn} onPress={() => setFilters({ cats: new Set(), inStock: false, min:0, max:20000, sort:'newest' })}>
          <Text style={{ color: Colors.primary }}>Clear Filters</Text>
        </TouchableOpacity>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.chip, filters.cats.has(cat) && styles.chipActive]}
            onPress={() => {
              const next = new Set(filters.cats);
              next.has(cat) ? next.delete(cat) : next.add(cat);
              setFilters({ ...filters, cats: next });
            }}
          >
            <Text style={{ color: '#fff' }}>{cat}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={[styles.chip, filters.inStock && styles.chipActive]} onPress={() => setFilters({ ...filters, inStock: !filters.inStock })}>
          <Text style={{ color: '#fff' }}>In Stock</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.sortRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ color: Colors.lightGray }}>Price:</Text>
          <TextInput
            keyboardType="numeric"
            value={String(filters.min)}
            onChangeText={(v)=>setFilters({ ...filters, min: Number(v) || 0 })}
            style={[styles.input, { width: 80, paddingVertical: 6, paddingHorizontal: 8, marginLeft: 6 }]}
            placeholder="Min"
            placeholderTextColor={Colors.darkGray}
          />
          <Text style={{ color: Colors.lightGray }}>to</Text>
          <TextInput
            keyboardType="numeric"
            value={String(filters.max)}
            onChangeText={(v)=>setFilters({ ...filters, max: Number(v) || 0 })}
            style={[styles.input, { width: 80, paddingVertical: 6, paddingHorizontal: 8, marginLeft: 6 }]}
            placeholder="Max"
            placeholderTextColor={Colors.darkGray}
          />
        </View>
        <View style={styles.sortButtons}>
          {['price-asc','price-desc','name','newest'].map((opt) => (
            <TouchableOpacity key={opt} style={[styles.sortBtn, filters.sort===opt && styles.sortActive]} onPress={()=>setFilters({ ...filters, sort: opt })}>
              <Text style={{ color: '#fff', fontSize: 12 }}>{opt.replace('price-','Price ').replace('name','Name').replace('newest','Newest')}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading && <Text style={{ color: Colors.lightGray }}>Loading...</Text>}
      {error ? <Text style={{ color: Colors.error }}>{error}</Text> : null}

      {!selected && (
        <FlatList
          data={filtered}
          renderItem={renderCard}
          keyExtractor={(item) => item._id}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          contentContainerStyle={{ paddingBottom: 120 }}
        />
      )}

      {selected && <Detail />}

      {cartOpen && <CartDrawer />}
      {checkoutOpen && <Checkout />}
      <Confirmation />
      {toast ? <View style={styles.toast}><Text style={{ color: '#fff' }}>{toast}</Text></View> : null}
    </View>
  );
};

const QuantityPicker = ({ max, onAdd, disabled }:{ max:number; onAdd:(qty:number)=>void; disabled?:boolean }) => {
  const [qty, setQty] = useState(1);
  useEffect(()=>setQty(1), [max]);
  return (
    <View>
      <View style={styles.qtyRow}>
        <TouchableOpacity style={styles.qtyBtn} disabled={disabled} onPress={()=>setQty(Math.max(1, qty-1))}><Text style={styles.qtyText}>-</Text></TouchableOpacity>
        <Text style={{ color: '#fff', marginHorizontal: 8 }}>{qty}</Text>
        <TouchableOpacity style={styles.qtyBtn} disabled={disabled} onPress={()=>setQty(Math.min(max || 1, qty+1))}><Text style={styles.qtyText}>+</Text></TouchableOpacity>
      </View>
      <TouchableOpacity style={[styles.primaryBtn, { marginTop: 8, opacity: disabled ? 0.4 : 1 }]} disabled={disabled} onPress={()=>onAdd(qty)}>
        <Text style={styles.primaryText}>{disabled ? 'Out of Stock' : 'Add to Cart'}</Text>
      </TouchableOpacity>
    </View>
  );
};

const Row = ({ label, value, bold }:{ label:string; value:string; bold?:boolean }) => (
  <View style={styles.row}>
    <Text style={[styles.rowLabel, bold && { fontWeight: '800' }]}>{label}</Text>
    <Text style={[styles.rowValue, bold && { fontWeight: '800' }]}>{value}</Text>
  </View>
);

const Label = ({ text }:{ text:string }) => <Text style={{ color: Colors.lightGray, marginTop: 8 }}>{text}</Text>;
const Input = (props:any) => <TextInput {...props} style={[styles.input, props.style]} placeholderTextColor={Colors.darkGray} />;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 14 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  title: { color: '#fff', fontSize: 22, fontWeight: '800' },
  cartBtn: { padding: 8, borderRadius: 10, borderWidth: 1, borderColor: '#333', position: 'relative' },
  cartBadge: { position: 'absolute', top: -6, right: -6, backgroundColor: Colors.primary, borderRadius: 999, paddingHorizontal: 6, paddingVertical: 2 },
  cartBadgeText: { color: '#000', fontWeight: '800', fontSize: 11 },
  filterRow: { flexGrow: 0, marginBottom: 8 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, borderWidth: 1, borderColor: '#333', marginRight: 8 },
  chipActive: { backgroundColor: '#2f2f2f', borderColor: Colors.primary },
  clearBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, borderWidth: 1, borderColor: Colors.primary, marginRight: 8 },
  sortRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sortButtons: { flexDirection: 'row' },
  sortBtn: { paddingHorizontal: 8, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: '#333', marginLeft: 6 },
  sortActive: { borderColor: Colors.primary },
  card: { backgroundColor: Colors.cardBackground, borderRadius: 12, overflow: 'hidden', flex: 0.48, marginBottom: 10 },
  imageWrap: { width: '100%', aspectRatio: 1.1, backgroundColor: '#111' },
  image: { width: '100%', height: '100%' },
  outBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: '#e53935', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  outText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  cardBody: { padding: 10 },
  cardTitle: { color: '#fff', fontWeight: '700', minHeight: 36 },
  cardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  cardPrice: { color: '#fff', fontWeight: '800' },
  addBtn: { backgroundColor: '#2f2f2f', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  addBtnText: { color: '#fff', fontWeight: '700' },
  detail: { backgroundColor: Colors.cardBackground, borderRadius: 12, padding: 12 },
  detailImg: { width: 240, height: 180, borderRadius: 12, marginRight: 10 },
  detailTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  detailPrice: { color: Colors.primary, fontSize: 18, fontWeight: '800', marginVertical: 6 },
  detailDesc: { color: Colors.lightGray, lineHeight: 20 },
  backRow: { flexDirection: 'row', alignItems: 'center' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  qtyBtn: { borderWidth: 1, borderColor: '#444', borderRadius: 8, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  qtyText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  primaryBtn: { backgroundColor: Colors.primary, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  primaryText: { color: '#000', fontWeight: '800' },
  drawer: { position: 'absolute', top: 0, right: 0, bottom: 0, width: 360, backgroundColor: '#181818', padding: 14, zIndex: 20, borderLeftWidth: 1, borderLeftColor: '#333' },
  drawerHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  drawerTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  cartRow: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#222' },
  cartImg: { width: 64, height: 64, borderRadius: 8, backgroundColor: '#111', marginRight: 10 },
  drawerFoot: { paddingTop: 10, borderTopWidth: 1, borderTopColor: '#222' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4 },
  rowLabel: { color: Colors.lightGray },
  rowValue: { color: '#fff' },
  overlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 30 },
  checkoutCard: { backgroundColor: '#1f1f1f', borderRadius: 12, padding: 14, width: '100%', maxWidth: 540 },
  checkoutHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  input: { backgroundColor: '#2b2b2b', color: '#fff', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: '#333', marginTop: 6 },
  dropdown: { backgroundColor: '#2b2b2b', borderRadius: 10, borderWidth: 1, borderColor: '#333', marginTop: 4 },
  dropdownItem: { color: '#fff', padding: 10, borderBottomWidth: 1, borderBottomColor: '#333' },
  segment: { flexDirection: 'row', marginVertical: 8 },
  segmentBtn: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: '#333', marginRight: 8 },
  segmentActive: { borderColor: Colors.primary, backgroundColor: '#2f2f2f' },
  summaryBox: { backgroundColor: '#252525', borderRadius: 10, padding: 10, marginTop: 10 },
  summaryTitle: { color: '#fff', fontWeight: '700', marginBottom: 6 },
  confirmBox: { backgroundColor: '#1f1f1f', borderRadius: 12, padding: 16, width: '90%', maxWidth: 420, alignItems: 'center' },
  toast: { position: 'absolute', top: 30, alignSelf: 'center', backgroundColor: '#2f2f2f', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, zIndex: 40 },
});

export default StoreScreen;
