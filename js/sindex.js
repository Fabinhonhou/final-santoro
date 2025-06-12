// Script principal para index.html
console.log("🍝 Santoro's Restaurant - Script.js carregado")

document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 DOM carregado, inicializando script.js")

  // Inicializar funcionalidades básicas
  initializeScrollEffects()
  initializeButtons()

  // Verificar se auth.js está disponível e atualizar navegação
  if (window.auth && typeof window.auth.updateNavigation === "function") {
    window.auth.updateNavigation()
  } else {
    // Fallback básico para navegação
    updateBasicNavigation()
  }
})

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
  const session = localStorage.getItem("userSession")
  const isLoggedIn = session !== null

  const nav = document.querySelector("header nav")
  if (!nav) return

  // Remover links existentes de dashboard/logout
  const existingDashboard = nav.querySelector(".dashboard-link")
  const existingLogout = nav.querySelector(".logout-link")
  if (existingDashboard) existingDashboard.remove()
  if (existingLogout) existingLogout.remove()

  if (isLoggedIn) {
    // Esconder login
    const loginLink = nav.querySelector('a[href*="login"]')
    if (loginLink) loginLink.style.display = "none"

    // Adicionar dashboard e logout
    const dashboardLink = document.createElement("a")
    dashboardLink.href = "dashboard.html"
    dashboardLink.textContent = "DASHBOARD"
    dashboardLink.className = "dashboard-link"

    const logoutLink = document.createElement("a")
    logoutLink.href = "#"
    logoutLink.textContent = "SAIR"
    logoutLink.className = "logout-link"
    logoutLink.style.color = "#b91c1c"
    logoutLink.addEventListener("click", (e) => {
      e.preventDefault()
      localStorage.removeItem("userSession")
      alert("Logout realizado com sucesso!")
      window.location.reload()
    })

    nav.appendChild(dashboardLink)
    nav.appendChild(logoutLink)
  } else {
    // Mostrar login
    const loginLink = nav.querySelector('a[href*="login"]')
    if (loginLink) loginLink.style.display = ""
  }
}

console.log("✅ Script.js inicializado")
