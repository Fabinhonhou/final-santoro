// Script principal para todas as páginas
console.log("🍝 Santoro's Restaurant - Main.js carregado")

document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 DOM carregado, inicializando main.js")

  // Inicializar funcionalidades básicas
  initializeNavigation()
  initializeScrollEffects()
  initializeButtons()

  // Aguardar um pouco para garantir que auth.js carregou
  setTimeout(() => {
    // Verificar se auth.js está disponível e atualizar navegação
    if (window.auth && typeof window.auth.updateNavigation === "function") {
      console.log("🔄 Atualizando navegação via auth.js")
      window.auth.updateNavigation()
    } else {
      console.log("⚠️ Auth.js não disponível, usando fallback")
      updateBasicNavigation()
    }
  }, 100)
})

function initializeNavigation() {
  console.log("🧭 Inicializando navegação...")

  // Menu mobile
  const hamburger = document.getElementById("hamburger")
  const navMenu = document.getElementById("navMenu")

  if (hamburger && navMenu) {
    console.log("📱 Configurando menu mobile")
    hamburger.addEventListener("click", () => {
      hamburger.classList.toggle("active")
      navMenu.classList.toggle("active")
      console.log("📱 Menu mobile toggled")
    })

    // Fechar menu ao clicar em um link
    const navLinks = navMenu.querySelectorAll(".nav-link")
    navLinks.forEach((link) => {
      link.addEventListener("click", () => {
        hamburger.classList.remove("active")
        navMenu.classList.remove("active")
      })
    })
  } else {
    console.log("⚠️ Elementos do menu mobile não encontrados")
  }
}

function initializeScrollEffects() {
  // Efeitos de scroll suaves
  const links = document.querySelectorAll('a[href^="#"]')

  links.forEach((link) => {
    link.addEventListener("click", function (e) {
      const href = this.getAttribute("href")
      if (href === "#") return

      const target = document.querySelector(href)
      if (target) {
        e.preventDefault()
        target.scrollIntoView({
          behavior: "smooth",
        })
      }
    })
  })
}

function initializeButtons() {
  // Configurar botões da página inicial
  const reservaBtn = document.querySelector(".btn.red")
  const cardapioBtn = document.querySelector(".btn.beige")

  if (reservaBtn) {
    reservaBtn.addEventListener("click", (e) => {
      e.preventDefault()
      window.location.href = "reservas.html"
    })
  }

  if (cardapioBtn) {
    cardapioBtn.addEventListener("click", (e) => {
      e.preventDefault()
      window.location.href = "cardapio.html"
    })
  }
}

function updateBasicNavigation() {
  console.log("🔄 Atualizando navegação básica...")

  const session = localStorage.getItem("userSession")
  const isLoggedIn = session !== null

  const navMenu = document.getElementById("navMenu")
  if (!navMenu) {
    console.log("⚠️ NavMenu não encontrado para navegação básica")
    return
  }

  // Remover links existentes de dashboard/logout
  const existingDashboard = navMenu.querySelector(".dashboard-link")
  const existingLogout = navMenu.querySelector(".logout-link")
  if (existingDashboard) existingDashboard.parentElement.remove()
  if (existingLogout) existingLogout.parentElement.remove()

  const loginLink = document.getElementById("loginLink")
  const registerLink = document.getElementById("registerLink")

  if (isLoggedIn) {
    console.log("👤 Usuário logado - navegação básica")

    // Esconder login e registro
    if (loginLink) loginLink.style.display = "none"
    if (registerLink) registerLink.style.display = "none"

    // Adicionar dashboard e logout
    const dashboardItem = document.createElement("li")
    dashboardItem.className = "nav-item"
    dashboardItem.innerHTML = '<a href="dashboard.html" class="nav-link dashboard-link">DASHBOARD</a>'

    const logoutItem = document.createElement("li")
    logoutItem.className = "nav-item"
    logoutItem.innerHTML = '<a href="#" class="nav-link logout-link" style="color: #b91c1c;">SAIR</a>'

    logoutItem.querySelector("a").addEventListener("click", (e) => {
      e.preventDefault()
      localStorage.removeItem("userSession")
      console.log("🚪 Logout realizado")
      window.location.reload()
    })

    navMenu.appendChild(dashboardItem)
    navMenu.appendChild(logoutItem)
  } else {
    console.log("👤 Usuário não logado - navegação básica")

    // Mostrar login e registro
    if (loginLink) loginLink.style.display = ""
    if (registerLink) registerLink.style.display = ""
  }
}

// Função de logout global
function logout() {
  if (window.auth && typeof window.auth.logout === "function") {
    window.auth.logout()
  } else {
    localStorage.removeItem("userSession")
    console.log("🚪 Logout realizado via fallback")
    window.location.href = "index.html"
  }
}

// Exportar para uso global
window.logout = logout

console.log("✅ Main.js inicializado com sucesso")
