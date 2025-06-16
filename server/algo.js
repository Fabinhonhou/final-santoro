require("dotenv").config()
const { spawn } = require("child_process")
const fetch = require("node-fetch")

async function startServerAndTest() {
  console.log("=== INICIANDO SERVIDOR FINAL ===\n")

  // Verificar se o arquivo .env existe
  const fs = require("fs")
  const path = require("path")
  const envPath = path.join(__dirname, ".env")

  if (!fs.existsSync(envPath)) {
    console.log("❌ Arquivo .env não encontrado!")
    console.log("💡 Execute primeiro: node server/connect-with-password.js")
    return
  }

  console.log("✅ Arquivo .env encontrado")

  // Iniciar servidor
  console.log("🚀 Iniciando servidor...")
  const serverProcess = spawn("node", ["server/server.js"], {
    stdio: "inherit",
    shell: true,
  })

  // Aguardar servidor inicializar
  console.log("⏳ Aguardando servidor inicializar...")
  await new Promise((resolve) => setTimeout(resolve, 5000))

  // Testar se servidor está rodando
  try {
    console.log("🔍 Testando se servidor está ativo...")
    const response = await fetch("http://localhost:3000/api/test")
    const data = await response.json()

    if (data.success) {
      console.log("✅ Servidor está funcionando!")
      console.log("🌐 Acesse: http://localhost:3000")
      console.log("📝 Reservas: http://localhost:3000/reservaCompleta.html")
      console.log("🔐 Login: http://localhost:3000/login.html")
      console.log("👨‍💼 Admin: admin@santoros.com / admin123")

      // Testar API de reservas
      console.log("\n📋 Testando API de reservas...")
      const reservationData = {
        name: "Teste Servidor",
        email: "teste@servidor.com",
        phone: "(11) 99999-9999",
        date: "2025-12-25",
        time: "19:00",
        guests: 2,
        specialRequests: "Teste final do servidor",
      }

      const reservationResponse = await fetch("http://localhost:3000/api/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reservationData),
      })

      const reservationResult = await reservationResponse.json()

      if (reservationResult.success) {
        console.log("✅ API de reservas funcionando!")
        console.log(`📝 Reserva criada com ID: ${reservationResult.reservationId}`)
      } else {
        console.log("❌ Erro na API de reservas:", reservationResult.message)
      }

      console.log("\n🎉 TUDO PRONTO!")
      console.log("🌐 Abra seu navegador em: http://localhost:3000/reservaCompleta.html")
      console.log("⚠️ Pressione Ctrl+C para parar o servidor")
    } else {
      console.log("❌ Servidor não está respondendo corretamente")
    }
  } catch (error) {
    console.log("❌ Erro ao testar servidor:", error.message)
    console.log("💡 Tente executar manualmente: node server/server.js")
  }
}

startServerAndTest()
