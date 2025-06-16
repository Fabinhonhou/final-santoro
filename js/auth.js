// Sistema de autenticação integrado com o backend - VERSÃO CORRIGIDA
console.log("🚀 Auth.js iniciando...")

document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 DOM carregado, inicializando auth.js")

  const loginForm = document.getElementById("loginForm")
  const registerForm = document.getElementById("registerForm")
  const adminLoginForm = document.getElementById("adminLoginForm")

  console.log("📝 Formulários encontrados:", {
    login: !!loginForm,
    register: !!registerForm,
    adminLogin: !!adminLoginForm,
  })

  if (loginForm) {
    console.log("📝 Configurando listener para formulário de login")
    loginForm.addEventListener("submit", handleLogin)
  }

  if (adminLoginForm) {
    console.log("📝 Configurando listener para formulário de admin")
    adminLoginForm.addEventListener("submit", handleAdminLogin)
  }

  if (registerForm) {
    console.log("📝 Configurando listener para formulário de registro")
    registerForm.addEventListener("submit", handleRegister)
  }

  // Verificar se o usuário já está logado
  const session = getSession()
  if (session) {
    const currentPage = window.location.pathname

    // Se está em página de login/registro e já está logado, redirecionar
    if (currentPage.includes("login.html") || currentPage.includes("registro.html")) {
      console.log("👤 Usuário já logado, redirecionando...")

      if (session.user.type === "admin") {
        window.location.href = "inicio.html"
      } else {
        window.location.href = "dashboard.html"
      }
    }
  }

  // Atualizar navegação baseada no status de login
  updateNavigation()
})

async function handleLogin(e) {
  e.preventDefault()

  console.log("=== INICIANDO LOGIN DE USUÁRIO ===")

  const formData = new FormData(e.target)
  const loginData = {
    email: formData.get("email"),
    password: formData.get("password"),
  }

  console.log("Dados do login:", { email: loginData.email, password: "[HIDDEN]" })

  let originalText = "" // Declare originalText variable here
  try {
    // Mostrar estado de carregamento
    const submitBtn = e.target.querySelector('button[type="submit"]')
    originalText = submitBtn.textContent
    submitBtn.textContent = "Entrando..."
    submitBtn.disabled = true

    // Esconder mensagens de erro anteriores
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
      // Armazenar dados da sessão
      console.log("✅ Login bem-sucedido, salvando sessão...")
      setSession({
        user: responseData.user,
        token: responseData.token,
      })

      // Atualizar navegação
      updateNavigation()

      // Redirecionar baseado no tipo de usuário
      console.log("🚀 Redirecionando usuário...")
      if (responseData.user.type === "admin") {
        window.location.href = "inicio.html"
      } else {
        window.location.href = "dashboard.html"
      }
    } else {
      throw new Error(responseData.message || "Login falhou")
    }
  } catch (error) {
    console.error("❌ Erro no login:", error)
    showMessage("error-message", error.message, true)
  } finally {
    // Resetar estado do botão
    const submitBtn = e.target.querySelector('button[type="submit"]')
    if (submitBtn) {
      submitBtn.textContent = originalText
      submitBtn.disabled = false
    }
  }
}

async function handleAdminLogin(e) {
  e.preventDefault()

  console.log("=== INICIANDO LOGIN DE ADMINISTRADOR ===")

  const formData = new FormData(e.target)
  const loginData = {
    email: formData.get("email"),
    password: formData.get("password"),
  }

  console.log("Dados do login admin:", { email: loginData.email, password: "[HIDDEN]" })

  let originalText = "" // Declare originalText variable here
  try {
    // Mostrar estado de carregamento
    const submitBtn = e.target.querySelector('button[type="submit"]')
    originalText = submitBtn.textContent
    submitBtn.textContent = "Verificando..."
    submitBtn.disabled = true

    // Esconder mensagens de erro anteriores
    hideMessage("error-message")

    console.log("Enviando para API de login admin...")

    const response = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(loginData),
    })

    console.log("Status da resposta admin:", response.status)

    const responseData = await response.json()
    console.log("Dados da resposta admin:", responseData)

    if (!response.ok) {
      throw new Error(responseData.message || "Erro no login")
    }

    if (responseData.success && responseData.user.type === "admin") {
      // Armazenar dados da sessão
      console.log("✅ Login de admin bem-sucedido, salvando sessão...")
      setSession({
        user: responseData.user,
        token: responseData.token,
      })

      // Atualizar navegação
      updateNavigation()

      // Redirecionar para inicio.html
      console.log("🚀 Redirecionando admin para inicio.html...")
      window.location.href = "inicio.html"
    } else {
      throw new Error("Acesso administrativo negado")
    }
  } catch (error) {
    console.error("❌ Erro no login admin:", error)
    showMessage("error-message", error.message, true)
  } finally {
    // Resetar estado do botão
    const submitBtn = e.target.querySelector('button[type="submit"]')
    if (submitBtn) {
      submitBtn.textContent = originalText
      submitBtn.disabled = false
    }
  }
}

