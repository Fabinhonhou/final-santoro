require("dotenv").config()
const mysql = require("mysql2/promise")

async function listAdmins() {
  console.log("=== LISTANDO ADMINISTRADORES ===")

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

    // Verificar se a tabela existe
    const [tables] = await db.execute("SHOW TABLES LIKE 'admin_users'")

    if (tables.length === 0) {
      console.log("❌ Tabela admin_users não existe!")
      console.log("💡 Execute: node server/create-admin-user.js")
      await db.end()
      return
    }

    // Listar todos os administradores
    const [admins] = await db.execute(`
      SELECT id, name, email, role, active, created_at, last_login 
      FROM admin_users 
      ORDER BY created_at DESC
    `)

    if (admins.length === 0) {
      console.log("❌ Nenhum administrador encontrado!")
      console.log("💡 Execute: node server/create-admin-user.js")
    } else {
      console.log(`📋 Encontrados ${admins.length} administradores:`)
      console.log("")

      admins.forEach((admin, index) => {
        const status = admin.active ? "✅ Ativo" : "❌ Inativo"
        const created = new Date(admin.created_at).toLocaleDateString("pt-BR")
        const lastLogin = admin.last_login
          ? new Date(admin.last_login).toLocaleDateString("pt-BR") +
            " " +
            new Date(admin.last_login).toLocaleTimeString("pt-BR")
          : "Nunca"

        console.log(`${index + 1}. ${admin.name}`)
        console.log(`   📧 Email: ${admin.email}`)
        console.log(`   👤 Tipo: ${admin.role}`)
        console.log(`   📊 Status: ${status}`)
        console.log(`   📅 Criado: ${created}`)
        console.log(`   🕐 Último login: ${lastLogin}`)
        console.log("")
      })
    }

    await db.end()
  } catch (error) {
    console.error("\n❌ ERRO:", error.message)
  }
}

listAdmins().catch(console.error)
