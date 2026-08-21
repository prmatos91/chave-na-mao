#!/bin/sh
# Gera env.js em tempo de execucao a partir da variavel de ambiente API_URL,
# permitindo trocar a URL da API sem precisar rebuildar a imagem do frontend.
set -e

: "${API_URL:=http://localhost:8080}"

cat > /usr/share/nginx/html/env.js <<EOF
window.__env = {
  apiUrl: "${API_URL}"
};
EOF
