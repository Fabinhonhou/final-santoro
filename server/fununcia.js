require("dotenv").config()
const mysql = require("mysql2/promise")

async function fixTableStructure() {
  console.log("=== CORRIGINDO ESTRUTURA DAS TABELAS ===\n")

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

    // Verificar estrutura da tabela users
    console.log("🔍 Verificando estrutura da tabela users...")
    const [columns] = await db.execute("DESCRIBE users")

    console.log("📋 Colunas atuais da tabela users:")
    columns.forEach((col) => {
      console.log(`   - ${col.Field} (${col.Type})`)
    })

    // Verificar se as colunas cpf e date_birth existem
    const hasCP = columns.some((col) => col.Field === "cpf")
    const hasDateBirth = columns.some((col) => col.Field === "date_birth")

    console.log(`\n📊 Status das colunas:`)
    console.log(`   CPF: ${hasCP ? "✅ Existe" : "❌ Faltando"}`)
    console.log(`   Date Birth: ${hasDateBirth ? "✅ Existe" : "❌ Faltando"}`)

    // Adicionar colunas faltantes
    if (!hasCP) {
      console.log("➕ Adicionando coluna 'cpf'...")
      await db.execute("ALTER TABLE users ADD COLUMN cpf VARCHAR(14) AFTER name")
      console.log("✅ Coluna 'cpf' adicionada")
    }

    if (!hasDateBirth) {
      console.log("➕ Adicionando coluna 'date_birth'...")
      await db.execute("ALTER TABLE users ADD COLUMN date_birth DATE AFTER cpf")
      console.log("✅ Coluna 'date_birth' adicionada")
    }

    // Verificar/criar tabela admin_users
    console.log("\n🔍 Verificando tabela admin_users...")
    try {
      const [adminColumns] = await db.execute("DESCRIBE admin_users")
      console.log("✅ Tabela admin_users existe")
    } catch (error) {
      console.log("➕ Criando tabela admin_users...")
      await db.execute(`
        CREATE TABLE admin_users (
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
      console.log("✅ Tabela admin_users criada")
    }

    // Criar admin padrão
    console.log("\n👤 Verificando admin padrão...")
    const [existingAdmin] = await db.execute("SELECT id FROM admin_users WHERE email = ?", ["admin@santoros.com"])

    if (existingAdmin.length === 0) {
      console.log("➕ Criando admin padrão...")
      const bcrypt = require("bcrypt")
      const hashedPassword = await bcrypt.hash("admin123", 12)

      await db.execute("INSERT INTO admin_users (name, email, password, role, active) VALUES (?, ?, ?, ?, ?)", [
        "Administrador",
        "admin@santoros.com",
        hashedPassword,
        "admin",
        true,
      ])
      console.log("✅ Admin padrão criado:")
      console.log("   Email: admin@santoros.com")
      console.log("   Senha: admin123")
    } else {
      console.log("✅ Admin padrão já existe")
    }

    // Verificar estrutura final
    console.log("\n📋 Estrutura final da tabela users:")
    const [finalColumns] = await db.execute("DESCRIBE users")
    finalColumns.forEach((col) => {
      console.log(`   - ${col.Field} (${col.Type})`)
    })

    await db.end()
    console.log("\n🎉 ESTRUTURA CORRIGIDA COM SUCESSO!")
    console.log("🚀 Agora execute: node server/server.js")
  } catch (error) {
    console.error("❌ Erro:", error.message)
    console.log("\n💡 Possíveis soluções:")
    console.log("1. Verifique se o MySQL está rodando")
    console.log("2. Confirme as configurações no arquivo .env")
    console.log("3. Verifique se o banco 'santoros_restaurant' existe")
  }
}

fixTableStructure().catch(console.error)
