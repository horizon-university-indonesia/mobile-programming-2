-- categories
CREATE TABLE IF NOT EXISTS `categories` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `name` varchar(100) NOT NULL,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- products
CREATE TABLE IF NOT EXISTS `products` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `sku` varchar(50) DEFAULT NULL,
    `barcode` varchar(50) DEFAULT NULL,
    `name` varchar(255) NOT NULL,
    `description` text DEFAULT NULL,
    `category_id` int(11) DEFAULT NULL,
    `price` decimal(10,2) NOT NULL,
    `stock` int(11) NOT NULL DEFAULT 0,
    `image_url` varchar(255) DEFAULT NULL,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- transactions
CREATE TABLE IF NOT EXISTS `transactions` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `total_amount` decimal(10,2) NOT NULL,
    `tax_amount` decimal(10,2) NOT NULL,
    `final_amount` decimal(10,2) NOT NULL,
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- transaction_items
CREATE TABLE IF NOT EXISTS `transaction_items` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `transaction_id` int(11) NOT NULL,
    `product_id` int(11) NOT NULL,
    `product_name` varchar(255) NOT NULL,
    `quantity` int(11) NOT NULL,
    `price_at_time` decimal(10,2) NOT NULL,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
