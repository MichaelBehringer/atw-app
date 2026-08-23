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
0 */8 * * * /root/atw-app/backup/backup.sh
```

## Sicherung

`backup/backup.sh` erzeugt zwei Dinge in `/root/zap-backup` und committet sie in
das dortige Git-Repository:

- `dump.sql` — vollständiger `mysqldump`, das ist die Grundlage zum
  Zurückspielen.
- `csv/<tabelle>.csv` — je Tabelle eine Datei zum Lesen und Auswerten, etwa in
  einer Tabellenkalkulation, mit dem vollständigen Inhalt. Praktischer
  Nebeneffekt: im Git-Diff ist auf einen Blick zu sehen, was sich seit der
  letzten Sicherung geändert hat.

Die Sicherung verbindet als MariaDB-Benutzer **`admin`**, das Passwort wird aus
`ATW_DB_DSN` in der `.env` gelesen. Es steht damit nur an einer Stelle und
wird über eine temporäre Optionsdatei übergeben, nicht über die Kommandozeile —
Argumente wären in `ps` für alle Nutzer des Systems sichtbar.

Der Anwendungsbenutzer taugt hier nicht: dessen Berechtigung gilt für den
Zugriff aus dem Container (`'ffwadmin'@'172.%'`). Das Backup läuft auf dem Host,
von dort sieht MariaDB die Verbindung als `localhost` und lehnt sie ab —
`Access denied for user 'ffwadmin'@'localhost'`.

Hat `admin` ein anderes Passwort als der Anwendungsbenutzer, lässt sich beides
in der `.env` überschreiben:

```
ATW_BACKUP_DB_USER=admin
ATW_BACKUP_DB_PASSWORD=…
```

### Meldung, wenn es schiefgeht

Ein Backup, dessen Ausfall niemand bemerkt, ist keins. Wenn in der `.env` ein
Thema hinterlegt ist, meldet sich das Skript bei jedem Fehler über ntfy:

```
ATW_BACKUP_NTFY_TOPIC=ein-eigenes-thema-fuer-meldungen
```

Bewusst ein anderes Thema als das der Anwendung — eine Backup-Störung gehört
nicht in die Benachrichtigungen der Gerätewarte.

### Zurückspielen

Einmal ausprobieren, solange nichts brennt. Ein Backup, das nie zurückgespielt
wurde, ist eine Vermutung:

```bash
# In eine Testdatenbank, nicht über den Bestand
sudo mariadb -e "CREATE DATABASE ffw_test"
sudo mariadb ffw_test < /root/zap-backup/dump.sql

# Gegenprobe: gleiche Zeilenzahl wie im Original?
sudo mariadb -e "SELECT COUNT(*) FROM ffw.atemschutzpflegestelle_data"
sudo mariadb -e "SELECT COUNT(*) FROM ffw_test.atemschutzpflegestelle_data"

sudo mariadb -e "DROP DATABASE ffw_test"
```

Im Ernstfall auf den Bestand, mit einem älteren Stand aus der Historie:

```bash
cd /root/zap-backup
git log --oneline                 # gewünschten Stand suchen
git show <commit>:dump.sql > /tmp/wiederherstellung.sql
docker compose -f /root/atw-app/docker-compose.yml stop server
sudo mariadb ffw < /tmp/wiederherstellung.sql
docker compose -f /root/atw-app/docker-compose.yml start server
```

### Was dieses Verfahren leistet und was nicht

- **Auswärtige Ablage:** ja, das Git-Remote liegt nicht auf der VM. Ein
  Totalverlust der VM ist abgedeckt.
- **Aufbewahrung:** die Git-Historie, also unbegrenzt. Alte Stände lassen sich
  nicht löschen, das Repository wächst dauerhaft.
- **Datenverlust im Ernstfall:** bis zu 8 Stunden.
- **Personenbezogene Daten:** Dump und CSV enthalten Namen und — solange die
  Passwörter nicht gehasht sind — die Passwörter im Klartext. Beides liegt damit
  dauerhaft und praktisch unlöschbar beim Anbieter des Git-Remotes. Das ist eine
  bewusste Entscheidung; der wirksame Hebel dagegen ist nicht das Backup,
  sondern die Passwörter zu hashen. Soll eine Spalte doch aus den CSVs
  herausbleiben, geht das über `AUSGESCHLOSSEN` in `backup/export_csv.py` — der
  Dump kann sie nicht auslassen, weil er sonst zum Zurückspielen unbrauchbar
  wäre.

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
