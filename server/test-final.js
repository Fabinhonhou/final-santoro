require("dotenv").config()

async function testFinalLogin() {
  console.log("=== TESTE FINAL DE LOGIN ADMIN ===")

  const adminCredentials = {
    email: "fabitorresrocha@gmail.com",
    password: "SantorosADM123",
  }

  try {
    console.log("📡 Testando com servidor corrigido...")
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
      console.log("🎉 LOGIN DE ADMIN BEM-SUCEDIDO!")
      console.log("🎯 Tipo de usuário:", data.user.type)
      console.log("👤 Nome:", data.user.name)
      console.log("📧 Email:", data.user.email)
      console.log("🔑 Role:", data.user.role)
      console.log("🎫 Token:", data.token.substring(0, 50) + "...")
    } else {
      console.log("❌ LOGIN FALHOU:", data.message)
    }
  } catch (error) {
    console.error("❌ Erro no teste:", error.message)
  }
}

// Aguardar servidor estar rodando
setTimeout(testFinalLogin, 3000)
