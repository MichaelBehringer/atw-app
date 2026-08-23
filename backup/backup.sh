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
REPO_DIR="$APP_DIR/backup/gitRepo"
CSV_DIR="$REPO_DIR/csv"
ENV_DATEI="$APP_DIR/.env"

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
# Der Name der Datenbank kommt aus der .env, damit er nur an einer Stelle steht.
DSN="$(wert_aus_env ATW_DB_DSN)"
[ -n "$DSN" ] || abbruch "ATW_DB_DSN fehlt in $ENV_DATEI"

DB_NAME="${DSN##*/}"        # nach dem letzten /
DB_NAME="${DB_NAME%%\?*}"   # etwaige ?parameter abschneiden
[ -n "$DB_NAME" ] || abbruch "Datenbankname nicht aus ATW_DB_DSN zu lesen"

# Verbindung bewusst OHNE Zugangsdaten und OHNE host-Angabe.
#
# Damit läuft es über den Unix-Socket, und MariaDB erkennt den aufrufenden
# Systembenutzer (root) über das unix_socket-Plugin. Zwei Vorteile: es liegt
# nirgends ein Passwort, und es braucht keine zusätzliche Berechtigung.
#
# Der Anwendungsbenutzer taugt hier nicht: der ist für den Zugriff aus dem
# Container eingerichtet ('ffwadmin'@'172.%'). Das Backup läuft auf dem Host,
# von dort sieht MariaDB die Verbindung als 'localhost' - und lehnt sie ab.
#
# Nur falls unix_socket nicht verfügbar ist, können in der .env
# ATW_BACKUP_DB_USER und ATW_BACKUP_DB_PASSWORD gesetzt werden. Dann wird das
# Passwort über eine Datei übergeben, nicht über die Kommandozeile - Argumente
# sind in "ps" für alle Nutzer des Systems sichtbar.
DEFAULTS="$TMP_DIR/my.cnf"
umask 077
printf '[client]\n' > "$DEFAULTS"

BACKUP_USER="$(wert_aus_env ATW_BACKUP_DB_USER)"
if [ -n "$BACKUP_USER" ]; then
	printf 'user=%s\n' "$BACKUP_USER" >> "$DEFAULTS"
	BACKUP_PASS="$(wert_aus_env ATW_BACKUP_DB_PASSWORD)"
	[ -n "$BACKUP_PASS" ] && printf 'password=%s\n' "$BACKUP_PASS" >> "$DEFAULTS"
fi

# --- SQL-Dump ---------------------------------------------------------------
# --single-transaction: ohne das ist der Dump bei InnoDB nicht konsistent, wenn
# während des Laufs geschrieben wird.
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

if ! git -C "$REPO_DIR" commit -q -m "Sicherung $(date '+%Y-%m-%d %H:%M')"; then
	abbruch "git commit"
fi

if ! git -C "$REPO_DIR" push -q 2> "$TMP_DIR/push.txt"; then
	# Der Commit liegt lokal, nur das Hochladen fehlt. Das ist genau der Fall,
	# der vorher unbemerkt blieb und die Sicherung faktisch beendet hat.
	abbruch "git push: $(tr '\n' ' ' < "$TMP_DIR/push.txt")"
fi

echo "Sicherung abgeschlossen"
