#!/bin/bash

echo "🧪 Testando funcionalidade de saldo e depósito..."
echo ""

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Verificar se a aplicação está rodando
print_status "Verificando se a aplicação está rodando..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200"; then
    print_success "Aplicação está rodando em http://localhost:3000"
else
    print_warning "Aplicação não está acessível. Execute: npm run docker:start"
    exit 1
fi

# Verificar endpoint de saldo
print_status "Testando endpoint de saldo..."
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/account/balance)
if [ "$response" = "401" ]; then
    print_success "Endpoint de saldo funcionando (401 = não autenticado, esperado)"
elif [ "$response" = "200" ]; then
    print_success "Endpoint de saldo funcionando (200 = usuário autenticado)"
else
    print_warning "Endpoint de saldo retornou código: $response"
fi

# Verificar página de depósito
print_status "Testando página de depósito..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/account/deposit | grep -q "200"; then
    print_success "Página de depósito acessível"
else
    print_warning "Página de depósito pode ter problemas"
fi

echo ""
echo -e "${BLUE}🎯 URLs para testar:${NC}"
echo "   • Página principal: http://localhost:3000"
echo "   • Página de depósito: http://localhost:3000/account/deposit"
echo "   • Página de conta: http://localhost:3000/account"
echo ""
echo -e "${BLUE}📋 Como testar:${NC}"
echo "   1. Acesse http://localhost:3000"
echo "   2. Faça login com Google"
echo "   3. Veja o saldo e botão 'Depositar' no header"
echo "   4. Clique em 'Depositar' para testar"
echo ""
echo -e "${BLUE}💳 Para testar Stripe:${NC}"
echo "   npm run stripe:listen"