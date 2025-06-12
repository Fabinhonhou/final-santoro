require("dotenv").config()
const mysql = require("mysql2/promise")

async function createDatabase() {
  console.log("=== CRIANDO BANCO DE DADOS E TABELAS (VERSÃO CORRIGIDA) ===")

  try {
    // Conectar sem especificar banco de dados
    console.log("Conectando ao MySQL...")
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
    })

    // Criar o banco de dados
    const dbName = process.env.DB_NAME || "santoros_restaurant"
    console.log(`Criando banco de dados "${dbName}"...`)
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${dbName}`)
    console.log("Banco de dados criado com sucesso!")

    // Fechar a primeira conexão
    await connection.end()

    // Conectar diretamente ao banco específico (sem usar USE)
    console.log(`Conectando diretamente ao banco "${dbName}"...`)
    const dbConnection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: dbName, // Especificar o banco na conexão
    })

    // Criar tabelas
    console.log("Criando tabelas...")

    // Users table
    console.log("- Criando tabela 'users'")
    await dbConnection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Reservations table
    console.log("- Criando tabela 'reservations'")
    await dbConnection.execute(`
      CREATE TABLE IF NOT EXISTS reservations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        date DATE NOT NULL,
        time VARCHAR(10) NOT NULL,
        guests INT NOT NULL,
        special_requests TEXT,
        status ENUM('pending', 'confirmed', 'cancelled') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_date (date),
        INDEX idx_status (status)
      )
    `)

    // Menu items table
    console.log("- Criando tabela 'menu_items'")
    await dbConnection.execute(`
      CREATE TABLE IF NOT EXISTS menu_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        category VARCHAR(100) NOT NULL,
        image_url VARCHAR(500),
        available BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_category (category),
        INDEX idx_available (available)
      )
    `)

    // Inventory table
    console.log("- Criando tabela 'inventory'")
    await dbConnection.execute(`
      CREATE TABLE IF NOT EXISTS inventory (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        current_stock DECIMAL(10, 2) NOT NULL DEFAULT 0,
        min_stock DECIMAL(10, 2) NOT NULL DEFAULT 0,
        unit VARCHAR(50) NOT NULL,
        supplier VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_category (category),
        INDEX idx_stock_level (current_stock, min_stock)
      )
    `)

    // Inserir dados de exemplo no menu
    console.log("- Inserindo dados de exemplo no menu...")
    await dbConnection.execute(`
      INSERT IGNORE INTO menu_items (name, description, price, category, available) VALUES
      ('Spaghetti Carbonara', 'Classic Roman pasta with eggs, pecorino cheese, guanciale, and black pepper', 18.95, 'pasta', TRUE),
      ('Bruschetta Classica', 'Toasted bread topped with fresh tomatoes, basil, garlic, and extra virgin olive oil', 12.95, 'antipasti', TRUE),
      ('Osso Buco', 'Braised veal shanks with vegetables, white wine, and gremolata', 32.95, 'secondi', TRUE),
      ('Tiramisu', 'Espresso-soaked ladyfingers layered with mascarpone cream and cocoa', 9.95, 'dolci', TRUE),
      ('Fettuccine Alfredo', 'Fresh fettuccine in a rich parmesan cream sauce', 16.95, 'pasta', TRUE),
      ('Antipasto della Casa', 'Selection of cured meats, cheeses, olives, and marinated vegetables', 18.95, 'antipasti', TRUE)
    `)

    // Inserir dados de exemplo no inventário
    console.log("- Inserindo dados de exemplo no inventário...")
    await dbConnection.execute(`
      INSERT IGNORE INTO inventory (name, category, current_stock, min_stock, unit, supplier) VALUES
      ('Tomatoes', 'vegetables', 15.5, 10.0, 'kg', 'Fresh Farm Co.'),
      ('Mozzarella Cheese', 'dairy', 8.0, 5.0, 'kg', 'Italian Dairy'),
      ('Pasta (Spaghetti)', 'grains', 25.0, 20.0, 'kg', 'Pasta Masters'),
      ('Olive Oil', 'other', 12.0, 3.0, 'liters', 'Mediterranean Oils'),
      ('Basil', 'vegetables', 2.0, 5.0, 'kg', 'Herb Garden'),
      ('Parmesan Cheese', 'dairy', 6.0, 3.0, 'kg', 'Italian Dairy')
    `)

    // Verificar tabelas criadas
    console.log("\nVerificando tabelas criadas:")
    const [tables] = await dbConnection.execute("SHOW TABLES")
    tables.forEach((table) => {
      const tableName = Object.values(table)[0]
      console.log(`   ✅ ${tableName}`)
    })

    // Verificar dados inseridos
    console.log("\nVerificando dados inseridos:")
    const [menuCount] = await dbConnection.execute("SELECT COUNT(*) as count FROM menu_items")
    const [inventoryCount] = await dbConnection.execute("SELECT COUNT(*) as count FROM inventory")
    console.log(`   - Menu items: ${menuCount[0].count}`)
    console.log(`   - Inventory items: ${inventoryCount[0].count}`)

    await dbConnection.end()
    console.log("\n✅ BANCO DE DADOS E TABELAS CRIADOS COM SUCESSO!")
    console.log("Agora você pode iniciar o servidor com: npm start")
  } catch (error) {
    console.error("\n❌ ERRO:", error.message)
    console.error("Stack trace:", error.stack)
  }
}

createDatabase().catch(console.error)
