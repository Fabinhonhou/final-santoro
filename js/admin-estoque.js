// Admin Inventory Management System with Database Integration
document.addEventListener("DOMContentLoaded", () => {
  // Check admin authentication
  const session = localStorage.getItem("userSession")

  if (!session) {
    alert("Acesso negado. Faça login como administrador.")
    window.location.href = "login.html"
    return
  }

  const userData = JSON.parse(session)

  if (!userData.user || userData.user.type !== "admin") {
    alert("Acesso negado. Apenas administradores podem acessar esta página.")
    window.location.href = "login.html"
    return
  }

  console.log("👨‍💼 Admin logado:", userData.user)

  // Initialize inventory management
  initializeInventoryManagement()
})

let inventoryData = []
let filteredInventoryData = []
let authToken = ""

function initializeInventoryManagement() {
  console.log("🔧 Inicializando gerenciamento de estoque...")

  // Get auth token
  const userData = JSON.parse(localStorage.getItem("userSession"))
  console.log("👤 Dados do usuário:", userData)

  if (!userData || !userData.token) {
    console.error("❌ Token de autenticação não encontrado")
    alert("Erro de autenticação. Faça login novamente.")
    window.location.href = "login.html"
    return
  }

  authToken = userData.token
  console.log("🔑 Token obtido:", authToken ? "Sim" : "Não")

  // Load inventory data and statistics
  console.log("📦 Carregando dados do estoque...")
  loadInventoryData()
  loadInventoryStats()

  // Setup event listeners
  console.log("🎯 Configurando event listeners...")
  setupEventListeners()

  // Setup logout
  document.getElementById("adminLogoutBtn")?.addEventListener("click", (e) => {
    e.preventDefault()
    confirmLogout()
  })

  console.log("✅ Inicialização concluída")
}

function setupEventListeners() {
  console.log("🎯 Configurando event listeners...")

  // Add inventory button
  const addBtn = document.getElementById("addInventoryBtn")
  console.log("➕ Botão adicionar encontrado:", addBtn ? "Sim" : "Não")

  addBtn?.addEventListener("click", () => {
    console.log("🔘 Botão adicionar clicado!")
    openInventoryModal()
  })

  // Refresh button
  const refreshBtn = document.getElementById("refreshBtn")
  console.log("🔄 Botão refresh encontrado:", refreshBtn ? "Sim" : "Não")

  refreshBtn?.addEventListener("click", () => {
    console.log("🔄 Botão refresh clicado!")
    loadInventoryData()
    loadInventoryStats()
  })

  // Filters
  document.getElementById("categoryFilter")?.addEventListener("change", applyFilters)
  document.getElementById("stockFilter")?.addEventListener("change", applyFilters)
  document.getElementById("searchFilter")?.addEventListener("input", applyFilters)

  // Modal controls
  setupModalControls()

  console.log("✅ Event listeners configurados")
}

function setupModalControls() {
  const modal = document.getElementById("inventoryModal")
  const closeBtn = document.getElementById("closeInventoryModal")
  const cancelBtn = document.getElementById("cancelInventory")
  const form = document.getElementById("inventoryForm")

  // Close modal events
  closeBtn?.addEventListener("click", () => {
    modal.style.display = "none"
  })

  cancelBtn?.addEventListener("click", () => {
    modal.style.display = "none"
  })

  // Close modal when clicking outside
  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.style.display = "none"
    }
  })

  // Form submission
  form?.addEventListener("submit", handleInventorySubmit)
}

