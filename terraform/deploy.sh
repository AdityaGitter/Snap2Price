#!/bin/bash
set -euo pipefail

# ==============================================================================
# ShopSmart AI – Server Deployment & Automated Health Check Script
# ==============================================================================

COLOR_RESET="\033[0m"
COLOR_GREEN="\033[32m"
COLOR_BLUE="\033[34m"
COLOR_YELLOW="\033[33m"
COLOR_RED="\033[31m"

echo -e "${COLOR_BLUE}======================================================${COLOR_RESET}"
echo -e "${COLOR_BLUE}       ShopSmart AI - Automated Deployment Runner     ${COLOR_RESET}"
echo -e "${COLOR_BLUE}======================================================${COLOR_RESET}"

PROJECT_DIR="/opt/shopsmart-ai"

# Ensure script is executed in project directory or navigate to it
if [ -d "$PROJECT_DIR" ]; then
    cd "$PROJECT_DIR"
fi

echo -e "\n${COLOR_YELLOW}--> [1/5] Checking Docker & Docker Compose...${COLOR_RESET}"
if ! command -v docker &> /dev/null; then
    echo -e "${COLOR_RED}Error: Docker is not installed. Please run user_data.sh first.${COLOR_RESET}"
    exit 1
fi

docker --version
docker compose version

echo -e "\n${COLOR_YELLOW}--> [2/5] Preparing Environment File...${COLOR_RESET}"
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        echo "Creating .env from .env.example..."
        cp .env.example .env
        # Generate random secure key
        SECRET=$(head /dev/urandom | tr -dc A-Za-z0-9 | head -c 48)
        sed -i "s/shopsmart_super_secure_jwt_secret_key.*/${SECRET}/g" .env
        echo -e "${COLOR_GREEN}✓ Generated secure application secret key in .env${COLOR_RESET}"
    else
        echo -e "${COLOR_RED}Error: .env.example not found!${COLOR_RESET}"
        exit 1
    fi
else
    echo -e "${COLOR_GREEN}✓ Existing .env file found.${COLOR_RESET}"
fi

echo -e "\n${COLOR_YELLOW}--> [3/5] Pulling Latest Updates & Building Containers...${COLOR_RESET}"
if [ -d .git ]; then
    echo "Updating git repository..."
    git pull || echo "Continuing with local files..."
fi

echo "Building and starting Docker Compose services in detached mode..."
docker compose down || true
docker compose up --build -d

echo -e "\n${COLOR_YELLOW}--> [4/5] Verifying Service Health...${COLOR_RESET}"
echo "Waiting for PostgreSQL, Redis, FastAPI, and Nginx to initialize..."

MAX_RETRIES=15
COUNTER=0
HEALTHY=false

while [ $COUNTER -lt $MAX_RETRIES ]; do
    COUNTER=$((COUNTER+1))
    echo -n "Attempt $COUNTER/$MAX_RETRIES: Checking API Health... "
    
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/api/health || true)
    
    if [ "$RESPONSE" == "200" ]; then
        HEALTHY=true
        echo -e "${COLOR_GREEN}OK (HTTP 200)${COLOR_RESET}"
        break
    else
        echo -e "${COLOR_YELLOW}Waiting (HTTP $RESPONSE)...${COLOR_RESET}"
        sleep 4
    fi
done

if [ "$HEALTHY" = true ]; then
    echo -e "\n${COLOR_GREEN}======================================================${COLOR_RESET}"
    echo -e "${COLOR_GREEN}  🎉 ShopSmart AI is LIVE & RUNNING HEALTHILY!         ${COLOR_RESET}"
    echo -e "${COLOR_GREEN}======================================================${COLOR_RESET}"
    
    # Get Public IP
    PUBLIC_IP=$(curl -s https://checkip.amazonaws.com || curl -s ifconfig.me || echo "localhost")
    
    echo -e "Access Details:"
    echo -e "  🌐 Storefront:      ${COLOR_BLUE}http://${PUBLIC_IP}/${COLOR_RESET}"
    echo -e "  📚 Swagger API Docs: ${COLOR_BLUE}http://${PUBLIC_IP}/docs${COLOR_RESET}"
    echo -e "  🩺 Healthcheck:      ${COLOR_BLUE}http://${PUBLIC_IP}/api/health${COLOR_RESET}"
    echo -e "\nDemo Credentials for Viva / Presentation:"
    echo -e "  🛡️  Admin Account:    admin@shopsmart.ai / Admin@123"
    echo -e "  👤 Customer Account: demo@shopsmart.ai  / Demo@123"
    echo -e "======================================================"
    exit 0
else
    echo -e "\n${COLOR_RED}Healthcheck failed after $MAX_RETRIES attempts.${COLOR_RESET}"
    echo "Inspecting container logs:"
    docker compose logs --tail=30
    exit 1
fi
