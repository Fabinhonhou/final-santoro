require("dotenv").config()
const mysql = require("mysql2/promise")

async function testExactConnection() {
  console.log("=== TESTANDO CONEXÃO COM CONFIGURAÇÕES EXATAS ===\n")

  console.log("📋 Configurações carregadas do .env:")
  console.log("   DB_HOST:", process.env.DB_HOST)
  console.log("   DB_PORT:", process.env.DB_PORT)
  console.log("   DB_USER:", process.env.DB_USER)
  console.log("   DB_PASSWORD:", process.env.DB_PASSWORD ? "✅ DEFINIDA" : "❌ NÃO DEFINIDA")
  console.log("   DB_NAME:", process.env.DB_NAME)

  try {
    console.log("\n🔍 Testando conexão...")

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: Number.parseInt(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectTimeout: 10000,
    })

    console.log("✅ CONEXÃO ESTABELECIDA!")

    // Testar banco
    await connection.execute("CREATE DATABASE IF NOT EXISTS santoros_restaurant")
    await connection.execute("USE santoros_restaurant")

    console.log("✅ Banco santoros_restaurant OK!")

    // Testar tabela reservations
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS reservations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        date DATE NOT NULL,
        time VARCHAR(10) NOT NULL,
        guests INT NOT NULL,
        special_requests TEXT,
        status ENUM('pending', 'confirmed', 'cancelled') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    console.log("✅ Tabela reservations OK!")

    const [count] = await connection.execute("SELECT COUNT(*) as total FROM reservations")
    console.log(`📊 Total de reservas: ${count[0].total}`)

    await connection.end()

    console.log("\n🎉 TUDO FUNCIONANDO!")
    console.log("🚀 Execute: node server/server.js")

    return true
  } catch (error) {
    console.log(`❌ Erro: ${error.message}`)
    return false
  }
}

testExactConnection()
