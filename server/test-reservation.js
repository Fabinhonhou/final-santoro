const mysql = require("mysql2/promise")
require("dotenv").config()

async function testReservationsAPI() {
  console.log("=== TESTANDO API DE RESERVAS ===")

  try {
    // Testar conexão com banco
    console.log("1. Testando conexão com banco...")
    const db = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "santoros_restaurant",
    })

    console.log("✅ Conectado ao banco")

    // Verificar se tabela existe
    console.log("2. Verificando tabela reservations...")
    const [tables] = await db.execute("SHOW TABLES LIKE 'reservations'")

    if (tables.length === 0) {
      console.log("❌ Tabela reservations não existe! Criando...")
      await db.execute(`
        CREATE TABLE reservations (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          phone VARCHAR(20) NOT NULL,
          date DATE NOT NULL,
          time VARCHAR(10) NOT NULL,
          guests INT NOT NULL,
          special_requests TEXT,
          status ENUM('pending', 'confirmed', 'cancelled') DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_user_id (user_id),
          INDEX idx_date (date),
          INDEX idx_status (status)
        )
      `)
      console.log("✅ Tabela criada")
    } else {
      console.log("✅ Tabela reservations existe")
    }

    // Testar inserção direta
    console.log("3. Testando inserção direta...")
    const [result] = await db.execute(
      `INSERT INTO reservations (name, email, phone, date, time, guests, special_requests, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
      ["Teste Usuario", "teste@email.com", "(11) 99999-9999", "2025-12-25", "19:00", 4, "Teste de reserva"],
    )

    console.log("✅ Reserva teste inserida com ID:", result.insertId)

    // Verificar se foi salva
    const [reservations] = await db.execute("SELECT * FROM reservations WHERE id = ?", [result.insertId])
    console.log("✅ Reserva salva:", reservations[0])

    // Testar API via fetch
    console.log("4. Testando API via fetch...")
    const response = await fetch("http://localhost:3000/api/reservations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Teste API",
        email: "api@teste.com",
        phone: "(11) 88888-8888",
        date: "2025-12-31",
        time: "20:00",
        guests: 2,
        specialRequests: "Teste via API",
      }),
    })

    const apiResult = await response.json()
    console.log("📡 Resposta da API:", apiResult)

    if (apiResult.success) {
      console.log("✅ API funcionando corretamente!")
    } else {
      console.log("❌ Erro na API:", apiResult.message)
    }

    await db.end()
  } catch (error) {
    console.error("❌ Erro no teste:", error)
  }
}

testReservationsAPI()
