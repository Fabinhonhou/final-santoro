require("dotenv").config()
const mysql = require("mysql2/promise")

async function diagnoseDatabase() {
  console.log("=== DIAGNÓSTICO DO BANCO DE DADOS ===")
  console.log("Configurações:")
  console.log("- Host:", process.env.DB_HOST)
  console.log("- Port:", process.env.DB_PORT)
  console.log("- User:", process.env.DB_USER)
  console.log("- Password:", process.env.DB_PASSWORD ? "[DEFINIDA]" : "[VAZIA]")
  console.log("- Database:", process.env.DB_NAME)

  try {
    // Teste 1: Conectar sem especificar banco de dados
    console.log("\n1. Tentando conectar ao MySQL sem especificar banco de dados...")
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
    })
    console.log("✅ Conexão bem-sucedida!")

    // Teste 2: Verificar permissões
    console.log("\n2. Verificando permissões para criar banco de dados...")
    try {
      const dbName = process.env.DB_NAME || "santoros_restaurant"
      await connection.execute(`CREATE DATABASE IF NOT EXISTS ${dbName}`)
      console.log(`✅ Permissão para criar banco de dados "${dbName}" confirmada!`)
    } catch (error) {
      console.error("❌ Erro ao criar banco de dados:", error.message)
      console.log("\nSolução: Você precisa de permissões para criar bancos de dados.")
      console.log("1. Use um usuário com mais privilégios")
      console.log("2. Ou crie o banco de dados manualmente com:")
      console.log(`   CREATE DATABASE ${process.env.DB_NAME || "santoros_restaurant"};`)
      return
    }

    // Teste 3: Conectar ao banco específico
    console.log("\n3. Conectando ao banco de dados específico...")
    try {
      await connection.execute(`USE ${process.env.DB_NAME || "santoros_restaurant"}`)
      console.log("✅ Conexão ao banco específico bem-sucedida!")
    } catch (error) {
      console.error("❌ Erro ao conectar ao banco específico:", error.message)
      return
    }

    // Teste 4: Criar uma tabela de teste
    console.log("\n4. Tentando criar uma tabela de teste...")
    try {
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS test_table (
          id INT AUTO_INCREMENT PRIMARY KEY,
          test_column VARCHAR(255)
        )
      `)
      console.log("✅ Tabela de teste criada com sucesso!")
    } catch (error) {
      console.error("❌ Erro ao criar tabela de teste:", error.message)
      return
    }

    // Teste 5: Verificar tabelas existentes
    console.log("\n5. Verificando tabelas existentes...")
    const [tables] = await connection.execute("SHOW TABLES")
    console.log("Tabelas encontradas:", tables.length)
    tables.forEach((table) => {
      const tableName = Object.values(table)[0]
      console.log(`   - ${tableName}`)
    })

    await connection.end()
    console.log("\n✅ DIAGNÓSTICO CONCLUÍDO COM SUCESSO!")
  } catch (error) {
    console.error("\n❌ ERRO DE CONEXÃO:", error.message)
    console.log("\nVerifique:")
    console.log("1. Se o MySQL está rodando")
    console.log("2. Se as credenciais estão corretas")
    console.log("3. Se o host e porta estão corretos")
  }
}

diagnoseDatabase().catch(console.error)
