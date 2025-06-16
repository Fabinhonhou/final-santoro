console.log("🍽️ Reserva Completa JS iniciando...")

// Variáveis globais
let selectedTable = null
const tableCapacities = {
  1: 2,
  2: 2,
  3: 2,
  4: 2,
  5: 4,
  6: 4,
  7: 4,
  8: 4,
  9: 6,
  10: 6,
  11: 6,
  12: 6,
  13: 8,
  14: 8,
  15: 8,
  16: 8,
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("🍽️ DOM carregado, inicializando reserva completa")

  // Configurar formulário
  console.log("📝 Configurando formulário de reserva")
  setupReservationForm()

  // Carregar dados do usuário se estiver logado
  loadUserData()

  // Verificar se há mesa selecionada
  checkSelectedTable()

  // Configurar restrições de data
  setupDateRestrictions()

  // Carregar reservas do usuário
  loadUserReservations()
})

function setupReservationForm() {
  const form = document.getElementById("reservationForm")
  if (form) {
    form.addEventListener("submit", handleReservationSubmit)
    console.log("✅ Event listener adicionado ao formulário")
  } else {
    console.error("❌ Formulário de reserva não encontrado")
  }
}

function loadUserData() {
  console.log("👤 Carregando dados do usuário...")

  if (!window.auth || !window.auth.isLoggedIn()) {
    console.log("👤 Usuário não está logado")
    return
  }

  const session = window.auth.getSession()
  if (session && session.user) {
    console.log("✅ Preenchendo dados do usuário logado")

    // Preencher nome e email automaticamente
    const nameInput = document.getElementById("nome")
    const emailInput = document.getElementById("email")

    if (nameInput && session.user.name) {
      nameInput.value = session.user.name
      nameInput.style.backgroundColor = "#f0f8ff"
    }

    if (emailInput && session.user.email) {
      emailInput.value = session.user.email
      emailInput.style.backgroundColor = "#f0f8ff"
    }

    console.log("✅ Dados preenchidos:", {
      nome: session.user.name,
      email: session.user.email,
    })
  }
}

function checkSelectedTable() {
  // Verificar se há mesa selecionada pelo cliente
  const selectedTableData = localStorage.getItem("selectedTable")
  const adminSelectedTable = localStorage.getItem("adminSelectedTable")

  if (selectedTableData) {
    try {
      selectedTable = JSON.parse(selectedTableData)
      console.log("🪑 Mesa selecionada pelo cliente:", selectedTable)

      // Mostrar mesa selecionada na interface
      showSelectedTableInfo(selectedTable, "cliente")

      // Limpar dados após uso
      localStorage.removeItem("selectedTable")
    } catch (error) {
      console.error("❌ Erro ao processar mesa selecionada:", error)
    }
  } else if (adminSelectedTable) {
    try {
      const adminData = JSON.parse(adminSelectedTable)
      selectedTable = {
        tableNumber: adminData.tableNumber,
        capacity: tableCapacities[adminData.tableNumber] || 4,
      }
      console.log("🪑 Mesa selecionada pelo admin:", selectedTable)

      // Mostrar mesa selecionada na interface
      showSelectedTableInfo(selectedTable, "admin")

      // Limpar dados após uso
      localStorage.removeItem("adminSelectedTable")
    } catch (error) {
      console.error("❌ Erro ao processar mesa selecionada pelo admin:", error)
    }
  }
}

function showSelectedTableInfo(table, type) {
  const tableInfo = document.createElement("div")
  tableInfo.style.cssText =
    type === "admin"
      ? "background: #e3f2fd; padding: 15px; margin-bottom: 20px; border-radius: 8px; text-align: center; font-weight: bold; color: #1976d2;"
      : "background: #e8f5e8; padding: 15px; margin-bottom: 20px; border-radius: 8px; text-align: center; font-weight: bold; color: #2e7d32;"

  const prefix = type === "admin" ? "👨‍💼 Reserva Admin - " : "✅ "
  tableInfo.innerHTML = `${prefix}Mesa ${table.tableNumber} selecionada (Capacidade: ${table.capacity || tableCapacities[table.tableNumber] || 4} pessoas)`

  const form = document.getElementById("reservationForm")
  if (form) {
    form.insertBefore(tableInfo, form.firstChild)
  }
}

