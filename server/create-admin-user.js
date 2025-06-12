require("dotenv").config()
const mysql = require("mysql2/promise")
const bcrypt = require("bcrypt")

async function createAdminUser() {
  console.log("=== CRIANDO USUÁRIO ADMINISTRADOR ===")

  try {
    // Conectar ao banco de dados
    const db = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "MYdatabase@2025",
      database: process.env.DB_NAME || "santoros_restaurant",
    })

    console.log("✅ Conectado ao banco de dados")

    // Criar tabela de administradores se não existir
    console.log("📋 Criando tabela de administradores...")
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

    // Verificar se já existe um admin
    const [existingAdmins] = await db.execute("SELECT COUNT(*) as count FROM admin_users")

    if (existingAdmins[0].count > 0) {
      console.log("⚠️ Já existem administradores cadastrados:")
      const [admins] = await db.execute("SELECT id, name, email, role, active FROM admin_users")
      admins.forEach((admin) => {
        console.log(`   - ${admin.name} (${admin.email}) - ${admin.role} - ${admin.active ? "Ativo" : "Inativo"}`)
      })

      const readline = require("readline")
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      })

      const answer = await new Promise((resolve) => {
        rl.question("Deseja criar um novo administrador mesmo assim? (s/n): ", resolve)
      })

      rl.close()

      if (answer.toLowerCase() !== "s" && answer.toLowerCase() !== "sim") {
        console.log("❌ Operação cancelada")
        await db.end()
        return
      }
    }

    // Solicitar dados do administrador
    const readline = require("readline")
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    console.log("\n📝 Vamos criar um novo administrador:")

    const name = await new Promise((resolve) => {
      rl.question("Nome completo: ", resolve)
    })

    const email = await new Promise((resolve) => {
      rl.question("Email: ", resolve)
    })

    const password = await new Promise((resolve) => {
      rl.question("Senha (mínimo 8 caracteres): ", resolve)
    })

    const roleAnswer = await new Promise((resolve) => {
      rl.question("Tipo de administrador (1=admin, 2=super_admin) [1]: ", resolve)
    })

    rl.close()

    // Validar dados
    if (!name || name.trim().length < 2) {
      throw new Error("Nome deve ter pelo menos 2 caracteres")
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw new Error("Email inválido")
    }

    if (password.length < 8) {
      throw new Error("Senha deve ter pelo menos 8 caracteres")
    }

    const role = roleAnswer === "2" ? "super_admin" : "admin"

    // Verificar se email já existe
    const [existingEmail] = await db.execute("SELECT id FROM admin_users WHERE email = ?", [email])
    if (existingEmail.length > 0) {
      throw new Error("Email já está em uso")
    }

    // Hash da senha
    console.log("🔐 Criptografando senha...")
    const hashedPassword = await bcrypt.hash(password, 12)

    // Criar administrador
    console.log("👤 Criando administrador...")
    const [result] = await db.execute("INSERT INTO admin_users (name, email, password, role) VALUES (?, ?, ?, ?)", [
      name.trim(),
      email.toLowerCase(),
      hashedPassword,
      role,
    ])

    console.log("✅ ADMINISTRADOR CRIADO COM SUCESSO!")
    console.log(`   - ID: ${result.insertId}`)
    console.log(`   - Nome: ${name}`)
    console.log(`   - Email: ${email}`)
    console.log(`   - Tipo: ${role}`)
    console.log(`   - Senha: [CRIPTOGRAFADA]`)

    // Mostrar todos os administradores
    console.log("\n📋 ADMINISTRADORES CADASTRADOS:")
    const [allAdmins] = await db.execute(
      "SELECT id, name, email, role, active, created_at FROM admin_users ORDER BY created_at DESC",
    )
    allAdmins.forEach((admin) => {
      const status = admin.active ? "✅ Ativo" : "❌ Inativo"
      const date = new Date(admin.created_at).toLocaleDateString("pt-BR")
      console.log(`   - ${admin.name} (${admin.email}) - ${admin.role} - ${status} - Criado: ${date}`)
    })

    await db.end()
    console.log("\n🚀 Agora você pode fazer login no painel admin com essas credenciais!")
  } catch (error) {
    console.error("\n❌ ERRO:", error.message)
  }
}

createAdminUser().catch(console.error)
