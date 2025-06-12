require("dotenv").config()
const { spawn } = require("child_process")
const path = require("path")

console.log("🚀 Iniciando servidor Santoro's Restaurant...")
console.log("📁 Diretório atual:", __dirname)

// Verificar se o arquivo server.js existe
const serverPath = path.join(__dirname, "server.js")
const fs = require("fs")

if (!fs.existsSync(serverPath)) {
  console.error("❌ Arquivo server.js não encontrado em:", serverPath)
  process.exit(1)
}

// Verificar variáveis de ambiente
console.log("🔧 Verificando configurações...")
console.log("DB_HOST:", process.env.DB_HOST || "localhost")
console.log("DB_PORT:", process.env.DB_PORT || "3306")
console.log("DB_USER:", process.env.DB_USER || "root")
console.log("DB_NAME:", process.env.DB_NAME || "santoros_restaurant")
console.log("PORT:", process.env.PORT || "3000")

// Iniciar o servidor
const serverProcess = spawn("node", ["server.js"], {
  cwd: __dirname,
  stdio: "inherit",
})

serverProcess.on("error", (err) => {
  console.error("❌ Erro ao iniciar servidor:", err)
})

serverProcess.on("exit", (code) => {
  console.log(`🔄 Servidor encerrado com código: ${code}`)
})

// Capturar Ctrl+C para encerrar graciosamente
process.on("SIGINT", () => {
  console.log("\n🛑 Encerrando servidor...")
  serverProcess.kill("SIGINT")
  process.exit(0)
})
