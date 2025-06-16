import dotenv from "dotenv"
import express from "express"
import mysql from "mysql2/promise"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import cors from "cors"
import path from "path"
import fs from "fs"
import { fileURLToPath } from "url"

// ES modules equivalent of __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000
const JWT_SECRET = process.env.JWT_SECRET || "b6203381221684dfc0504aa5bfeaa9e06ed7434ba146f02c54480b45ad785180"

// Middleware
app.use(cors())
app.use(express.json())

// Log de todas as requisições para debug
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`)
  if (req.method === "POST") {
    console.log("Body:", JSON.stringify(req.body, null, 2))
  }
  next()
})

// Configuração específica para arquivos estáticos com MIME types corretos
const staticPath = path.join(__dirname, "../")
console.log("📁 Serving static files from:", staticPath)

// Servir favicon.ico vazio para evitar erro 404
app.get("/favicon.ico", (req, res) => {
  res.status(204).end() // No content
})

// Configurar MIME types corretos
const mimeTypes = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
}

app.use(
  express.static(staticPath, {
    setHeaders: (res, filePath) => {
      const ext = path.extname(filePath).toLowerCase()
      if (mimeTypes[ext]) {
        res.setHeader("Content-Type", mimeTypes[ext])
      }
    },
  }),
)

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "santoros_restaurant",
}

// Database connection
let db

async function initDatabase() {
  try {
    console.log("=== INICIALIZANDO BANCO DE DADOS ===")
    console.log("Host:", dbConfig.host)
    console.log("Port:", dbConfig.port)
    console.log("User:", dbConfig.user)
    console.log("Database:", dbConfig.database)

    // Primeiro, conectar sem especificar banco de dados para criá-lo se necessário
    console.log("1. Conectando sem especificar banco de dados...")
    const tempConnection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
    })

    // Criar o banco de dados se não existir
    const dbName = dbConfig.database
    console.log(`2. Criando banco de dados "${dbName}" se não existir...`)
    await tempConnection.execute(`CREATE DATABASE IF NOT EXISTS ${dbName}`)
    await tempConnection.end()
    console.log("   ✅ Banco de dados verificado/criado")

    // Agora conectar diretamente ao banco específico
    console.log("3. Conectando ao banco específico...")
    db = await mysql.createConnection(dbConfig)
    console.log("   ✅ Conectado ao MySQL database com sucesso!")

    // Criar tabelas se não existirem
    console.log("4. Verificando/criando tabelas...")
    await createTables()
    console.log("   ✅ Tabelas verificadas/criadas com sucesso!")

    console.log("=== BANCO DE DADOS INICIALIZADO COM SUCESSO ===\n")
  } catch (error) {
    console.error("❌ Falha na conexão com o banco de dados:", error.message)
    console.log("\nDicas de solução:")
    console.log("1. Verifique se o MySQL está rodando na porta 3306")
    console.log("2. Confirme o usuário e senha do MySQL")
    console.log("3. Verifique o arquivo .env")
    console.log("4. Execute: node server/create-db-fixed.js")
    process.exit(1)
  }
}

async function createTables() {
  try {
    // Users table com CPF e data de nascimento
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        cpf VARCHAR(14),
        date_birth DATE,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Reservations table - UPDATED with table_number
    await db.execute(`
      CREATE TABLE IF NOT EXISTS reservations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        date DATE NOT NULL,
        time VARCHAR(10) NOT NULL,
        guests INT NOT NULL,
        table_number INT,
        special_requests TEXT,
        status ENUM('pending', 'confirmed', 'cancelled') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_date (date),
        INDEX idx_status (status),
        INDEX idx_table_number (table_number)
      )
    `)

    // Menu items table
    await db.execute(`
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
    await db.execute(`
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

    // Admin users table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'super_admin') DEFAULT 'admin',
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP NULL,
        INDEX idx_email (email),
        INDEX idx_active (active)
      )
    `)

    console.log("   - Todas as tabelas foram verificadas/criadas")

    // Criar admin padrão se não existir
    await createDefaultAdmin()
  } catch (error) {
    console.error("Erro ao criar tabelas:", error)
    throw error
  }
}

