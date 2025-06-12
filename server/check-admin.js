require("dotenv").config()
const mysql = require("mysql2/promise")
const bcrypt = require("bcrypt")

async function checkAdmin() {
  console.log("=== VERIFICANDO ADMINISTRADOR ===")

  try {
    // Conectar ao banco de dados
    const db = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "santoros_restaurant",
    })

    console.log("✅ Conectado ao banco de dados")

    // Verificar se a tabela admin_users existe
    const [tables] = await db.execute("SHOW TABLES LIKE 'admin_users'")

    if (tables.length === 0) {
      console.log("❌ Tabela admin_users não existe!")
      console.log("💡 Execute: node server/create-admin-user.js")
      return
    }

    // Listar todos os administradores
    const [admins] = await db.execute("SELECT * FROM admin_users")

    console.log(`📋 Encontrados ${admins.length} administradores:`)

    for (const admin of admins) {
      console.log(`\n👤 Admin ID: ${admin.id}`)
      console.log(`   Nome: ${admin.name}`)
      console.log(`   Email: ${admin.email}`)
      console.log(`   Role: ${admin.role}`)
      console.log(`   Ativo: ${admin.active}`)
      console.log(`   Criado: ${admin.created_at}`)

      // Testar senha padrão
      const testPasswords = ["SantorosADM123", "SantorosADM!@#", process.env.ADMIN_PASSWORD || "SantoroADM123"]

      for (const testPassword of testPasswords) {
        try {
          const isMatch = await bcrypt.compare(testPassword, admin.password)
          console.log(`   Teste senha "${testPassword}": ${isMatch ? "✅ CORRETA" : "❌ Incorreta"}`)

          if (isMatch) {
            console.log(`\n🎉 CREDENCIAIS CORRETAS ENCONTRADAS:`)
            console.log(`   Email: ${admin.email}`)
            console.log(`   Senha: ${testPassword}`)
            break
          }
        } catch (error) {
          console.log(`   Erro ao testar senha "${testPassword}": ${error.message}`)
        }
      }
    }

    await db.end()
  } catch (error) {
    console.error("❌ Erro:", error.message)
  }
}

checkAdmin().catch(console.error)
