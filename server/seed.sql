INSERT INTO categories (name) VALUES
  ('Electronics'),
  ('Fashion'),
  ('Books');

INSERT INTO products (category_id, name, description, price, stock, image_url) VALUES
  (1, 'Wireless Earbuds', 'Bluetooth earbuds with charging case', 129900, 25, '/images/placeholder.png'),
  (1, 'Bluetooth Speaker', 'Portable speaker with deep bass', 199900, 15, '/images/placeholder.png'),
  (1, 'Power Bank 10000mAh', 'Fast charging power bank', 99900, 30, '/images/placeholder.png'),
  (1, 'Smart Watch', 'Fitness tracker with heart rate monitor', 249900, 10, '/images/placeholder.png'),
  (1, 'USB-C Cable', 'Durable 1 metre fast charge cable', 29900, 50, '/images/placeholder.png'),
  (2, 'Cotton T-Shirt', 'Soft round neck cotton t-shirt', 49900, 40, '/images/placeholder.png'),
  (2, 'Denim Jeans', 'Slim fit stretch denim jeans', 129900, 20, '/images/placeholder.png'),
  (2, 'Running Shoes', 'Lightweight breathable running shoes', 199900, 18, '/images/placeholder.png'),
  (2, 'Backpack', 'Water resistant 25L backpack', 89900, 22, '/images/placeholder.png'),
  (2, 'Sunglasses', 'UV protected sunglasses', 59900, 35, '/images/placeholder.png'),
  (3, 'JavaScript Basics Guide', 'Beginner friendly JavaScript book', 39900, 20, '/images/placeholder.png'),
  (3, 'Python for Beginners', 'Learn Python step by step', 44900, 20, '/images/placeholder.png'),
  (3, 'Data Structures Handbook', 'Core data structures explained', 54900, 12, '/images/placeholder.png'),
  (3, 'Web Development Notes', 'HTML, CSS and Node.js essentials', 34900, 25, '/images/placeholder.png'),
  (3, 'Interview Prep Guide', 'Common technical interview questions', 49900, 15, '/images/placeholder.png');