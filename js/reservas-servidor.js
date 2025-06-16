console.log("🍽️ Reservas Servidor JS iniciando...")

const currentDate = new Date().toISOString().split("T")[0]
let reservationsData = []
let tablesData = []

document.addEventListener("DOMContentLoaded", () => {
  console.log("🍽️ DOM carregado, inicializando painel de reservas")

  initializeReservationsPanel()
  loadReservationsData()
  updateCurrentDate()
})

function initializeReservationsPanel() {
  console.log("🔧 Inicializando painel de reservas...")

  // Verificar autenticação admin
  if (!checkAdminAuth()) {
    return
  }

  console.log("✅ Admin autenticado, carregando dados...")
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

function updateCurrentDate() {
  const dateElement = document.getElementById("current-date")
  const today = new Date()

  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }

  const formattedDate = today.toLocaleDateString("pt-BR", options)
  dateElement.textContent = formattedDate
}

async function loadReservationsData() {
  console.log("📊 Carregando dados de reservas...")

  try {
    // Carregar reservas do dia atual
    const reservationsResponse = await fetch(`/api/admin/reservations?date=${currentDate}`, {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    })

    if (!reservationsResponse.ok) {
      throw new Error("Erro ao carregar reservas")
    }

    const reservationsResult = await reservationsResponse.json()

    if (reservationsResult.success) {
      reservationsData = reservationsResult.reservations
      console.log("✅ Reservas carregadas:", reservationsData.length)
    }

    // Carregar dados das mesas
    await loadTablesData()

    // Atualizar interface
    updateTablesGrid()
    updateStatistics()
  } catch (error) {
    console.error("❌ Erro ao carregar dados:", error)
    alert("Erro ao carregar dados das reservas: " + error.message)
  }
}

async function loadTablesData() {
  console.log("🪑 Carregando dados das mesas...")

  try {
    const response = await fetch(`/api/admin/tables?date=${currentDate}`, {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    })

    if (!response.ok) {
      throw new Error("Erro ao carregar mesas")
    }

    const result = await response.json()

    if (result.success) {
      tablesData = result.tables
      console.log("✅ Mesas carregadas:", tablesData.length)
    }
  } catch (error) {
    console.error("❌ Erro ao carregar mesas:", error)
    // Criar dados padrão se não conseguir carregar
    tablesData = Array.from({ length: 16 }, (_, i) => ({
      table_number: i + 1,
      status: "available",
      reservation_id: null,
    }))
  }
}

function updateTablesGrid() {
  console.log("🎨 Atualizando grid de mesas...")

  const tablesGrid = document.getElementById("tables-grid")
  tablesGrid.innerHTML = ""

  // Criar 16 mesas
  for (let i = 1; i <= 16; i++) {
    const tableData = tablesData.find((t) => t.table_number === i) || {
      table_number: i,
      status: "available",
      reservation_id: null,
    }

    const tableElement = document.createElement("div")
    tableElement.className = `quadrado ${tableData.status}`
    tableElement.innerHTML = `<span class="numero">${String(i).padStart(2, "0")}<br><span class="label">Mesa</span></span>`

    // Adicionar evento de clique
    tableElement.addEventListener("click", () => {
      handleTableClick(tableData)
    })

    tablesGrid.appendChild(tableElement)
  }
}

