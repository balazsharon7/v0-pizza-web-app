-- Seed data for Terra Verde Pizza

-- Insert categories
INSERT INTO categories (name_hu, name_en, slug, sort_order) VALUES
  ('Pizzák', 'Pizzas', 'pizzas', 1),
  ('Italok', 'Drinks', 'drinks', 2),
  ('Desszertek', 'Desserts', 'desserts', 3),
  ('Extrák', 'Extras', 'extras', 4)
ON CONFLICT (slug) DO NOTHING;

-- Insert sizes
INSERT INTO sizes (name_hu, name_en, size_cm, price_multiplier, sort_order) VALUES
  ('Kicsi', 'Small', 26, 0.80, 1),
  ('Közepes', 'Medium', 32, 1.00, 2),
  ('Nagy', 'Large', 45, 1.40, 3)
ON CONFLICT DO NOTHING;

-- Insert toppings
INSERT INTO toppings (name_hu, name_en, price, sort_order) VALUES
  ('Extra sajt', 'Extra cheese', 400, 1),
  ('Sonka', 'Ham', 500, 2),
  ('Gomba', 'Mushrooms', 400, 3),
  ('Bacon', 'Bacon', 600, 4),
  ('Jalapeño', 'Jalapeño', 350, 5),
  ('Olívabogyó', 'Olives', 400, 6),
  ('Paprika', 'Bell pepper', 350, 7),
  ('Hagyma', 'Onion', 300, 8),
  ('Kukorica', 'Corn', 350, 9),
  ('Ananász', 'Pineapple', 400, 10)
ON CONFLICT DO NOTHING;

-- Insert pizzas
INSERT INTO products (category_id, name_hu, name_en, description_hu, description_en, base_price, is_customizable, sort_order)
SELECT 
  c.id,
  p.name_hu,
  p.name_en,
  p.description_hu,
  p.description_en,
  p.base_price,
  true,
  p.sort_order
FROM categories c
CROSS JOIN (VALUES
  ('Margherita', 'Margherita', 'Paradicsomszósz, mozzarella, friss bazsalikom', 'Tomato sauce, mozzarella, fresh basil', 2490, 1),
  ('Pepperoni', 'Pepperoni', 'Paradicsomszósz, mozzarella, pepperoni szalámi', 'Tomato sauce, mozzarella, pepperoni salami', 2890, 2),
  ('Quattro Formaggi', 'Four Cheese', 'Mozzarella, gorgonzola, parmesan, ricotta', 'Mozzarella, gorgonzola, parmesan, ricotta', 3290, 3),
  ('Prosciutto e Funghi', 'Ham & Mushroom', 'Paradicsomszósz, mozzarella, sonka, gomba', 'Tomato sauce, mozzarella, ham, mushrooms', 2990, 4),
  ('Diavola', 'Diavola', 'Paradicsomszósz, mozzarella, csípős szalámi, chilipehely', 'Tomato sauce, mozzarella, spicy salami, chili flakes', 3090, 5),
  ('Capricciosa', 'Capricciosa', 'Paradicsomszósz, mozzarella, sonka, gomba, articsóka, olívabogyó', 'Tomato sauce, mozzarella, ham, mushrooms, artichoke, olives', 3190, 6),
  ('Vegetariana', 'Vegetarian', 'Paradicsomszósz, mozzarella, grillzöldségek, rukola', 'Tomato sauce, mozzarella, grilled vegetables, arugula', 2790, 7),
  ('Tonno', 'Tuna', 'Paradicsomszósz, mozzarella, tonhal, vöröshagyma', 'Tomato sauce, mozzarella, tuna, red onion', 3090, 8),
  ('Hawaiiana', 'Hawaiian', 'Paradicsomszósz, mozzarella, sonka, ananász', 'Tomato sauce, mozzarella, ham, pineapple', 2890, 9),
  ('BBQ Csirke', 'BBQ Chicken', 'BBQ szósz, mozzarella, csirkemell, bacon, hagyma', 'BBQ sauce, mozzarella, chicken breast, bacon, onion', 3390, 10)
) AS p(name_hu, name_en, description_hu, description_en, base_price, sort_order)
WHERE c.slug = 'pizzas'
ON CONFLICT DO NOTHING;

-- Insert drinks
INSERT INTO products (category_id, name_hu, name_en, description_hu, description_en, base_price, is_customizable, sort_order)
SELECT 
  c.id,
  p.name_hu,
  p.name_en,
  p.description_hu,
  p.description_en,
  p.base_price,
  false,
  p.sort_order
