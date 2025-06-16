// Sistema de reservas completo - Adaptado para estrutura específica
console.log("🍽️ Reserva Completa JS iniciando...")

document.addEventListener("DOMContentLoaded", () => {
  console.log("🍽️ DOM carregado, inicializando reserva completa")

  initializeReservationForm()
  loadUserData()
  loadUserReservations()
  setupDateRestrictions()
})

function initializeReservationForm() {
  const form = document.getElementById("reservationForm")

  if (form) {
    console.log("📝 Configurando formulário de reserva")
    form.addEventListener("submit", handleReservationSubmit)

    // Adicionar máscara de telefone
    const phoneInput = document.getElementById("telefone")
    if (phoneInput) {
      phoneInput.addEventListener("input", formatPhoneNumber)
    }
  } else {
    console.error("❌ Formulário de reserva não encontrado!")
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

function setupDateRestrictions() {
  const dateInput = document.getElementById("data")
  if (dateInput) {
    const today = new Date()
    const todayString = today.toISOString().split("T")[0]
    dateInput.setAttribute("min", todayString)

    console.log("📅 Restrições de data configuradas:", {
      min: todayString,
      max: "sem limite",
    })
  }
}

function formatPhoneNumber(e) {
  let value = e.target.value.replace(/\D/g, "")

  if (value.length >= 11) {
    value = value.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
  } else if (value.length >= 7) {
    value = value.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3")
  } else if (value.length >= 3) {
    value = value.replace(/(\d{2})(\d{0,5})/, "($1) $2")
  }

  e.target.value = value
}

async function handleReservationSubmit(e) {
  e.preventDefault()

  console.log("=== ENVIANDO RESERVA ===")

  const formData = new FormData(e.target)

  // Tratar o valor "7+" para pessoas
  let guestsValue = formData.get("pessoas")
  if (guestsValue === "7+") {
    guestsValue = "7"
  }

  const reservationData = {
    name: formData.get("nome"),
    email: formData.get("email"),
    phone: formData.get("telefone"),
    date: formData.get("data"),
    time: formData.get("horario"),
    guests: Number.parseInt(guestsValue),
    specialRequests: formData.get("observacoes") || "",
  }

  console.log("📋 Dados da reserva:", reservationData)

  // Validar dados
  if (!validateReservationData(reservationData)) {
    return
  }

  try {
    // Mostrar loading
    showLoading(true)
    hideMessages()

    console.log("📡 Enviando para API...")

    // Fazer requisição para API
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

    let responseData
    try {
      responseData = await response.json()
      console.log("📡 Dados da resposta:", responseData)
    } catch (jsonError) {
      console.error("❌ Erro ao parsear JSON:", jsonError)
      throw new Error("Erro na comunicação com o servidor")
    }

    if (!response.ok) {
      throw new Error(responseData.message || `Erro HTTP ${response.status}`)
    }

    if (responseData.success) {
      console.log("✅ Reserva criada com sucesso! ID:", responseData.reservationId)

      // Mostrar mensagem de sucesso
      showMessage("success", "🎉 Reserva realizada com sucesso! Entraremos em contato em breve para confirmar.")

      // Limpar formulário
      e.target.reset()

      // Recarregar dados do usuário
      setTimeout(() => {
        loadUserData()
        loadUserReservations()
      }, 1000)

      // Scroll para o topo
      window.scrollTo({ top: 0, behavior: "smooth" })

      // Mostrar alerta também
      alert("Reserva realizada com sucesso! Verifique sua caixa de entrada.")
    } else {
      throw new Error(responseData.message || "Falha ao criar reserva")
    }
  } catch (error) {
    console.error("❌ Erro na reserva:", error)
    showMessage("error", "❌ Erro ao fazer reserva: " + error.message)
    alert("Erro ao fazer reserva: " + error.message)
  } finally {
    showLoading(false)
  }
}

function validateReservationData(data) {
  console.log("🔍 Validando dados da reserva...")

  if (!data.name || data.name.trim().length < 2) {
    showMessage("error", "Nome deve ter pelo menos 2 caracteres.")
    return false
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(data.email)) {
    showMessage("error", "Por favor, insira um email válido.")
    return false
  }

  if (!data.phone || data.phone.replace(/\D/g, "").length < 10) {
    showMessage("error", "Por favor, insira um telefone válido.")
    return false
  }

  if (!data.date) {
    showMessage("error", "Por favor, selecione uma data.")
    return false
  }

  if (!data.time) {
    showMessage("error", "Por favor, selecione um horário.")
    return false
  }

  if (!data.guests || data.guests < 1) {
    showMessage("error", "Por favor, selecione o número de pessoas.")
    return false
  }

  // Verificar se a data não é no passado
  const reservationDate = new Date(data.date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (reservationDate < today) {
    showMessage("error", "A data da reserva não pode ser no passado.")
    return false
  }

  console.log("✅ Validação passou")
  return true
}

async function loadUserReservations() {
  if (!window.auth || !window.auth.isLoggedIn()) {
    console.log("👤 Usuário não logado, não carregando reservas")
    return
  }

  try {
    console.log("📋 Carregando reservas do usuário...")

    const response = await fetch("/api/reservations", {
      headers: {
        Authorization: `Bearer ${window.auth.getSession().token}`,
      },
    })

    if (!response.ok) {
      throw new Error("Erro ao carregar reservas")
    }

    const data = await response.json()

    if (data.success && data.reservations) {
      console.log("✅ Reservas carregadas:", data.reservations.length)
      displayUserReservations(data.reservations)
    }
  } catch (error) {
    console.error("❌ Erro ao carregar reservas:", error)
  }
}

function displayUserReservations(reservations) {
  const reservationsSection = document.getElementById("user-reservations")
  const reservationsList = document.getElementById("reservations-list")

  if (!reservationsSection || !reservationsList) {
    console.log("⚠️ Seção de reservas não encontrada no HTML")
    return
  }

  if (reservations.length === 0) {
    reservationsSection.style.display = "none"
    return
  }

  reservationsSection.style.display = "block"

  reservationsList.innerHTML = reservations
    .map(
      (reservation) => `
        <div class="reservation-card">
            <h3>Reserva #${reservation.id}</h3>
            <p><strong>Data:</strong> ${new Date(reservation.date).toLocaleDateString("pt-BR")}</p>
            <p><strong>Horário:</strong> ${reservation.time}</p>
            <p><strong>Pessoas:</strong> ${reservation.guests}</p>
            <p><strong>Status:</strong> <span class="status-${reservation.status}">${getStatusText(reservation.status)}</span></p>
            ${reservation.special_requests ? `<p><strong>Observações:</strong> ${reservation.special_requests}</p>` : ""}
            ${
              reservation.status === "pending"
                ? `
                <button onclick="cancelReservation(${reservation.id})" class="cancel-btn">
                    Cancelar Reserva
                </button>
            `
                : ""
            }
        </div>
    `,
    )
    .join("")
}

function getStatusText(status) {
  const statusMap = {
    pending: "Pendente",
    confirmed: "Confirmada",
    cancelled: "Cancelada",
  }
  return statusMap[status] || status
}

async function cancelReservation(reservationId) {
  if (!confirm("Tem certeza que deseja cancelar esta reserva?")) {
    return
  }

  try {
    const response = await fetch(`/api/reservations/${reservationId}/cancel`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${window.auth.getSession().token}`,
      },
    })

    const data = await response.json()

    if (data.success) {
      showMessage("success", "Reserva cancelada com sucesso!")
      loadUserReservations()
    } else {
      throw new Error(data.message)
    }
  } catch (error) {
    console.error("Erro ao cancelar reserva:", error)
    showMessage("error", "Erro ao cancelar reserva: " + error.message)
  }
}

function showLoading(show) {
  console.log("🔄 Mostrando loading:", show)

  const loading = document.getElementById("loading-indicator")
  const submitBtn = document.querySelector(".submit-btn")

  if (loading) {
    loading.style.display = show ? "block" : "none"
  }

  if (submitBtn) {
    submitBtn.disabled = show
    const btnText = submitBtn.querySelector(".btn-text")
    const btnLoading = submitBtn.querySelector(".btn-loading")

    if (btnText && btnLoading) {
      btnText.style.display = show ? "none" : "inline"
      btnLoading.style.display = show ? "inline" : "none"
    } else {
      submitBtn.textContent = show ? "Enviando..." : "Fazer Reserva"
    }
  }
}

function showMessage(type, message) {
  console.log(`📢 Mostrando mensagem ${type}:`, message)

  hideMessages()

  const messageElement = document.getElementById(`${type}-message`)

  if (messageElement) {
    const messageText = messageElement.querySelector("p")
    if (messageText) {
      messageText.textContent = message
    }
    messageElement.style.display = "block"

    // Auto-hide success messages
    if (type === "success") {
      setTimeout(() => {
        messageElement.style.display = "none"
      }, 8000)
    }
  }
}

function hideMessages() {
  const successMessage = document.getElementById("success-message")
  const errorMessage = document.getElementById("error-message")

  if (successMessage) successMessage.style.display = "none"
  if (errorMessage) errorMessage.style.display = "none"
}

// Exportar função para uso global
window.cancelReservation = cancelReservation

console.log("✅ Reserva Completa JS carregado completamente")
