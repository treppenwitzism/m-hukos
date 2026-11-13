CREATE DATABASE IF NOT EXISTS restaurant_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE restaurant_db;

-- Users: customers, staff and admins share one table, the role column decides access
CREATE TABLE users (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name           VARCHAR(100) NOT NULL,
  email          VARCHAR(255) NOT NULL,
  password_hash  VARCHAR(255) NOT NULL,
  role           ENUM('customer', 'staff', 'admin') NOT NULL DEFAULT 'customer',
  points_balance INT UNSIGNED NOT NULL DEFAULT 0,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB;

CREATE TABLE categories (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name       VARCHAR(100) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  PRIMARY KEY (id)
) ENGINE=InnoDB;

CREATE TABLE menu_items (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  category_id  INT UNSIGNED NOT NULL,
  name         VARCHAR(150) NOT NULL,
  description  TEXT NULL,
  price        DECIMAL(10,2) NOT NULL,
  image_url    VARCHAR(500) NULL,
  is_available TINYINT(1) NOT NULL DEFAULT 1,
  is_deleted   TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  CONSTRAINT fk_menu_items_category
    FOREIGN KEY (category_id) REFERENCES categories (id)
) ENGINE=InnoDB;

CREATE TABLE orders (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id       INT UNSIGNED NOT NULL,
  status        ENUM('pending', 'paid', 'fulfilled', 'expired', 'cancelled') NOT NULL DEFAULT 'pending',
  total         DECIMAL(10,2) NOT NULL,
  scheduled_for DATETIME NULL,  -- NULL means pickup as soon as possible
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_orders_user
    FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB;

-- unit_price is copied from the menu at order time, so later price edits do not change old orders
CREATE TABLE order_items (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id     INT UNSIGNED NOT NULL,
  menu_item_id INT UNSIGNED NOT NULL,
  quantity     INT UNSIGNED NOT NULL,
  unit_price   DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_order_items_order
    FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
  CONSTRAINT fk_order_items_menu_item
    FOREIGN KEY (menu_item_id) REFERENCES menu_items (id)
) ENGINE=InnoDB;

-- One order can have several payment attempts
CREATE TABLE payments (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id     INT UNSIGNED NOT NULL,
  paymongo_ref VARCHAR(100) NULL,
  method       VARCHAR(50) NULL,
  amount       DECIMAL(10,2) NOT NULL,
  status       ENUM('pending', 'paid', 'failed') NOT NULL DEFAULT 'pending',
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_payments_order
    FOREIGN KEY (order_id) REFERENCES orders (id)
) ENGINE=InnoDB;

-- QR links are separate from orders so the link can be deleted after 24 hours while the order is kept
CREATE TABLE qr_tokens (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id    INT UNSIGNED NOT NULL,
  token       CHAR(48) NOT NULL,
  expires_at  DATETIME NOT NULL,
  redeemed_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_qr_tokens_order (order_id),
  UNIQUE KEY uq_qr_tokens_token (token),
  CONSTRAINT fk_qr_tokens_order
    FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Ledger of every points change; users.points_balance holds the running total
CREATE TABLE points_transactions (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    INT UNSIGNED NOT NULL,
  order_id   INT UNSIGNED NULL,
  amount     INT NOT NULL,  -- positive when earned, negative when spent
  reason     VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_points_user
    FOREIGN KEY (user_id) REFERENCES users (id),
  CONSTRAINT fk_points_order
    FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE reviews (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id      INT UNSIGNED NOT NULL,
  menu_item_id INT UNSIGNED NOT NULL,
  rating       TINYINT UNSIGNED NOT NULL,
  comment      TEXT NULL,
  status       ENUM('visible', 'hidden') NOT NULL DEFAULT 'visible',
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_reviews_user_item (user_id, menu_item_id),
  CONSTRAINT chk_reviews_rating CHECK (rating BETWEEN 1 AND 5),
  CONSTRAINT fk_reviews_user
    FOREIGN KEY (user_id) REFERENCES users (id),
  CONSTRAINT fk_reviews_menu_item
    FOREIGN KEY (menu_item_id) REFERENCES menu_items (id)
) ENGINE=InnoDB;