async function createDefaultAdmin() {
  try {
    const adminEmail = "admin@santoros.com"
    const adminPassword = "admin123"

    // Verificar se admin já existe
    const [existingAdmin] = await db.execute("SELECT id FROM admin_users WHERE email = ?", [adminEmail])

    if (existingAdmin.length === 0) {
      console.log("   - Criando administrador padrão...")

      // Hash da senha
      const hashedPassword = await bcrypt.hash(adminPassword, 12)

      // Criar admin
      await db.execute("INSERT INTO admin_users (name, email, password, role, active) VALUES (?, ?, ?, ?, ?)", [
        "Administrador",
        adminEmail,
        hashedPassword,
        "admin",
        true,
      ])

      console.log("   ✅ Administrador padrão criado:")
      console.log(`      Email: ${adminEmail}`)
      console.log(`      Senha: ${adminPassword}`)
    } else {
      console.log("   ✅ Administrador padrão já existe")
    }
  } catch (error) {
    console.error("   ❌ Erro ao criar admin padrão:", error.message)
  }
}

// Authentication middleware
function authenticateToken(req, res, next) {
  console.log("🔐 Verificando autenticação para:", req.url)

  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]

  console.log("Token presente:", token ? "Sim" : "Não")

  if (!token) {
    console.log("❌ Token não fornecido")
    return res.status(401).json({
      success: false,
      message: "Access token required",
    })
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.log("❌ Token inválido:", err.message)
      return res.status(403).json({
        success: false,
        message: "Invalid token",
      })
    }
    console.log("✅ Token válido para usuário:", user.userId)
    req.user = user
    next()
  })
}

// Middleware opcional de autenticação (para reservas de usuários não logados)
function optionalAuth(req, res, next) {
  console.log("🔐 Verificando autenticação opcional para:", req.url)

  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]

  if (token) {
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (!err) {
        console.log("✅ Token válido encontrado para usuário:", user.userId)
        req.user = user
      } else {
        console.log("⚠️ Token inválido, continuando sem autenticação")
      }
      next()
    })
  } else {
    console.log("⚠️ Nenhum token fornecido, continuando sem autenticação")
    next()
  }
}

// Routes

// Rota de teste para verificar se a API está funcionando
app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "API está funcionando!",
    timestamp: new Date().toISOString(),
  })
})

