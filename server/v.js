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

async function verifyTableStructure() {
  let connection

  try {
    console.log("🔍 Verificando estrutura das tabelas...")

    // Conectar ao banco de dados
    connection = await mysql.createConnection(dbConfig)
    console.log("✅ Conectado ao banco de dados")

    // Verificar estrutura da tabela reservations
    console.log("\n📋 Estrutura da tabela 'reservations':")
    const [reservationsStructure] = await connection.execute("DESCRIBE reservations")
    reservationsStructure.forEach((column) => {
      console.log(
        `   - ${column.Field}: ${column.Type} ${column.Null === "YES" ? "(NULL)" : "(NOT NULL)"} ${column.Key ? `[${column.Key}]` : ""}`,
      )
    })

    // Verificar se table_number existe
    const hasTableNumber = reservationsStructure.some((col) => col.Field === "table_number")
    console.log(`\n🪑 Coluna table_number: ${hasTableNumber ? "✅ EXISTE" : "❌ NÃO EXISTE"}`)

    // Verificar outras tabelas importantes
    console.log("\n📋 Estrutura da tabela 'users':")
    const [usersStructure] = await connection.execute("DESCRIBE users")
    usersStructure.forEach((column) => {
      console.log(
        `   - ${column.Field}: ${column.Type} ${column.Null === "YES" ? "(NULL)" : "(NOT NULL)"} ${column.Key ? `[${column.Key}]` : ""}`,
      )
    })

    console.log("\n📋 Estrutura da tabela 'admin_users':")
    const [adminUsersStructure] = await connection.execute("DESCRIBE admin_users")
    adminUsersStructure.forEach((column) => {
      console.log(
        `   - ${column.Field}: ${column.Type} ${column.Null === "YES" ? "(NULL)" : "(NOT NULL)"} ${column.Key ? `[${column.Key}]` : ""}`,
      )
    })

    // Contar registros
    console.log("\n📊 Contagem de registros:")
    const [userCount] = await connection.execute("SELECT COUNT(*) as count FROM users")
    const [reservationCount] = await connection.execute("SELECT COUNT(*) as count FROM reservations")
    const [adminCount] = await connection.execute("SELECT COUNT(*) as count FROM admin_users")

    console.log(`   - Usuários: ${userCount[0].count}`)
    console.log(`   - Reservas: ${reservationCount[0].count}`)
    console.log(`   - Admins: ${adminCount[0].count}`)

    if (!hasTableNumber) {
      console.log("\n⚠️ AÇÃO NECESSÁRIA:")
      console.log("Execute: node server/add-table-number-column.js")
    }
  } catch (error) {
    console.error("❌ Erro ao verificar estrutura:", error.message)
  } finally {
    if (connection) {
      await connection.end()
      console.log("\n🔌 Conexão com banco de dados fechada")
    }
  }
}

// Executar
verifyTableStructure()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error("❌ Erro:", error)
    process.exit(1)
  })
