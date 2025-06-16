const { spawn } = require("child_process")
const mysql = require("mysql2/promise")
require("dotenv").config()

async function startServerAndTest() {
  console.log("=== INICIANDO SERVIDOR E TESTANDO RESERVAS ===")

  // Primeiro, verificar se o servidor já está rodando
  try {
    const testResponse = await fetch("http://localhost:3000/api/test")
    if (testResponse.ok) {
      console.log("✅ Servidor já está rodando!")
      await testReservationsAPI()
      return
    }
  } catch (error) {
    console.log("🚀 Servidor não está rodando, iniciando...")
  }

  // Iniciar o servidor
  const serverProcess = spawn("node", ["server/server.js"], {
    stdio: "inherit",
    cwd: process.cwd(),
  })

  console.log("⏳ Aguardando servidor inicializar...")

  // Aguardar alguns segundos para o servidor inicializar
  await new Promise((resolve) => setTimeout(resolve, 5000))

  // Testar a API
  await testReservationsAPI()

  // Manter o servidor rodando
  console.log("\n🚀 Servidor rodando! Pressione Ctrl+C para parar.")
  console.log("🌐 Acesse: http://localhost:3000")
  console.log("📝 Reservas: http://localhost:3000/reservaCompleta.html")

  process.on("SIGINT", () => {
    console.log("\n🛑 Parando servidor...")
    serverProcess.kill()
    process.exit(0)
  })
}

async function testReservationsAPI() {
  console.log("\n=== TESTANDO API DE RESERVAS ===")

  try {
    // Testar se API está respondendo
    console.log("1. Testando se API está ativa...")
    const testResponse = await fetch("http://localhost:3000/api/test")
    const testData = await testResponse.json()
    console.log("✅ API ativa:", testData.message)

    // Testar criação de reserva
    console.log("2. Testando criação de reserva...")
    const reservationData = {
      name: "João Silva",
      email: "joao@email.com",
      phone: "(11) 99999-9999",
      date: "2025-12-25",
      time: "19:30",
      guests: 4,
      specialRequests: "Mesa próxima à janela",
    }

    const response = await fetch("http://localhost:3000/api/reservations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(reservationData),
    })

    const result = await response.json()
    console.log("📡 Status:", response.status)
    console.log("📡 Resposta:", result)

    if (result.success) {
      console.log("✅ Reserva criada com sucesso! ID:", result.reservationId)

      // Verificar no banco se foi salva
      console.log("3. Verificando no banco de dados...")
      const db = await mysql.createConnection({
        host: process.env.DB_HOST || "localhost",
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "",
        database: process.env.DB_NAME || "santoros_restaurant",
      })

      const [reservations] = await db.execute("SELECT * FROM reservations WHERE id = ?", [result.reservationId])

      if (reservations.length > 0) {
        console.log("✅ Reserva encontrada no banco:")
        console.log("   Nome:", reservations[0].name)
        console.log("   Email:", reservations[0].email)
        console.log("   Data:", reservations[0].date)
        console.log("   Horário:", reservations[0].time)
        console.log("   Pessoas:", reservations[0].guests)
        console.log("   Status:", reservations[0].status)
      }

      await db.end()
    } else {
      console.log("❌ Erro ao criar reserva:", result.message)
    }
  } catch (error) {
    console.error("❌ Erro no teste da API:", error.message)
  }
}

startServerAndTest()
