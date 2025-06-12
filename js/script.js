// Script principal para index.html
console.log("🍝 Santoro's Restaurant - Script.js carregado")

document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 DOM carregado, inicializando script.js")

  // Inicializar funcionalidades básicas
  initializeScrollEffects()
  initializeButtons()
  initializeNavigation()

  // Verificar se auth.js está disponível e atualizar navegação
  if (window.auth && typeof window.auth.updateNavigation === "function") {
    window.auth.updateNavigation()
  }
})

function initializeNavigation() {
  // Configurar menu mobile
  const hamburger = document.getElementById("hamburger")
  const navMenu = document.getElementById("navMenu")

  if (hamburger && navMenu) {
    hamburger.addEventListener("click", () => {
      hamburger.classList.toggle("active")
      navMenu.classList.toggle("active")
    })
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

console.log("✅ Script.js inicializado")
