# Santoro's Italian Restaurant - Sistema Completo

Sistema completo para o restaurante Santoro's, incluindo website, sistema de reservas, autenticação de usuários e painel administrativo.

## 🚀 Funcionalidades

### Frontend
- **Website responsivo** com design moderno
- **Sistema de autenticação** (login/registro)
- **Sistema de reservas** integrado
- **Cardápio dinâmico** 
- **Dashboard do usuário**
- **Interface mobile-friendly**

### Backend
- **API RESTful** com Node.js e Express
- **Autenticação JWT** segura
- **Banco de dados MySQL** 
- **Sistema de reservas** completo
- **Painel administrativo** para gerenciamento
- **Gestão de inventário**

## 📋 Pré-requisitos

- Node.js (versão 14 ou superior)
- MySQL (versão 5.7 ou superior)
- npm ou yarn

## 🛠️ Instalação

### 1. Clone o repositório
\`\`\`bash
git clone <url-do-repositorio>
cd santoros-restaurant
\`\`\`

### 2. Configure o banco de dados
Certifique-se de que o MySQL está rodando e crie um usuário com permissões adequadas.

### 3. Configure as variáveis de ambiente
Copie o arquivo `.env` para a pasta `server/` e ajuste as configurações:

\`\`\`env
JWT_SECRET=b6203381221684dfc0504aa5bfeaa9e06ed7434ba146f02c54480b45ad785180
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=SuaSenhaMySQL
DB_NAME=santoros_restaurant
ADMIN_PASSWORD=admin123
PORT=3000
\`\`\`

### 4. Instale as dependências e inicialize o banco
\`\`\`bash
cd server
npm run setup
\`\`\`

Este comando irá:
- Instalar todas as dependências
- Criar o banco de dados
- Criar todas as tabelas necessárias
- Inserir dados de exemplo
- Criar usuário administrador

### 5. Inicie o servidor
\`\`\`bash
npm start
\`\`\`

Para desenvolvimento com auto-reload:
\`\`\`bash
npm run dev
\`\`\`

## 🌐 Acesso ao Sistema

### Website Principal
- **URL**: http://localhost:3000
- **Páginas**: Home, Cardápio, Reservas, Login/Registro

### Painel Administrativo
- **URL**: http://localhost:3000/admin-login.html
- **Email**: admin@santoros.com
- **Senha**: admin123 (ou a definida no .env)

### Dashboard do Usuário
- **URL**: http://localhost:3000/dashboard.html
- **Acesso**: Após fazer login como usuário

## 📁 Estrutura do Projeto

\`\`\`
santoros-restaurant/
├── server/                 # Backend
│   ├── server.js          # Servidor principal
│   ├── init-db.js         # Inicialização do banco
│   ├── package.json       # Dependências do backend
│   └── .env              # Variáveis de ambiente
├── css/                   # Estilos CSS
├── js/                    # Scripts JavaScript
│   ├── auth.js           # Sistema de autenticação
│   ├── reservations.js   # Sistema de reservas
│   ├── script.js         # Scripts gerais
│   ├── bia.js           # Scripts específicos
│   ├── cardapio.js      # Scripts do cardápio
│   └── contato.js       # Scripts de contato
├── img/                   # Imagens
├── index.html            # Página principal
├── login.html            # Página de login
├── registro.html         # Página de registro
├── cardapio.html         # Página do cardápio
├── reservas.html         # Página de reservas
├── dashboard.html        # Dashboard do usuário
└── README.md             # Este arquivo
\`\`\`

## 🔧 API Endpoints

### Autenticação
- `POST /api/register` - Registro de usuário
- `POST /api/login` - Login de usuário
- `GET /api/user/profile` - Perfil do usuário (autenticado)

### Reservas
- `POST /api/reservations` - Criar reserva
- `GET /api/reservations` - Listar reservas do usuário (autenticado)
- `PUT /api/reservations/:id/cancel` - Cancelar reserva (autenticado)

### Menu
- `GET /api/menu` - Listar itens do menu

### Admin
- `POST /api/admin/login` - Login administrativo
- `GET /api/admin/stats` - Estatísticas do dashboard
- `GET /api/admin/reservations` - Listar todas as reservas
- `PUT /api/admin/reservations/:id` - Atualizar status da reserva
- `GET /api/admin/inventory` - Gerenciar inventário
- `GET /api/admin/menu` - Gerenciar menu

## 🎨 Funcionalidades do Frontend

### Sistema de Autenticação
- Registro com validação completa
- Login seguro com JWT
- Dashboard personalizado
- Logout automático

### Sistema de Reservas
- Formulário intuitivo
- Validação de datas
- Histórico de reservas
- Cancelamento de reservas

### Design Responsivo
- Mobile-first approach
- Menu hambúrguer para mobile
- Layouts adaptativos
- Otimização para touch

## 🔒 Segurança

- Senhas criptografadas com bcrypt
- Autenticação JWT com expiração
- Validação de dados no frontend e backend
- Proteção contra SQL injection
- Headers de segurança configurados

## 🚀 Deploy

### Desenvolvimento Local
\`\`\`bash
cd server
npm run dev
\`\`\`

### Produção
1. Configure as variáveis de ambiente para produção
2. Use um processo manager como PM2
3. Configure proxy reverso (nginx)
4. Use HTTPS em produção

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique se o MySQL está rodando
2. Confirme as configurações do .env
3. Execute `npm run init-db` para recriar o banco
4. Verifique os logs do servidor

## 📝 Licença

Este projeto está sob a licença MIT.
\`\`\`

## 🎉 Sistema Completo Configurado!

Agora você tem um sistema completo e funcional com:

### ✅ **Frontend Integrado**
- Todos os seus arquivos HTML preservados
- Sistema de autenticação funcional
- Reservas integradas com o backend
- Design responsivo mantido

### ✅ **Backend Robusto**
- API completa para todas as funcionalidades
- Banco de dados MySQL configurado
- Sistema de autenticação JWT
- Painel administrativo

### ✅ **Funcionalidades Principais**
- **Registro/Login** de usuários
- **Sistema de reservas** completo
- **Dashboard** personalizado
- **Painel admin** para gerenciamento
- **Cardápio dinâmico**

### 🚀 **Para começar:**

1. **Configure o MySQL** e ajuste o arquivo `.env`
2. **Execute**: `cd server && npm run setup`
3. **Inicie**: `npm start`
4. **Acesse**: http://localhost:3000

O sistema está pronto para uso com todas as suas páginas integradas ao backend!
