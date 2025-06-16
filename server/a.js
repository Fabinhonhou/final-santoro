import dotenv from "dotenv"
import mysql from "mysql2/promise"

dotenv.config()

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "santoros_restaurant",
}

async function addTableNumberColumn() {
  let connection

  try {
    console.log("🔧 Adicionando coluna table_number à tabela reservations...")

    // Conectar ao banco de dados
    connection = await mysql.createConnection(dbConfig)
    console.log("✅ Conectado ao banco de dados")

    // Verificar se a coluna já existe
    const [columns] = await connection.execute(
      `
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'reservations' AND COLUMN_NAME = 'table_number'
    `,
      [dbConfig.database],
    )

    if (columns.length > 0) {
      console.log("ℹ️ A coluna table_number já existe na tabela reservations")
      return
    }

    // Adicionar a coluna table_number
    await connection.execute(`
      ALTER TABLE reservations 
      ADD COLUMN table_number INT NULL AFTER guests
    `)

    console.log("✅ Coluna table_number adicionada com sucesso!")

    // Adicionar índice para a nova coluna
    await connection.execute(`
      ALTER TABLE reservations 
      ADD INDEX idx_table_number (table_number)
    `)

    console.log("✅ Índice para table_number criado com sucesso!")

    // Verificar a estrutura da tabela
    const [tableStructure] = await connection.execute("DESCRIBE reservations")
    console.log("\n📋 Estrutura atual da tabela reservations:")
    tableStructure.forEach((column) => {
      console.log(`   - ${column.Field}: ${column.Type} ${column.Null === "YES" ? "(NULL)" : "(NOT NULL)"}`)
    })
  } catch (error) {
    console.error("❌ Erro ao adicionar coluna table_number:", error.message)

    if (error.code === "ER_DUP_FIELDNAME") {
      console.log("ℹ️ A coluna table_number já existe")
    } else {
      throw error
    }
  } finally {
    if (connection) {
      await connection.end()
      console.log("🔌 Conexão com banco de dados fechada")
    }
  }
}

// Executar
addTableNumberColumn()
  .then(() => {
    console.log("\n🎉 Migração concluída com sucesso!")
    console.log("Agora você pode reiniciar o servidor e testar as reservas.")
    process.exit(0)
  })
  .catch((error) => {
    console.error("\n❌ Falha na migração:", error)
    process.exit(1)
  })
