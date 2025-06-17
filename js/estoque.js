// Sistema de histórico de estoque - VERSÃO COMPLETA
console.log("🚀 Histórico de estoque iniciando...")

// Importar Lucide icons
const lucide = window.lucide

// Verificar autenticação admin no carregamento
document.addEventListener("DOMContentLoaded", () => {
  console.log("🔒 Verificando autenticação admin...")

  // Verificar se o usuário está logado e é admin
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

  // Inicializar a página
  inicializarPagina()
})

// Variáveis globais
let historicoCompleto = []
let historicoFiltrado = []
let filtroTipo = "todos"
let filtroProduto = ""
let filtroData = ""

// Função para inicializar a página
async function inicializarPagina() {
  console.log("🔄 Inicializando página de histórico...")

  // Inicializar ícones do Lucide
  if (typeof lucide !== "undefined") {
    lucide.createIcons()
  }

  // Configurar menu hamburger
  configurarMenuHamburger()

  // Configurar event listeners dos filtros
  configurarFiltros()

  // Carregar dados iniciais
  await carregarHistorico()
}

// Configurar menu hamburger
function configurarMenuHamburger() {
  const hamburger = document.getElementById("hamburger")
  const navMenu = document.getElementById("navMenu")

  if (hamburger && navMenu) {
    hamburger.addEventListener("click", () => {
      hamburger.classList.toggle("active")
      navMenu.classList.toggle("active")
    })

    // Fechar menu ao clicar em um link
    document.querySelectorAll(".nav-link").forEach((n) =>
      n.addEventListener("click", () => {
        hamburger.classList.remove("active")
        navMenu.classList.remove("active")
      }),
    )
  }
}

// Configurar filtros
function configurarFiltros() {
  document.getElementById("filtro-tipo").addEventListener("change", (e) => {
    filtroTipo = e.target.value
    aplicarFiltros()
  })

  document.getElementById("filtro-produto").addEventListener("input", (e) => {
    filtroProduto = e.target.value
    aplicarFiltros()
  })

  document.getElementById("filtro-data").addEventListener("change", (e) => {
    filtroData = e.target.value
    aplicarFiltros()
  })
}

// Função para fazer requisições autenticadas
async function requisicaoAutenticada(url, options = {}) {
  const session = JSON.parse(localStorage.getItem("userSession"))

  if (!session || !session.token) {
    throw new Error("Token de autenticação não encontrado")
  }

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session.token}`,
    ...options.headers,
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  if (response.status === 401 || response.status === 403) {
    alert("Sessão expirada. Faça login novamente.")
    localStorage.removeItem("userSession")
    window.location.href = "login.html"
    return
  }

  return response
}

// Carregar histórico do servidor
async function carregarHistorico() {
  console.log("📡 Carregando histórico do servidor...")

  mostrarLoading(true)

  try {
    const response = await requisicaoAutenticada("/api/inventory/history?limit=100")

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`)
    }

    const data = await response.json()

    if (data.success) {
      historicoCompleto = data.data || []
      console.log("✅ Histórico carregado:", historicoCompleto.length, "registros")

      // Aplicar filtros e atualizar interface
      aplicarFiltros()
    } else {
      throw new Error(data.message || "Erro ao carregar histórico")
    }
  } catch (error) {
    console.error("❌ Erro ao carregar histórico:", error)

    // Mostrar dados de exemplo em caso de erro
    console.log("⚠️ Usando dados de exemplo...")
    historicoCompleto = gerarDadosExemplo()
    aplicarFiltros()

    // Mostrar mensagem de erro
    mostrarMensagemErro("Erro ao carregar dados do servidor. Mostrando dados de exemplo.")
  } finally {
    mostrarLoading(false)
  }
}

