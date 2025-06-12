require("dotenv").config()
const mysql = require("mysql2/promise")
const bcrypt = require("bcrypt")

async function resetAdminPassword() {
  console.log("=== RESETANDO SENHA DO ADMINISTRADOR ===")

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

    // Nova senha
    const newPassword = "admin123"
    const adminEmail = "admin@santoros.com"

    // Hash da nova senha
    console.log("🔐 Gerando hash da nova senha...")
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // Verificar se admin existe
    const [existingAdmin] = await db.execute("SELECT id FROM admin_users WHERE email = ?", [adminEmail])

    if (existingAdmin.length === 0) {
      console.log("❌ Admin não encontrado, criando novo...")

      // Criar novo admin
      await db.execute("INSERT INTO admin_users (name, email, password, role, active) VALUES (?, ?, ?, ?, ?)", [
        "Administrador",
        adminEmail,
        hashedPassword,
        "admin",
        true,
      ])

      console.log("✅ Novo administrador criado!")
    } else {
      console.log("📝 Atualizando senha do administrador existente...")

      // Atualizar senha
      await db.execute("UPDATE admin_users SET password = ?, active = true WHERE email = ?", [
        hashedPassword,
        adminEmail,
      ])

      console.log("✅ Senha atualizada!")
    }

    // Verificar se funcionou
    console.log("\n🧪 Testando nova senha...")
    const [admin] = await db.execute("SELECT * FROM admin_users WHERE email = ?", [adminEmail])

    if (admin.length > 0) {
      const isMatch = await bcrypt.compare(newPassword, admin[0].password)
      console.log(`Teste da senha: ${isMatch ? "✅ SUCESSO" : "❌ FALHOU"}`)

      if (isMatch) {
        console.log("\n🎉 CREDENCIAIS ATUALIZADAS:")
        console.log(`   Email: ${adminEmail}`)
        console.log(`   Senha: ${newPassword}`)
        console.log(`   Role: ${admin[0].role}`)
      }
    }

    await db.end()
  } catch (error) {
    console.error("❌ Erro:", error.message)
  }
}

resetAdminPassword().catch(console.error)
