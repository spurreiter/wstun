#!/usr/bin/env sh

ARG1="$1"
DOMAIN=${ARG1:=too.nice}

echo Generating certificate for "$DOMAIN"

openssl req -x509 \
	-newkey rsa:2048 \
	-nodes -sha256 \
	-subj "/CN=$DOMAIN" \
	-keyout "$DOMAIN".key \
	-out "$DOMAIN".crt