async function handleRegister(e) {
  console.log("🔥 HANDLE REGISTER CHAMADO!")
  e.preventDefault()
  e.stopPropagation()

  console.log("=== INICIANDO REGISTRO ===")

  const formData = new FormData(e.target)
  const registerData = {
    name: formData.get("name"),
    cpf: formData.get("cpf"),
    date_birth: formData.get("nascimento"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    acceptTerms: formData.get("acceptTerms"),
  }

  console.log("Dados do registro processados:", {
    name: registerData.name,
    cpf: registerData.cpf,
    date_birth: registerData.date_birth,
    email: registerData.email,
    password: registerData.password ? "[HIDDEN]" : "VAZIO",
    confirmPassword: registerData.confirmPassword ? "[HIDDEN]" : "VAZIO",
    acceptTerms: registerData.acceptTerms,
  })

  // Validar dados do formulário
  if (!validateRegisterData(registerData)) {
    console.log("❌ Validação do registro falhou")
    return false
  }

  try {
    // Mostrar estado de carregamento
    const submitBtn = e.target.querySelector('button[type="submit"]')
    if (submitBtn) {
      submitBtn.textContent = "Criando Conta..."
      submitBtn.disabled = true
    }

    // Esconder mensagens anteriores
    hideMessage("error-message")
    hideMessage("success-message")

    console.log("📡 Enviando para API de registro...")

    const requestBody = {
      name: registerData.name,
      cpf: registerData.cpf,
      date_birth: registerData.date_birth,
      email: registerData.email,
      password: registerData.password,
    }

    const response = await fetch("/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    })

    console.log("📡 Status da resposta:", response.status)

    const responseData = await response.json()
    console.log("📡 Dados da resposta:", responseData)

    if (!response.ok) {
      throw new Error(responseData.message || "Erro no registro")
    }

    if (responseData.success) {
      // Mostrar mensagem de sucesso
      console.log("✅ Registro bem-sucedido!")
      showMessage("success-message", "Conta criada com sucesso! Redirecionando para login...")

      // Esconder formulário
      e.target.style.display = "none"

      // Redirecionar para login após 2 segundos
      setTimeout(() => {
        window.location.href = "login.html"
      }, 2000)
    } else {
      throw new Error(responseData.message || "Registro falhou")
    }
  } catch (error) {
    console.error("❌ Erro no registro:", error)
    showMessage("error-message", error.message, true)
  } finally {
    // Resetar estado do botão
    const submitBtn = e.target.querySelector('button[type="submit"]')
    if (submitBtn) {
      submitBtn.textContent = "Criar Conta"
      submitBtn.disabled = false
    }
  }

  return false
}

function validateRegisterData(data) {
  console.log("🔍 Validando dados do registro...")

  if (!data.name || data.name.trim().length < 2) {
    showMessage("error-message", "Nome deve ter pelo menos 2 caracteres.", true)
    return false
  }

  if (data.cpf && data.cpf.replace(/\D/g, "").length !== 11) {
    showMessage("error-message", "Por favor, insira um CPF válido (11 dígitos).", true)
    return false
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(data.email)) {
    showMessage("error-message", "Por favor, insira um email válido.", true)
    return false
  }

  if (!data.password || data.password.length < 8) {
    showMessage("error-message", "Senha deve ter pelo menos 8 caracteres.", true)
    return false
  }

  if (data.password !== data.confirmPassword) {
    showMessage("error-message", "As senhas não coincidem.", true)
    return false
  }

  if (!data.acceptTerms) {
    showMessage("error-message", "Você deve aceitar os termos e condições.", true)
    return false
  }

  console.log("✅ Validação do registro passou")
  return true
}

function getSession() {
  try {
    const session = localStorage.getItem("userSession")
    return session ? JSON.parse(session) : null
  } catch (error) {
    console.error("Erro ao recuperar sessão:", error)
    return null
  }
}

function setSession(userData) {
  try {
    localStorage.setItem("userSession", JSON.stringify(userData))
    console.log("✅ Sessão salva:", userData)
  } catch (error) {
    console.error("Erro ao salvar sessão:", error)
  }
}

function clearSession() {
  localStorage.removeItem("userSession")
  console.log("🗑️ Sessão removida")
}

function isLoggedIn() {
  return getSession() !== null
}

function isAdmin() {
  const session = getSession()
  return session && session.user && session.user.type === "admin"
}

function isUser() {
  const session = getSession()
  return session && session.user && session.user.type === "user"
}

function logout() {
  console.log("🚪 Fazendo logout...")
  clearSession()
  updateNavigation()

  // Redirecionar baseado na página atual
  const currentPage = window.location.pathname
  if (currentPage.includes("inicio.html") || currentPage.includes("admin") || currentPage.includes("dashboard.html")) {
    window.location.href = "index.html"
  } else {
    window.location.reload()
  }
}

function updateNavigation() {
  const session = getSession()
  console.log("🔄 Atualizando navegação. Sessão:", session ? "Logado" : "Não logado")

  // Encontrar a navbar
  const navMenu = document.querySelector(".nav-menu") || document.querySelector("#navMenu")

  if (!navMenu) {
    console.log("⚠️ Navbar não encontrada")
    return
  }

  console.log("✅ Navbar encontrada, atualizando...")

  // Remover botões existentes de dashboard, admin e logout
  const existingDashboard = navMenu.querySelector(".dashboard-link")
  const existingAdmin = navMenu.querySelector(".admin-link")
  const existingLogout = navMenu.querySelector(".logout-btn")

  if (existingDashboard) existingDashboard.parentElement.remove()
  if (existingAdmin) existingAdmin.parentElement.remove()
  if (existingLogout) existingLogout.parentElement.remove()

  // Encontrar links de login e registro
  const loginLink = navMenu.querySelector("#loginLink") || navMenu.querySelector('a[href*="login"]')
  const registerLink = navMenu.querySelector("#registerLink") || navMenu.querySelector('a[href*="registro"]')

  if (session && session.user) {
    console.log("👤 Usuário logado:", session.user.type)

    // Esconder login/registro
    if (loginLink) loginLink.style.display = "none"
    if (registerLink) registerLink.style.display = "none"

    // Adicionar links baseados no tipo de usuário
    if (session.user.type === "admin") {
      // Para administradores
      const adminItem = document.createElement("li")
      adminItem.className = "nav-item"
      adminItem.innerHTML = '<a href="inicio.html" class="nav-link admin-link">PAINEL ADMIN</a>'
      navMenu.appendChild(adminItem)
    } else {
      // Para usuários normais
      const dashboardItem = document.createElement("li")
      dashboardItem.className = "nav-item"
      dashboardItem.innerHTML = '<a href="dashboard.html" class="nav-link dashboard-link">DASHBOARD</a>'
      navMenu.appendChild(dashboardItem)
    }

    // Adicionar Logout para ambos
    const logoutItem = document.createElement("li")
    logoutItem.className = "nav-item"
    logoutItem.innerHTML = '<a href="#" class="nav-link logout-btn" style="color: #b91c1c;">SAIR</a>'

    // Adicionar event listener para logout
    const logoutLink = logoutItem.querySelector("a")
    logoutLink.addEventListener("click", (e) => {
      e.preventDefault()
      logout()
    })

    navMenu.appendChild(logoutItem)
  } else {
    console.log("👤 Usuário não logado")

    // Mostrar login/registro
    if (loginLink) loginLink.style.display = ""
    if (registerLink) registerLink.style.display = ""
  }

  console.log("✅ Navegação atualizada com sucesso")
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
      } else {
        messageElement.innerHTML = `<p>${messageText}</p>`
      }
    }

    // Auto-esconder mensagens de sucesso após 5 segundos
    if (!isError) {
      setTimeout(() => {
        messageElement.style.display = "none"
      }, 5000)
    }
  }
}

// Função para fazer requisições autenticadas
async function authenticatedFetch(url, options = {}) {
  const session = getSession()
  if (session && session.token) {
    options.headers = {
      ...options.headers,
      Authorization: `Bearer ${session.token}`,
    }
  }
  return fetch(url, options)
}

// Exportar funções para uso global
window.auth = {
  getSession,
  setSession,
  clearSession,
  isLoggedIn,
  isAdmin,
  isUser,
  logout,
  updateNavigation,
  authenticatedFetch,
}

console.log("✅ Auth.js carregado completamente")
