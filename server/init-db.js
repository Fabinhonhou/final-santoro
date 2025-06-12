require("dotenv").config()
const mysql = require("mysql2/promise")
const bcrypt = require("bcrypt")

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "MYdatabase@2025",
  database: process.env.DB_NAME || "santoros_restaurant",
}

async function initializeDatabase() {
  let connection

  try {
    console.log("🚀 Inicializando banco de dados...")

    // Conectar sem especificar banco de dados
    connection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
    })

    // Criar banco de dados se não existir
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`)
    console.log(`✅ Banco de dados "${dbConfig.database}" criado/verificado`)

    // Fechar conexão e reconectar ao banco específico
    await connection.end()
    connection = await mysql.createConnection(dbConfig)

    // Criar tabelas
    console.log("📋 Criando tabelas...")

    // Tabela de usuários
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        cpf VARCHAR(11),
        date_birth DATE,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Tabela de reservas
    await connection.execute(`
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

    // Tabela de itens do menu
    await connection.execute(`
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

    // Tabela de inventário
    await connection.execute(`
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

    // Tabela de administradores
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'manager') DEFAULT 'admin',
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP NULL
      )
    `)

    console.log("✅ Todas as tabelas criadas com sucesso!")

    // Criar usuário admin padrão
    const adminEmail = "admin@santoros.com"
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123"

    const [existingAdmin] = await connection.execute("SELECT id FROM admin_users WHERE email = ?", [adminEmail])

    if (existingAdmin.length === 0) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10)
      await connection.execute("INSERT INTO admin_users (name, email, password, role) VALUES (?, ?, ?, ?)", [
        "Administrador",
        adminEmail,
        hashedPassword,
        "admin",
      ])
      console.log("✅ Usuário admin criado:")
      console.log(`   Email: ${adminEmail}`)
      console.log(`   Senha: ${adminPassword}`)
    } else {
      console.log("ℹ️ Usuário admin já existe")
    }

    // Inserir alguns itens de menu de exemplo
    const [existingMenuItems] = await connection.execute("SELECT COUNT(*) as count FROM menu_items")

    if (existingMenuItems[0].count === 0) {
      console.log("📋 Inserindo itens de menu de exemplo...")

      const menuItems = [
        [
          "Spaghetti Carbonara",
          "Massa fresca com ovos, queijo pecorino, guanciale e pimenta preta",
          54.0,
          "Primi Piatti",
          "/placeholder.svg?height=300&width=400",
        ],
        [
          "Margherita Pizza",
          "Pizza clássica com molho de tomate, mozzarella e manjericão",
          42.0,
          "Pizza",
          "/placeholder.svg?height=300&width=400",
        ],
        [
          "Tiramisu",
          "Sobremesa italiana com mascarpone, café e cacau",
          28.0,
          "Dolci",
          "/placeholder.svg?height=300&width=400",
        ],
        [
          "Bruschetta",
          "Pão tostado com tomate, manjericão e azeite",
          24.0,
          "Antipasti",
          "/placeholder.svg?height=300&width=400",
        ],
        [
          "Osso Buco",
          "Jarrete de vitela braseado com legumes",
          85.0,
          "Secondi Piatti",
          "/placeholder.svg?height=300&width=400",
        ],
      ]

      for (const item of menuItems) {
        await connection.execute(
          "INSERT INTO menu_items (name, description, price, category, image_url) VALUES (?, ?, ?, ?, ?)",
          item,
        )
      }

      console.log("✅ Itens de menu inseridos com sucesso!")
    }

    console.log("\n🎉 Banco de dados inicializado com sucesso!")
    console.log("\n📋 Informações importantes:")
    console.log(`   🌐 Acesse: http://localhost:3000`)
    console.log(`   👨‍💼 Admin: http://localhost:3000/admin-login.html`)
    console.log(`   📧 Email admin: ${adminEmail}`)
    console.log(`   🔑 Senha admin: ${adminPassword}`)
  } catch (error) {
    console.error("❌ Erro ao inicializar banco de dados:", error)
    process.exit(1)
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  initializeDatabase()
}

module.exports = { initializeDatabase }
