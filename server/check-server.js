
const http = require("http")

function checkServer() {
  console.log("🔍 Verificando se o servidor está rodando...")

  const options = {
    hostname: "localhost",
    port: 3000,
    path: "/api/test",
    method: "GET",
    timeout: 5000,
  }

  const req = http.request(options, (res) => {
    console.log("✅ Servidor está rodando!")
    console.log("Status:", res.statusCode)

    let data = ""
    res.on("data", (chunk) => {
      data += chunk
    })

    res.on("end", () => {
      console.log("Resposta:", data)
    })
  })

  req.on("error", (err) => {
    console.log("❌ Servidor NÃO está rodando!")
    console.log("Erro:", err.message)
    console.log("\n💡 Para iniciar o servidor:")
    console.log("1. cd server")
    console.log("2. npm start")
  })

  req.on("timeout", () => {
    console.log("⏰ Timeout - servidor pode estar lento")
    req.destroy()
  })

  req.end()
}

checkServer()
