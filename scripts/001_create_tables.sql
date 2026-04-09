-- Terra Verde Pizza Database Schema

-- Categories table (pizza, drinks, desserts, etc.)
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_hu TEXT NOT NULL,
  name_en TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products table (pizzas, items)
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name_hu TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_hu TEXT,
  description_en TEXT,
  base_price INTEGER NOT NULL, -- price in HUF (smallest unit)
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  is_customizable BOOLEAN DEFAULT false, -- can add toppings/sizes
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sizes for customizable products (small, medium, large)
CREATE TABLE IF NOT EXISTS sizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_hu TEXT NOT NULL,
  name_en TEXT NOT NULL,
  size_cm INTEGER, -- diameter in cm for pizzas
  price_multiplier NUMERIC(3,2) DEFAULT 1.00, -- 1.0 = base price, 1.2 = +20%
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);

-- Extra toppings
CREATE TABLE IF NOT EXISTS toppings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_hu TEXT NOT NULL,
  name_en TEXT NOT NULL,
  price INTEGER NOT NULL, -- extra price in HUF
  is_available BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0
);

-- User profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  default_address TEXT,
  default_city TEXT,
  default_zip TEXT,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- null for guest orders
  order_number TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'delivering', 'completed', 'cancelled')),
  delivery_type TEXT NOT NULL CHECK (delivery_type IN ('delivery', 'pickup')),
  
  -- Customer info (stored even for guests)
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  
  -- Delivery address (null for pickup)
  delivery_address TEXT,
  delivery_city TEXT,
  delivery_zip TEXT,
  
  -- Pricing
  subtotal INTEGER NOT NULL,
  delivery_fee INTEGER DEFAULT 0,
  total INTEGER NOT NULL,
  
  -- Payment
  payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card')),
  
  -- Notes
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  estimated_delivery TIMESTAMPTZ
);

-- Order items
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  size_id UUID REFERENCES sizes(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price INTEGER NOT NULL,
  total_price INTEGER NOT NULL,
  notes TEXT, -- special requests
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order item toppings (many-to-many)
CREATE TABLE IF NOT EXISTS order_item_toppings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  topping_id UUID NOT NULL REFERENCES toppings(id),
  price INTEGER NOT NULL
);

-- Store settings
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
