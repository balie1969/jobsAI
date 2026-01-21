#!/bin/bash
# Stopp alle containere
docker-compose down

# Fjern gamle jobsai-images for å tvinge ny nedlasting
docker image rm ghcr.io/balie1969/jobsai:latest

# Fjern ubrukte data (valgfritt, men bra for opprydding)
docker system prune -f

# Hent nyeste versjon
docker-compose pull

# Start opp igjen
docker-compose up -d

echo "App restartet med HELT fersk versjon! 🚀"
echo "Prøv nå (husk Refresh i nettleser)."