// User Registration
app.post("/api/register", async (req, res) => {
  console.log("🔥 ROTA /api/register CHAMADA!")
  console.log("📋 Headers:", req.headers)
  console.log("📋 Body completo:", req.body)

  try {
    console.log("=== REGISTRO DE USUÁRIO ===")
    console.log("Dados recebidos:", req.body)

    const { name, email, password, cpf, date_birth } = req.body

    // Validate input
    if (!name || !email || !password) {
      console.log("❌ Campos obrigatórios faltando")
      return res.status(400).json({
        success: false,
        message: "Nome, email e senha são obrigatórios",
      })
    }

    if (password.length < 8) {
      console.log("❌ Senha muito curta")
      return res.status(400).json({
        success: false,
        message: "A senha deve ter pelo menos 8 caracteres",
      })
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      console.log("❌ Email inválido")
      return res.status(400).json({
        success: false,
        message: "Por favor, insira um email válido",
      })
    }

    // Check if user already exists
    console.log("🔍 Verificando se usuário já existe...")
    const [existingUsers] = await db.execute("SELECT id FROM users WHERE email = ?", [email])

    if (existingUsers.length > 0) {
      console.log("❌ Email já está em uso")
      return res.status(400).json({
        success: false,
        message: "Este email já está em uso",
      })
    }

    // Hash password
    console.log("🔐 Criptografando senha...")
    const hashedPassword = await bcrypt.hash(password, 12)

    // Preparar dados para inserção
    const userData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      cpf: cpf ? cpf.replace(/\D/g, "") : null,
      date_birth: date_birth || null,
    }

    console.log("💾 Salvando usuário no banco...")

    // Create user com transação para garantir consistência
    await db.beginTransaction()

    try {
      const [result] = await db.execute(
        "INSERT INTO users (name, email, password, cpf, date_birth) VALUES (?, ?, ?, ?, ?)",
        [userData.name, userData.email, userData.password, userData.cpf, userData.date_birth],
      )

      await db.commit()

      console.log("✅ Usuário criado com sucesso! ID:", result.insertId)

      // Verificar se foi salvo corretamente
      const [savedUser] = await db.execute(
        "SELECT id, name, email, cpf, date_birth, created_at FROM users WHERE id = ?",
        [result.insertId],
      )

      console.log("✅ Verificação - usuário salvo:", savedUser[0])

      res.status(201).json({
        success: true,
        message: "Conta criada com sucesso! Redirecionando para login...",
        userId: result.insertId,
        user: {
          id: savedUser[0].id,
          name: savedUser[0].name,
          email: savedUser[0].email,
          cpf: savedUser[0].cpf,
          date_birth: savedUser[0].date_birth,
        },
      })
    } catch (insertError) {
      await db.rollback()
      throw insertError
    }
  } catch (error) {
    console.error("❌ Erro no registro:", error)

    // Verificar se é erro de duplicação de email
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({
        success: false,
        message: "Este email já está em uso",
      })
    }

    res.status(500).json({
      success: false,
      message: "Erro interno do servidor. Tente novamente.",
    })
  }
})

// User Login
app.post("/api/login", async (req, res) => {
  try {
    console.log("=== LOGIN ===")
    const { email, password } = req.body

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email e senha são obrigatórios",
      })
    }

    console.log("🔍 Tentando login para:", email)

    // Primeiro, tentar encontrar na tabela de usuários normais
    console.log("🔍 Buscando em users...")
    const [users] = await db.execute(
      "SELECT id, name, email, password, cpf, date_birth, created_at FROM users WHERE email = ?",
      [email.toLowerCase().trim()],
    )

    if (users.length > 0) {
      const user = users[0]
      console.log("✅ Usuário encontrado na tabela users:", user.email)

      // Verify password
      const passwordMatch = await bcrypt.compare(password, user.password)

      if (!passwordMatch) {
        console.log("❌ Senha incorreta para usuário")
        return res.status(401).json({
          success: false,
          message: "Email ou senha incorretos",
        })
      }

      // Generate JWT token
      const token = jwt.sign({ userId: user.id, email: user.email, type: "user" }, JWT_SECRET, { expiresIn: "7d" })

      console.log("✅ Login de usuário bem-sucedido para:", user.email)

      return res.json({
        success: true,
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          cpf: user.cpf,
          date_birth: user.date_birth,
          created_at: user.created_at,
          type: "user",
        },
      })
    }

    // Se não encontrou em users, tentar em admin_users
    console.log("🔍 Buscando em admin_users...")
    const [admins] = await db.execute(
      "SELECT id, name, email, password, role, active, created_at FROM admin_users WHERE email = ? AND active = true",
      [email.toLowerCase().trim()],
    )

    if (admins.length > 0) {
      const admin = admins[0]
      console.log("✅ Admin encontrado:", admin.email)

      // Verify password
      const passwordMatch = await bcrypt.compare(password, admin.password)

      if (!passwordMatch) {
        console.log("❌ Senha incorreta para admin")
        return res.status(401).json({
          success: false,
          message: "Email ou senha incorretos",
        })
      }

      // Update last login
      await db.execute("UPDATE admin_users SET last_login = NOW() WHERE id = ?", [admin.id])

      // Generate JWT token
      const token = jwt.sign({ userId: admin.id, email: admin.email, type: "admin", role: admin.role }, JWT_SECRET, {
        expiresIn: "7d",
      })

      console.log("✅ Login de admin bem-sucedido para:", admin.email)

      return res.json({
        success: true,
        token,
        user: {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          created_at: admin.created_at,
          type: "admin",
        },
      })
    }

    // Se não encontrou em nenhuma tabela
    console.log("❌ Email não encontrado em nenhuma tabela")
    return res.status(401).json({
      success: false,
      message: "Email ou senha incorretos",
    })
  } catch (error) {
    console.error("❌ Erro no login:", error)
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
    })
  }
})

