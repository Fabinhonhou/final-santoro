const fs = require("fs")
const path = require("path")

console.log("=== ALTERNATIVAS PARA MYSQL ===\n")

console.log("🎯 SOLUÇÕES RÁPIDAS:\n")

console.log("📦 1. XAMPP (MAIS FÁCIL - RECOMENDADO)")
console.log("   ✅ Inclui MySQL, Apache, PHP")
console.log("   ✅ Interface gráfica simples")
console.log("   ✅ Não precisa configurar")
console.log("   📥 Download: https://www.apachefriends.org/download.html")
console.log("   🚀 Após instalar: Abra XAMPP Control Panel → Start MySQL\n")

console.log("📦 2. MySQL Installer")
console.log("   ✅ Instalação oficial do MySQL")
console.log("   ⚠️  Requer mais configuração")
console.log("   📥 Download: https://dev.mysql.com/downloads/installer/")
console.log("   🚀 Escolha 'Developer Default' na instalação\n")

console.log("📦 3. WAMP (Windows)")
console.log("   ✅ Similar ao XAMPP")
console.log("   ✅ Interface em português")
console.log("   📥 Download: https://www.wampserver.com/\n")

console.log("📦 4. MySQL Portable (Avançado)")
console.log("   ✅ Não precisa instalar")
console.log("   ⚠️  Configuração manual")
console.log("   📥 Download: https://dev.mysql.com/downloads/mysql/\n")

console.log("🔧 APÓS INSTALAR QUALQUER OPÇÃO:")
console.log("1. Execute: node server/check-mysql-status.js")
console.log("2. Se MySQL estiver rodando, execute: node server/server.js")
console.log("3. Acesse: http://localhost:3000/reservaCompleta.html\n")

console.log("💡 RECOMENDAÇÃO:")
console.log("Use o XAMPP - é a opção mais simples e rápida!")
console.log("Após instalar, só precisa clicar em 'Start' no MySQL.")

// Criar arquivo de configuração para XAMPP
const xamppConfig = `# Configuração para XAMPP
# Após instalar XAMPP, copie este conteúdo para server/.env

JWT_SECRET=b6203381221684dfc0504aa5bfeaa9e06ed7434ba146f02c54480b45ad785180
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=santoros_restaurant
ADMIN_PASSWORD=admin123
PORT=3000`

fs.writeFileSync(path.join(__dirname, "xampp-config.txt"), xamppConfig)
console.log("\n✅ Arquivo 'xampp-config.txt' criado com configurações para XAMPP")