// Gerar dados de exemplo para fallback
function gerarDadosExemplo() {
  const hoje = new Date()
  const dados = []

  for (let i = 0; i < 20; i++) {
    const data = new Date(hoje)
    data.setDate(data.getDate() - i)

    dados.push({
      id: i + 1,
      item_name: `Produto ${i + 1}`,
      operation_type: i % 3 === 0 ? "entrada" : i % 3 === 1 ? "saida" : "ajuste",
      old_quantity: Math.floor(Math.random() * 100),
      new_quantity: Math.floor(Math.random() * 100),
      quantity_change: Math.floor(Math.random() * 20) - 10,
      admin_name: "Admin Exemplo",
      supplier: i % 2 === 0 ? "Fornecedor A" : null,
      notes: `Observação ${i + 1}`,
      created_at: data.toISOString(),
      date: data.toISOString().split("T")[0],
      time: `${String(Math.floor(Math.random() * 24)).padStart(2, "0")}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}`,
    })
  }

  return dados
}

// Aplicar filtros
function aplicarFiltros() {
  console.log("🔍 Aplicando filtros:", { filtroTipo, filtroProduto, filtroData })

  historicoFiltrado = historicoCompleto.filter((item) => {
    const matchTipo = filtroTipo === "todos" || item.operation_type === filtroTipo
    const matchProduto = filtroProduto === "" || item.item_name.toLowerCase().includes(filtroProduto.toLowerCase())
    const matchData = filtroData === "" || item.date === filtroData

    return matchTipo && matchProduto && matchData
  })

  console.log("✅ Filtros aplicados:", historicoFiltrado.length, "registros")

  atualizarResumos()
  renderizarTabela()
}

// Atualizar resumos
function atualizarResumos() {
  const entradas = historicoFiltrado.filter((item) => item.operation_type === "entrada")
  const saidas = historicoFiltrado.filter((item) => item.operation_type === "saida")

  const totalEntradas = entradas.length
  const totalSaidas = saidas.length
  const totalMovimentacoes = historicoFiltrado.length

  // Calcular peso/volume (usando quantity_change como aproximação)
  const pesoEntradas = entradas.reduce((acc, item) => acc + Math.abs(item.quantity_change || 0), 0)
  const pesoSaidas = saidas.reduce((acc, item) => acc + Math.abs(item.quantity_change || 0), 0)
  const saldoLiquido = pesoEntradas - pesoSaidas

  // Atualizar elementos
  document.getElementById("total-entradas").textContent = totalEntradas
  document.getElementById("total-saidas").textContent = totalSaidas
  document.getElementById("total-movimentacoes").textContent = totalMovimentacoes
  document.getElementById("peso-entradas").textContent = `${pesoEntradas.toFixed(1)} kg/L total`
  document.getElementById("peso-saidas").textContent = `${pesoSaidas.toFixed(1)} kg/L total`
  document.getElementById("saldo-liquido").textContent = saldoLiquido.toFixed(1)
}

// Renderizar tabela
function renderizarTabela() {
  const tbody = document.getElementById("tabela-historico")
  const estadoVazio = document.getElementById("estado-vazio")

  if (historicoFiltrado.length === 0) {
    tbody.innerHTML = ""
    estadoVazio.style.display = "flex"
    return
  }

  estadoVazio.style.display = "none"

  tbody.innerHTML = historicoFiltrado
    .map((item) => {
      const tipoClass =
        item.operation_type === "entrada"
          ? "badge-entrada"
          : item.operation_type === "saida"
            ? "badge-saida"
            : "badge-ajuste"
      const tipoIcon =
        item.operation_type === "entrada"
          ? "trending-up"
          : item.operation_type === "saida"
            ? "trending-down"
            : "settings"
      const tipoTexto =
        item.operation_type === "entrada" ? "Entrada" : item.operation_type === "saida" ? "Saída" : "Ajuste"

      const diferenca = item.quantity_change || item.new_quantity - item.old_quantity
      const diferencaClass = diferenca > 0 ? "text-green-600" : diferenca < 0 ? "text-red-600" : "text-gray-600"
      const diferencaIcon = diferenca > 0 ? "+" : ""

      return `
      <tr>
        <td>
          <div class="font-medium">${formatarData(item.date)}</div>
          <div class="text-gray-500" style="font-size: 0.75rem;">${item.time}</div>
        </td>
        <td class="font-medium">${item.item_name}</td>
        <td>
          <span class="badge ${tipoClass}">
            <i data-lucide="${tipoIcon}" class="badge-icon"></i>
            ${tipoTexto}
          </span>
        </td>
        <td class="text-right font-medium">${item.old_quantity || 0}</td>
        <td class="text-right font-medium">${item.new_quantity || 0}</td>
        <td class="text-right font-medium ${diferencaClass}">
          ${diferencaIcon}${Math.abs(diferenca).toFixed(1)}
        </td>
        <td>${item.admin_name || "Sistema"}</td>
        <td class="truncate">${item.notes || item.supplier || "-"}</td>
      </tr>
    `
    })
    .join("")

  // Reinicializar ícones do Lucide
  if (typeof lucide !== "undefined") {
    lucide.createIcons()
  }
}

