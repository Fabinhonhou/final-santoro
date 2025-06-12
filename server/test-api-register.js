const fetch = require("node-fetch")

async function testRegisterAPI() {
  console.log("🧪 Testando API de registro...")

  const testUser = {
    name: "Usuário de Teste",
    email: `teste${Date.now()}@example.com`, // Email único para evitar conflitos
    password: "senha123456",
    cpf: "123.456.789-00",
    date_birth: "1990-01-01",
  }

  console.log("📝 Dados de teste:", {
    ...testUser,
    password: "[OCULTO]",
  })

  try {
    const response = await fetch("http://localhost:3000/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testUser),
    })

    const data = await response.json()
    console.log("📡 Status da resposta:", response.status)
    console.log("📡 Dados da resposta:", data)

    if (data.success) {
      console.log("✅ Teste bem-sucedido! Usuário criado com ID:", data.userId)
    } else {
      console.error("❌ Teste falhou:", data.message)
    }
  } catch (error) {
    console.error("❌ Erro ao testar API:", error)
  }
}

testRegisterAPI()
