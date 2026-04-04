import { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import {
  SEED_PRODUCTS,
  SEED_FLOORS,
  DEFAULT_PAYMENT_METHODS,
  generateId,
} from '../data/seedData';

const AppContext = createContext(null);

const DEFAULT_USERS = [
  {
    id: 'u_admin',
    name: 'Admin User',
    email: 'admin@odoo.com',
    password: 'admin123',
    role: 'admin',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'u_kitchen',
    name: 'Kitchen Staff',
    email: 'kitchen@odoo.com',
    password: 'kitchen123',
    role: 'kitchen',
    createdAt: new Date().toISOString(),
  },
];

function getInitialState() {
  const kitchenAvailability = {};
  SEED_PRODUCTS.forEach(p => {
    kitchenAvailability[p.id] = true;
  });

  return {
    users: DEFAULT_USERS,
    currentUser: null,
    products: SEED_PRODUCTS,
    paymentMethods: DEFAULT_PAYMENT_METHODS,
    floors: SEED_FLOORS,
    orders: [],
    currentSession: null,
    sessionHistory: [],
    kitchenAvailability,
  };
}

// Ensure all required fields exist with safe defaults
function ensureCompleteState(dbState) {
  const defaults = getInitialState();
  return {
    users: Array.isArray(dbState.users)
      ? dbState.users.map(user => ({ ...user, id: user.id || generateId() }))
      : defaults.users,
    currentUser: null, // never restore from DB — session-only
    products: Array.isArray(dbState.products) && dbState.products.length > 0
      ? dbState.products : defaults.products,
    paymentMethods: dbState.paymentMethods && Object.keys(dbState.paymentMethods).length > 0
      ? dbState.paymentMethods : defaults.paymentMethods,
    floors: Array.isArray(dbState.floors) && dbState.floors.length > 0
      ? dbState.floors : defaults.floors,
    orders: Array.isArray(dbState.orders)
      ? dbState.orders.map(order => ({
          ...order,
          id: order.id || generateId(),
          createdAt: order.createdAt || new Date().toISOString(),
        }))
      : defaults.orders,
    currentSession: dbState.currentSession || null,
    sessionHistory: Array.isArray(dbState.sessionHistory) ? dbState.sessionHistory : defaults.sessionHistory,
    kitchenAvailability: dbState.kitchenAvailability && Object.keys(dbState.kitchenAvailability).length > 0
      ? dbState.kitchenAvailability : defaults.kitchenAvailability,
  };
}

// Sync state to MongoDB (fire-and-forget)
function syncToDB(state) {
  // Exclude currentUser — it's session-only, not persisted
  const { currentUser, ...toSync } = state;
  fetch('/api/state', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ state: toSync }),
  }).catch(e => console.error('Could not sync to DB', e));
}

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_FULL_STATE': {
      return ensureCompleteState(action.payload);
    }
    // ===== AUTH =====
    case 'SIGNUP': {
      const newUser = action.payload;
      return { ...state, users: [...state.users, newUser], currentUser: newUser };
    }
    case 'LOGIN': {
      return { ...state, currentUser: action.payload };
    }
    case 'LOGOUT': {
      return { ...state, currentUser: null };
    }

    // ===== PRODUCTS =====
    case 'ADD_PRODUCT': {
      return { ...state, products: [...state.products, action.payload] };
    }
    case 'UPDATE_PRODUCT': {
      return {
        ...state,
        products: state.products.map(p => p.id === action.payload.id ? action.payload : p),
      };
    }
    case 'DELETE_PRODUCT': {
      return {
        ...state,
        products: state.products.filter(p => p.id !== action.payload),
      };
    }

    // ===== PAYMENT METHODS =====
    case 'TOGGLE_PAYMENT_METHOD': {
      return {
        ...state,
        paymentMethods: {
          ...state.paymentMethods,
          [action.payload]: !state.paymentMethods[action.payload],
        },
      };
    }
    case 'SET_UPI_ID': {
      return {
        ...state,
        paymentMethods: { ...state.paymentMethods, upiId: action.payload },
      };
    }

    // ===== FLOORS & TABLES =====
    case 'ADD_FLOOR': {
      return { ...state, floors: [...state.floors, action.payload] };
    }
    case 'ADD_TABLE': {
      return {
        ...state,
        floors: state.floors.map(f =>
          f.id === action.payload.floorId
            ? { ...f, tables: [...f.tables, action.payload.table] }
            : f
        ),
      };
    }
    case 'UPDATE_TABLE_STATUS': {
      return {
        ...state,
        floors: state.floors.map(f => ({
          ...f,
          tables: f.tables.map(t =>
            t.id === action.payload.tableId
              ? { ...t, status: action.payload.status }
              : t
          ),
        })),
      };
    }
    case 'REMOVE_FLOOR': {
      return {
        ...state,
        floors: state.floors.filter(f => f.id !== action.payload),
      };
    }
    case 'REMOVE_TABLE': {
      return {
        ...state,
        floors: state.floors.map(f =>
          f.id === action.payload.floorId
            ? { ...f, tables: f.tables.filter(t => t.id !== action.payload.tableId) }
            : f
        ),
      };
    }

    // ===== ORDERS =====
    case 'ADD_ORDER': {
      return { ...state, orders: [action.payload, ...state.orders] };
    }
    case 'UPDATE_ORDER_STATUS': {
      return {
        ...state,
        orders: state.orders.map(o =>
          o.id === action.payload.orderId
            ? { ...o, status: action.payload.status }
            : o
        ),
      };
    }
    case 'UPDATE_ORDER_ITEM_STATUS': {
      return {
        ...state,
        orders: state.orders.map(o =>
          o.id === action.payload.orderId
            ? {
                ...o,
                items: o.items.map((item, idx) =>
                  idx === action.payload.itemIndex
                    ? { ...item, prepared: !item.prepared }
                    : item
                ),
              }
            : o
        ),
      };
    }
    case 'UPDATE_PAYMENT_STATUS': {
      return {
        ...state,
        orders: state.orders.map(o =>
          o.id === action.payload.orderId
            ? { ...o, paymentStatus: 'paid', paymentMethod: action.payload.paymentMethod }
            : o
        ),
      };
    }

    // ===== SESSION =====
    case 'OPEN_SESSION': {
      return {
        ...state,
        currentSession: {
          id: 'session_' + Date.now(),
          openedAt: new Date().toISOString(),
          status: 'open',
        },
      };
    }
    case 'CLOSE_SESSION': {
      const sessionEntry = {
        id: state.currentSession?.id || 'session_' + Date.now(),
        openedAt: state.currentSession?.openedAt || new Date().toISOString(),
        closedAt: new Date().toISOString(),
        closingSale: action.payload || 0,
      };
      return {
        ...state,
        currentSession: null,
        sessionHistory: [sessionEntry, ...state.sessionHistory],
      };
    }

    // ===== KITCHEN AVAILABILITY =====
    case 'TOGGLE_KITCHEN_AVAILABILITY': {
      const productId = action.payload;
      return {
        ...state,
        kitchenAvailability: {
          ...state.kitchenAvailability,
          [productId]: !state.kitchenAvailability[productId],
        },
      };
    }

    default:
      return state;
  }
}

