CREATE TABLE IF NOT EXISTS roles (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  role_name VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255) DEFAULT NULL,
  permissions JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(191) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  google_id VARCHAR(191) DEFAULT NULL,
  profile_image VARCHAR(255) DEFAULT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_email (email),
  INDEX idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payments (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NULL,
  transaction_id VARCHAR(191) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_method ENUM('bkash', 'nagad', 'stripe', 'clover', 'other') NOT NULL,
  status ENUM('pending', 'success', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
  metadata JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_payments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY uq_payments_transaction_id (transaction_id),
  INDEX idx_payments_user_id (user_id),
  INDEX idx_payments_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS content (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(191) NOT NULL,
  description TEXT NOT NULL,
  created_by INT UNSIGNED NULL,
  status ENUM('draft', 'pending_review', 'approved', 'rejected', 'archived') NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_content_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_content_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS activity_logs (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) DEFAULT NULL,
  entity_id VARCHAR(100) DEFAULT NULL,
  details TEXT DEFAULT NULL,
  ip_address VARCHAR(45) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_activity_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_activity_logs_user_id (user_id),
  INDEX idx_activity_logs_action (action),
  INDEX idx_activity_logs_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS reports (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  content_id INT UNSIGNED NOT NULL,
  reported_by INT UNSIGNED NULL,
  reason TEXT NOT NULL,
  status ENUM('open', 'reviewing', 'resolved', 'rejected') NOT NULL DEFAULT 'open',
  resolution TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_reports_content FOREIGN KEY (content_id) REFERENCES content(id) ON DELETE CASCADE,
  CONSTRAINT fk_reports_reported_by FOREIGN KEY (reported_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_reports_status (status),
  INDEX idx_reports_content_id (content_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS categories (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  slug VARCHAR(120) NOT NULL UNIQUE,
  icon VARCHAR(20) NOT NULL DEFAULT '🍽️',
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_categories_sort (sort_order, name),
  INDEX idx_categories_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS menu_items (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(191) NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  category VARCHAR(120) NOT NULL,
  image VARCHAR(500) DEFAULT NULL,
  is_available TINYINT(1) NOT NULL DEFAULT 1,
  is_popular TINYINT(1) NOT NULL DEFAULT 0,
  is_vegetarian TINYINT(1) NOT NULL DEFAULT 0,
  is_vegan TINYINT(1) NOT NULL DEFAULT 0,
  is_spicy TINYINT(1) NOT NULL DEFAULT 0,
  customizations JSON NULL,
  add_ons JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_menu_items_category (category),
  INDEX idx_menu_items_available (is_available),
  INDEX idx_menu_items_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_profiles (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uid VARCHAR(191) NOT NULL UNIQUE,
  email VARCHAR(191) NOT NULL DEFAULT '',
  full_name VARCHAR(191) NOT NULL DEFAULT '',
  phone VARCHAR(50) NOT NULL DEFAULT '',
  date_of_birth VARCHAR(50) NOT NULL DEFAULT '',
  preferred_contact ENUM('email', 'phone', '') NOT NULL DEFAULT 'email',
  addresses JSON NULL,
  completed_orders INT NOT NULL DEFAULT 0,
  loyalty_stamps INT NOT NULL DEFAULT 0,
  loyalty_reward_available TINYINT(1) NOT NULL DEFAULT 0,
  reward_points INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_profiles_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS orders (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_uid VARCHAR(191) DEFAULT NULL,
  email VARCHAR(191) NOT NULL,
  delivery_mode ENUM('delivery', 'collection') NOT NULL,
  address_json JSON NULL,
  items_json JSON NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  delivery_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  loyalty_discount DECIMAL(10,2) NOT NULL DEFAULT 0,
  cashback_earned DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  payment_method ENUM('card', 'cash') NOT NULL,
  loyalty_reward_applied TINYINT(1) NOT NULL DEFAULT 0,
  invoice_number VARCHAR(120) NOT NULL,
  receipt_email_sent TINYINT(1) NOT NULL DEFAULT 0,
  promo_code VARCHAR(80) DEFAULT NULL,
  promo_discount DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_intent_id VARCHAR(191) DEFAULT NULL,
  payment_status ENUM('pending', 'paid', 'cash_on_collection') NOT NULL DEFAULT 'pending',
  notes TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'Order Received',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_orders_user_uid (user_uid),
  INDEX idx_orders_email (email),
  INDEX idx_orders_created_at (created_at),
  INDEX idx_orders_payment_intent (payment_intent_id),
  INDEX idx_orders_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS business_settings (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  business_name VARCHAR(80) NOT NULL DEFAULT 'Lebanese Flames',
  logo_url VARCHAR(500) NOT NULL DEFAULT '',
  opening_hours JSON NULL,
  holiday_closures JSON NULL,
  payment_settings JSON NULL,
  about_chef JSON NULL,
  contact_info JSON NULL,
  offer_popup JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS promotions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(80) NOT NULL UNIQUE,
  description TEXT,
  discount_type ENUM('percent', 'amount') NOT NULL,
  value DECIMAL(10,2) NOT NULL,
  min_subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  max_discount DECIMAL(10,2) NOT NULL DEFAULT 0,
  starts_at DATETIME NULL,
  ends_at DATETIME NULL,
  first_order_only TINYINT(1) NOT NULL DEFAULT 0,
  min_completed_orders INT NOT NULL DEFAULT 0,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_promotions_active (active),
  INDEX idx_promotions_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS support_messages (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(191) NOT NULL,
  email VARCHAR(191) NOT NULL,
  phone VARCHAR(50) NOT NULL DEFAULT '',
  order_id VARCHAR(120) NOT NULL DEFAULT '',
  message TEXT NOT NULL,
  source VARCHAR(80) NOT NULL DEFAULT 'web',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_support_email (email),
  INDEX idx_support_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS abandoned_carts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(191) DEFAULT NULL,
  phone VARCHAR(50) DEFAULT NULL,
  items_json JSON NULL,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  delivery_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  source VARCHAR(80) NOT NULL DEFAULT 'checkout',
  promo_link VARCHAR(500) NOT NULL DEFAULT '',
  reminder_sent TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_abandoned_email (email),
  INDEX idx_abandoned_phone (phone),
  INDEX idx_abandoned_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO roles (role_name, description, permissions) VALUES
  ('admin', 'Full administrative access', JSON_ARRAY('users.manage','roles.assign','dashboard.full','payments.manage','content.manage','reports.manage','settings.manage')),
  ('manager', 'Manages editors and operations with limited user administration', JSON_ARRAY('users.manage_limited','roles.assign_editor','dashboard.full','content.manage','reports.manage','promotions.manage')),
  ('moderator', 'Can moderate submitted content and manage reports', JSON_ARRAY('content.review','reports.manage','dashboard.read')),
  ('editor', 'Can add and edit content and media', JSON_ARRAY('content.create','content.edit','media.upload','dashboard.read')),
  ('user', 'Standard user with basic access', JSON_ARRAY('self.read'));