function setupDateRestrictions() {
  const dateInput = document.getElementById("data")
  if (dateInput) {
    // Definir data mínima como hoje
    const today = new Date()
    const minDate = today.toISOString().split("T")[0]
    dateInput.min = minDate

    console.log("📅 Restrições de data configuradas:", {
      min: minDate,
      max: "sem limite",
    })
  }
}

async function handleReservationSubmit(event) {
  event.preventDefault()
  console.log("=== ENVIANDO RESERVA ===")

  // Obter dados do formulário
  const formData = getFormData()
  if (!formData) {
    return
  }

  // Validar capacidade da mesa se uma mesa foi selecionada
  if (selectedTable && !validateTableCapacity(formData.guests, selectedTable.tableNumber)) {
    return
  }

  // Preparar dados da reserva
  const reservationData = {
    name: formData.name,
    email: formData.email,
    phone: formData.phone,
    date: formData.date,
    time: formData.time,
    guests: Number.parseInt(formData.guests),
    specialRequests: formData.specialRequests,
    tableNumber: selectedTable ? Number.parseInt(selectedTable.tableNumber) : null,
  }

  console.log("📋 Dados da reserva:", reservationData)

  try {
    showLoading(true)

    // Enviar para API
    console.log("📡 Enviando para API...")
    const response = await fetch("/api/reservations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Adicionar token se usuário estiver logado
        ...(window.auth && window.auth.isLoggedIn()
          ? {
              Authorization: `Bearer ${window.auth.getSession().token}`,
            }
          : {}),
      },
      body: JSON.stringify(reservationData),
    })

    console.log("📡 Status da resposta:", response.status)

    const result = await response.json()
    console.log("📡 Dados da resposta:", result)

    if (response.ok && result.success) {
      console.log("✅ Reserva criada com sucesso!")
      showMessage("success", "✅ Reserva criada com sucesso!")

      // Limpar formulário
      document.getElementById("reservationForm").reset()
      selectedTable = null

      // Recarregar reservas do usuário
      loadUserReservations()
    } else {
      console.error("❌ Erro na resposta da API:", result.message)
      throw new Error(result.message || "Erro desconhecido")
    }
  } catch (error) {
    console.error("❌ Erro na reserva:", error)
    showMessage("error", `❌ Erro ao fazer reserva: ${error.message}`)
  } finally {
    showLoading(false)
  }
}

function getFormData() {
  const nameInput = document.getElementById("nome")
  const emailInput = document.getElementById("email")
  const phoneInput = document.getElementById("telefone")
  const dateInput = document.getElementById("data")
  const timeInput = document.getElementById("horario")
  const guestsInput = document.getElementById("pessoas")
  const specialRequestsInput = document.getElementById("observacoes")

  // Verificar se todos os elementos existem
  if (!nameInput || !emailInput || !phoneInput || !dateInput || !timeInput || !guestsInput) {
    console.error("❌ Elementos do formulário não encontrados")
    showMessage("error", "Erro no formulário. Recarregue a página.")
    return null
  }

  // Validar dados
  console.log("🔍 Validando dados da reserva...")

  const name = nameInput.value.trim()
  const email = emailInput.value.trim()
  const phone = phoneInput.value.trim()
  const date = dateInput.value
  const time = timeInput.value
  const guests = guestsInput.value
  const specialRequests = specialRequestsInput ? specialRequestsInput.value.trim() : ""

  if (!name || !email || !phone || !date || !time || !guests) {
    showMessage("error", "Por favor, preencha todos os campos obrigatórios.")
    return null
  }

  // Validar email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    showMessage("error", "Por favor, insira um email válido.")
    return null
  }

  // Validar data
  const selectedDate = new Date(date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (selectedDate < today) {
    showMessage("error", "A data da reserva não pode ser no passado.")
    return null
  }

  console.log("✅ Validação passou")

  return {
    name,
    email,
    phone,
    date,
    time,
    guests,
    specialRequests,
  }
}

