require("dotenv").config()
const mysql = require("mysql2/promise")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")

const JWT_SECRET = process.env.JWT_SECRET || "b6203381221684dfc0504aa5bfeaa9e06ed7434ba146f02c54480b45ad785180"

async function testAdminLoginDirect() {
  console.log("=== TESTE DIRETO DE LOGIN ADMIN (SEM SERVIDOR) ===")

  const adminCredentials = {
    email: "fabitorresrocha@gmail.com",
    password: "SantorosADM123",
  }

  try {
    // Conectar ao banco
    const db = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "santoros_restaurant",
    })

    console.log("✅ Conectado ao banco de dados")
    console.log("📧 Testando credenciais:", adminCredentials.email)

    // Buscar admin
    const [admins] = await db.execute(
      "SELECT id, name, email, password, role, active, created_at FROM admin_users WHERE email = ? AND active = true",
      [adminCredentials.email.toLowerCase().trim()],
    )

    if (admins.length === 0) {
      console.log("❌ Admin não encontrado ou inativo")
      return
    }

    const admin = admins[0]
    console.log("✅ Admin encontrado:", {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      active: admin.active,
    })

    // Verificar senha
    const passwordMatch = await bcrypt.compare(adminCredentials.password, admin.password)
    console.log("🔐 Verificação de senha:", passwordMatch ? "✅ CORRETA" : "❌ INCORRETA")

    if (passwordMatch) {
      // Gerar token
      const token = jwt.sign({ userId: admin.id, email: admin.email, type: "admin", role: admin.role }, JWT_SECRET, {
        expiresIn: "7d",
      })

      console.log("🎉 LOGIN SIMULADO BEM-SUCEDIDO!")
      console.log("Token gerado:", token.substring(0, 50) + "...")
      console.log("Dados do usuário:", {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        type: "admin",
      })

      // Atualizar último login
      await db.execute("UPDATE admin_users SET last_login = NOW() WHERE id = ?", [admin.id])
      console.log("✅ Último login atualizado")
    }

    await db.end()
  } catch (error) {
    console.error("❌ Erro no teste:", error.message)
  }
}

testAdminLoginDirect().catch(console.error)
