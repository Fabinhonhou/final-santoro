import mysql from "mysql2/promise"
import dotenv from "dotenv"

dotenv.config()

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "santoros_restaurant",
}

async function setupCompleteInventoryHistory() {
  let connection

  try {
    console.log("🚀 Configurando sistema de histórico de estoque...")
    console.log("🔧 Conectando ao banco de dados...")

    connection = await mysql.createConnection(dbConfig)
    console.log("✅ Conectado ao banco de dados!")

    console.log("📋 Criando tabela de histórico de estoque...")

    // Criar tabela de histórico de estoque
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS inventory_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        inventory_id INT,
        item_name VARCHAR(255) NOT NULL,
        operation_type ENUM('entrada', 'saida', 'ajuste') NOT NULL,
        old_quantity DECIMAL(10, 2) NOT NULL DEFAULT 0,
        new_quantity DECIMAL(10, 2) NOT NULL DEFAULT 0,
        quantity_change DECIMAL(10, 2) GENERATED ALWAYS AS (new_quantity - old_quantity) STORED,
        admin_id INT,
        admin_name VARCHAR(255),
        supplier VARCHAR(255),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_inventory_id (inventory_id),
        INDEX idx_operation_type (operation_type),
        INDEX idx_created_at (created_at),
        INDEX idx_item_name (item_name)
      )
    `)

    console.log("✅ Tabela inventory_history criada com sucesso!")

    console.log("🔧 Removendo triggers antigos se existirem...")

    // Remover triggers existentes usando query() em vez de execute()
    await connection.query("DROP TRIGGER IF EXISTS inventory_update_trigger")
    await connection.query("DROP TRIGGER IF EXISTS inventory_insert_trigger")

    console.log("🔧 Criando triggers para registrar mudanças automaticamente...")

    // Trigger para UPDATE usando query()
    await connection.query(`
      CREATE TRIGGER inventory_update_trigger
      AFTER UPDATE ON inventory
      FOR EACH ROW
      BEGIN
        IF OLD.current_stock != NEW.current_stock THEN
          INSERT INTO inventory_history (
            inventory_id,
            item_name,
            operation_type,
            old_quantity,
            new_quantity,
            admin_name,
            notes
          ) VALUES (
            NEW.id,
            NEW.name,
            CASE 
              WHEN NEW.current_stock > OLD.current_stock THEN 'entrada'
              WHEN NEW.current_stock < OLD.current_stock THEN 'saida'
              ELSE 'ajuste'
            END,
            OLD.current_stock,
            NEW.current_stock,
            'Sistema',
            CONCAT('Alteração automática: ', OLD.current_stock, ' → ', NEW.current_stock)
          );
        END IF;
      END
    `)

    console.log("✅ Trigger de UPDATE criado com sucesso!")

    // Trigger para INSERT (novos itens) usando query()
    await connection.query(`
      CREATE TRIGGER inventory_insert_trigger
      AFTER INSERT ON inventory
      FOR EACH ROW
      BEGIN
        INSERT INTO inventory_history (
          inventory_id,
          item_name,
          operation_type,
          old_quantity,
          new_quantity,
          admin_name,
          notes
        ) VALUES (
          NEW.id,
          NEW.name,
          'entrada',
          0,
          NEW.current_stock,
          'Sistema',
          'Item adicionado ao estoque'
        );
      END
    `)

    console.log("✅ Trigger de INSERT criado com sucesso!")

    console.log("📊 Verificando dados existentes...")

    // Verificar se já existem dados de exemplo
    const [existingHistory] = await connection.execute("SELECT COUNT(*) as count FROM inventory_history")
    console.log(`ℹ️ Registros existentes no histórico: ${existingHistory[0].count}`)

    if (existingHistory[0].count === 0) {
      console.log("📊 Inserindo dados de exemplo...")

      // Buscar itens do estoque para criar histórico de exemplo
      const [inventoryItems] = await connection.execute("SELECT * FROM inventory LIMIT 10")
      console.log(`ℹ️ Encontrados ${inventoryItems.length} itens no estoque`)

      if (inventoryItems.length > 0) {
        for (let i = 0; i < inventoryItems.length; i++) {
          const item = inventoryItems[i]

          // Criar histórico variado para cada item
          const baseQuantity = item.current_stock || 10

          // Entrada inicial (7 dias atrás)
          await connection.execute(
            `
            INSERT INTO inventory_history (
              inventory_id, item_name, operation_type, old_quantity, new_quantity, 
              admin_name, supplier, notes, created_at
            ) VALUES (?, ?, 'entrada', 0, ?, 'João Silva', 'Fornecedor Central', 'Estoque inicial', DATE_SUB(NOW(), INTERVAL 7 DAY))
          `,
            [item.id, item.name, baseQuantity + 50],
          )

          // Saída para uso (5 dias atrás)
          await connection.execute(
            `
            INSERT INTO inventory_history (
              inventory_id, item_name, operation_type, old_quantity, new_quantity, 
              admin_name, notes, created_at
            ) VALUES (?, ?, 'saida', ?, ?, 'Maria Santos', 'Uso na cozinha', DATE_SUB(NOW(), INTERVAL 5 DAY))
          `,
            [item.id, item.name, baseQuantity + 50, baseQuantity + 30],
          )

          // Entrada de reposição (3 dias atrás)
          await connection.execute(
            `
            INSERT INTO inventory_history (
              inventory_id, item_name, operation_type, old_quantity, new_quantity, 
              admin_name, supplier, notes, created_at
            ) VALUES (?, ?, 'entrada', ?, ?, 'Carlos Oliveira', 'Distribuidora ABC', 'Reposição de estoque', DATE_SUB(NOW(), INTERVAL 3 DAY))
          `,
            [item.id, item.name, baseQuantity + 30, baseQuantity + 60],
          )

          // Saída recente (1 dia atrás)
          await connection.execute(
            `
            INSERT INTO inventory_history (
              inventory_id, item_name, operation_type, old_quantity, new_quantity, 
              admin_name, notes, created_at
            ) VALUES (?, ?, 'saida', ?, ?, 'Ana Costa', 'Preparo do jantar', DATE_SUB(NOW(), INTERVAL 1 DAY))
          `,
            [item.id, item.name, baseQuantity + 60, baseQuantity],
          )
        }

        console.log("✅ Dados de exemplo inseridos com sucesso!")
      } else {
        console.log("⚠️ Nenhum item encontrado no estoque. Criando alguns itens de exemplo...")

        // Criar alguns itens de exemplo se não existirem
        const exemploItens = [
          { name: "Arroz Branco", current_stock: 25, unit: "kg", min_stock: 5 },
          { name: "Feijão Preto", current_stock: 15, unit: "kg", min_stock: 3 },
          { name: "Óleo de Soja", current_stock: 12, unit: "L", min_stock: 2 },
          { name: "Sal Refinado", current_stock: 8, unit: "kg", min_stock: 1 },
          { name: "Açúcar Cristal", current_stock: 20, unit: "kg", min_stock: 5 },
        ]

        for (const item of exemploItens) {
          await connection.execute(
            `
            INSERT INTO inventory (name, current_stock, unit, min_stock) 
            VALUES (?, ?, ?, ?)
          `,
            [item.name, item.current_stock, item.unit, item.min_stock],
          )
        }

        console.log("✅ Itens de exemplo criados! Os triggers criarão o histórico automaticamente.")
      }
    } else {
      console.log("ℹ️ Dados de exemplo já existem, pulando inserção...")
    }

    // Verificar o resultado final
    const [finalCount] = await connection.execute("SELECT COUNT(*) as count FROM inventory_history")
    console.log(`📊 Total de registros no histórico: ${finalCount[0].count}`)

    console.log("")
    console.log("🎉 Sistema de histórico de estoque configurado com sucesso!")
    console.log("")
    console.log("📋 Próximos passos:")
    console.log("1. Reinicie o servidor: node server.js")
    console.log("2. Acesse: http://localhost:3000/estoque-historico.html")
    console.log("3. Faça login como admin para ver o histórico")
    console.log("")
    console.log("🔧 Funcionalidades disponíveis:")
    console.log("- ✅ Histórico automático de todas as mudanças no estoque")
    console.log("- ✅ Filtros por tipo, produto e data")
    console.log("- ✅ Exportação de relatórios em CSV")
    console.log("- ✅ Estatísticas em tempo real")
    console.log("- ✅ Triggers automáticos para capturar mudanças")
  } catch (error) {
    console.error("❌ Erro ao configurar histórico de estoque:", error)

    if (error.code === "ER_NO_SUCH_TABLE") {
      console.log("💡 Dica: Execute primeiro o script de criação do banco de dados")
    } else if (error.code === "ECONNREFUSED") {
      console.log("💡 Dica: Verifique se o MySQL está rodando")
    } else if (error.code === "ER_ACCESS_DENIED_ERROR") {
      console.log("💡 Dica: Verifique as credenciais do banco no arquivo .env")
    }

    throw error
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}

// Executar o setup
setupCompleteInventoryHistory()
  .then(() => {
    console.log("✅ Script executado com sucesso!")
    process.exit(0)
  })
  .catch((error) => {
    console.error("❌ Erro ao executar script:", error)
    process.exit(1)
  })
