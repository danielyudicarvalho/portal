#!/bin/bash

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Verificando status dos serviços...${NC}"
echo ""

# Função para verificar serviço
check_service() {
    local service_name=$1
    local url=$2
    local expected_code=${3:-200}
    
    echo -n "Verificando $service_name... "
    
    if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "$expected_code"; then
        echo -e "${GREEN}✅ OK${NC}"
        return 0
    else
        echo -e "${RED}❌ FALHOU${NC}"
        return 1
    fi
}

# Verificar containers Docker
echo -e "${YELLOW}📦 Status dos Containers:${NC}"
docker compose -f docker-compose.dev.yml ps
echo ""

# Verificar serviços web
echo -e "${YELLOW}🌐 Verificando Conectividade:${NC}"
check_service "Next.js App" "http://localhost:3000"
check_service "Multiplayer Server" "http://localhost:3002" "404"

# Verificar banco de dados
echo -n "Verificando PostgreSQL... "
if docker compose -f docker-compose.dev.yml exec -T postgres pg_isready -U gameuser -q; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ FALHOU${NC}"
fi

# Verificar Redis
echo -n "Verificando Redis... "
if docker compose -f docker-compose.dev.yml exec -T redis redis-cli ping | grep -q "PONG"; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ FALHOU${NC}"
fi

echo ""
echo -e "${BLUE}🎯 URLs Disponíveis:${NC}"
echo "   • Aplicação: http://localhost:3000"
echo "   • Depósitos: http://localhost:3000/account/deposit"
echo "   • Multiplayer: ws://localhost:3002"
echo ""
echo -e "${BLUE}💳 Para testar Stripe:${NC}"
echo "   npm run stripe:listen"
echo ""
echo -e "${BLUE}📊 Para ver logs:${NC}"
echo "   npm run docker:logs"