const mysql = require("mysql2/promise")
const fs = require("fs")
const path = require("path")

async function connectWithWorkbench() {
  console.log("=== CONECTANDO USANDO CONFIGURAÇÕES DO WORKBENCH ===\n")

  // Configurações típicas do MySQL Workbench
  const configs = [
    {
      name: "Padrão sem senha",
      host: "localhost",
      port: 3306,
      user: "root",
      password: "",
    },
    {
      name: "Padrão com senha vazia",
      host: "127.0.0.1",
      port: 3306,
      user: "root",
      password: "",
    },
    {
      name: "Porta alternativa 3307",
      host: "localhost",
      port: 3307,
      user: "root",
      password: "",
    },
  ]

  for (const config of configs) {
    console.log(`🔍 Testando: ${config.name}`)
    console.log(`   Host: ${config.host}:${config.port}`)
    console.log(`   User: ${config.user}`)

    try {
      const connection = await mysql.createConnection({
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password,
        connectTimeout: 5000,
      })

      console.log("✅ CONEXÃO ESTABELECIDA!")

      // Testar se o banco santoros_restaurant existe
      try {
        await connection.execute("USE santoros_restaurant")
        console.log("✅ Banco 'santoros_restaurant' encontrado!")

        // Verificar tabelas
        const [tables] = await connection.execute("SHOW TABLES")
        console.log(
          "📋 Tabelas encontradas:",
          tables.map((t) => Object.values(t)[0]),
        )

        // Criar arquivo .env com as configurações corretas
        createEnvFile(config)

        // Testar uma query simples
        const [reservations] = await connection.execute("SELECT COUNT(*) as total FROM reservations")
        console.log(`📊 Total de reservas: ${reservations[0].total}`)

        await connection.end()

        console.log("\n🎉 CONFIGURAÇÃO SALVA COM SUCESSO!")
        console.log("🚀 Agora execute: node server/server.js")
        return true
      } catch (dbError) {
        console.log("⚠️ Banco 'santoros_restaurant' não encontrado, mas conexão OK")
        console.log("💡 Vamos criar o banco...")

        await connection.execute("CREATE DATABASE IF NOT EXISTS santoros_restaurant")
        console.log("✅ Banco criado!")

        createEnvFile(config)
        await connection.end()
        return true
      }
    } catch (error) {
      console.log(`❌ Falhou: ${error.message}`)
    }
  }

  console.log("\n❌ Nenhuma configuração funcionou")
  console.log("💡 Vamos tentar descobrir as configurações do Workbench...")
  await findWorkbenchConfig()
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
  console.log("✅ Arquivo .env criado/atualizado")
  console.log("📋 Configurações salvas:")
  console.log(`   Host: ${config.host}`)
  console.log(`   Port: ${config.port}`)
  console.log(`   User: ${config.user}`)
  console.log(`   Password: ${config.password ? "[DEFINIDA]" : "[VAZIA]"}`)
}

async function findWorkbenchConfig() {
  console.log("\n🔍 Procurando configurações do MySQL Workbench...")

  const possiblePaths = [
    path.join(process.env.APPDATA, "MySQL", "Workbench", "connections.xml"),
    path.join(process.env.USERPROFILE, "AppData", "Roaming", "MySQL", "Workbench", "connections.xml"),
    path.join(process.env.USERPROFILE, ".mysql", "workbench", "connections.xml"),
  ]

  for (const configPath of possiblePaths) {
    if (fs.existsSync(configPath)) {
      console.log(`✅ Arquivo de configuração encontrado: ${configPath}`)
      try {
        const content = fs.readFileSync(configPath, "utf8")
        console.log("📋 Conteúdo do arquivo de configuração:")
        console.log(content.substring(0, 500) + "...")
      } catch (error) {
        console.log("❌ Erro ao ler arquivo:", error.message)
      }
      break
    }
  }

  console.log("\n💡 SOLUÇÃO MANUAL:")
  console.log("1. No MySQL Workbench, clique na conexão 'Santoro'")
  console.log("2. Vá em 'Database' > 'Manage Connections'")
  console.log("3. Anote: Host, Port, Username")
  console.log("4. Teste a senha (se houver)")
  console.log("5. Execute: node server/server.js")
}

// Executar
connectWithWorkbench().catch(console.error)
