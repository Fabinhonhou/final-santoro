console.log("👥 Clientes Servidor JS iniciando...")

let clientsData = []

document.addEventListener("DOMContentLoaded", () => {
  console.log("👥 DOM carregado, inicializando painel de clientes")

  initializeClientsPanel()
  loadClientsData()
})

function initializeClientsPanel() {
  console.log("🔧 Inicializando painel de clientes...")

  // Verificar autenticação admin
  if (!checkAdminAuth()) {
    return
  }

  console.log("✅ Admin autenticado, carregando clientes...")
}

function checkAdminAuth() {
  // Verificar se há sessão de admin
  const session = localStorage.getItem("userSession")

  if (!session) {
    alert("Acesso negado. Faça login como administrador.")
    window.location.href = "login.html"
    return false
  }

  try {
    const userData = JSON.parse(session)

    if (!userData.user || userData.user.type !== "admin") {
      alert("Acesso negado. Apenas administradores podem acessar esta página.")
      window.location.href = "index.html"
      return false
    }

    return true
  } catch (error) {
    console.error("❌ Erro ao verificar autenticação:", error)
    localStorage.removeItem("userSession")
    window.location.href = "login.html"
    return false
  }
}

async function loadClientsData() {
  console.log("📊 Carregando dados dos clientes...")

  try {
    const response = await fetch("/api/admin/users", {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    })

    if (!response.ok) {
      throw new Error("Erro ao carregar clientes")
    }

    const result = await response.json()

    if (result.success) {
      clientsData = result.users
      console.log("✅ Clientes carregados:", clientsData.length)
      displayClients()
    } else {
      throw new Error(result.message)
    }
  } catch (error) {
    console.error("❌ Erro ao carregar clientes:", error)
    displayError("Erro ao carregar dados dos clientes: " + error.message)
  }
}

function displayClients() {
  console.log("🎨 Exibindo lista de clientes...")

  const clientsList = document.getElementById("clients-list")

  // Update stats
  updateStats()

  if (clientsData.length === 0) {
    clientsList.innerHTML = `
      <div class="no-clients">
        Nenhum cliente cadastrado encontrado.
      </div>
    `
    return
  }

  clientsList.innerHTML = clientsData
    .map(
      (client) => `
    <div class="client-row">
      <div class="client-name">${client.name || "N/A"}</div>
      <div class="client-email">${client.email || "N/A"}</div>
      <div class="client-cpf">${formatCPF(client.cpf) || "Não informado"}</div>
      <div class="client-date">${formatDate(client.created_at)}</div>
    </div>
  `,
    )
    .join("")

  console.log("✅ Lista de clientes exibida")
}

function updateStats() {
  const totalClients = clientsData.length
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()

  const clientsThisMonth = clientsData.filter((client) => {
    if (!client.created_at) return false
    const clientDate = new Date(client.created_at)
    return clientDate.getMonth() === currentMonth && clientDate.getFullYear() === currentYear
  }).length

  const clientsWithCPF = clientsData.filter((client) => client.cpf && client.cpf.trim() !== "").length

  // Update DOM elements
  const totalElement = document.getElementById("total-clients")
  const monthElement = document.getElementById("clients-this-month")
  const cpfElement = document.getElementById("clients-with-cpf")

  if (totalElement) totalElement.textContent = totalClients
  if (monthElement) monthElement.textContent = clientsThisMonth
  if (cpfElement) cpfElement.textContent = clientsWithCPF
}

function displayError(message) {
  const clientsList = document.getElementById("clients-list")
  clientsList.innerHTML = `
    <div class="error">
      ${message}
    </div>
  `
}

function formatCPF(cpf) {
  if (!cpf) return null

  // Remove caracteres não numéricos
  const cleanCPF = cpf.replace(/\D/g, "")

  // Aplica máscara XXX.XXX.XXX-XX
  if (cleanCPF.length === 11) {
    return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
  }

  return cpf
}

function formatDate(dateString) {
  if (!dateString) return "N/A"

  try {
    const date = new Date(dateString)
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  } catch (error) {
    console.error("❌ Erro ao formatar data:", error)
    return "Data inválida"
  }
}

function getAuthToken() {
  const session = localStorage.getItem("userSession")
  if (session) {
    try {
      const userData = JSON.parse(session)
      return userData.token
    } catch (error) {
      console.error("❌ Erro ao obter token:", error)
    }
  }
  return null
}

console.log("✅ Clientes Servidor JS carregado completamente")
