require("dotenv").config()
const mysql = require("mysql2/promise")
const bcrypt = require("bcrypt")

async function testUserCreation() {
  console.log("=== TESTANDO CRIAÇÃO DE USUÁRIO ===")

  try {
    // Conectar ao banco de dados
    const db = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "santoros_restaurant",
    })

    console.log("✅ Conectado ao banco de dados")

    // Verificar estrutura da tabela users
    console.log("\n📋 Estrutura da tabela users:")
    const [columns] = await db.execute("DESCRIBE users")
    columns.forEach((col) => {
      console.log(`   - ${col.Field}: ${col.Type} ${col.Null === "NO" ? "NOT NULL" : "NULL"}`)
    })

    // Dados de teste
    const testUser = {
      name: "João Teste",
      email: "joao.teste@email.com",
      password: "senha123456",
      cpf: "12345678901",
      date_birth: "1990-05-15",
    }

    console.log("\n💾 Testando inserção de usuário:")
    console.log("Dados:", testUser)

    // Verificar se usuário já existe
    const [existingUsers] = await db.execute("SELECT id FROM users WHERE email = ?", [testUser.email])

    if (existingUsers.length > 0) {
      console.log("⚠️ Usuário já existe, removendo para teste...")
      await db.execute("DELETE FROM users WHERE email = ?", [testUser.email])
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(testUser.password, 12)

    // Inserir usuário
    const [result] = await db.execute(
      "INSERT INTO users (name, email, password, cpf, date_birth) VALUES (?, ?, ?, ?, ?)",
      [testUser.name, testUser.email, hashedPassword, testUser.cpf, testUser.date_birth],
    )

    console.log("✅ Usuário inserido com ID:", result.insertId)

    // Verificar se foi salvo corretamente
    const [savedUser] = await db.execute(
      "SELECT id, name, email, cpf, date_birth, created_at FROM users WHERE id = ?",
      [result.insertId],
    )

    console.log("\n✅ Dados salvos no banco:")
    console.log("ID:", savedUser[0].id)
    console.log("Nome:", savedUser[0].name)
    console.log("Email:", savedUser[0].email)
    console.log("CPF:", savedUser[0].cpf)
    console.log("Data de Nascimento:", savedUser[0].date_birth)
    console.log("Criado em:", savedUser[0].created_at)

    // Testar login
    console.log("\n🔐 Testando login...")
    const passwordMatch = await bcrypt.compare(testUser.password, hashedPassword)
    console.log("Senha confere:", passwordMatch ? "✅ Sim" : "❌ Não")

    await db.end()
    console.log("\n✅ TESTE CONCLUÍDO COM SUCESSO!")
  } catch (error) {
    console.error("\n❌ ERRO NO TESTE:", error.message)
    console.error(error)
  }
}

testUserCreation().catch(console.error)
