import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import Razorpay from 'razorpay';
import crypto from 'crypto';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/odoo_cafe';
mongoose.connect(mongoURI)
  .then(() => console.log('MongoDB Atlas connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Schemas structured distinctly for Admin and Kitchen Staff entities
// Using strict: false allows Mongoose to absorb the exact frontend data structures perfectly seamlessly
// _id: false on nested schemas prevents Mongoose from auto-generating _id on subdocuments
const UserSchema = new mongoose.Schema({}, { strict: false, _id: true });
const ProductSchema = new mongoose.Schema({}, { strict: false, _id: true });
const FloorSchema = new mongoose.Schema({}, { strict: false, _id: true });
const OrderSchema = new mongoose.Schema({}, { strict: false, _id: true });
const SessionHistorySchema = new mongoose.Schema({}, { strict: false, _id: true });
const ConfigSchema = new mongoose.Schema({}, { strict: false, _id: true });

// Create collections relevant for Admin and Kitchen staff
const User = mongoose.model('User', UserSchema);
const Product = mongoose.model('Product', ProductSchema);
const Floor = mongoose.model('Floor', FloorSchema);
const Order = mongoose.model('Order', OrderSchema);
const SessionHistory = mongoose.model('SessionHistory', SessionHistorySchema);
const Config = mongoose.model('Config', ConfigSchema);

// Recursively remove MongoDB internal properties (_id, __v) from all levels
function deepClean(obj) {
  if (Array.isArray(obj)) {
    return obj.map(item => deepClean(item));
  }
  if (obj !== null && typeof obj === 'object') {
    const cleaned = {};
    for (const key of Object.keys(obj)) {
      if (key === '_id' || key === '__v') continue;
      cleaned[key] = deepClean(obj[key]);
    }
    return cleaned;
  }
  return obj;
}

// Clean an array of lean Mongoose documents
const cleanDbDocs = (arr) => deepClean(arr);

// Strip any _id / __v that might have leaked into the frontend state before inserting
function stripMongoFields(data) {
  if (Array.isArray(data)) {
    return data.map(item => stripMongoFields(item));
  }
  if (data !== null && typeof data === 'object') {
    const cleaned = {};
    for (const key of Object.keys(data)) {
      if (key === '_id' || key === '__v') continue;
      cleaned[key] = stripMongoFields(data[key]);
    }
    return cleaned;
  }
  return data;
}

// Endpoint to get state and construct it back for the frontend
app.get('/api/state', async (req, res) => {
  try {
    const [users, products, floors, orders, sessionHistory, config] = await Promise.all([
      User.find().lean(),
      Product.find().lean(),
      Floor.find().lean(),
      Order.find().lean(),
      SessionHistory.find().lean(),
      Config.findOne({ docType: 'global' }).lean()
    ]);

    res.json({
      success: true,
      state: {
        users: cleanDbDocs(users),
        currentUser: null,
        products: cleanDbDocs(products),
        floors: cleanDbDocs(floors),
        orders: cleanDbDocs(orders),
        sessionHistory: cleanDbDocs(sessionHistory),
        kitchenAvailability: config?.kitchenAvailability || {},
        paymentMethods: config?.paymentMethods || {},
        currentSession: config?.currentSession || null
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint to save structured data from frontend
app.post('/api/state', async (req, res) => {
  try {
    const { state } = req.body;
    if (!state) return res.status(400).json({ success: false, message: 'No state provided' });

    // Clean all incoming data to strip any leaked _id / __v before inserting
    // Admin Data
    if (state.users && Array.isArray(state.users)) {
      await User.deleteMany({});
      const cleanUsers = stripMongoFields(state.users);
      if (cleanUsers.length) await User.insertMany(cleanUsers);
    }
    
    if (state.products && Array.isArray(state.products)) {
      await Product.deleteMany({});
      const cleanProducts = stripMongoFields(state.products);
      if (cleanProducts.length) await Product.insertMany(cleanProducts);
    }

    if (state.floors && Array.isArray(state.floors)) {
      await Floor.deleteMany({});
      const cleanFloors = stripMongoFields(state.floors);
      if (cleanFloors.length) await Floor.insertMany(cleanFloors);
    }

    if (state.sessionHistory && Array.isArray(state.sessionHistory)) {
      await SessionHistory.deleteMany({});
      const cleanHistory = stripMongoFields(state.sessionHistory);
      if (cleanHistory.length) await SessionHistory.insertMany(cleanHistory);
    }

    // Kitchen Data
    if (state.orders && Array.isArray(state.orders)) {
      await Order.deleteMany({});
      const cleanOrders = stripMongoFields(state.orders);
      if (cleanOrders.length) await Order.insertMany(cleanOrders);
    }

    // Global Settings & Kitchen Configuration
    await Config.findOneAndUpdate(
      { docType: 'global' },
      {
        docType: 'global',
        kitchenAvailability: state.kitchenAvailability || {},
        paymentMethods: state.paymentMethods || {},
        currentSession: state.currentSession || null
      },
      { upsert: true }
    );

    res.json({ success: true, message: 'Database collections successfully updated' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint to reset all data (wipe all collections)
app.delete('/api/reset', async (req, res) => {
  try {
    await Promise.all([
      User.deleteMany({}),
      Product.deleteMany({}),
      Floor.deleteMany({}),
      Order.deleteMany({}),
      SessionHistory.deleteMany({}),
      Config.deleteMany({})
    ]);
    res.json({ success: true, message: 'All data wiped successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── Razorpay Endpoints ───

// Expose public key to frontend
app.get('/api/razorpay/key', (req, res) => {
  res.json({ key: process.env.RAZORPAY_KEY_ID });
});

// Create a Razorpay order
app.post('/api/razorpay/order', async (req, res) => {
  try {
    const { amount } = req.body; // amount in ₹ (rupees)
    const options = {
      amount: Math.round(amount * 100), // Razorpay expects paise
      currency: 'INR',
      receipt: 'receipt_' + Date.now(),
    };
    const order = await razorpay.orders.create(options);
    res.json({ success: true, order });
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Verify Razorpay payment signature
app.post('/api/razorpay/verify', (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature === razorpay_signature) {
      res.json({ success: true, message: 'Payment verified' });
    } else {
      res.status(400).json({ success: false, message: 'Invalid signature' });
    }
  } catch (error) {
    console.error('Razorpay verification error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
