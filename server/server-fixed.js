require("dotenv").config()

const express = require("express")
const mysql = require("mysql2/promise")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const cors = require("cors")
const path = require("path")
const fs = require("fs")

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

    // Reservations table
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
        special_requests TEXT,
        status ENUM('pending', 'confirmed', 'cancelled') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_date (date),
        INDEX idx_status (status)
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
    return res.status(401).json({ message: "Access token required" })
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.log("❌ Token inválido:", err.message)
      return res.status(403).json({ message: "Invalid token" })
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

// User Registration - CORRIGIDO para garantir salvamento
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
      cpf: cpf ? cpf.replace(/\D/g, "") : null, // Remove caracteres não numéricos do CPF
      date_birth: date_birth || null,
    }

    console.log("💾 Salvando usuário no banco...")
    console.log("Dados a serem salvos:", {
      name: userData.name,
      email: userData.email,
      cpf: userData.cpf,
      date_birth: userData.date_birth,
      password: "[CRIPTOGRAFADA]",
    })

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

// User Login - CORRIGIDO para priorizar admin_users
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

    // PRIMEIRO, tentar encontrar na tabela de administradores
    console.log("🔍 Buscando em admin_users PRIMEIRO...")
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

    // DEPOIS, tentar encontrar na tabela de usuários normais
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

    // Aqui você pode:
    // 1. Salvar no banco de dados
    // 2. Enviar email para o administrador
    // 3. Integrar com sistema de tickets

    // Por enquanto, apenas log
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

// Rota específica para contato.html
app.get("/contato.html", (req, res) => {
  res.sendFile(path.join(__dirname, "../contato.html"))
})

// Rotas específicas para arquivos HTML
app.get("/registro.html", (req, res) => {
  res.sendFile(path.join(__dirname, "../registro.html"))
})

app.get("/login.html", (req, res) => {
  res.sendFile(path.join(__dirname, "../login.html"))
})

app.get("/menu.html", (req, res) => {
  res.sendFile(path.join(__dirname, "../menu.html"))
})

// Rota para CSS específicos
app.get("/css/registro.css", (req, res) => {
  res.setHeader("Content-Type", "text/css")
  res.sendFile(path.join(__dirname, "../css/registro.css"))
})

app.get("/css/login.css", (req, res) => {
  res.setHeader("Content-Type", "text/css")
  res.sendFile(path.join(__dirname, "../css/login.css"))
})

// Catch-all route deve ser o último
app.get("*", (req, res) => {
  console.log(`🔄 Catch-all route hit for: ${req.url}`)

  // Se for uma requisição para um arquivo que não existe, retornar 404
  if (req.url.includes(".") && !fs.existsSync(path.join(staticPath, req.url))) {
    return res.status(404).send("File not found")
  }

  // Caso contrário, servir menu.html
  res.sendFile(path.join(__dirname, "../menu.html"))
})

// Start server
async function startServer() {
  await initDatabase()

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`)
    console.log(`🌐 Visit http://localhost:${PORT} to view the website`)
    console.log(`📝 Registration: http://localhost:${PORT}/registro.html`)
    console.log(`🔐 Login: http://localhost:${PORT}/login.html`)
    console.log(`👨‍💼 Admin Login: fabitorresrocha@gmail.com / SantorosADM123`)
    console.log(`📁 Static files served from: ${path.join(__dirname, "../")}`)
  })
}

startServer().catch(console.error)
