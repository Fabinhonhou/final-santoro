require("dotenv").config()
const mysql = require("mysql2/promise")
const fs = require("fs")
const path = require("path")

async function diagnoseSystem() {
  console.log("🔍 DIAGNÓSTICO COMPLETO DO SISTEMA")
  console.log("=====================================\n")

  // 1. Verificar arquivos essenciais
  console.log("📁 1. VERIFICANDO ARQUIVOS...")
  const essentialFiles = ["server.js", "package.json", ".env"]

  for (const file of essentialFiles) {
    const filePath = path.join(__dirname, file)
    if (fs.existsSync(filePath)) {
      console.log(`   ✅ ${file} - OK`)
    } else {
      console.log(`   ❌ ${file} - FALTANDO`)
    }
  }

  // 2. Verificar dependências
  console.log("\n📦 2. VERIFICANDO DEPENDÊNCIAS...")
  try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, "package.json"), "utf8"))
    const nodeModulesPath = path.join(__dirname, "node_modules")

    if (fs.existsSync(nodeModulesPath)) {
      console.log("   ✅ node_modules existe")

      const requiredDeps = ["express", "mysql2", "bcrypt", "jsonwebtoken", "cors", "dotenv"]
      for (const dep of requiredDeps) {
        const depPath = path.join(nodeModulesPath, dep)
        if (fs.existsSync(depPath)) {
          console.log(`   ✅ ${dep} - instalado`)
        } else {
          console.log(`   ❌ ${dep} - FALTANDO`)
        }
      }
    } else {
      console.log("   ❌ node_modules não existe - execute: npm install")
    }
  } catch (error) {
    console.log("   ❌ Erro ao verificar package.json:", error.message)
  }

  // 3. Verificar configurações do banco
  console.log("\n🗄️ 3. VERIFICANDO BANCO DE DADOS...")
  try {
    const dbConfig = {
      host: process.env.DB_HOST || "localhost",
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "santoros_restaurant",
    }

    console.log("   Configurações:")
    console.log(`   - Host: ${dbConfig.host}`)
    console.log(`   - Port: ${dbConfig.port}`)
    console.log(`   - User: ${dbConfig.user}`)
    console.log(`   - Database: ${dbConfig.database}`)

    // Tentar conectar
    const connection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
    })

    console.log("   ✅ Conexão MySQL - OK")

    // Verificar se o banco existe
    const [databases] = await connection.execute("SHOW DATABASES")
    const dbExists = databases.some((db) => Object.values(db)[0] === dbConfig.database)

    if (dbExists) {
      console.log(`   ✅ Banco "${dbConfig.database}" existe`)
    } else {
      console.log(`   ⚠️ Banco "${dbConfig.database}" não existe - será criado automaticamente`)
    }

    await connection.end()
  } catch (error) {
    console.log("   ❌ Erro de conexão MySQL:", error.message)
    console.log("   💡 Verifique se o MySQL está rodando e as credenciais estão corretas")
  }

  // 4. Verificar porta
  console.log("\n🌐 4. VERIFICANDO PORTA...")
  const net = require("net")
  const port = process.env.PORT || 3000

  const server = net.createServer()

  server.listen(port, () => {
    console.log(`   ✅ Porta ${port} está disponível`)
    server.close()
  })

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.log(`   ⚠️ Porta ${port} já está em uso`)
      console.log("   💡 Outro processo pode estar usando a porta")
    } else {
      console.log(`   ❌ Erro na porta ${port}:`, err.message)
    }
  })

  console.log("\n🎯 RESUMO:")
  console.log("Para iniciar o servidor:")
  console.log("1. cd server")
  console.log("2. npm install (se necessário)")
  console.log("3. npm start")
  console.log("\nPara testar a API:")
  console.log("4. node test-registration.js")
}

diagnoseSystem().catch(console.error)
