require("dotenv").config()

async function testRegistration() {
  console.log("=== TESTANDO REGISTRO DE USUÁRIO ===")

  const testUser = {
    name: "fabiano",
    email: "fabiano@exemplo.com",
    password: "senha123456",
    cpf: "12345678901",
    date_birth: "1990-05-15",
  }

  try {
    console.log("📤 Enviando dados de teste:", testUser)

    const response = await fetch("http://localhost:3000/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testUser),
    })

    console.log("📥 Status da resposta:", response.status)

    const data = await response.json()
    console.log("📥 Dados da resposta:", data)

    if (data.success) {
      console.log("✅ TESTE DE REGISTRO BEM-SUCEDIDO!")
      console.log("👤 Usuário criado:", data.user)
    } else {
      console.log("❌ TESTE DE REGISTRO FALHOU!")
      console.log("💬 Mensagem:", data.message)
    }
  } catch (error) {
    console.error("❌ ERRO NO TESTE:", error.message)
  }
}

// Aguardar um pouco para o servidor iniciar
setTimeout(testRegistration, 2000)
