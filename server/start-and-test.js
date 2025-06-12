require("dotenv").config()
const { spawn } = require("child_process")
const http = require("http")

async function startServerAndTest() {
  console.log("🚀 Iniciando servidor e testando login admin...")

  // Iniciar servidor
  const serverProcess = spawn("node", ["server.js"], {
    cwd: __dirname,
    stdio: "pipe",
  })

  let serverReady = false

  // Capturar output do servidor
  serverProcess.stdout.on("data", (data) => {
    const output = data.toString()
    console.log("📡 Servidor:", output.trim())

    if (output.includes("Server running on port")) {
      serverReady = true
      console.log("✅ Servidor iniciado, aguardando 2 segundos...")
      setTimeout(testAdminLogin, 2000)
    }
  })

  serverProcess.stderr.on("data", (data) => {
    console.error("❌ Erro do servidor:", data.toString())
  })

  // Função para testar login
  async function testAdminLogin() {
    console.log("\n=== TESTANDO LOGIN DE ADMINISTRADOR ===")

    const adminCredentials = {
      email: "fabitorresrocha@gmail.com",
      password: "SantorosADM123",
    }

    try {
      console.log("📡 Enviando requisição de login...")
      console.log("Email:", adminCredentials.email)

      const response = await fetch("http://localhost:3000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(adminCredentials),
      })

      console.log("📡 Status da resposta:", response.status)

      const data = await response.json()
      console.log("📡 Dados da resposta:", JSON.stringify(data, null, 2))

      if (data.success) {
        console.log("✅ LOGIN DE ADMIN BEM-SUCEDIDO!")
        console.log("🎯 Tipo de usuário:", data.user.type)
        console.log("👤 Nome:", data.user.name)
        console.log("📧 Email:", data.user.email)
        console.log("🔑 Role:", data.user.role)
      } else {
        console.log("❌ LOGIN FALHOU:", data.message)
      }
    } catch (error) {
      console.error("❌ Erro no teste:", error.message)
    } finally {
      // Encerrar servidor
      console.log("\n🛑 Encerrando servidor...")
      serverProcess.kill("SIGTERM")
      process.exit(0)
    }
  }

  // Timeout de segurança
  setTimeout(() => {
    if (!serverReady) {
      console.log("⏰ Timeout - servidor não iniciou a tempo")
      serverProcess.kill("SIGTERM")
      process.exit(1)
    }
  }, 10000)
}

startServerAndTest().catch(console.error)