function updateStatistics() {
  console.log("📊 Atualizando estatísticas...")

  const totalTables = 16
  const occupiedTables = tablesData.filter((t) => t.status === "occupied").length
  const availableTables = totalTables - occupiedTables

  // Contar reservas por período
  const lunchReservations = reservationsData.filter((r) => {
    const time = r.time
    return time >= "11:00" && time <= "15:00"
  }).length

  const dinnerReservations = reservationsData.filter((r) => {
    const time = r.time
    return time >= "18:00" && time <= "23:00"
  }).length

  const businessReservations = reservationsData.filter((r) => {
    return r.special_requests && r.special_requests.toLowerCase().includes("comercial")
  }).length

  // Atualizar elementos
  document.getElementById("total-tables").innerHTML = `${totalTables}<br><span class="label">MESAS</span>`
  document.getElementById("available-tables").innerHTML = `${availableTables}<br><span class="label">LIVRES</span>`
  document.getElementById("occupied-tables").innerHTML = `${occupiedTables}<br><span class="label">OCUPADAS</span>`
  document.getElementById("lunch-reservations").innerHTML = `${lunchReservations}<br><span class="label">ALMOÇO</span>`
  document.getElementById("dinner-reservations").innerHTML =
    `${dinnerReservations}<br><span class="label">JANTAR</span>`
  document.getElementById("business-reservations").innerHTML =
    `${businessReservations}<br><span class="label">COMERCIAL</span>`

  console.log("📊 Estatísticas atualizadas:", {
    totalTables,
    availableTables,
    occupiedTables,
    lunchReservations,
    dinnerReservations,
    businessReservations,
  })
}

function handleTableClick(tableData) {
  console.log("🪑 Mesa clicada:", tableData)

  if (tableData.reservation_id) {
    // Mesa tem reserva, mostrar detalhes
    showReservationDetails(tableData.reservation_id)
  } else {
    // Mesa livre, opção de criar reserva
    showNewReservationOption(tableData.table_number)
  }
}

async function showReservationDetails(reservationId) {
  console.log("📋 Mostrando detalhes da reserva:", reservationId)

  const modal = document.getElementById("reservation-modal")
  const modalContent = document.getElementById("modal-content")
  const modalTitle = document.getElementById("modal-title")

  modalTitle.textContent = "Detalhes da Reserva"
  modalContent.innerHTML = '<div class="loading">Carregando detalhes...</div>'
  modal.style.display = "block"

  try {
    const response = await fetch(`/api/admin/reservations/${reservationId}`, {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    })

    if (!response.ok) {
      throw new Error("Erro ao carregar detalhes da reserva")
    }

    const result = await response.json()

    if (result.success) {
      displayReservationDetails(result.reservation)
    } else {
      throw new Error(result.message)
    }
  } catch (error) {
    console.error("❌ Erro ao carregar detalhes:", error)
    modalContent.innerHTML = `<div style="color: red;">Erro ao carregar detalhes: ${error.message}</div>`
  }
}

function displayReservationDetails(reservation) {
  console.log("📋 Exibindo detalhes da reserva:", reservation)

  const modalContent = document.getElementById("modal-content")

  modalContent.innerHTML = `
    <div class="reservation-details">
      <h3>Reserva #${reservation.id}</h3>
      <p><strong>Nome:</strong> ${reservation.name}</p>
      <p><strong>Email:</strong> ${reservation.email}</p>
      <p><strong>Telefone:</strong> ${reservation.phone}</p>
      <p><strong>Mesa:</strong> ${reservation.table_number || "Não especificada"}</p>
      <p><strong>Data:</strong> ${new Date(reservation.date).toLocaleDateString("pt-BR")}</p>
      <p><strong>Horário:</strong> ${reservation.time}</p>
      <p><strong>Pessoas:</strong> ${reservation.guests}</p>
      <p><strong>Status:</strong> <span class="status-${reservation.status}">${getStatusText(reservation.status)}</span></p>
      ${reservation.special_requests ? `<p><strong>Observações:</strong> ${reservation.special_requests}</p>` : ""}
      <p><strong>Criada em:</strong> ${new Date(reservation.created_at).toLocaleString("pt-BR")}</p>
    </div>
    
    <div class="reservation-actions">
      ${
        reservation.status === "pending"
          ? `
        <button class="btn btn-confirm" onclick="updateReservationStatus(${reservation.id}, 'confirmed')">
          Confirmar Reserva
        </button>
      `
          : ""
      }
      
      ${
        reservation.status !== "cancelled"
          ? `
        <button class="btn btn-cancel" onclick="updateReservationStatus(${reservation.id}, 'cancelled')">
          Cancelar Reserva
        </button>
      `
          : ""
      }
      
      <button class="btn btn-close" onclick="closeReservationModal()">
        Fechar
      </button>
    </div>
  `
}

