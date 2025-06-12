document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm")
  const registerForm = document.getElementById("registerForm")

  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin)
  }

  if (registerForm) {
    registerForm.addEventListener("submit", handleRegister)
  }

  // Check if user is already logged in and redirect
  if (
    getSession() &&
    (window.location.pathname.includes("login.html") || window.location.pathname.includes("register.html"))
  ) {
    window.location.href = "dashboard.html"
  }
})

async function handleLogin(e) {
  e.preventDefault()

  console.log("=== INICIANDO LOGIN ===")

  const formData = new FormData(e.target)
  const loginData = {
    email: formData.get("email"),
    password: formData.get("password"),
  }

  console.log("Dados do login:", { email: loginData.email, password: "[HIDDEN]" })

  try {
    // Show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]')
    const originalText = submitBtn.textContent
    submitBtn.textContent = "Entrando..."
    submitBtn.disabled = true

    // Hide previous error messages
    hideMessage("error-message")

    console.log("Enviando para API de login...")

    const response = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(loginData),
    })

    console.log("Status da resposta:", response.status)

    const responseData = await response.json()
    console.log("Dados da resposta:", responseData)

    if (!response.ok) {
      throw new Error(responseData.message || "Erro no login")
    }

    if (responseData.success) {
      // Store session data
      console.log("✅ Login bem-sucedido, salvando sessão...")
      setSession({
        user: responseData.user,
        token: responseData.token,
      })

      // Redirect to dashboard
      window.location.href = "dashboard.html"
    } else {
      throw new Error(responseData.message || "Login falhou")
    }
  } catch (error) {
    console.error("❌ Erro no login:", error)
    showMessage("error-message", error.message, true)
  } finally {
    // Reset button state
    const submitBtn = e.target.querySelector('button[type="submit"]')
    if (submitBtn) {
      submitBtn.textContent = "Login"
      submitBtn.disabled = false
    }
  }
}

async function handleRegister(e) {
  e.preventDefault()

  console.log("=== INICIANDO REGISTRO ===")

  const formData = new FormData(e.target)
  const registerData = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    acceptTerms: formData.get("acceptTerms"),
  }

  console.log("Dados do registro:", {
    name: registerData.name,
    email: registerData.email,
    password: "[HIDDEN]",
    confirmPassword: "[HIDDEN]",
    acceptTerms: registerData.acceptTerms,
  })

  // Validate form data
  if (!validateRegisterData(registerData)) {
    console.log("❌ Validação do registro falhou")
    return
  }

  try {
    // Show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]')
    const originalText = submitBtn.textContent
    submitBtn.textContent = "Criando Conta..."
    submitBtn.disabled = true

    // Hide previous messages
    hideMessage("error-message")
    hideMessage("success-message")

    console.log("Enviando para API de registro...")

    const response = await fetch("/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: registerData.name,
        email: registerData.email,
        password: registerData.password,
      }),
    })

    console.log("Status da resposta:", response.status)

    const responseData = await response.json()
    console.log("Dados da resposta:", responseData)

    if (!response.ok) {
      throw new Error(responseData.message || "Erro no registro")
    }

    if (responseData.success) {
      // Show success message
      console.log("✅ Registro bem-sucedido!")
      showMessage("success-message")

      // Hide form
      e.target.style.display = "none"

      // Redirect to login after 3 seconds
      setTimeout(() => {
        window.location.href = "login.html"
      }, 3000)
    } else {
      throw new Error(responseData.message || "Registro falhou")
    }
  } catch (error) {
    console.error("❌ Erro no registro:", error)
    showMessage("error-message", error.message, true)
  } finally {
    // Reset button state
    const submitBtn = e.target.querySelector('button[type="submit"]')
    if (submitBtn) {
      submitBtn.textContent = "Create Account"
      submitBtn.disabled = false
    }
  }
}

function validateRegisterData(data) {
  console.log("Validando dados do registro...")

  // Check required fields
  if (!data.name || data.name.trim().length < 2) {
    console.log("❌ Nome inválido")
    showMessage("error-message", "Nome deve ter pelo menos 2 caracteres.", true)
    return false
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(data.email)) {
    console.log("❌ Email inválido")
    showMessage("error-message", "Por favor, insira um email válido.", true)
    return false
  }

  // Validate password strength
  if (data.password.length < 8) {
    console.log("❌ Senha muito curta")
    showMessage("error-message", "Senha deve ter pelo menos 8 caracteres.", true)
    return false
  }

  // Check password confirmation
  if (data.password !== data.confirmPassword) {
    console.log("❌ Senhas não coincidem")
    showMessage("error-message", "As senhas não coincidem.", true)
    return false
  }

  // Check terms acceptance
  if (!data.acceptTerms) {
    console.log("❌ Termos não aceitos")
    showMessage("error-message", "Você deve aceitar os termos e condições.", true)
    return false
  }

  console.log("✅ Validação do registro passou")
  return true
}

function getSession() {
  const session = localStorage.getItem("userSession")
  return session ? JSON.parse(session) : null
}

function setSession(userData) {
  localStorage.setItem("userSession", JSON.stringify(userData))
}

function clearSession() {
  localStorage.removeItem("userSession")
}

function isLoggedIn() {
  return getSession() !== null
}

function hideMessage(messageId) {
  const messageElement = document.getElementById(messageId)
  if (messageElement) {
    messageElement.style.display = "none"
  }
}

function showMessage(messageId, messageText = "", isError = false) {
  const messageElement = document.getElementById(messageId)
  if (messageElement) {
    messageElement.style.display = "block"

    if (messageText) {
      const messageTextElement = messageElement.querySelector("p")
      if (messageTextElement) {
        messageTextElement.textContent = messageText
      }
    }

    // Auto-hide success messages after 5 seconds
    if (!isError) {
      setTimeout(() => {
        messageElement.style.display = "none"
      }, 5000)
    }
  }
}