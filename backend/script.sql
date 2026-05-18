CREATE TABLE Users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    avatar_url TEXT, 
    location VARCHAR(100),
    phone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'client' 
);

CREATE TABLE Categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL
);

CREATE TABLE Products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    price INTEGER NOT NULL, 
    description TEXT, 
    stock INTEGER NOT NULL DEFAULT 0,
    category_id INTEGER REFERENCES Categories(id) ON DELETE CASCADE,
    seller_id INTEGER REFERENCES Users(id) ON DELETE CASCADE,
    location VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Product_images (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES Products(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    position INTEGER DEFAULT 1
);

CREATE TABLE Orders (
    id SERIAL PRIMARY KEY,
    buyer_id INTEGER REFERENCES Users(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_price INTEGER NOT NULL 
);

CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES Orders(id) ON DELETE CASCADE,
    products_id INTEGER REFERENCES Products(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price_at_purchase INTEGER NOT NULL 
);

CREATE TABLE User_favorites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES Users(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES Products(id) ON DELETE CASCADE,
    UNIQUE(user_id, product_id) 
);