// Actions that should NOT trigger a DB sync (read-only or session-only)
const SKIP_SYNC_ACTIONS = new Set(['SET_FULL_STATE', 'LOGIN', 'LOGOUT']);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, undefined, getInitialState);
  const lastActionRef = useRef(null);

  // Wrap dispatch to track which action caused the change
  const trackedDispatch = (action) => {
    lastActionRef.current = action.type;
    dispatch(action);
  };

  // Load state from MongoDB on mount
  useEffect(() => {
    let active = true;

    fetch('/api/state')
      .then(res => res.ok ? res.json() : Promise.reject('fetch failed'))
      .then(data => {
        if (!active || !data.success || !data.state) return;

        const {
          products = [],
          users = [],
          floors = [],
        } = data.state || {};

        const isEmpty = products.length === 0 && users.length === 0 && floors.length === 0;

        if (!isEmpty) {
          dispatch({ type: 'SET_FULL_STATE', payload: data.state });
        } else {
          // DB is empty — seed it with defaults
          const seed = getInitialState();
          syncToDB(seed);
        }
      })
      .catch(err => console.error('Database unreachable.', err));

    return () => { active = false; };
  }, []);

  // Sync to MongoDB only for user-initiated actions that change persisted data
  useEffect(() => {
    const action = lastActionRef.current;
    // Don't sync for: initial render (null), DB load, login/logout (session-only)
    if (!action || SKIP_SYNC_ACTIONS.has(action)) return;

    syncToDB(state);
  }, [state]);

  return (
    <AppContext.Provider value={{ state, dispatch: trackedDispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

export default AppContext;
