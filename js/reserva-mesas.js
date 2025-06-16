document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded and parsed")

  // Verificar se há mesa selecionada
  const selectedTableData = localStorage.getItem("selectedTable")
  const adminSelectedTable = localStorage.getItem("adminSelectedTable")
  let selectedTable = null

  if (selectedTableData) {
    try {
      selectedTable = JSON.parse(selectedTableData)
      console.log("🪑 Mesa selecionada pelo cliente:", selectedTable)

      // Mostrar mesa selecionada na interface
      const tableInfo = document.createElement("div")
      tableInfo.style.cssText =
        "background: #e8f5e8; padding: 15px; margin-bottom: 20px; border-radius: 8px; text-align: center; font-weight: bold; color: #2e7d32;"
      tableInfo.innerHTML = `✅ Mesa ${selectedTable.tableNumber} selecionada`

      const form = document.getElementById("reservationForm")
      if (form) {
        form.insertBefore(tableInfo, form.firstChild)
      }

      // Limpar dados após uso
      localStorage.removeItem("selectedTable")
    } catch (error) {
      console.error("❌ Erro ao processar mesa selecionada:", error)
    }
  } else if (adminSelectedTable) {
    try {
      const adminData = JSON.parse(adminSelectedTable)
      selectedTable = { tableNumber: adminData.tableNumber }
      console.log("🪑 Mesa selecionada pelo admin:", selectedTable)

      // Mostrar mesa selecionada na interface
      const tableInfo = document.createElement("div")
      tableInfo.style.cssText =
        "background: #e3f2fd; padding: 15px; margin-bottom: 20px; border-radius: 8px; text-align: center; font-weight: bold; color: #1976d2;"
      tableInfo.innerHTML = `👨‍💼 Reserva Admin - Mesa ${selectedTable.tableNumber}`

      const form = document.getElementById("reservationForm")
      if (form) {
        form.insertBefore(tableInfo, form.firstChild)
      }

      // Limpar dados após uso
      localStorage.removeItem("adminSelectedTable")
    } catch (error) {
      console.error("❌ Erro ao processar mesa selecionada pelo admin:", error)
    }
  }

  const form = document.getElementById("reservationForm")

  form.addEventListener("submit", (event) => {
    event.preventDefault()
    handleSubmit()
  })

  async function handleSubmit() {
    const name = document.getElementById("name").value
    const email = document.getElementById("email").value
    const phone = document.getElementById("phone").value
    const date = document.getElementById("date").value
    const time = document.getElementById("time").value
    const guests = document.getElementById("guests").value
    const specialRequests = document.getElementById("specialRequests").value

    const requestBody = {
      name,
      email,
      phone,
      date,
      time,
      guests: Number.parseInt(guests),
      specialRequests,
      tableNumber: selectedTable ? selectedTable.tableNumber : null,
    }

    try {
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
        body: JSON.stringify({
          ...requestBody,
          tableNumber: selectedTable ? selectedTable.tableNumber : null,
        }),
      })

      if (response.ok) {
        console.log("Reserva enviada com sucesso!")
        alert("Reserva enviada com sucesso!")
        form.reset()
      } else {
        console.error("Erro ao enviar a reserva:", response.status)
        alert("Erro ao enviar a reserva.")
      }
    } catch (error) {
      console.error("Erro ao enviar a reserva:", error)
      alert("Erro ao enviar a reserva.")
    }
  }

  loadUserData()

  function loadUserData() {
    console.log("👤 Carregando dados do usuário...")

    // Verificar se há mesa selecionada
    const selectedTableData = localStorage.getItem("selectedTable")
    if (selectedTableData) {
      try {
        const tableData = JSON.parse(selectedTableData)
        console.log("🪑 Mesa selecionada:", tableData)

        // Mostrar mesa selecionada na interface
        const form = document.getElementById("reservationForm")
        if (form) {
          const tableInfo = document.createElement("div")
          tableInfo.style.cssText =
            "background: #e8f5e8; padding: 15px; margin-bottom: 20px; border-radius: 8px; text-align: center; font-weight: bold; color: #2e7d32;"
          tableInfo.innerHTML = `✅ Mesa ${tableData.tableNumber} selecionada (Capacidade: ${tableData.capacity} pessoas)`

          form.insertBefore(tableInfo, form.firstChild)
        }

        // Limpar dados após mostrar
        localStorage.removeItem("selectedTable")
      } catch (error) {
        console.error("❌ Erro ao processar mesa selecionada:", error)
      }
    }

    if (!window.auth || !window.auth.isLoggedIn()) {
      console.log("👤 Usuário não está logado")
      return
    }

    const session = window.auth.getSession()
    if (session && session.user) {
      console.log("✅ Preenchendo dados do usuário logado")

      // Preencher nome e email automaticamente
      const nameInput = document.getElementById("name")
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
})
