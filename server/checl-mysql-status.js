const { exec } = require("child_process")
const fs = require("fs")
const path = require("path")

async function checkMySQLStatus() {
  console.log("=== VERIFICANDO STATUS DO MYSQL ===\n")

  // 1. Verificar se MySQL está instalado
  console.log("1. Verificando se MySQL está instalado...")

  return new Promise((resolve) => {
    exec("mysql --version", (error, stdout, stderr) => {
      if (error) {
        console.log("❌ MySQL não encontrado no PATH")
        console.log("❌ MySQL provavelmente não está instalado\n")
        showInstallInstructions()
        resolve(false)
      } else {
        console.log("✅ MySQL encontrado:", stdout.trim())
        checkMySQLService()
        resolve(true)
      }
    })
  })
}

function checkMySQLService() {
  console.log("\n2. Verificando serviços do MySQL...")

  exec('sc query type= service | findstr /i "mysql"', (error, stdout, stderr) => {
    if (error || !stdout.trim()) {
      console.log("❌ Nenhum serviço MySQL encontrado")
      console.log("💡 MySQL pode estar instalado mas não como serviço\n")
      checkMySQLProcesses()
    } else {
      console.log("✅ Serviços MySQL encontrados:")
      console.log(stdout)
      suggestServiceCommands()
    }
  })
}

function checkMySQLProcesses() {
  console.log("3. Verificando processos MySQL em execução...")

  exec('tasklist | findstr /i "mysql"', (error, stdout, stderr) => {
    if (error || !stdout.trim()) {
      console.log("❌ Nenhum processo MySQL em execução")
      showManualStartInstructions()
    } else {
      console.log("✅ Processos MySQL encontrados:")
      console.log(stdout)
      console.log("💡 MySQL está rodando, mas pode estar em porta diferente")
      testDifferentPorts()
    }
  })
}

function testDifferentPorts() {
  console.log("\n4. Testando conexão em portas comuns...")

  const mysql = require("mysql2/promise")
  const ports = [3306, 3307, 3308, 33060]

  ports.forEach(async (port) => {
    try {
      const connection = await mysql.createConnection({
        host: "localhost",
        port: port,
        user: "root",
        password: "",
        timeout: 2000,
      })

      console.log(`✅ MySQL encontrado na porta ${port}!`)
      await connection.end()

      // Atualizar .env com a porta correta
      updateEnvFile(port)
    } catch (error) {
      console.log(`❌ Porta ${port}: ${error.message}`)
    }
  })
}

function updateEnvFile(port) {
  const envPath = path.join(__dirname, ".env")
  let envContent = ""

  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, "utf8")
    envContent = envContent.replace(/DB_PORT=\d+/, `DB_PORT=${port}`)
  } else {
    envContent = `JWT_SECRET=b6203381221684dfc0504aa5bfeaa9e06ed7434ba146f02c54480b45ad785180
DB_HOST=localhost
DB_PORT=${port}
DB_USER=root
DB_PASSWORD=
DB_NAME=santoros_restaurant
ADMIN_PASSWORD=admin123
PORT=3000`
  }

  fs.writeFileSync(envPath, envContent)
  console.log(`✅ Arquivo .env atualizado com porta ${port}`)
}

function suggestServiceCommands() {
  console.log("\n🔧 COMANDOS PARA TENTAR:")
  console.log("1. net start MySQL80 (para MySQL 8.0)")
  console.log("2. net start MySQL57 (para MySQL 5.7)")
  console.log("3. net start MySQL (nome genérico)")
  console.log("4. net start WAMPSERVER (se usando WAMP)")
  console.log("5. net start XAMPP (se usando XAMPP)")
}

function showInstallInstructions() {
  console.log("🔧 OPÇÕES PARA INSTALAR MYSQL:")
  console.log("\n📦 OPÇÃO 1 - MySQL Installer (Recomendado):")
  console.log("1. Baixe: https://dev.mysql.com/downloads/installer/")
  console.log("2. Execute o instalador")
  console.log("3. Escolha 'Developer Default'")
  console.log("4. Configure senha para root")

  console.log("\n📦 OPÇÃO 2 - XAMPP (Mais fácil):")
  console.log("1. Baixe: https://www.apachefriends.org/download.html")
  console.log("2. Instale o XAMPP")
  console.log("3. Abra o XAMPP Control Panel")
  console.log("4. Clique em 'Start' no MySQL")

  console.log("\n📦 OPÇÃO 3 - WAMP:")
  console.log("1. Baixe: https://www.wampserver.com/")
  console.log("2. Instale o WAMP")
  console.log("3. Inicie o WampServer")

  console.log("\n📦 OPÇÃO 4 - MySQL Portable:")
  console.log("1. Baixe: https://dev.mysql.com/downloads/mysql/")
  console.log("2. Extraia em uma pasta")
  console.log("3. Execute manualmente")
}

function showManualStartInstructions() {
  console.log("\n🔧 SE MYSQL ESTÁ INSTALADO MAS NÃO RODANDO:")
  console.log("\n1. Procure pelo MySQL Workbench ou MySQL Command Line")
  console.log("2. Ou procure por 'Services' no Windows e procure MySQL")
  console.log("3. Ou execute como administrador:")
  console.log("   - Abra CMD como administrador")
  console.log("   - cd C:\\Program Files\\MySQL\\MySQL Server X.X\\bin")
  console.log("   - mysqld --console")

  console.log("\n4. Se usando XAMPP:")
  console.log("   - Abra XAMPP Control Panel")
  console.log("   - Clique em 'Start' ao lado de MySQL")

  console.log("\n5. Se usando WAMP:")
  console.log("   - Clique no ícone do WAMP na bandeja")
  console.log("   - Clique em 'Start All Services'")
}

// Executar verificação
checkMySQLStatus()
