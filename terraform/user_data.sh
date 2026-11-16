#!/bin/bash
set -euxo pipefail

# ==============================================================================
# ShopSmart AI – Cloud-Init EC2 Provisioning Script
# ==============================================================================

echo "=== [1/6] Updating System Packages ==="
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get upgrade -y
apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    git \
    ufw \
    htop \
    unzip \
    jq

echo "=== [2/6] Installing Official Docker Engine & Docker Compose ==="
mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Enable and start Docker service
systemctl enable docker
systemctl start docker
usermod -aG docker ubuntu

echo "=== [3/6] Setting Up Project Directory ==="
mkdir -p /opt/shopsmart-ai
chown -R ubuntu:ubuntu /opt/shopsmart-ai

echo "=== [4/6] Configuring Firewall (UFW) ==="
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 8000/tcp
ufw --force enable

echo "=== [5/6] Creating Systemd Auto-restart Service ==="
cat << 'EOF' > /etc/systemd/system/shopsmart.service
[Unit]
Description=ShopSmart AI Docker Compose Application
Requires=docker.service
After=docker.service network-online.target
Wants=network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/shopsmart-ai
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload

echo "=== [6/6] Cloud-Init Finished Successfully ==="
echo "ShopSmart AI server is ready for deployment."
