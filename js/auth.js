// Sistema de autenticação integrado com o backend
console.log("🚀 Auth.js iniciando...")

document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 DOM carregado, inicializando auth.js")

  const loginForm = document.getElementById("loginForm")
  const registerForm = document.getElementById("registerForm")

  console.log("📝 Formulários encontrados:", {
    login: !!loginForm,
    register: !!registerForm,
  })

  if (loginForm) {
    console.log("📝 Configurando listener para formulário de login")
    loginForm.addEventListener("submit", handleLogin)
  }

  if (registerForm) {
    console.log("📝 Configurando listener para formulário de registro")
    registerForm.addEventListener("submit", handleRegister)

    // Adicionar listener adicional para debug
    registerForm.onsubmit = (e) => {
      console.log("🔥 FORM SUBMIT INTERCEPTADO!")
      return handleRegister(e)
    }
  }

  // Verificar se o usuário já está logado
  if (
    getSession() &&
    (window.location.pathname.includes("login.html") || window.location.pathname.includes("registro.html"))
  ) {
    console.log("👤 Usuário já logado, redirecionando...")
    window.location.href = "dashboard.html"
  }

  // Atualizar navegação baseada no status de login
  updateNavigation()
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
    // Mostrar estado de carregamento
    const submitBtn = e.target.querySelector('button[type="submit"]')
    const originalText = submitBtn.textContent
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

      // Redirecionar para página principal
      console.log("🚀 Redirecionando para dashboard...")
      window.location.href = "dashboard.html"
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
      submitBtn.textContent = "Entrar"
      submitBtn.disabled = false
    }
  }
}

