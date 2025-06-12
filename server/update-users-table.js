require("dotenv").config()
const mysql = require("mysql2/promise")

async function updateUsersTable() {
  console.log("=== ATUALIZANDO TABELA DE USUÁRIOS ===")

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

    // Verificar estrutura atual da tabela
    console.log("📋 Verificando estrutura atual da tabela users...")
    const [columns] = await db.execute("DESCRIBE users")

    console.log("Colunas atuais:")
    columns.forEach((col) => {
      console.log(`   - ${col.Field}: ${col.Type}`)
    })

    // Verificar se as colunas CPF e data de nascimento já existem
    const hasCP = columns.some((col) => col.Field === "cpf")
    const hasBirthDate = columns.some((col) => col.Field === "date_birth")

    // Adicionar coluna CPF se não existir
    if (!hasCP) {
      console.log("➕ Adicionando coluna 'cpf'...")
      await db.execute("ALTER TABLE users ADD COLUMN cpf VARCHAR(14) AFTER name")
      console.log("   ✅ Coluna 'cpf' adicionada")
    } else {
      console.log("   ℹ️ Coluna 'cpf' já existe")
    }

    // Adicionar coluna data de nascimento se não existir
    if (!hasBirthDate) {
      console.log("➕ Adicionando coluna 'date_birth'...")
      await db.execute("ALTER TABLE users ADD COLUMN date_birth DATE AFTER cpf")
      console.log("   ✅ Coluna 'date_birth' adicionada")
    } else {
      console.log("   ℹ️ Coluna 'date_birth' já existe")
    }

    // Verificar estrutura final
    console.log("\n📋 Estrutura final da tabela users:")
    const [finalColumns] = await db.execute("DESCRIBE users")
    finalColumns.forEach((col) => {
      console.log(`   - ${col.Field}: ${col.Type} ${col.Null === "NO" ? "NOT NULL" : "NULL"}`)
    })

    await db.end()
    console.log("\n✅ ATUALIZAÇÃO DA TABELA CONCLUÍDA!")
  } catch (error) {
    console.error("\n❌ ERRO:", error.message)
    console.error(error)
  }
}

updateUsersTable().catch(console.error)
