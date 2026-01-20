#!/bin/bash

# Stop on first error
set -e

echo "🚀 Starter bygging av Docker-image for linux/amd64..."

# 1. Bygg imaget for linux/amd64 (viktig siden du sitter på Mac, og VPS ofte er amd64)
# Vi bruker --platform linux/amd64 for å sikre at det kjører på vanlig Linux VPS.
docker build --platform linux/amd64 -t ghcr.io/balie1969/jobsai:latest .

echo "✅ Bygging ferdig!"

# 2. Push til GitHub Container Registry
echo "🚀 Pusher til GitHub Container Registry..."
docker push ghcr.io/balie1969/jobsai:latest

echo "🎉 Suksess! Imaget er nå lastet opp."
echo "-----------------------------------"
echo "NESTE STEG PÅ VPS:"
echo "1. Lag/oppdater .env.production filen din."
echo "2. Kjør: docker login ghcr.io -u balie1969 -p <DIN_GITHUB_TOKEN>"
echo "3. Kjør: docker-compose pull && docker-compose up -d"