// Contact Form Submission
app.post("/api/contact", async (req, res) => {
  try {
    console.log("=== FORMULÁRIO DE CONTATO ===")
    const { nome, email, telefone, mensagem } = req.body

    // Validate input
    if (!nome || !email || !mensagem) {
      return res.status(400).json({
        success: false,
        message: "Nome, email e mensagem são obrigatórios",
      })
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Por favor, insira um email válido",
      })
    }

    console.log("📧 Mensagem de contato recebida:")
    console.log("Nome:", nome)
    console.log("Email:", email)
    console.log("Telefone:", telefone || "Não informado")
    console.log("Mensagem:", mensagem)

    console.log("✅ Mensagem de contato processada com sucesso")

    res.json({
      success: true,
      message: "Mensagem enviada com sucesso! Entraremos em contato em breve.",
    })
  } catch (error) {
    console.error("❌ Erro ao processar contato:", error)
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
    })
  }
})

// Reservations API
app.post("/api/reservations", optionalAuth, async (req, res) => {
  try {
    console.log("=== CRIANDO RESERVA ===")
    console.log("Body recebido:", req.body)

    const { name, email, phone, date, time, guests, specialRequests, tableNumber } = req.body

    // Validate input
    if (!name || !email || !phone || !date || !time || !guests) {
      console.log("❌ Campos obrigatórios faltando")
      return res.status(400).json({
        success: false,
        message: "Todos os campos obrigatórios devem ser preenchidos",
      })
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      console.log("❌ Email inválido:", email)
      return res.status(400).json({
        success: false,
        message: "Por favor, insira um email válido",
      })
    }

    // Verificar se a data não é no passado
    const reservationDate = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (reservationDate < today) {
      console.log("❌ Data no passado:", date)
      return res.status(400).json({
        success: false,
        message: "A data da reserva não pode ser no passado",
      })
    }

    console.log("📋 Dados da reserva validados:", {
      name,
      email,
      phone,
      date,
      time,
      guests,
      tableNumber,
      specialRequests,
    })

    // Verificar se a conexão com o banco está ativa
    if (!db) {
      console.log("❌ Conexão com banco não disponível")
      return res.status(500).json({
        success: false,
        message: "Erro de conexão com o banco de dados",
      })
    }

    // Inserir reserva no banco
    const [result] = await db.execute(
      `INSERT INTO reservations (user_id, name, email, phone, date, time, guests, table_number, special_requests, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        req.user ? req.user.userId : null,
        name,
        email,
        phone,
        date,
        time,
        guests,
        tableNumber || null,
        specialRequests || null,
      ],
    )

    console.log("✅ Reserva criada com ID:", result.insertId)

    res.status(201).json({
      success: true,
      message: "Reserva criada com sucesso!",
      reservationId: result.insertId,
    })
  } catch (error) {
    console.error("❌ Erro ao criar reserva:", error)
    console.error("Stack trace:", error.stack)
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
})

// Get user reservations
app.get("/api/reservations", authenticateToken, async (req, res) => {
  try {
    console.log("=== BUSCANDO RESERVAS DO USUÁRIO ===")
    console.log("User ID:", req.user.userId)

    const [reservations] = await db.execute(
      `SELECT id, name, email, phone, date, time, guests, special_requests, status, created_at 
       FROM reservations 
       WHERE user_id = ? 
       ORDER BY date DESC, time DESC`,
      [req.user.userId],
    )

    console.log("✅ Reservas encontradas:", reservations.length)

    res.json({
      success: true,
      reservations,
    })
  } catch (error) {
    console.error("❌ Erro ao buscar reservas:", error)
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
    })
  }
})

// Cancel reservation
app.put("/api/reservations/:id/cancel", authenticateToken, async (req, res) => {
  try {
    const reservationId = req.params.id
    console.log("=== CANCELANDO RESERVA ===")
    console.log("Reservation ID:", reservationId)
    console.log("User ID:", req.user.userId)

    // Verificar se a reserva pertence ao usuário
    const [reservations] = await db.execute("SELECT id, status FROM reservations WHERE id = ? AND user_id = ?", [
      reservationId,
      req.user.userId,
    ])

    if (reservations.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Reserva não encontrada",
      })
    }

    const reservation = reservations[0]

    if (reservation.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Esta reserva já foi cancelada",
      })
    }

    // Cancelar reserva
    await db.execute("UPDATE reservations SET status = 'cancelled' WHERE id = ?", [reservationId])

    console.log("✅ Reserva cancelada com sucesso")

    res.json({
      success: true,
      message: "Reserva cancelada com sucesso",
    })
  } catch (error) {
    console.error("❌ Erro ao cancelar reserva:", error)
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
    })
  }
})

// Inventory API Routes

// Get all inventory items
app.get("/api/inventory", authenticateToken, async (req, res) => {
  try {
    console.log("=== BUSCANDO ITENS DO ESTOQUE ===")
    console.log("👤 Usuário autenticado:", req.user)

    // Check if user is admin
    if (req.user.type !== "admin") {
      console.log("❌ Usuário não é admin:", req.user.type)
      return res.status(403).json({
        success: false,
        message: "Acesso negado. Apenas administradores podem acessar o estoque.",
      })
    }

    console.log("🔍 Executando query no banco de dados...")
    const [inventory] = await db.execute(`
      SELECT id, name, category, current_stock, min_stock, unit, supplier, 
             created_at, updated_at 
      FROM inventory 
      ORDER BY name ASC
    `)

    console.log("📊 Resultados da query:", {
      count: inventory.length,
      items: inventory.map((item) => ({ id: item.id, name: item.name })),
    })

    res.json({
      success: true,
      inventory,
    })
  } catch (error) {
    console.error("❌ Erro ao buscar estoque:", error)
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor: " + error.message,
    })
  }
})

// Create new inventory item
app.post("/api/inventory", authenticateToken, async (req, res) => {
  try {
    console.log("=== CRIANDO ITEM DO ESTOQUE ===")

    // Check if user is admin
    if (req.user.type !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Acesso negado. Apenas administradores podem gerenciar o estoque.",
      })
    }

    const { name, category, currentStock, minStock, unit, supplier } = req.body

    // Validate input
    if (!name || !category || currentStock === undefined || minStock === undefined || !unit) {
      return res.status(400).json({
        success: false,
        message: "Nome, categoria, estoque atual, estoque mínimo e unidade são obrigatórios",
      })
    }

    if (currentStock < 0 || minStock < 0) {
      return res.status(400).json({
        success: false,
        message: "Os valores de estoque não podem ser negativos",
      })
    }

    console.log("📋 Dados do item:", { name, category, currentStock, minStock, unit, supplier })

    // Insert inventory item
    const [result] = await db.execute(
      `
      INSERT INTO inventory (name, category, current_stock, min_stock, unit, supplier) 
      VALUES (?, ?, ?, ?, ?, ?)
    `,
      [name, category, currentStock, minStock, unit, supplier || null],
    )

    console.log("✅ Item do estoque criado com ID:", result.insertId)

    // Get the created item
    const [createdItem] = await db.execute(
      `
      SELECT id, name, category, current_stock, min_stock, unit, supplier, 
             created_at, updated_at 
      FROM inventory 
      WHERE id = ?
    `,
      [result.insertId],
    )

    res.status(201).json({
      success: true,
      message: "Item adicionado ao estoque com sucesso!",
      item: createdItem[0],
    })
  } catch (error) {
    console.error("❌ Erro ao criar item do estoque:", error)
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
    })
  }
})

// Update inventory item
app.put("/api/inventory/:id", authenticateToken, async (req, res) => {
  try {
    const itemId = req.params.id
    console.log("=== ATUALIZANDO ITEM DO ESTOQUE ===")
    console.log("Item ID:", itemId)

    // Check if user is admin
    if (req.user.type !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Acesso negado. Apenas administradores podem gerenciar o estoque.",
      })
    }

    const { name, category, currentStock, minStock, unit, supplier } = req.body

    // Validate input
    if (!name || !category || currentStock === undefined || minStock === undefined || !unit) {
      return res.status(400).json({
        success: false,
        message: "Nome, categoria, estoque atual, estoque mínimo e unidade são obrigatórios",
      })
    }

    if (currentStock < 0 || minStock < 0) {
      return res.status(400).json({
        success: false,
        message: "Os valores de estoque não podem ser negativos",
      })
    }

    // Check if item exists
    const [existingItem] = await db.execute("SELECT id FROM inventory WHERE id = ?", [itemId])

    if (existingItem.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Item não encontrado",
      })
    }

    // Update inventory item
    await db.execute(
      `
      UPDATE inventory 
      SET name = ?, category = ?, current_stock = ?, min_stock = ?, unit = ?, supplier = ?, updated_at = NOW()
      WHERE id = ?
    `,
      [name, category, currentStock, minStock, unit, supplier || null, itemId],
    )

    console.log("✅ Item do estoque atualizado com sucesso")

    // Get the updated item
    const [updatedItem] = await db.execute(
      `
      SELECT id, name, category, current_stock, min_stock, unit, supplier, 
             created_at, updated_at 
      FROM inventory 
      WHERE id = ?
    `,
      [itemId],
    )

    res.json({
      success: true,
      message: "Item atualizado com sucesso!",
      item: updatedItem[0],
    })
  } catch (error) {
    console.error("❌ Erro ao atualizar item do estoque:", error)
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
    })
  }
})

// Delete inventory item
app.delete("/api/inventory/:id", authenticateToken, async (req, res) => {
  try {
    const itemId = req.params.id
    console.log("=== EXCLUINDO ITEM DO ESTOQUE ===")
    console.log("Item ID:", itemId)

    // Check if user is admin
    if (req.user.type !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Acesso negado. Apenas administradores podem gerenciar o estoque.",
      })
    }

    // Check if item exists
    const [existingItem] = await db.execute("SELECT id, name FROM inventory WHERE id = ?", [itemId])

    if (existingItem.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Item não encontrado",
      })
    }

    // Delete inventory item
    await db.execute("DELETE FROM inventory WHERE id = ?", [itemId])

    console.log("✅ Item do estoque excluído:", existingItem[0].name)

    res.json({
      success: true,
      message: "Item excluído com sucesso!",
    })
  } catch (error) {
    console.error("❌ Erro ao excluir item do estoque:", error)
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
    })
  }
})

// Get inventory statistics
app.get("/api/inventory/stats", authenticateToken, async (req, res) => {
  try {
    console.log("=== BUSCANDO ESTATÍSTICAS DO ESTOQUE ===")

    // Check if user is admin
    if (req.user.type !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Acesso negado. Apenas administradores podem acessar as estatísticas.",
      })
    }

    // Get inventory statistics with new logic (min_stock + 5)
    const [totalItems] = await db.execute("SELECT COUNT(*) as total FROM inventory")
    const [lowStockItems] = await db.execute(
      "SELECT COUNT(*) as total FROM inventory WHERE current_stock > 0 AND current_stock <= (min_stock + 5)",
    )
    const [outOfStockItems] = await db.execute("SELECT COUNT(*) as total FROM inventory WHERE current_stock = 0")
    const [categories] = await db.execute("SELECT category, COUNT(*) as total FROM inventory GROUP BY category")

    const stats = {
      totalItems: totalItems[0].total,
      lowStockItems: lowStockItems[0].total,
      outOfStockItems: outOfStockItems[0].total,
      categories: categories,
    }

    console.log("✅ Estatísticas do estoque:", stats)

    res.json({
      success: true,
      stats,
    })
  } catch (error) {
    console.error("❌ Erro ao buscar estatísticas do estoque:", error)
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
    })
  }
})

// Admin API Routes

// Get all users (admin only)
app.get("/api/admin/users", authenticateToken, async (req, res) => {
  try {
    console.log("=== ADMIN: BUSCANDO USUÁRIOS ===")

    // Check if user is admin
    if (req.user.type !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Acesso negado. Apenas administradores podem acessar esta funcionalidade.",
      })
    }

    console.log("🔍 Buscando todos os usuários...")
    const [users] = await db.execute(`
      SELECT id, name, email, cpf, date_birth, created_at 
      FROM users 
      ORDER BY created_at DESC
    `)

    console.log("✅ Usuários encontrados:", users.length)

    res.json({
      success: true,
      users,
    })
  } catch (error) {
    console.error("❌ Erro ao buscar usuários:", error)
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
    })
  }
})

// Get reservations by date (admin only)
app.get("/api/admin/reservations", authenticateToken, async (req, res) => {
  try {
    console.log("=== ADMIN: BUSCANDO RESERVAS ===")

    // Check if user is admin
    if (req.user.type !== "admin") {
      console.log("❌ Usuário não é admin:", req.user.type)
      return res.status(403).json({
        success: false,
        message: "Acesso negado. Apenas administradores podem acessar esta funcionalidade.",
      })
    }

    const { date } = req.query
    const targetDate = date || new Date().toISOString().split("T")[0]

    console.log("🔍 Buscando reservas para a data:", targetDate)

    // Verificar se a conexão com o banco está ativa
    if (!db) {
      console.log("❌ Conexão com banco não disponível")
      return res.status(500).json({
        success: false,
        message: "Erro de conexão com o banco de dados",
      })
    }

    const [reservations] = await db.execute(
      `
      SELECT id, user_id, name, email, phone, date, time, guests, 
             special_requests, status, table_number, created_at 
      FROM reservations 
      WHERE date = ? 
      ORDER BY time ASC
    `,
      [targetDate],
    )

    console.log("✅ Reservas encontradas:", reservations.length)

    res.json({
      success: true,
      reservations,
    })
  } catch (error) {
    console.error("❌ Erro ao buscar reservas:", error)
    console.error("Stack trace:", error.stack)
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
})

// Get specific reservation details (admin only)
app.get("/api/admin/reservations/:id", authenticateToken, async (req, res) => {
  try {
    const reservationId = req.params.id
    console.log("=== ADMIN: BUSCANDO DETALHES DA RESERVA ===")
    console.log("Reservation ID:", reservationId)

    // Check if user is admin
    if (req.user.type !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Acesso negado. Apenas administradores podem acessar esta funcionalidade.",
      })
    }

    const [reservations] = await db.execute(
      `
      SELECT id, user_id, name, email, phone, date, time, guests, 
             special_requests, status, table_number, created_at 
      FROM reservations 
      WHERE id = ?
    `,
      [reservationId],
    )

    if (reservations.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Reserva não encontrada",
      })
    }

    console.log("✅ Detalhes da reserva encontrados")

    res.json({
      success: true,
      reservation: reservations[0],
    })
  } catch (error) {
    console.error("❌ Erro ao buscar detalhes da reserva:", error)
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
    })
  }
})

// Update reservation status (admin only)
app.put("/api/admin/reservations/:id/status", authenticateToken, async (req, res) => {
  try {
    const reservationId = req.params.id
    const { status } = req.body

    console.log("=== ADMIN: ATUALIZANDO STATUS DA RESERVA ===")
    console.log("Reservation ID:", reservationId)
    console.log("New Status:", status)

    // Check if user is admin
    if (req.user.type !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Acesso negado. Apenas administradores podem acessar esta funcionalidade.",
      })
    }

    // Validate status
    const validStatuses = ["pending", "confirmed", "cancelled"]
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status inválido",
      })
    }

    // Check if reservation exists
    const [existingReservation] = await db.execute("SELECT id FROM reservations WHERE id = ?", [reservationId])

    if (existingReservation.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Reserva não encontrada",
      })
    }

    // Update reservation status
    await db.execute("UPDATE reservations SET status = ? WHERE id = ?", [status, reservationId])

    console.log("✅ Status da reserva atualizado com sucesso")

    res.json({
      success: true,
      message: "Status da reserva atualizado com sucesso",
    })
  } catch (error) {
    console.error("❌ Erro ao atualizar status da reserva:", error)
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
    })
  }
})

// Get tables status by date (admin only)
app.get("/api/admin/tables", authenticateToken, async (req, res) => {
  try {
    console.log("=== ADMIN: BUSCANDO STATUS DAS MESAS ===")

    // Check if user is admin
    if (req.user.type !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Acesso negado. Apenas administradores podem acessar esta funcionalidade.",
      })
    }

    const { date } = req.query
    const targetDate = date || new Date().toISOString().split("T")[0]

    console.log("🔍 Buscando status das mesas para a data:", targetDate)

    // Get reservations for the date to determine table status
    const [reservations] = await db.execute(
      `
      SELECT table_number, id as reservation_id, status, time
      FROM reservations 
      WHERE date = ? AND table_number IS NOT NULL AND status != 'cancelled'
      ORDER BY table_number ASC
    `,
      [targetDate],
    )

    // Create tables array (1-16)
    const tables = []
    for (let i = 1; i <= 16; i++) {
      const reservation = reservations.find((r) => r.table_number === i)

      tables.push({
        table_number: i,
        status: reservation ? (reservation.status === "confirmed" ? "occupied" : "reserved") : "available",
        reservation_id: reservation ? reservation.reservation_id : null,
        time: reservation ? reservation.time : null,
      })
    }

    console.log("✅ Status das mesas calculado:", tables.length)

    res.json({
      success: true,
      tables,
    })
  } catch (error) {
    console.error("❌ Erro ao buscar status das mesas:", error)
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
    })
  }
})

// Catch-all route para arquivos não encontrados
app.get("*", (req, res) => {
  console.log(`🔄 Catch-all route hit for: ${req.url}`)

  // Se for uma requisição para API que não existe, retornar 404 JSON
  if (req.url.startsWith("/api/")) {
    return res.status(404).json({
      success: false,
      message: "API endpoint not found",
    })
  }

  // Para outros arquivos, verificar se existem
  const filePath = path.join(staticPath, req.url)
  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath)
  }

  // Se não encontrar o arquivo, servir index.html se existir
  const indexPath = path.join(staticPath, "index.html")
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath)
  }

  // Caso contrário, retornar 404
  res.status(404).send("Page not found")
})

// Start server
async function startServer() {
  await initDatabase()

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`)
    console.log(`🌐 Visit http://localhost:${PORT} to view the website`)
    console.log(`📝 Registration: http://localhost:${PORT}/registro.html`)
    console.log(`🔐 Login: http://localhost:${PORT}/login.html`)
    console.log(`👨‍💼 Admin Login: admin@santoros.com / admin123`)
    console.log(`📁 Static files served from: ${path.join(__dirname, "../")}`)
  })
}

startServer().catch(console.error)
