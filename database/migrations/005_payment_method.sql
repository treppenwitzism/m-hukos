ALTER TABLE orders
  ADD COLUMN payment_method ENUM('counter', 'paymongo') NULL DEFAULT NULL AFTER status;