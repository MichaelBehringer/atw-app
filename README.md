# atw-app

Atemschutzpflegestelle der FFW Wemding. Go-Backend, React-Frontend als
installierbare PWA, ausgeliefert über Docker.

## Inbetriebnahme auf der VM

### 1. Zugangsdaten anlegen

```bash
cp .env.example .env
nano .env
```

Die `.env` ist gitignored und enthält den Datenbank-Zugang und den
Signaturschlüssel der Anmeldung. Fehlt sie, bricht `docker compose up` mit
einer Meldung ab — es wird nichts stillschweigend mit Standardwerten gestartet.

Für den Signaturschlüssel einen eigenen Wert erzeugen:

```bash
openssl rand -base64 48
```

### 2. MySQL für den Zugriff aus dem Container öffnen

Die Datenbank läuft auf der VM selbst. Der Container erreicht sie über
`host.docker.internal` — dafür steht `extra_hosts: host.docker.internal:host-gateway`
in der `docker-compose.yml`.

Wichtig dabei: aus Sicht von MySQL kommt die Verbindung **nicht** von
`localhost`, sondern von der Adresse der Docker-Bridge (üblicherweise
`172.17.0.1`). Zwei Dinge müssen deshalb stimmen.

Drei Dinge müssen stimmen. Die Fehlermeldung im Log sagt, welches davon fehlt:

| Meldung | Ursache |
|---|---|
| `connection refused` | MySQL lauscht nicht auf dieser Adresse |
| `i/o timeout` | Pakete werden verworfen — Firewall |
| `Access denied` | Benutzer nicht von dieser Adresse zugelassen |

**1. MySQL muss auf der Bridge lauschen.** Standard auf Debian/Ubuntu ist nur
`127.0.0.1`. In `/etc/mysql/mysql.conf.d/mysqld.cnf` (bei MariaDB
`/etc/mysql/mariadb.conf.d/50-server.cnf`):

```ini
bind-address = 127.0.0.1,172.17.0.1
```

Die Doppelangabe gibt es ab MySQL 8.0.13 bzw. MariaDB 10.11 und ist die
sparsamste Variante: Skripte auf dem Host funktionieren weiter, und der Port ist
nicht im ganzen Netz offen. Bei älteren Versionen geht nur `0.0.0.0`.

Danach `sudo systemctl restart mysql` (bzw. `mariadb`) und prüfen:

```bash
sudo ss -tlnp | grep 3306
```

**2. Die Firewall muss den Container durchlassen.** Das ist die Stelle, die am
meisten Zeit kostet, weil sie unauffällig ist.

Der Container liegt im Compose-Netz (`172.18.x.x`) und spricht die MySQL über
die Adresse der Docker-Bridge (`172.17.0.1`) an. Das ist eine Adresse des Hosts,
der Verkehr läuft also durch die **INPUT**-Kette — und dort greift die
Standardregel von ufw, die alles verwirft. Docker legt dafür **keine** Regel an.

Ergebnis: `i/o timeout`. Nicht `connection refused`, weil die Pakete gar nicht
ankommen. Und ein `ufw deny 3306` macht es endgültig dicht, auch für den
Container.

```bash
# Vorhandene Sperre für 3306 zuerst entfernen, Regeln gelten in ihrer Reihenfolge
sudo ufw status numbered
sudo ufw delete <nummer>

# Docker-Netze durchlassen. 172.16.0.0/12 deckt 172.16.x bis 172.31.x ab, also
# die Standard-Bridge und alle Compose-Netze.
sudo ufw allow from 172.16.0.0/12 to any port 3306 proto tcp
sudo ufw reload
```

Enger geht es mit den konkreten Subnetzen, die aber wechseln können:

```bash
docker network inspect atw-app_default -f '{{range .IPAM.Config}}{{.Subnet}}{{end}}'
```

Ist ufw gar nicht aktiv (`sudo ufw status` sagt `inactive`), liegt es nicht
daran — dann prüfen, ob der Anbieter der VM eine eigene Firewall davor hat.

**3. Der Benutzer muss vom Docker-Subnetz zugelassen sein.** Ein Benutzer
`'ffwadmin'@'localhost'` reicht nicht:

```sql
CREATE USER IF NOT EXISTS 'ffwadmin'@'172.%' IDENTIFIED BY 'HIER_DAS_PASSWORT';
GRANT SELECT, INSERT, UPDATE, DELETE ON ffw.* TO 'ffwadmin'@'172.%';
FLUSH PRIVILEGES;
```

Bewusst nur diese vier Rechte — die Anwendung legt keine Tabellen an.

### 3. Zertifikate

nginx erwartet `certs/fullchain.pem` und `certs/privkey.pem`. Ohne sie startet
der Container nicht.

```bash
certonly --standalone -d ffwemding.dynv6.net --non-interactive --agree-tos -m michabehringer@gmail.com
sh certs/cert.sh
```

### 4. Starten

```bash
docker compose up --build -d
docker compose logs -f server
```

Erreichbar unter `https://ffwemding.dynv6.net:11200`.

### 5. Prüfen

```bash
# Läuft alles?
docker compose ps

# Kommt die Datenbank an?  (401 ist richtig - falsches Passwort, aber die
# Abfrage lief)
curl -sk -o /dev/null -w '%{http_code}\n' -X POST \
  https://ffwemding.dynv6.net:11200/server/login \
  -H 'Content-Type: application/json' -d '{"username":"x","password":"x"}'

# Wird komprimiert ausgeliefert?  content-encoding: gzip muss dabei sein
curl -skI -H 'Accept-Encoding: gzip' \
  https://ffwemding.dynv6.net:11200/assets/index-*.js | grep -i content-encoding
```

## Aktualisieren

```bash
git pull
docker compose up --build -d
```

Die Nutzer bekommen beim nächsten Öffnen der App den Hinweis „Neue Version
verfügbar" und entscheiden selbst, wann sie neu laden. Die `.env` bleibt beim
Aktualisieren unberührt.

## Wartung

Aus der Crontab (`sudo crontab -u root -e`):

```cron
30 2 * * * sh /root/atw-app/certs/cert.sh
0 3 * * * /sbin/shutdown -r
0 */6 * * * /root/atw-app/backup/backup.sh
```

## Entwicklung

Frontend: siehe `ui/README.md`. Backend:

```bash
cd server
cp .env.example .env    # lokale Werte, u.a. ATW_NTFY_ENABLED=false
go run .
```

## Aufbau

| Dienst | Image | Aufgabe |
|---|---|---|
| `nginx` | `nginx:1.30-alpine` | TLS auf Port 11200, verteilt auf `ui` und `server` |
| `ui` | `nginx:1.30-alpine` | liefert den Frontend-Build aus, mit Kompression und Cache-Headern |
| `server` | `gcr.io/distroless/static` | Go-Backend auf Port 8080 |

Die Datenbank läuft nicht im Container, sondern auf der VM.
