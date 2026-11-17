USE restaurant_db;

INSERT INTO categories (name, sort_order) VALUES
  ('Mains', 1),
  ('Sides', 2),
  ('Drinks', 3);

INSERT INTO menu_items (category_id, name, description, price) VALUES
  (1, 'Chicken Adobo', 'Chicken braised in soy sauce and vinegar, served with rice', 150.00),
  (1, 'Pork Sinigang', 'Sour tamarind soup with pork and vegetables', 180.00),
  (2, 'Lumpiang Shanghai', 'Crispy spring rolls, six pieces', 90.00),
  (3, 'Iced Tea', 'House-brewed, served cold', 50.00),
  (3, 'Calamansi Juice', 'Fresh calamansi, lightly sweetened', 60.00);