// Função para formatar data
function formatarData(dataString) {
  if (!dataString) return "-"

  try {
    const data = new Date(dataString)
    return data.toLocaleDateString("pt-BR")
  } catch (error) {
    return dataString
  }
}

// Mostrar/esconder loading
function mostrarLoading(mostrar) {
  const loadingState = document.getElementById("loading-state")
  const summarySection = document.getElementById("summary-section")

  if (loadingState) {
    loadingState.style.display = mostrar ? "block" : "none"
  }

  if (summarySection) {
    summarySection.style.display = mostrar ? "none" : "grid"
  }
}

// Mostrar mensagem de erro
function mostrarMensagemErro(mensagem) {
  // Criar elemento de erro se não existir
  let errorDiv = document.getElementById("error-message")

  if (!errorDiv) {
    errorDiv = document.createElement("div")
    errorDiv.id = "error-message"
    errorDiv.className = "card"
    errorDiv.style.cssText = "margin-bottom: 1rem; background-color: #fee; border-color: #fcc; color: #c33;"

    const container = document.querySelector(".container")
    const header = document.querySelector(".page-header")
    container.insertBefore(errorDiv, header.nextSibling)
  }

  errorDiv.innerHTML = `
    <div class="card-content" style="padding: 1rem;">
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <i data-lucide="alert-triangle" style="color: #c33;"></i>
        <span>${mensagem}</span>
      </div>
    </div>
  `

  // Reinicializar ícones
  if (typeof lucide !== "undefined") {
    lucide.createIcons()
  }

  // Auto-remover após 5 segundos
  setTimeout(() => {
    if (errorDiv) {
      errorDiv.remove()
    }
  }, 5000)
}

// Função para exportar relatório
function exportarRelatorio() {
  console.log("📊 Exportando relatório...")

  if (historicoFiltrado.length === 0) {
    alert("Nenhum dado para exportar!")
    return
  }

  // Preparar dados para CSV
  const headers = [
    "Data",
    "Hora",
    "Produto",
    "Tipo",
    "Qtd Anterior",
    "Qtd Nova",
    "Diferença",
    "Responsável",
    "Observações",
  ]

  const csvData = historicoFiltrado.map((item) => {
    const diferenca = item.quantity_change || item.new_quantity - item.old_quantity
    return [
      formatarData(item.date),
      item.time,
      item.item_name,
      item.operation_type === "entrada" ? "Entrada" : item.operation_type === "saida" ? "Saída" : "Ajuste",
      item.old_quantity || 0,
      item.new_quantity || 0,
      diferenca.toFixed(1),
      item.admin_name || "Sistema",
      item.notes || item.supplier || "-",
    ]
  })

  // Criar CSV
  const csvContent = [headers, ...csvData].map((row) => row.map((field) => `"${field}"`).join(",")).join("\n")

  // Download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)

  link.setAttribute("href", url)
  link.setAttribute("download", `historico-estoque-${new Date().toISOString().split("T")[0]}.csv`)
  link.style.visibility = "hidden"

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  console.log("✅ Relatório exportado com sucesso!")
}

// Adicionar estilos CSS para badges personalizadas
const style = document.createElement("style")
style.textContent = `
  .badge-ajuste {
    background-color: rgba(184, 134, 11, 0.1);
    color: #b8860b;
  }
  
  .text-green-600 {
    color: #16a34a;
  }
  
  .text-red-600 {
    color: #dc2626;
  }
  
  .text-gray-600 {
    color: #6b7280;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`
document.head.appendChild(style)

console.log("✅ Sistema de histórico de estoque carregado!")