function validateTableCapacity(guests, tableNumber) {
  const capacity = tableCapacities[tableNumber]
  const guestCount = Number.parseInt(guests)

  if (capacity && guestCount > capacity) {
    showMessage(
      "error",
      `❌ A mesa ${tableNumber} tem capacidade para ${capacity} pessoas, mas você selecionou ${guestCount} pessoas. Por favor, escolha uma mesa maior ou reduza o número de pessoas.`,
    )
    return false
  }

  return true
}

async function loadUserReservations() {
  console.log("📋 Carregando reservas do usuário...")

  if (!window.auth || !window.auth.isLoggedIn()) {
    console.log("👤 Usuário não está logado, não carregando reservas")
    return
  }

  try {
    const session = window.auth.getSession()
    const response = await fetch("/api/reservations", {
      headers: {
        Authorization: `Bearer ${session.token}`,
      },
    })

    if (response.ok) {
      const result = await response.json()
      console.log("✅ Reservas carregadas:", result.reservations.length)
      displayUserReservations(result.reservations)
    } else {
      console.error("❌ Erro ao carregar reservas:", response.status)
    }
  } catch (error) {
    console.error("❌ Erro ao carregar reservas:", error)
  }
}

function displayUserReservations(reservations) {
  const reservationsSection = document.getElementById("user-reservations")
  if (!reservationsSection) {
    console.log("⚠️ Seção de reservas não encontrada no HTML")
    return
  }

  if (reservations.length === 0) {
    reservationsSection.innerHTML = "<p>Você ainda não tem reservas.</p>"
    return
  }

  const reservationsHTML = reservations
    .map(
      (reservation) => `
        <div class="reservation-item">
            <h4>Reserva #${reservation.id}</h4>
            <p><strong>Data:</strong> ${new Date(reservation.date).toLocaleDateString("pt-BR")}</p>
            <p><strong>Horário:</strong> ${reservation.time}</p>
            <p><strong>Pessoas:</strong> ${reservation.guests}</p>
            <p><strong>Status:</strong> <span class="status-${reservation.status}">${getStatusText(reservation.status)}</span></p>
            ${reservation.special_requests ? `<p><strong>Observações:</strong> ${reservation.special_requests}</p>` : ""}
        </div>
    `,
    )
    .join("")

  reservationsSection.innerHTML = `
        <h3>Suas Reservas</h3>
        ${reservationsHTML}
    `
}

function getStatusText(status) {
  const statusMap = {
    pending: "Pendente",
    confirmed: "Confirmada",
    cancelled: "Cancelada",
  }
  return statusMap[status] || status
}

function showLoading(show) {
  console.log("🔄 Mostrando loading:", show)
  const loadingElement = document.getElementById("loading")
  if (loadingElement) {
    loadingElement.style.display = show ? "block" : "none"
  }
}

function showMessage(type, message) {
  console.log(`📢 Mostrando mensagem ${type}:`, message)

  // Remover mensagens existentes
  const existingMessages = document.querySelectorAll(".message")
  existingMessages.forEach((msg) => msg.remove())

  // Criar nova mensagem
  const messageDiv = document.createElement("div")
  messageDiv.className = `message ${type}`
  messageDiv.style.cssText = `
        padding: 15px;
        margin: 10px 0;
        border-radius: 5px;
        font-weight: bold;
        ${type === "success" ? "background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb;" : ""}
        ${type === "error" ? "background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb;" : ""}
    `
  messageDiv.textContent = message

  // Inserir no início do formulário
  const form = document.getElementById("reservationForm")
  if (form) {
    form.insertBefore(messageDiv, form.firstChild)

    // Remover após 5 segundos
    setTimeout(() => {
      messageDiv.remove()
    }, 5000)
  }
}

console.log("✅ Reserva Completa JS carregado completamente")
