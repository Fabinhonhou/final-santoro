require("dotenv").config()
const mysql = require("mysql2/promise")
const bcrypt = require("bcrypt")

async function fixAdminConflict() {
  console.log("=== RESOLVENDO CONFLITO DE EMAIL ADMIN ===")

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

    const adminEmail = "fabitorresrocha@gmail.com"
    const adminPassword = "SantorosADM123"

    // 1. Verificar se existe na tabela users
    console.log("\n1. Verificando tabela users...")
    const [users] = await db.execute("SELECT id, name, email FROM users WHERE email = ?", [adminEmail])

    if (users.length > 0) {
      console.log("⚠️ Email encontrado na tabela users:")
      console.log(`   ID: ${users[0].id}, Nome: ${users[0].name}`)

      // Opção 1: Remover da tabela users
      console.log("\n🗑️ Removendo email da tabela users...")
      await db.execute("DELETE FROM users WHERE email = ?", [adminEmail])
      console.log("✅ Email removido da tabela users")
    } else {
      console.log("✅ Email não encontrado na tabela users")
    }

    // 2. Verificar se existe na tabela admin_users
    console.log("\n2. Verificando tabela admin_users...")
    const [admins] = await db.execute("SELECT id, name, email, role FROM admin_users WHERE email = ?", [adminEmail])

    if (admins.length > 0) {
      console.log("✅ Email encontrado na tabela admin_users:")
      console.log(`   ID: ${admins[0].id}, Nome: ${admins[0].name}, Role: ${admins[0].role}`)

      // Atualizar senha
      console.log("\n🔐 Atualizando senha do admin...")
      const hashedPassword = await bcrypt.hash(adminPassword, 12)
      await db.execute("UPDATE admin_users SET password = ?, active = true WHERE email = ?", [
        hashedPassword,
        adminEmail,
      ])
      console.log("✅ Senha do admin atualizada")
    } else {
      console.log("➕ Criando novo admin...")

      // Criar admin
      const hashedPassword = await bcrypt.hash(adminPassword, 12)
      await db.execute("INSERT INTO admin_users (name, email, password, role, active) VALUES (?, ?, ?, ?, ?)", [
        "Fabio Torres Rocha",
        adminEmail,
        hashedPassword,
        "super_admin",
        true,
      ])
      console.log("✅ Novo admin criado")
    }

    // 3. Testar credenciais
    console.log("\n3. Testando credenciais...")
    const [finalAdmin] = await db.execute("SELECT * FROM admin_users WHERE email = ?", [adminEmail])

    if (finalAdmin.length > 0) {
      const admin = finalAdmin[0]
      const isMatch = await bcrypt.compare(adminPassword, admin.password)

      console.log(`Teste da senha: ${isMatch ? "✅ SUCESSO" : "❌ FALHOU"}`)

      if (isMatch) {
        console.log("\n🎉 PROBLEMA RESOLVIDO!")
        console.log("📧 Email:", admin.email)
        console.log("🔑 Senha:", adminPassword)
        console.log("👤 Nome:", admin.name)
        console.log("🛡️ Role:", admin.role)
        console.log("✅ Ativo:", admin.active)
      }
    }

    await db.end()
  } catch (error) {
    console.error("❌ Erro:", error.message)
  }
}

fixAdminConflict().catch(console.error)