function showNewReservationOption(tableNumber) {
  console.log("➕ Mostrando opção de nova reserva para mesa:", tableNumber)

  const modal = document.getElementById("reservation-modal")
  const modalContent = document.getElementById("modal-content")
  const modalTitle = document.getElementById("modal-title")

  modalTitle.textContent = `Nova Reserva - Mesa ${tableNumber}`

  modalContent.innerHTML = `
    <div class="reservation-details">
      <p>Esta mesa está disponível para reserva.</p>
      <p><strong>Mesa:</strong> ${tableNumber}</p>
      <p><strong>Data:</strong> ${new Date(currentDate).toLocaleDateString("pt-BR")}</p>
    </div>
    
    <div class="reservation-actions">
      <button class="btn btn-confirm" onclick="redirectToNewReservation(${tableNumber})">
        Criar Nova Reserva
      </button>
      <button class="btn btn-close" onclick="closeReservationModal()">
        Fechar
      </button>
    </div>
  `

  modal.style.display = "block"
}

async function updateReservationStatus(reservationId, newStatus) {
  console.log(`🔄 Atualizando status da reserva ${reservationId} para ${newStatus}`)

  try {
    const response = await fetch(`/api/admin/reservations/${reservationId}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify({ status: newStatus }),
    })

    if (!response.ok) {
      throw new Error("Erro ao atualizar status")
    }

    const result = await response.json()

    if (result.success) {
      alert(`Reserva ${newStatus === "confirmed" ? "confirmada" : "cancelada"} com sucesso!`)
      closeReservationModal()
      loadReservationsData() // Recarregar dados
    } else {
      throw new Error(result.message)
    }
  } catch (error) {
    console.error("❌ Erro ao atualizar status:", error)
    alert("Erro ao atualizar reserva: " + error.message)
  }
}

function redirectToNewReservation(tableNumber) {
  // Salvar mesa selecionada e redirecionar para página de reserva
  localStorage.setItem(
    "adminSelectedTable",
    JSON.stringify({
      tableNumber: tableNumber,
      date: currentDate,
      isAdmin: true,
    }),
  )

  window.location.href = "reservaCompleta.html"
}

function openNewReservationModal() {
  console.log("➕ Abrindo modal para nova reserva")

  const modal = document.getElementById("reservation-modal")
  const modalContent = document.getElementById("modal-content")
  const modalTitle = document.getElementById("modal-title")

  modalTitle.textContent = "Nova Reserva"

  modalContent.innerHTML = `
    <div class="reservation-details">
      <p>Selecione uma mesa disponível no painel ou crie uma reserva sem mesa específica.</p>
    </div>
    
    <div class="reservation-actions">
      <button class="btn btn-confirm" onclick="redirectToNewReservation(null)">
        Criar Reserva Sem Mesa
      </button>
      <button class="btn btn-close" onclick="closeReservationModal()">
        Fechar
      </button>
    </div>
  `

  modal.style.display = "block"
}

function closeReservationModal() {
  const modal = document.getElementById("reservation-modal")
  modal.style.display = "none"
}

function getStatusText(status) {
  const statusMap = {
    pending: "Pendente",
    confirmed: "Confirmada",
    cancelled: "Cancelada",
  }
  return statusMap[status] || status
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

// Fechar modal ao clicar fora
window.onclick = (event) => {
  const modal = document.getElementById("reservation-modal")
  if (event.target === modal) {
    closeReservationModal()
  }
}

console.log("✅ Reservas Servidor JS carregado completamente")
