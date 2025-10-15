#!/usr/bin/env bash
set -euo pipefail

note() { printf "\n== %s ==\n" "$*"; }
size_of() { du -sh --apparent-size "$1" 2>/dev/null | awk '{print $1, $2}'; }

if [ "${EUID:-$(id -u)}" -ne 0 ]; then
  echo "This script must run as root. Use: sudo bash $0" >&2
  exit 1
fi

# Determine invoking user's home for Docker migration target
TARGET_USER="${SUDO_USER:-${USER:-root}}"
if [ "$TARGET_USER" = "root" ]; then
  TARGET_HOME="/root"
else
  TARGET_HOME="/home/$TARGET_USER"
fi

note "Initial disk usage for / and /home"
df -h / /home | sed -n '1p;2,3p'

note "Root space hogs (pre-clean)"
for p in \
  /var/cache/apt /var/log /var/log/journal /var/lib/snapd /var/lib/docker /var/lib/flatpak /var/tmp; do
  [ -e "$p" ] && size_of "$p" || true
done

note "APT cleanup (clean, autoclean, autoremove)"
apt-get -y clean || true
apt-get -y autoclean || true
apt-get -y autoremove --purge || true

note "Configure journald size cap and vacuum to 200M"
install -d -m 0755 /etc/systemd/journald.conf.d || true
cat > /etc/systemd/journald.conf.d/99-maxuse.conf <<EOF
[Journal]
SystemMaxUse=200M
EOF
systemctl restart systemd-journald 2>/dev/null || true
journalctl --vacuum-size=200M 2>/dev/null || true

if command -v snap >/dev/null 2>&1; then
  note "Pruning old Snap revisions and set retain=2"
  snap set system refresh.retain=2 || true
  snap list --all | awk '/disabled/{print $1, $3}' | while read name rev; do snap remove "$name" --revision="$rev" || true; done
else
  note "Snap not found; skipping"
fi

if command -v flatpak >/dev/null 2>&1; then
  note "Flatpak: uninstall unused runtimes"
  flatpak uninstall --unused -y || true
else
  note "Flatpak not found; skipping"
fi

# Docker migration to /home if present and >= 1G
DOCKER_DIR="/var/lib/docker"
TARGET_BASE="$TARGET_HOME/docker-data"
if [ -d "$DOCKER_DIR" ]; then
  SZ_KB=$(du -sk "$DOCKER_DIR" 2>/dev/null | awk '{print $1}') || SZ_KB=0
  if [ "${SZ_KB:-0}" -ge 1048576 ]; then # >= 1G
    note "Docker data detected (size: $(du -sh "$DOCKER_DIR" | awk '{print $1}')). Migrating to $TARGET_BASE."
    systemctl stop docker 2>/dev/null || true
    mkdir -p "$TARGET_BASE" || true
    # Move directory under TARGET_BASE (results in $TARGET_BASE/docker)
    if mv "$DOCKER_DIR" "$TARGET_BASE" 2>/dev/null; then
      :
    else
      note "mv failed; attempting rsync/cp fallback"
      if command -v rsync >/dev/null 2>&1; then
        rsync -aHAXx "$DOCKER_DIR" "$TARGET_BASE" && rm -rf "$DOCKER_DIR"
      else
        mkdir -p "$TARGET_BASE/docker"
        cp -a "$DOCKER_DIR/." "$TARGET_BASE/docker/" && rm -rf "$DOCKER_DIR"
      fi
    fi
    if [ ! -e "$DOCKER_DIR" ]; then
      ln -s "$TARGET_BASE/docker" "$DOCKER_DIR"
    fi
    systemctl start docker 2>/dev/null || true
  else
    note "Docker data present but small (<1G); skipping migration"
  fi
else
  note "Docker directory not found; skipping migration"
fi

note "Root space hogs (post-clean)"
for p in \
  /var/cache/apt /var/log /var/log/journal /var/lib/snapd /var/lib/docker /var/lib/flatpak /var/tmp; do
  [ -e "$p" ] && size_of "$p" || true
done

note "Final disk usage for / and /home"
df -h / /home | sed -n '1p;2,3p'

note "Done"