FROM categories c
CROSS JOIN (VALUES
  ('Coca-Cola 0,5L', 'Coca-Cola 0.5L', 'Klasszikus Coca-Cola', 'Classic Coca-Cola', 590, 1),
  ('Coca-Cola Zero 0,5L', 'Coca-Cola Zero 0.5L', 'Cukormentes Coca-Cola', 'Sugar-free Coca-Cola', 590, 2),
  ('Fanta 0,5L', 'Fanta 0.5L', 'Narancs ízű üdítő', 'Orange flavored soft drink', 590, 3),
  ('Sprite 0,5L', 'Sprite 0.5L', 'Citromos üdítő', 'Lemon-lime soft drink', 590, 4),
  ('Ásványvíz 0,5L', 'Mineral Water 0.5L', 'Szénsavas ásványvíz', 'Sparkling mineral water', 390, 5),
  ('Limonádé', 'Lemonade', 'Házi limonádé citrommal és mentával', 'Homemade lemonade with lemon and mint', 690, 6),
  ('Sör (Dreher) 0,5L', 'Beer (Dreher) 0.5L', 'Világos sör', 'Lager beer', 790, 7),
  ('Házi jeges tea', 'Homemade Iced Tea', 'Citromos vagy barackos', 'Lemon or peach flavored', 590, 8)
) AS p(name_hu, name_en, description_hu, description_en, base_price, sort_order)
WHERE c.slug = 'drinks'
ON CONFLICT DO NOTHING;

-- Insert desserts
INSERT INTO products (category_id, name_hu, name_en, description_hu, description_en, base_price, is_customizable, sort_order)
SELECT 
  c.id,
  p.name_hu,
  p.name_en,
  p.description_hu,
  p.description_en,
  p.base_price,
  false,
  p.sort_order
FROM categories c
CROSS JOIN (VALUES
  ('Tiramisu', 'Tiramisu', 'Házi készítésű olasz tiramisu', 'Homemade Italian tiramisu', 1290, 1),
  ('Panna Cotta', 'Panna Cotta', 'Vaníliás panna cotta erdei gyümölcsökkel', 'Vanilla panna cotta with forest fruits', 1190, 2),
  ('Nutella Pizza', 'Nutella Pizza', 'Édes pizza Nutellával és banánnal', 'Sweet pizza with Nutella and banana', 1890, 3),
  ('Gelato', 'Gelato', 'Olasz fagylalt (3 gombóc)', 'Italian ice cream (3 scoops)', 990, 4)
) AS p(name_hu, name_en, description_hu, description_en, base_price, sort_order)
WHERE c.slug = 'desserts'
ON CONFLICT DO NOTHING;

-- Insert extras
INSERT INTO products (category_id, name_hu, name_en, description_hu, description_en, base_price, is_customizable, sort_order)
SELECT 
  c.id,
  p.name_hu,
  p.name_en,
  p.description_hu,
  p.description_en,
  p.base_price,
  false,
  p.sort_order
FROM categories c
CROSS JOIN (VALUES
  ('Fokhagymás mártás', 'Garlic Sauce', 'Házi fokhagymás mártás', 'Homemade garlic sauce', 290, 1),
  ('BBQ szósz', 'BBQ Sauce', 'Füstös BBQ szósz', 'Smoky BBQ sauce', 290, 2),
  ('Ranch szósz', 'Ranch Sauce', 'Krémes ranch szósz', 'Creamy ranch sauce', 290, 3),
  ('Csípős szósz', 'Hot Sauce', 'Extra csípős chili szósz', 'Extra spicy chili sauce', 290, 4)
) AS p(name_hu, name_en, description_hu, description_en, base_price, sort_order)
WHERE c.slug = 'extras'
ON CONFLICT DO NOTHING;

-- Insert default settings
INSERT INTO settings (key, value) VALUES
  ('store_info', '{"name_hu": "Terra Verde Pizza", "name_en": "Terra Verde Pizza", "phone": "+36 1 234 5678", "email": "info@terraverdepizza.hu", "address": "Budapest, Példa utca 123."}'),
  ('opening_hours', '{"monday": {"open": "11:00", "close": "22:00"}, "tuesday": {"open": "11:00", "close": "22:00"}, "wednesday": {"open": "11:00", "close": "22:00"}, "thursday": {"open": "11:00", "close": "22:00"}, "friday": {"open": "11:00", "close": "23:00"}, "saturday": {"open": "12:00", "close": "23:00"}, "sunday": {"open": "12:00", "close": "21:00"}}'),
  ('delivery_settings', '{"min_order": 3000, "delivery_fee": 500, "free_delivery_threshold": 8000, "delivery_radius_km": 5, "estimated_time_min": 30, "estimated_time_max": 45}'),
  ('pickup_settings', '{"enabled": true, "discount_percent": 10, "estimated_time_min": 15, "estimated_time_max": 25}')
ON CONFLICT (key) DO NOTHING;
