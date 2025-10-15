# 🐳 Guia Completo - Executando com Docker + Stripe

## ✅ **Projeto Rodando com Sucesso!**

Seu Game Portal está agora executando completamente em containers Docker com suporte total ao Stripe.

## 🌐 **URLs Disponíveis**

- **Aplicação Principal**: http://localhost:3000
- **Servidor Multiplayer**: ws://localhost:3002
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

## 🚀 **Comandos Principais**

### **Iniciar o projeto:**
```bash
npm run docker:start
# ou
./scripts/start-with-docker.sh
```

### **Parar o projeto:**
```bash
npm run docker:stop
# ou
docker compose -f docker-compose.dev.yml down
```

### **Ver logs em tempo real:**
```bash
npm run docker:logs
# ou
docker compose -f docker-compose.dev.yml logs -f
```

### **Ver logs de um serviço específico:**
```bash
docker compose -f docker-compose.dev.yml logs -f app
docker compose -f docker-compose.dev.yml logs -f postgres
docker compose -f docker-compose.dev.yml logs -f redis
docker compose -f docker-compose.dev.yml logs -f multiplayer-server
```

## 💳 **Testando o Stripe**

### **1. Acesse a página de depósito:**
http://localhost:3000/account/deposit

### **2. Em outro terminal, inicie o listener de webhooks:**
```bash
npm run stripe:listen
```

### **3. Use cartões de teste:**
- **Sucesso**: `4242 4242 4242 4242`
- **Falha**: `4000 0000 0000 0002`
- **Data**: Qualquer futura (12/25)
- **CVC**: Qualquer 3 dígitos (123)

### **4. Teste eventos automaticamente:**
```bash
npm run stripe:test
```

## 🔧 **Estrutura dos Containers**

### **App Container (Next.js)**
- **Porta**: 3000
- **Função**: Interface web principal
- **Inclui**: Stripe integration, NextAuth, Prisma
- **Comando**: `npm run dev`

### **Multiplayer Server Container**
- **Porta**: 3002
- **Função**: Servidor de jogos multiplayer
- **Tecnologia**: Colyseus
- **Comando**: `npm run dev:multiplayer`

### **PostgreSQL Container**
- **Porta**: 5432
- **Função**: Banco de dados principal
- **Dados**: Usuários, transações, jogos
- **Versão**: PostgreSQL 15 Alpine

### **Redis Container**
- **Porta**: 6379
- **Função**: Cache e sessões multiplayer
- **Versão**: Redis 7 Alpine

## 📊 **Monitoramento**

### **Status dos containers:**
```bash
docker compose -f docker-compose.dev.yml ps
```

### **Uso de recursos:**
```bash
docker stats
```

### **Logs específicos:**
```bash
# Logs da aplicação
docker compose -f docker-compose.dev.yml logs app

# Logs do banco
docker compose -f docker-compose.dev.yml logs postgres

# Logs do Redis
docker compose -f docker-compose.dev.yml logs redis
```

## 🛠️ **Desenvolvimento**

### **Modificar código:**
- Os arquivos são sincronizados automaticamente via volumes
- Mudanças no código são refletidas imediatamente (hot reload)
- Não precisa rebuildar a imagem para mudanças de código

### **Adicionar dependências:**
```bash
# Parar containers
npm run docker:stop

# Rebuildar imagens
docker compose -f docker-compose.dev.yml build

# Reiniciar
npm run docker:start
```

### **Executar comandos no container:**
```bash
# Acessar shell do container da app
docker compose -f docker-compose.dev.yml exec app sh

# Executar Prisma Studio
docker compose -f docker-compose.dev.yml exec app npx prisma studio

# Executar migrações
docker compose -f docker-compose.dev.yml exec app npx prisma migrate dev
```

## 🗄️ **Banco de Dados**

### **Acessar PostgreSQL:**
```bash
docker compose -f docker-compose.dev.yml exec postgres psql -U gameuser -d game_portal
```

### **Backup do banco:**
```bash
docker compose -f docker-compose.dev.yml exec postgres pg_dump -U gameuser game_portal > backup.sql
```

### **Restaurar backup:**
```bash
docker compose -f docker-compose.dev.yml exec -T postgres psql -U gameuser -d game_portal < backup.sql
```

## 🔍 **Troubleshooting**

### **Container não inicia:**
```bash
# Ver logs detalhados
docker compose -f docker-compose.dev.yml logs [service-name]

# Rebuildar imagem
docker compose -f docker-compose.dev.yml build [service-name]
```

### **Erro de conexão com banco:**
```bash
# Verificar se PostgreSQL está rodando
docker compose -f docker-compose.dev.yml ps postgres

# Testar conexão
docker compose -f docker-compose.dev.yml exec postgres pg_isready -U gameuser
```

### **Stripe não funciona:**
1. Verifique se as chaves estão no `.env.local`
2. Confirme se o webhook listener está rodando
3. Teste com `npm run stripe:test`

### **Limpar tudo e recomeçar:**
```bash
# Parar e remover containers
docker compose -f docker-compose.dev.yml down -v

# Remover imagens
docker rmi gomi-app gomi-multiplayer-server

# Reconstruir tudo
npm run docker:start
```

## 📁 **Volumes Persistentes**

- **postgres_data**: Dados do PostgreSQL
- **redis_data**: Dados do Redis
- **Código fonte**: Sincronizado em tempo real

### **Limpar volumes:**
```bash
docker compose -f docker-compose.dev.yml down -v
docker volume prune
```

## 🚀 **Deploy para Produção**

Para produção, você precisará:

1. **Criar docker-compose.prod.yml**
2. **Usar chaves live do Stripe**
3. **Configurar HTTPS**
4. **Configurar webhook em produção**
5. **Usar banco de dados externo**

## 📋 **Checklist de Funcionamento**

- [x] ✅ Containers iniciando corretamente
- [x] ✅ Next.js rodando na porta 3000
- [x] ✅ Multiplayer server na porta 3002
- [x] ✅ PostgreSQL acessível
- [x] ✅ Redis funcionando
- [x] ✅ Stripe configurado
- [x] ✅ Webhooks prontos para teste
- [x] ✅ Hot reload funcionando

## 🎉 **Próximos Passos**

1. **Teste a aplicação**: http://localhost:3000
2. **Faça login** com Google OAuth
3. **Teste depósitos**: http://localhost:3000/account/deposit
4. **Jogue alguns jogos** multiplayer
5. **Monitore os logs** para ver tudo funcionando

Seu ambiente de desenvolvimento está 100% funcional! 🚀