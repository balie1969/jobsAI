# Deployment_Guide - JobsAI

Denne guiden beskriver arbeidsflyten for å rulle ut nye versjoner av JobsAI.

## 1. Lokalt (Din Mac) - Når du har gjort endringer

Når du har kodet ferdig og vil legge ut en ny versjon:

1.  **Lagre og Push koden til GitHub:**
    ```bash
    git add .
    git commit -m "Beskrivelse av endringer"
    git push
    ```

2.  **Bygg og Push Docker-image:**
    Vi bruker et script som bygger versjonen for Linux (VPS) og laster den opp til GitHub Container Registry.
    ```bash
    ./deploy.sh
    ```
    *Dette kan ta 1-2 minutter. Når den sier "Suksess!", er den nye versjonen klar i skyen.*

---

## 2. PÅ VPS (Server) - For å oppdatere appen

Logg inn på VPS-en din og naviger til mappen:
```bash
cd /opt/jobsai
```

### Alternativ A: Automatisk oppdatering (Alt i ett)
Kjør denne kommandoen for å hente siste versjon og restarte appen:
```bash
sudo docker-compose pull && sudo docker-compose up -d
```
*   `pull`: Laster ned den nye versjonen fra GitHub.
*   `up -d`: Starter appen på nytt med den nye versjonen (uten nedetid for databasen).

### Alternativ B: Hvis du også har endret `docker-compose.yml`
Hvis du har gjort endringer i `docker-compose.yml` (f.eks. lagt til nye tjenester eller endret porter), bør du gjøre:

1.  Hent filendringene:
    ```bash
    git pull
    ```
2.  Start på nytt (dette oppdaterer også config):
    ```bash
    sudo docker-compose pull && sudo docker-compose up -d
    ```

## 3. Miljøvariabler (.env) - Viktig!
Hvis du legger til nye API-nøkler eller endrer hemmeligheter i `.env.local` lokalt, må disse også manuelt legges inn i `.env.production` på serveren.

1.  Logg inn på VPS.
2.  Rediger filen: `nano .env.production` (eller bruk `sudo tee` metoden).
3.  Etterpå må du alltid restarte appen for at endringene skal tre i kraft:
    ```bash
    sudo docker-compose down
    sudo docker-compose up -d
    ```

---

## Feilsøking

**Glemt passord/login på VPS?**
Hvis du får "Unauthorized" når du puller, må du logge inn på nytt:
```bash
echo "DIN_GITHUB_TOKEN" | sudo docker login ghcr.io -u balie1969 --password-stdin
```

**Sjekke at appen kjører:**
```bash
sudo docker ps
```

**Se logger (hvis noe kræsjer):**
```bash
sudo docker logs jobsai_app --tail 100 -f
```
*(Trykk `Ctrl + C` for å gå ut av loggen)*
