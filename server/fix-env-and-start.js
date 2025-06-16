const fs = require("fs")
const path = require("path")
require("dotenv").config()

async function fixEnvAndStart() {
  console.log("=== VERIFICANDO E CORRIGINDO CONFIGURAÇÕES ===")

  // Verificar se arquivo .env existe
  const envPath = path.join(__dirname, ".env")
  console.log("📁 Verificando arquivo .env em:", envPath)

  if (!fs.existsSync(envPath)) {
    console.log("❌ Arquivo .env não encontrado!")
    console.log("🔧 Criando arquivo .env...")

    const envContent = `JWT_SECRET=b6203381221684dfc0504aa5bfeaa9e06ed7434ba146f02c54480b45ad785180
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=MYdatabase@2025
DB_NAME=santoros_restaurant
ADMIN_PASSWORD=admin123
PORT=3000`

    fs.writeFileSync(envPath, envContent)
    console.log("✅ Arquivo .env criado com sucesso!")
  } else {
    console.log("✅ Arquivo .env encontrado")
  }

  // Verificar variáveis de ambiente
  console.log("\n📋 Verificando variáveis de ambiente:")
  console.log("DB_HOST:", process.env.DB_HOST || "❌ NÃO DEFINIDO")
  console.log("DB_PORT:", process.env.DB_PORT || "❌ NÃO DEFINIDO")
  console.log("DB_USER:", process.env.DB_USER || "❌ NÃO DEFINIDO")
  console.log("DB_PASSWORD:", process.env.DB_PASSWORD ? "✅ DEFINIDO" : "❌ NÃO DEFINIDO")
  console.log("DB_NAME:", process.env.DB_NAME || "❌ NÃO DEFINIDO")

  // Testar conexão com MySQL
  console.log("\n🔍 Testando conexão com MySQL...")
  try {
    const mysql = require("mysql2/promise")

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
    })

    console.log("✅ Conexão com MySQL bem-sucedida!")
    await connection.end()

    // Iniciar servidor
    console.log("\n🚀 Iniciando servidor...")
    require("./server.js")
  } catch (error) {
    console.error("❌ Erro na conexão com MySQL:", error.message)
    console.log("\n🔧 SOLUÇÕES POSSÍVEIS:")
    console.log("1. Verifique se o MySQL está rodando:")
    console.log("   - Windows: Abra 'Serviços' e procure por 'MySQL'")
    console.log("   - Ou execute: net start mysql")
    console.log("\n2. Verifique a senha do MySQL:")
    console.log("   - A senha atual no .env é: MYdatabase@2025")
    console.log("   - Se for diferente, edite o arquivo server/.env")
    console.log("\n3. Se não souber a senha, execute:")
    console.log("   mysql -u root -p")
    console.log("   E digite a senha quando solicitado")
  }
}

fixEnvAndStart()
