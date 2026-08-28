#!/bin/bash
#
# Sicherung der Datenbank: ein SQL-Dump zum Zurückspielen und je Tabelle eine
# CSV-Datei zum Lesen. Beides wird in ein eigenes Git-Repository committet.
#
# Läuft per crontab, Zeitplan siehe README.
#
# Bewusst ohne "set -e": ein fehlgeschlagener Schritt soll gemeldet werden und
# nicht still abbrechen. Fehler laufen über die Funktion abbruch().

APP_DIR=/root/atw-app
REPO_DIR=/root/zap-backup
CSV_DIR="$REPO_DIR/csv"
ENV_DATEI="$APP_DIR/.env"

# Datenbankbenutzer für die Sicherung.
#
# Leer bedeutet: ohne Benutzernamen und ohne Passwort verbinden. Der Client
# nimmt dann den Namen des aufrufenden Systembenutzers (im Cronjob also root)
# und MariaDB prüft ihn über das unix_socket-Plugin. Das ist derselbe Weg, über
# den "sudo mariadb" ohne Passwort funktioniert.
#
# Warum nicht 'admin' mit Passwort: dieses Konto ist auf dieser Maschine
# ebenfalls über unix_socket eingerichtet. Es prüft kein Passwort, sondern den
# Namen des Systembenutzers - der müsste dafür 'admin' heißen. Aus einem
# root-Cronjob ist das Konto damit nicht erreichbar; der Versuch endet in
# MariaDB-Fehler 1698.
#
# Ist ein Konto vorhanden, das wirklich per Passwort prüft, kann es über
# ATW_BACKUP_DB_USER in der .env gesetzt werden.
DB_USER_STANDARD=

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

wert_aus_env() {
	[ -r "$ENV_DATEI" ] || return 0
	grep -m1 "^$1=" "$ENV_DATEI" | cut -d= -f2-
}

# Meldet den Fehler und bricht ab. Ohne diese Meldung würden ausgefallene
# Sicherungen erst auffallen, wenn man sie braucht.
abbruch() {
	echo "Backup fehlgeschlagen: $1" >&2

	local thema
	thema="$(wert_aus_env ATW_BACKUP_NTFY_TOPIC)"
	if [ -n "$thema" ]; then
		local basis
		basis="$(wert_aus_env ATW_NTFY_URL)"
		[ -n "$basis" ] || basis="https://ntfy.sh"
		curl -s -m 10 -H "Title: Backup fehlgeschlagen" -H "Tags: rotating_light" \
			-H "Priority: high" -d "$1" "${basis%/}/$thema" >/dev/null
	fi

	exit 1
}

# --- Datenbank und Zugang ---------------------------------------------------
# Name der Datenbank und Passwort kommen aus der .env, damit sie nur an einer
# Stelle stehen.
DSN="$(wert_aus_env ATW_DB_DSN)"
[ -n "$DSN" ] || abbruch "ATW_DB_DSN fehlt in $ENV_DATEI"

# ffwadmin:passwort@tcp(host:3306)/ffw
ZUGANG="${DSN%@*}"          # alles vor dem letzten @
DB_PASS="${ZUGANG#*:}"      # ab dem ersten :
DB_NAME="${DSN##*/}"        # nach dem letzten /
DB_NAME="${DB_NAME%%\?*}"   # etwaige ?parameter abschneiden
[ -n "$DB_NAME" ] || abbruch "Datenbankname nicht aus ATW_DB_DSN zu lesen"

DB_USER="$(wert_aus_env ATW_BACKUP_DB_USER)"
[ -n "$DB_USER" ] || DB_USER="$DB_USER_STANDARD"
BACKUP_PASS="$(wert_aus_env ATW_BACKUP_DB_PASSWORD)"
[ -n "$BACKUP_PASS" ] && DB_PASS="$BACKUP_PASS"

# Keine host-Angabe: damit läuft die Verbindung über den Unix-Socket, was für
# beide Wege nötig ist. Das Passwort geht über eine Datei und nicht über die
# Kommandozeile - Argumente sind in "ps" für alle Nutzer des Systems sichtbar.
DEFAULTS="$TMP_DIR/my.cnf"
umask 077
printf '[client]\n' > "$DEFAULTS"
if [ -n "$DB_USER" ]; then
	printf 'user=%s\n' "$DB_USER" >> "$DEFAULTS"
	[ -n "$DB_PASS" ] || abbruch "für Benutzer $DB_USER kein Passwort ermittelt"
	printf 'password=%s\n' "$DB_PASS" >> "$DEFAULTS"
fi

# --- SQL-Dump ---------------------------------------------------------------
# --single-transaction: ohne das ist der Dump bei InnoDB nicht konsistent, wenn
# während des Laufs geschrieben wird.
#
# Erst in eine temporäre Datei: die alte Sicherung darf nicht schon leer sein,
# bevor klar ist, dass die neue etwas enthält.
DUMP_TMP="$TMP_DIR/dump.sql"
if ! mysqldump --defaults-extra-file="$DEFAULTS" --single-transaction --quick \
	--default-character-set=utf8mb4 "$DB_NAME" > "$DUMP_TMP" 2> "$TMP_DIR/fehler.txt"; then
	abbruch "mysqldump: $(tr '\n' ' ' < "$TMP_DIR/fehler.txt")"
fi

[ -s "$DUMP_TMP" ] || abbruch "mysqldump hat eine leere Datei erzeugt"

# mysqldump schreibt diese Zeile nur, wenn es vollständig durchgelaufen ist.
grep -q '^-- Dump completed' "$DUMP_TMP" || abbruch "Dump unvollständig"

mkdir -p "$REPO_DIR" || abbruch "kann $REPO_DIR nicht anlegen"
mv "$DUMP_TMP" "$REPO_DIR/dump.sql" || abbruch "kann den Dump nicht ablegen"

# --- CSV je Tabelle ---------------------------------------------------------
if ! python3 "$APP_DIR/backup/export_csv.py" \
	--defaults-extra-file "$DEFAULTS" \
	--database "$DB_NAME" \
	--out "$CSV_DIR" > "$TMP_DIR/csv.log" 2>&1; then
	abbruch "CSV-Export: $(tr '\n' ' ' < "$TMP_DIR/csv.log")"
fi
cat "$TMP_DIR/csv.log"

# --- Ins Git ----------------------------------------------------------------
git -C "$REPO_DIR" rev-parse --git-dir >/dev/null 2>&1 || abbruch "$REPO_DIR ist kein Git-Repository"

git -C "$REPO_DIR" add -A || abbruch "git add"

# Ohne Änderungen gibt "git commit" einen Fehler zurück. Das ist kein Problem,
# sondern der Normalfall an einem Tag ohne Einträge.
if git -C "$REPO_DIR" diff --cached --quiet; then
	echo "keine Änderungen, nichts zu committen"
	exit 0
fi

if ! git -C "$REPO_DIR" commit -q -m "Sicherung atw $(date '+%Y-%m-%d %H:%M')"; then
	abbruch "git commit"
fi

if ! git -C "$REPO_DIR" push -q 2> "$TMP_DIR/push.txt"; then
	# Der Commit liegt lokal, nur das Hochladen fehlt. Das ist genau der Fall,
	# der vorher unbemerkt blieb und die Sicherung faktisch beendet hat.
	abbruch "git push: $(tr '\n' ' ' < "$TMP_DIR/push.txt")"
fi

echo "Sicherung abgeschlossen"
