insert into categories (name, slug, sort_order) values
  ('Apparel', 'apparel', 1),
  ('Accessories', 'accessories', 2),
  ('Art & Prints', 'art', 3),
  ('Home Goods', 'home', 4);

insert into products (name, slug, description, price_cents, category_id, stock) values
  ('Classic Logo Tee', 'classic-logo-tee', 'Premium cotton tee with embroidered logo.', 3500, (select id from categories where slug='apparel'), 25),
  ('Enamel Pin Set', 'enamel-pin-set', 'Set of 3 collectible enamel pins.', 1500, (select id from categories where slug='accessories'), 50),
  ('Limited Print 01', 'limited-print-01', 'Numbered giclée print, 12x18".', 4500, (select id from categories where slug='art'), 10),
  ('Ceramic Mug', 'ceramic-mug', 'Handmade ceramic mug, 12oz.', 2200, (select id from categories where slug='home'), 30);
