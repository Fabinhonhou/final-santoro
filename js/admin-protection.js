// Proteção para páginas administrativas
console.log("🛡️ Admin protection carregado")

document.addEventListener("DOMContentLoaded", () => {
  // Verificar se estamos em uma página administrativa
  const currentPage = window.location.pathname
  const isAdminPage =
    currentPage.includes("inicio.html") ||
    currentPage.includes("ReservasServidor.html") ||
    currentPage.includes("ClientesServidor.html") ||
    currentPage.includes("admin")

  if (isAdminPage) {
    console.log("🔒 Página administrativa detectada, verificando permissões...")

    const session = localStorage.getItem("userSession")

    if (!session) {
      console.log("❌ Nenhuma sessão encontrada")
      alert("Acesso negado. Faça login como administrador.")
      window.location.href = "login.html"
      return
    }

    const userData = JSON.parse(session)

    if (!userData.user || userData.user.type !== "admin") {
      console.log("❌ Usuário não é administrador:", userData.user)
      alert("Acesso negado. Apenas administradores podem acessar esta página.")
      window.location.href = "index.html"
      return
    }

    console.log("✅ Acesso administrativo autorizado para:", userData.user.name)

    // Atualizar navegação para mostrar links administrativos
    updateAdminNavigation(userData.user)
  }
})

function updateAdminNavigation(adminUser) {
  // Atualizar navegação específica para admin
  const nav = document.querySelector("header nav")

  if (nav) {
    // Remover links de usuário comum se existirem
    const userLinks = nav.querySelectorAll('a[href*="dashboard"], .dashboard-link')
    userLinks.forEach((link) => link.remove())

    // Garantir que temos os links administrativos corretos
    const adminLinks = nav.querySelectorAll(
      'a[href*="inicio"], a[href*="ReservasServidor"], a[href*="ClientesServidor"]',
    )

    if (adminLinks.length === 0) {
      // Adicionar links administrativos se não existirem
      const adminLinksHTML = `
        <a href="inicio.html">PAINEL INICIAL</a>
        <a href="ReservasServidor.html">RESERVAS</a>
        <a href="ClientesServidor.html">CLIENTES</a>
      `

      // Inserir antes do link de logout se existir
      const logoutLink = nav.querySelector(".logout-link, .logout-btn")
      if (logoutLink) {
        logoutLink.insertAdjacentHTML("beforebegin", adminLinksHTML)
      } else {
        nav.insertAdjacentHTML("beforeend", adminLinksHTML)
      }
    }
  }

  // Configurar logout específico para admin
  const logoutLinks = document.querySelectorAll(".logout-link, .logout-btn, #adminLogoutBtn")
  logoutLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault()
      if (confirm("Tem certeza que deseja sair do painel administrativo?")) {
        localStorage.removeItem("userSession")
        alert("Logout realizado com sucesso!")
        window.location.href = "index.html"
      }
    })
  })
}

// Exportar para uso global
window.adminProtection = {
  updateAdminNavigation,
}