async function loadInventoryData() {
  console.log("📦 Iniciando carregamento do estoque...")

  const loadingElement = document.getElementById("inventory-loading")
  const tableContainer = document.getElementById("inventory-table")

  console.log("🔍 Elementos encontrados:", {
    loading: loadingElement ? "Sim" : "Não",
    table: tableContainer ? "Sim" : "Não",
  })

  try {
    loadingElement.style.display = "block"
    tableContainer.innerHTML = ""

    console.log("🌐 Fazendo requisição para /api/inventory...")
    console.log("🔑 Usando token:", authToken.substring(0, 20) + "...")

    const response = await fetch("/api/inventory", {
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
    })

    console.log("📡 Resposta recebida:", {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("❌ Erro na resposta:", errorText)
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log("📊 Dados recebidos:", data)

    if (data.success) {
      inventoryData = data.inventory
      filteredInventoryData = [...inventoryData]

      // DEBUG: Verificar dados recebidos
      console.log("🔍 DADOS RECEBIDOS DO SERVIDOR:")
      inventoryData.forEach((item) => {
        console.log(`   📦 ${item.name}: current=${item.current_stock}, min=${item.min_stock}`)
        console.log(`      Status calculado: ${getStockStatusText(item.current_stock, item.min_stock)}`)
      })

      console.log("✅ Dados do estoque carregados:", inventoryData.length, "itens")
      displayInventoryTable()
    } else {
      throw new Error(data.message || "Erro ao carregar estoque")
    }
  } catch (error) {
    console.error("❌ Erro ao carregar estoque:", error)
    tableContainer.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Erro ao carregar estoque</h3>
        <p>${error.message}</p>
        <button class="btn btn-primary" onclick="loadInventoryData()">Tentar Novamente</button>
      </div>
    `
  } finally {
    loadingElement.style.display = "none"
  }
}

async function loadInventoryStats() {
  try {
    const response = await fetch("/api/inventory/stats", {
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    if (data.success) {
      const stats = data.stats
      document.getElementById("totalItems").textContent = stats.totalItems
      document.getElementById("lowStockItems").textContent = stats.lowStockItems
      document.getElementById("outOfStockItems").textContent = stats.outOfStockItems
      document.getElementById("goodStockItems").textContent = stats.totalItems - stats.lowStockItems
    }
  } catch (error) {
    console.error("Erro ao carregar estatísticas:", error)
  }
}

function displayInventoryTable() {
  const tableContainer = document.getElementById("inventory-table")

  if (filteredInventoryData.length === 0) {
    tableContainer.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-box-open"></i>
        <h3>Nenhum item encontrado</h3>
        <p>Não há itens no estoque que correspondam aos filtros selecionados.</p>
      </div>
    `
    return
  }

  const tableHTML = `
    <table class="inventory-table">
      <thead>
        <tr>
          <th>Item</th>
          <th>Categoria</th>
          <th>Estoque Atual</th>
          <th>Estoque Mínimo</th>
          <th>Status</th>
          <th>Fornecedor</th>
          <th>Última Atualização</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        ${filteredInventoryData
          .map(
            (item) => `
            <tr>
              <td>
                <div style="font-weight: 600;">${item.name}</div>
                <div style="font-size: 0.75rem; color: #6b7280;">ID: ${item.id}</div>
              </td>
              <td>
                <span class="category-badge">${getCategoryName(item.category)}</span>
              </td>
              <td>
                <strong>${item.current_stock} ${item.unit}</strong>
              </td>
              <td>
                ${item.min_stock} ${item.unit}
              </td>
              <td>
                <span class="stock-status ${getStockStatusClass(item.current_stock, item.min_stock)}">
                  ${(() => {
                    console.log(`🏷️ Item: ${item.name}, Current: ${item.current_stock}, Min: ${item.min_stock}`)
                    return getStockStatusText(item.current_stock, item.min_stock)
                  })()}
                </span>
              </td>
              <td>
                ${item.supplier || "-"}
              </td>
              <td>
                ${formatDate(item.updated_at)}
              </td>
              <td>
                <div class="action-buttons">
                  <button class="btn btn-warning btn-sm" onclick="editInventoryItem(${item.id})">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button class="btn btn-success btn-sm" onclick="updateStock(${item.id})">
                    <i class="fas fa-plus"></i>
                  </button>
                  <button class="btn btn-danger btn-sm" onclick="deleteInventoryItem(${item.id})">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          `,
          )
          .join("")}
      </tbody>
    </table>
  `

  tableContainer.innerHTML = tableHTML
}

function applyFilters() {
  const categoryFilter = document.getElementById("categoryFilter").value
  const stockFilter = document.getElementById("stockFilter").value
  const searchFilter = document.getElementById("searchFilter").value.toLowerCase()

  filteredInventoryData = inventoryData.filter((item) => {
    // Category filter
    if (categoryFilter !== "all" && item.category !== categoryFilter) {
      return false
    }

    // Stock status filter
    if (stockFilter !== "all") {
      const stockStatus = getStockStatus(item.current_stock, item.min_stock)
      if (stockFilter !== stockStatus) {
        return false
      }
    }

    // Search filter
    if (searchFilter && !item.name.toLowerCase().includes(searchFilter)) {
      return false
    }

    return true
  })

  displayInventoryTable()
}

function openInventoryModal(item = null) {
  console.log("🔧 Abrindo modal do estoque...", item ? "Editando" : "Criando")

  const modal = document.getElementById("inventoryModal")
  const form = document.getElementById("inventoryForm")
  const title = document.getElementById("inventoryModalTitle")

  console.log("🔍 Elementos do modal encontrados:", {
    modal: modal ? "Sim" : "Não",
    form: form ? "Sim" : "Não",
    title: title ? "Sim" : "Não",
  })

  if (!modal) {
    console.error("❌ Modal não encontrado!")
    alert("Erro: Modal não encontrado. Verifique se a página foi carregada corretamente.")
    return
  }

  if (item) {
    title.textContent = "Editar Item do Estoque"
    populateForm(item)
  } else {
    title.textContent = "Adicionar Item ao Estoque"
    form.reset()
    document.getElementById("inventoryId").value = ""
  }

  modal.style.display = "flex"
  console.log("✅ Modal aberto")
}

function populateForm(item) {
  document.getElementById("inventoryId").value = item.id
  document.getElementById("itemName").value = item.name
  document.getElementById("category").value = item.category
  document.getElementById("currentStock").value = item.current_stock
  document.getElementById("minStock").value = item.min_stock
  document.getElementById("unit").value = item.unit
  document.getElementById("supplier").value = item.supplier || ""
}

async function handleInventorySubmit(e) {
  e.preventDefault()

  const formData = new FormData(e.target)
  const itemData = {
    name: formData.get("itemName"),
    category: formData.get("category"),
    currentStock: Number.parseFloat(formData.get("currentStock")),
    minStock: Number.parseFloat(formData.get("minStock")),
    unit: formData.get("unit"),
    supplier: formData.get("supplier") || null,
  }

  const itemId = formData.get("inventoryId")
  const isEditing = itemId && itemId !== ""

  try {
    const url = isEditing ? `/api/inventory/${itemId}` : "/api/inventory"
    const method = isEditing ? "PUT" : "POST"

    const response = await fetch(url, {
      method: method,
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(itemData),
    })

    const data = await response.json()

    if (data.success) {
      document.getElementById("inventoryModal").style.display = "none"
      await loadInventoryData()
      await loadInventoryStats()
      showNotification(data.message, "success")
    } else {
      throw new Error(data.message || "Erro ao salvar item")
    }
  } catch (error) {
    console.error("Erro ao salvar item:", error)
    showNotification(error.message, "error")
  }
}

async function editInventoryItem(itemId) {
  const item = inventoryData.find((item) => item.id === itemId)
  if (item) {
    openInventoryModal(item)
  }
}

async function updateStock(itemId) {
  const item = inventoryData.find((item) => item.id === itemId)
  if (!item) return

  const newStock = prompt(
    `Atualizar estoque de ${item.name}\nEstoque atual: ${item.current_stock} ${item.unit}\n\nDigite o novo valor:`,
    item.current_stock,
  )

  if (newStock !== null && !isNaN(newStock) && Number.parseFloat(newStock) >= 0) {
    try {
      const response = await fetch(`/api/inventory/${itemId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: item.name,
          category: item.category,
          currentStock: Number.parseFloat(newStock),
          minStock: item.min_stock,
          unit: item.unit,
          supplier: item.supplier,
        }),
      })

      const data = await response.json()

      if (data.success) {
        await loadInventoryData()
        await loadInventoryStats()
        showNotification("Estoque atualizado com sucesso!", "success")
      } else {
        throw new Error(data.message || "Erro ao atualizar estoque")
      }
    } catch (error) {
      console.error("Erro ao atualizar estoque:", error)
      showNotification(error.message, "error")
    }
  }
}

async function deleteInventoryItem(itemId) {
  const item = inventoryData.find((item) => item.id === itemId)
  if (!item) return

  if (confirm(`Tem certeza que deseja excluir "${item.name}" do estoque?`)) {
    try {
      const response = await fetch(`/api/inventory/${itemId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (data.success) {
        await loadInventoryData()
        await loadInventoryStats()
        showNotification(data.message, "success")
      } else {
        throw new Error(data.message || "Erro ao excluir item")
      }
    } catch (error) {
      console.error("Erro ao excluir item:", error)
      showNotification(error.message, "error")
    }
  }
}

// Utility functions
function getCategoryName(category) {
  const categories = {
    vegetables: "Vegetais",
    dairy: "Laticínios",
    grains: "Grãos",
    meat: "Carnes",
    beverages: "Bebidas",
    other: "Outros",
  }
  return categories[category] || category
}

function getStockStatus(current, min) {
  // Convert to numbers to ensure proper comparison
  const currentNum = Number(current)
  const minNum = Number(min)

  console.log(`🔍 Calculando status: current=${currentNum}, min=${minNum}`)

  if (currentNum === 0) {
    console.log(`   → Sem Estoque (current = 0)`)
    return "out"
  }

  if (currentNum <= minNum + 5) {
    console.log(`   → Estoque Baixo (${currentNum} <= ${minNum + 5})`)
    return "low"
  }

  console.log(`   → Estoque Bom (${currentNum} > ${minNum + 5})`)
  return "good"
}

function getStockStatusClass(current, min) {
  return `stock-${getStockStatus(current, min)}`
}

function getStockStatusText(current, min) {
  const status = getStockStatus(current, min)
  const statusTexts = {
    out: "Sem Estoque",
    low: "Estoque Baixo",
    good: "Estoque Bom",
  }
  console.log(`📊 Status final: ${status} = ${statusTexts[status]}`)
  return statusTexts[status]
}

function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function showNotification(message, type = "info") {
  // Create notification element
  const notification = document.createElement("div")
  notification.className = `notification notification-${type}`
  notification.innerHTML = `
    <i class="fas fa-${type === "success" ? "check-circle" : type === "error" ? "exclamation-circle" : "info-circle"}"></i>
    <span>${message}</span>
  `

  // Add to page
  document.body.appendChild(notification)

  // Show notification
  setTimeout(() => notification.classList.add("show"), 100)

  // Remove notification after 3 seconds
  setTimeout(() => {
    notification.classList.remove("show")
    setTimeout(() => document.body.removeChild(notification), 300)
  }, 3000)
}

function confirmLogout() {
  if (confirm("Tem certeza que deseja sair do painel administrativo?")) {
    localStorage.removeItem("userSession")
    alert("Logout realizado com sucesso!")
    window.location.href = "login.html"
  }
}

// Add notification styles
const notificationStyles = `
  .notification {
    position: fixed;
    top: 20px;
    right: 20px;
    background: white;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    gap: 0.75rem;
    transform: translateX(400px);
    transition: transform 0.3s ease;
    z-index: 1001;
    border-left: 4px solid #6b7280;
  }
  
  .notification.show {
    transform: translateX(0);
  }
  
  .notification-success {
    border-left-color: #10b981;
    color: #065f46;
  }
  
  .notification-error {
    border-left-color: #ef4444;
    color: #991b1b;
  }
  
  .notification-info {
    border-left-color: #3b82f6;
    color: #1e40af;
  }
`

// Add styles to head
const styleSheet = document.createElement("style")
styleSheet.textContent = notificationStyles
document.head.appendChild(styleSheet)