async function handleRegister(e) {
  console.log("🔥 HANDLE REGISTER CHAMADO!")
  e.preventDefault()
  e.stopPropagation()

  console.log("=== INICIANDO REGISTRO ===")
  console.log("Event target:", e.target)
  console.log("Form elements:", e.target.elements)

  const formData = new FormData(e.target)

  // Log todos os dados do formulário
  console.log("📋 Dados do FormData:")
  for (const [key, value] of formData.entries()) {
    console.log(`  ${key}: ${value}`)
  }

  const registerData = {
    name: formData.get("name"),
    cpf: formData.get("cpf"),
    date_birth: formData.get("nascimento"), // Corrigido para date_birth
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
      const originalText = submitBtn.textContent
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

    console.log("📡 Request body:", {
      ...requestBody,
      password: "[HIDDEN]",
    })

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
      console.log("🚀 Redirecionando para login em 2 segundos...")
      setTimeout(() => {
        console.log("🚀 Executando redirecionamento...")
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

  return false // Prevenir submit padrão
}

function validateRegisterData(data) {
  console.log("🔍 Validando dados do registro...")

  // Verificar campos obrigatórios
  if (!data.name || data.name.trim().length < 2) {
    console.log("❌ Nome inválido")
    showMessage("error-message", "Nome deve ter pelo menos 2 caracteres.", true)
    return false
  }

  // Validar CPF (básico) - opcional
  if (data.cpf && data.cpf.replace(/\D/g, "").length !== 11) {
    console.log("❌ CPF inválido")
    showMessage("error-message", "Por favor, insira um CPF válido (11 dígitos).", true)
    return false
  }

  // Validar formato do email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(data.email)) {
    console.log("❌ Email inválido")
    showMessage("error-message", "Por favor, insira um email válido.", true)
    return false
  }

  // Validar força da senha
  if (!data.password || data.password.length < 8) {
    console.log("❌ Senha muito curta")
    showMessage("error-message", "Senha deve ter pelo menos 8 caracteres.", true)
    return false
  }

  // Verificar confirmação da senha
  if (data.password !== data.confirmPassword) {
    console.log("❌ Senhas não coincidem")
    showMessage("error-message", "As senhas não coincidem.", true)
    return false
  }

  // Verificar aceitação dos termos
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

function logout() {
  clearSession()
  updateNavigation()
  window.location.href = "index.html"
}

function updateNavigation() {
  const session = getSession()
  console.log("🔄 Atualizando navegação. Sessão:", !!session)

  // Encontrar diferentes tipos de navegação
  const navMenu = document.querySelector(".nav-menu") || document.querySelector("#navMenu")
  const desktopMenu = document.querySelector("#desktop-menu")
  const mobileMenu = document.querySelector("#mobile-menu")
  const headerNav = document.querySelector("header nav")

  // Função para atualizar um menu específico
  function updateMenu(menu, isMobile = false) {
    if (!menu) return

    console.log("🔄 Atualizando menu:", menu.className || menu.id)

    // Não remover elementos se estivermos em páginas administrativas
    const currentPage = window.location.pathname
    const isAdminPage =
      currentPage.includes("inicio.html") ||
      currentPage.includes("ReservasServidor.html") ||
      currentPage.includes("ClientesServidor.html")

    if (isAdminPage) {
      console.log("📋 Página administrativa detectada, mantendo navegação admin")
      return // Não modificar navegação em páginas admin
    }

    // Remover botões existentes de dashboard e logout apenas se não estivermos em páginas admin
    const existingDashboard = menu.querySelector(".dashboard-link")
    const existingLogout = menu.querySelector(".logout-btn")
    const existingAdminLinks = menu.querySelectorAll(
      'a[href*="inicio"], a[href*="ReservasServidor"], a[href*="ClientesServidor"]',
    )

    if (existingDashboard) existingDashboard.parentElement?.remove()
    if (existingLogout) existingLogout.parentElement?.remove()
    existingAdminLinks.forEach((link) => link.parentElement?.remove())

    // Encontrar links de login e registro
    const loginLinks = menu.querySelectorAll('a[href*="login"], #loginLink, #mobileLoginLink')
    const registerLinks = menu.querySelectorAll('a[href*="registro"], #registerLink')

    if (session) {
      console.log("👤 Usuário logado:", session.user.type)

      // Usuário logado - esconder login/registro
      loginLinks.forEach((link) => {
        if (link.parentElement) {
          link.parentElement.style.display = "none"
        } else {
          link.style.display = "none"
        }
      })

      registerLinks.forEach((link) => {
        if (link.parentElement) {
          link.parentElement.style.display = "none"
        } else {
          link.style.display = "none"
        }
      })

      // Adicionar links baseados no tipo de usuário
      if (session.user.type === "admin") {
        // Admin - adicionar link para painel administrativo
        const adminItem = document.createElement(menu.tagName === "UL" ? "li" : "a")
        if (menu.tagName === "UL") {
          adminItem.className = "nav-item"
          adminItem.innerHTML = '<a href="inicio.html" class="nav-link admin-panel-link">PAINEL ADMIN</a>'
        } else {
          adminItem.href = "inicio.html"
          adminItem.textContent = "PAINEL ADMIN"
          adminItem.className = "admin-panel-link"
        }
        menu.appendChild(adminItem)
      } else {
        // Usuário comum - adicionar dashboard
        const dashboardItem = document.createElement(menu.tagName === "UL" ? "li" : "a")
        if (menu.tagName === "UL") {
          dashboardItem.className = "nav-item"
          dashboardItem.innerHTML = '<a href="dashboard.html" class="nav-link dashboard-link">DASHBOARD</a>'
        } else {
          dashboardItem.href = "dashboard.html"
          dashboardItem.textContent = "DASHBOARD"
          dashboardItem.className = "dashboard-link"
        }
        menu.appendChild(dashboardItem)
      }

      // Adicionar Logout
      const logoutItem = document.createElement(menu.tagName === "UL" ? "li" : "a")
      if (menu.tagName === "UL") {
        logoutItem.className = "nav-item"
        logoutItem.innerHTML = '<a href="#" class="nav-link logout-btn" style="color: #b91c1c;">SAIR</a>'
      } else {
        logoutItem.href = "#"
        logoutItem.textContent = "SAIR"
        logoutItem.className = "logout-btn"
        logoutItem.style.color = "#b91c1c"
      }

      // Adicionar event listener para logout
      const logoutLink = logoutItem.tagName === "LI" ? logoutItem.querySelector("a") : logoutItem
      logoutLink.addEventListener("click", (e) => {
        e.preventDefault()
        logout()
      })

      menu.appendChild(logoutItem)
    } else {
      // Usuário não logado - mostrar login/registro
      loginLinks.forEach((link) => {
        if (link.parentElement) {
          link.parentElement.style.display = ""
        } else {
          link.style.display = ""
        }
      })

      registerLinks.forEach((link) => {
        if (link.parentElement) {
          link.parentElement.style.display = ""
        } else {
          link.style.display = ""
        }
      })
    }
  }

  // Atualizar todos os menus encontrados
  if (navMenu) updateMenu(navMenu)
  if (desktopMenu) updateMenu(desktopMenu)
  if (mobileMenu) updateMenu(mobileMenu, true)
  if (headerNav && headerNav !== navMenu) updateMenu(headerNav)

  // Configurar logout existente no dashboard
  const existingLogoutBtn = document.getElementById("logoutBtn")
  if (existingLogoutBtn) {
    existingLogoutBtn.addEventListener("click", (e) => {
      e.preventDefault()
      logout()
    })
  }
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
  logout,
  updateNavigation,
  authenticatedFetch,
}

console.log("✅ Auth.js carregado completamente")
