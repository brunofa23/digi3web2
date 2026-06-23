#!/bin/bash

IS_SOURCED=0
if [ "${BASH_SOURCE[0]}" != "$0" ]; then
  IS_SOURCED=1
fi

# Utiliza a versão 20 do Node
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  . "$NVM_DIR/nvm.sh"
  if ! nvm use 20; then
    nvm install 20 || {
      if [ "$IS_SOURCED" -eq 1 ]; then return 1; else exit 1; fi
    }
    nvm use 20 || {
      if [ "$IS_SOURCED" -eq 1 ]; then return 1; else exit 1; fi
    }
  fi
  nvm alias default 20 >/dev/null 2>&1 || true
else
  echo "NVM não encontrado em $NVM_DIR" >&2
  if [ "$IS_SOURCED" -eq 1 ]; then return 1; else exit 1; fi
fi

if [ "$#" -gt 0 ]; then
  if [ "$IS_SOURCED" -eq 1 ]; then
    "$@"
    return $?
  fi
  exec "$@"
fi

# Inicia o serviço Docker
sudo service docker start

# Inicia o container digi3Web
docker start digi3Web

#sudo visudo
#root ALL=NOPASSWD: /usr/sbin/service docker start
