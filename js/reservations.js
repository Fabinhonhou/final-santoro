// Sistema de reservas integrado com o backend
document.addEventListener("DOMContentLoaded", () => {
  const reservationForm = document.querySelector('#contato form, form[action="#reservas"]')

  if (reservationForm) {
    reservationForm.addEventListener("submit", handleReservation)
  }

  // Configurar data mínima para hoje
  const dateInput = document.getElementById("data")
  if (dateInput) {
    const today = new Date().toISOString().split("T")[0]
    dateInput.setAttribute("min", today)
  }

  // Carregar reservas do usuário se estiver logado
  loadUserReservations()
})

async function handleReservation(e) {
  e.preventDefault()

  console.log("=== CRIANDO RESERVA ===")

  const formData = new FormData(e.target)
  const reservationData = {
    name: formData.get("nome"),
    email: formData.get("email"),
    phone: formData.get("telefone"),
    date: formData.get("data"),
    time: formData.get("horario"),
    guests: Number.parseInt(formData.get("pessoas")),
    specialRequests: formData.get("observacoes") || "",
  }

  console.log("Dados da reserva:", reservationData)

  // Validar dados
  if (!validateReservationData(reservationData)) {
    return
  }

  try {
    // Mostrar estado de carregamento
    const submitBtn = e.target.querySelector('button[type="submit"]')
    const originalText = submitBtn.textContent
    submitBtn.textContent = "Fazendo Reserva..."
    submitBtn.disabled = true

    console.log("Enviando para API de reservas...")

    // Usar fetch autenticado se o usuário estiver logado
    const response = await window.auth.authenticatedFetch("/api/reservations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(reservationData),
    })

    console.log("Status da resposta:", response.status)

    const responseData = await response.json()
    console.log("Dados da resposta:", responseData)

    if (!response.ok) {
      throw new Error(responseData.message || "Erro ao fazer reserva")
    }

    if (responseData.success) {
      console.log("✅ Reserva criada com sucesso!")

      // Mostrar mensagem de sucesso
      alert("Reserva feita com sucesso! Entraremos em contato em breve.")

      // Limpar formulário
      e.target.reset()

      // Recarregar reservas do usuário
      loadUserReservations()
    } else {
      throw new Error(responseData.message || "Falha ao criar reserva")
    }
  } catch (error) {
    console.error("❌ Erro na reserva:", error)
    alert("Erro ao fazer reserva: " + error.message)
  } finally {
    // Resetar estado do botão
    const submitBtn = e.target.querySelector('button[type="submit"]')
    if (submitBtn) {
      submitBtn.textContent = "Fazer Reserva"
      submitBtn.disabled = false
    }
  }
}

function validateReservationData(data) {
  console.log("Validando dados da reserva...")

  if (!data.name || data.name.trim().length < 2) {
    alert("Nome deve ter pelo menos 2 caracteres.")
    return false
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(data.email)) {
    alert("Por favor, insira um email válido.")
    return false
  }

  if (!data.phone || data.phone.length < 10) {
    alert("Por favor, insira um telefone válido.")
    return false
  }

  if (!data.date) {
    alert("Por favor, selecione uma data.")
    return false
  }

  if (!data.time) {
    alert("Por favor, selecione um horário.")
    return false
  }

  if (!data.guests || data.guests < 1) {
    alert("Por favor, selecione o número de pessoas.")
    return false
  }

  // Verificar se a data não é no passado
  const reservationDate = new Date(data.date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (reservationDate < today) {
    alert("A data da reserva não pode ser no passado.")
    return false
  }

  console.log("✅ Validação da reserva passou")
  return true
}

async function loadUserReservations() {
  if (!window.auth.isLoggedIn()) {
    return
  }

  try {
    console.log("Carregando reservas do usuário...")

    const response = await window.auth.authenticatedFetch("/api/reservations")

    if (!response.ok) {
      throw new Error("Erro ao carregar reservas")
    }

    const data = await response.json()

    if (data.success) {
      console.log("✅ Reservas carregadas:", data.reservations)
      displayUserReservations(data.reservations)
    }
  } catch (error) {
    console.error("❌ Erro ao carregar reservas:", error)
  }
}

function displayUserReservations(reservations) {
  // Criar seção de reservas do usuário se não existir
  let reservationsSection = document.getElementById("user-reservations")

  if (!reservationsSection && reservations.length > 0) {
    reservationsSection = document.createElement("section")
    reservationsSection.id = "user-reservations"
    reservationsSection.innerHTML = `
      <div class="container">
        <h2>Suas Reservas</h2>
        <div id="reservations-list"></div>
      </div>
    `

    // Inserir após o formulário de reserva
    const form = document.querySelector("#contato")
    if (form) {
      form.parentNode.insertBefore(reservationsSection, form.nextSibling)
    }
  }

  const reservationsList = document.getElementById("reservations-list")
  if (!reservationsList) return

  if (reservations.length === 0) {
    reservationsList.innerHTML = "<p>Você não tem reservas.</p>"
    return
  }

  reservationsList.innerHTML = reservations
    .map(
      (reservation) => `
    <div class="reservation-card" style="border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 8px;">
      <h3>Reserva #${reservation.id}</h3>
      <p><strong>Data:</strong> ${new Date(reservation.date).toLocaleDateString("pt-BR")}</p>
      <p><strong>Horário:</strong> ${reservation.time}</p>
      <p><strong>Pessoas:</strong> ${reservation.guests}</p>
      <p><strong>Status:</strong> <span class="status-${reservation.status}">${getStatusText(reservation.status)}</span></p>
      ${reservation.special_requests ? `<p><strong>Observações:</strong> ${reservation.special_requests}</p>` : ""}
      ${
        reservation.status === "pending"
          ? `
        <button onclick="cancelReservation(${reservation.id})" style="background: #e74c3c; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
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
    const response = await window.auth.authenticatedFetch(`/api/reservations/${reservationId}/cancel`, {
      method: "PUT",
    })

    const data = await response.json()

    if (data.success) {
      alert("Reserva cancelada com sucesso!")
      loadUserReservations() // Recarregar lista
    } else {
      throw new Error(data.message)
    }
  } catch (error) {
    console.error("Erro ao cancelar reserva:", error)
    alert("Erro ao cancelar reserva: " + error.message)
  }
}

// Exportar função para uso global
window.cancelReservation = cancelReservation
