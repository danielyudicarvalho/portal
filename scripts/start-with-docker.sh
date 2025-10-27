#!/bin/bash

echo "🚀 Iniciando Game Portal com Docker + Stripe..."
echo ""

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Função para imprimir com cor
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar se o Docker está rodando
if ! docker info > /dev/null 2>&1; then
    print_error "Docker não está rodando. Por favor, inicie o Docker primeiro."
    exit 1
fi

# Verificar se as variáveis do Stripe estão configuradas
if ! grep -q "STRIPE_SECRET_KEY=" .env.local || ! grep -q "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=" .env.local; then
    print_warning "Variáveis do Stripe não encontradas no .env.local"
    print_warning "Certifique-se de configurar suas chaves do Stripe antes de continuar."
fi

print_status "Parando containers existentes..."
docker compose -f docker-compose.dev.yml down

print_status "Construindo imagens Docker..."
docker compose -f docker-compose.dev.yml build

print_status "Iniciando serviços..."
docker compose -f docker-compose.dev.yml up -d

print_status "Aguardando serviços ficarem prontos..."
sleep 10

# Verificar se os serviços estão rodando
if docker compose -f docker-compose.dev.yml ps | grep -q "Up"; then
    print_success "Serviços iniciados com sucesso!"
    echo ""
    echo "📋 Status dos serviços:"
    docker compose -f docker-compose.dev.yml ps
    echo ""
    echo "🌐 URLs disponíveis:"
    echo "   • Aplicação: http://localhost:3000"
    echo "   • Multiplayer: ws://localhost:3002"
    echo "   • PostgreSQL: localhost:5432"
    echo "   • Redis: localhost:6379"
    echo ""
    echo "💳 Para testar Stripe:"
    echo "   1. Acesse: http://localhost:3000/account/deposit"
    echo "   2. Use cartão de teste: 4242 4242 4242 4242"
    echo "   3. Execute em outro terminal: npm run stripe:listen"
    echo ""
    echo "📊 Para monitorar logs:"
    echo "   docker compose -f docker-compose.dev.yml logs -f"
    echo ""
    echo "🛑 Para parar:"
    echo "   docker compose -f docker-compose.dev.yml down"
else
    print_error "Falha ao iniciar alguns serviços. Verificando logs..."
    docker compose -f docker-compose.dev.yml logs
fi