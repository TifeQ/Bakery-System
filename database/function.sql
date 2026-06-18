-- ============================================
-- BlazeSolutions Bakery System - RPC Functions
-- Author: Boluwatife
-- Date: June 2026
-- ============================================

-- Deduct inventory when order moves to Baking
create or replace function deduct_inventory()
returns void as $$
begin
  update inventory
  set current_stock = current_stock - 1,
      updated_at = now()
  where ingredient_name in ('Flour', 'Butter', 'Eggs', 'Packaging Boxes');
end;
$$ language plpgsql;

-- Get ingredients below safety threshold
create or replace function get_low_stock_items()
returns table (
  ingredient_name text,
  current_stock integer,
  safety_threshold integer,
  unit text
) as $$
begin
  return query
  select 
    i.ingredient_name,
    i.current_stock,
    i.safety_threshold,
    i.unit
  from inventory i
  where i.current_stock <= i.safety_threshold;
end;
$$ language plpgsql;
