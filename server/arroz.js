const fs = require("fs")
const path = require("path")

function fixEnvFile() {
  console.log("=== CORRIGINDO ARQUIVO .ENV COM CONFIGURAÇÕES EXATAS ===\n")

  const envPath = path.join(__dirname, ".env")

  // Configurações exatas do Workbench
  const envContent = `JWT_SECRET=b6203381221684dfc0504aa5bfeaa9e06ed7434ba146f02c54480b45ad785180
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=MYdatabase@2025
DB_NAME=santoros_restaurant
ADMIN_PASSWORD=admin123
PORT=3000`

  fs.writeFileSync(envPath, envContent)

  console.log("✅ Arquivo .env corrigido com configurações exatas:")
  console.log("   Host: 127.0.0.1 (igual ao Workbench)")
  console.log("   Port: 3306")
  console.log("   User: root")
  console.log("   Password: MYdatabase@2025")
  console.log("   Database: santoros_restaurant")

  // Verificar se o arquivo foi criado corretamente
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf8")
    console.log("\n📋 Conteúdo do arquivo .env:")
    console.log(content)
  }

  console.log("\n🚀 Agora execute: node server/server.js")
}

fixEnvFile()
