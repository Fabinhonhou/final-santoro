const mysql = require("mysql2/promise")
const fs = require("fs")
const path = require("path")

async function connectWithPassword() {
  console.log("=== CONECTANDO COM SENHA DO VAULT ===\n")

  const config = {
    host: "localhost",
    port: 3306,
    user: "root",
    password: "MYdatabase@2025", // Senha do vault
  }

  console.log("🔍 Testando conexão com senha...")
  console.log(`   Host: ${config.host}:${config.port}`)
  console.log(`   User: ${config.user}`)
  console.log(`   Password: ${config.password.substring(0, 3)}***`)

  try {
    const connection = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      connectTimeout: 10000,
    })

    console.log("✅ CONEXÃO ESTABELECIDA COM SUCESSO!")

    // Testar se o banco santoros_restaurant existe
    try {
      await connection.execute("USE santoros_restaurant")
      console.log("✅ Banco 'santoros_restaurant' encontrado!")

      // Verificar tabelas
      const [tables] = await connection.execute("SHOW TABLES")
      console.log("📋 Tabelas encontradas:")
      tables.forEach((table) => {
        console.log(`   - ${Object.values(table)[0]}`)
      })

      // Verificar reservas existentes
      const [reservations] = await connection.execute("SELECT COUNT(*) as total FROM reservations")
      console.log(`📊 Total de reservas no banco: ${reservations[0].total}`)

      if (reservations[0].total > 0) {
        const [lastReservations] = await connection.execute(
          "SELECT name, email, date, time FROM reservations ORDER BY created_at DESC LIMIT 3",
        )
        console.log("📋 Últimas reservas:")
        lastReservations.forEach((res, i) => {
          console.log(`   ${i + 1}. ${res.name} - ${res.email} - ${res.date} ${res.time}`)
        })
      }

      await connection.end()

      // Criar arquivo .env com a senha correta
      createEnvFile(config)

      console.log("\n🎉 CONFIGURAÇÃO SALVA COM SUCESSO!")
      console.log("🚀 Agora execute: node server/server.js")
      console.log("🌐 Depois acesse: http://localhost:3000/reservaCompleta.html")

      return true
    } catch (dbError) {
      console.log("⚠️ Banco 'santoros_restaurant' não encontrado")
      console.log("💡 Criando banco...")

      await connection.execute("CREATE DATABASE IF NOT EXISTS santoros_restaurant")
      console.log("✅ Banco criado!")

      createEnvFile(config)
      await connection.end()

      console.log("\n✅ Banco criado! Execute: node server/server.js")
      return true
    }
  } catch (error) {
    console.log(`❌ Erro na conexão: ${error.message}`)
    console.log("\n🔧 Possíveis soluções:")
    console.log("1. Verifique se a senha está correta: MYdatabase@2025")
    console.log("2. Confirme se o MySQL está rodando")
    console.log("3. Teste a conexão no Workbench primeiro")
    return false
  }
}

function createEnvFile(config) {
  const envPath = path.join(__dirname, ".env")
  const envContent = `JWT_SECRET=b6203381221684dfc0504aa5bfeaa9e06ed7434ba146f02c54480b45ad785180
DB_HOST=${config.host}
DB_PORT=${config.port}
DB_USER=${config.user}
DB_PASSWORD=${config.password}
DB_NAME=santoros_restaurant
ADMIN_PASSWORD=admin123
PORT=3000`

  fs.writeFileSync(envPath, envContent)
  console.log("✅ Arquivo .env criado/atualizado com senha correta")
  console.log("📋 Configurações salvas:")
  console.log(`   Host: ${config.host}`)
  console.log(`   Port: ${config.port}`)
  console.log(`   User: ${config.user}`)
  console.log(`   Password: [CONFIGURADA]`)
  console.log(`   Database: santoros_restaurant`)
}

// Executar
connectWithPassword().catch(console.error)
