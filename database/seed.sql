-- ============================================
-- BlazeSolutions Bakery System - Seed Data
-- Author: Boluwatife
-- Date: June 2026
-- ============================================

-- Products
insert into products (name, category, description, price, is_available) values
  ('Sourdough Loaf', 'Bread', 'Classic sourdough with a crispy crust and chewy interior, baked fresh daily.', 350000, true),
  ('Whole Wheat Bread', 'Bread', 'Nutritious whole wheat loaf, perfect for sandwiches and toast.', 280000, true),
  ('Butter Croissant', 'Pastries', 'Flaky, buttery croissant baked to golden perfection.', 150000, true),
  ('Chocolate Danish', 'Pastries', 'Soft pastry filled with rich dark chocolate cream.', 180000, true),
  ('Cinnamon Roll', 'Pastries', 'Warm cinnamon roll with cream cheese glaze.', 200000, true),
  ('Custom Birthday Cake', 'Custom Cakes', 'Fully customisable birthday cake. Add your message in the order notes.', 1500000, true),
  ('Wedding Tier Cake', 'Custom Cakes', 'Elegant multi-tier cake, designed to your specifications.', 5000000, true),
  ('Red Velvet Cake', 'Custom Cakes', 'Classic red velvet with cream cheese frosting. Available in 6" or 9" sizes.', 2500000, true);

-- Inventory
insert into inventory (ingredient_name, unit, current_stock, safety_threshold) values
  ('Flour', 'kg', 50, 10),
  ('Sugar', 'kg', 30, 5),
  ('Butter', 'kg', 20, 5),
  ('Eggs', 'units', 200, 30),
  ('Packaging Boxes', 'units', 100, 20);
