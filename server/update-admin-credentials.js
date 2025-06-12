require("dotenv").config()
const mysql = require("mysql2/promise")
const bcrypt = require("bcrypt")

async function updateAdminCredentials() {
  console.log("=== ATUALIZANDO CREDENCIAIS DO ADMINISTRADOR ===")

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

    // Suas credenciais
    const adminData = {
      name: "Fabio Torres Rocha",
      email: "fabitorresrocha@gmail.com",
      password: "SantorosADM123",
      role: "super_admin",
    }

    console.log("📝 Atualizando credenciais para:", adminData.email)

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(adminData.password, 12)

    // Verificar se admin já existe
    const [existingAdmin] = await db.execute("SELECT id FROM admin_users WHERE email = ?", [adminData.email])

    if (existingAdmin.length > 0) {
      console.log("📝 Atualizando administrador existente...")

      // Atualizar admin existente
      await db.execute("UPDATE admin_users SET name = ?, password = ?, role = ?, active = true WHERE email = ?", [
        adminData.name,
        hashedPassword,
        adminData.role,
        adminData.email,
      ])

      console.log("✅ Administrador atualizado!")
    } else {
      console.log("➕ Criando novo administrador...")

      // Criar novo admin
      await db.execute("INSERT INTO admin_users (name, email, password, role, active) VALUES (?, ?, ?, ?, ?)", [
        adminData.name,
        adminData.email,
        hashedPassword,
        adminData.role,
        true,
      ])

      console.log("✅ Novo administrador criado!")
    }

    // Verificar se funcionou
    console.log("\n🧪 Testando credenciais...")
    const [admin] = await db.execute("SELECT * FROM admin_users WHERE email = ?", [adminData.email])

    if (admin.length > 0) {
      const isMatch = await bcrypt.compare(adminData.password, admin[0].password)
      console.log(`Teste da senha: ${isMatch ? "✅ SUCESSO" : "❌ FALHOU"}`)

      if (isMatch) {
        console.log("\n🎉 CREDENCIAIS FINAIS:")
        console.log(`   Nome: ${admin[0].name}`)
        console.log(`   Email: ${admin[0].email}`)
        console.log(`   Senha: ${adminData.password}`)
        console.log(`   Role: ${admin[0].role}`)
        console.log(`   Ativo: ${admin[0].active}`)
      }
    }

    await db.end()
  } catch (error) {
    console.error("❌ Erro:", error.message)
  }
}

updateAdminCredentials().catch(console.error)
