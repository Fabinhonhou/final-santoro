require("dotenv").config()

async function testAdminLogin() {
  console.log("=== TESTANDO LOGIN DE ADMINISTRADOR ===")

  const adminCredentials = {
    email: "fabitorresrocha@gmail.com",
    password: "SantorosADM123",
  }

  try {
    console.log("📡 Enviando requisição de login...")
    console.log("Email:", adminCredentials.email)
    console.log("Senha:", adminCredentials.password)

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
      console.log("Token:", data.token)
      console.log("Usuário:", data.user)
    } else {
      console.log("❌ LOGIN FALHOU:", data.message)
    }
  } catch (error) {
    console.error("❌ Erro no teste:", error.message)
  }
}

// Aguardar servidor estar rodando
setTimeout(testAdminLogin, 2000)
