import mysql from "mysql2/promise"
import dotenv from "dotenv"

dotenv.config()

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "santoros_restaurant",
}

async function testServerHealth() {
  console.log("🔍 Testando saúde do servidor...")

  try {
    // Testar conexão com banco
    console.log("1. Testando conexão com banco de dados...")
    const db = await mysql.createConnection(dbConfig)

    // Testar se as tabelas existem
    console.log("2. Verificando tabelas...")
    const [tables] = await db.execute("SHOW TABLES")
    console.log(
      "   Tabelas encontradas:",
      tables.map((t) => Object.values(t)[0]),
    )

    // Testar consulta de usuários
    console.log("3. Testando consulta de usuários...")
    const [users] = await db.execute("SELECT COUNT(*) as count FROM users")
    console.log("   Usuários cadastrados:", users[0].count)

    // Testar consulta de reservas
    console.log("4. Testando consulta de reservas...")
    const [reservations] = await db.execute("SELECT COUNT(*) as count FROM reservations")
    console.log("   Reservas cadastradas:", reservations[0].count)

    // Testar consulta de admin
    console.log("5. Testando consulta de admin...")
    const [admins] = await db.execute("SELECT COUNT(*) as count FROM admin_users")
    console.log("   Admins cadastrados:", admins[0].count)

    await db.end()

    console.log("✅ Todos os testes passaram!")
  } catch (error) {
    console.error("❌ Erro nos testes:", error.message)
    console.error("Stack:", error.stack)
  }
}

testServerHealth()
