#!/bin/bash

# Create a directory for the certificates, remove if it already exists.
if [ -d "/var/lib/postgresql/certs" ]; then
    rm -rf /var/lib/postgresql/certs
fi
mkdir -p /var/lib/postgresql/certs

# Generate the CA key and certificate
openssl genrsa -out /var/lib/postgresql/certs/ca.key 4096
openssl req -new -x509 -days 365 -key /var/lib/postgresql/certs/ca.key -out /var/lib/postgresql/certs/ca.crt -subj "/CN=MyCA"

# Generate the server key and certificate signing request (CSR)
openssl genrsa -out /var/lib/postgresql/certs/server.key 4096
openssl req -new -key /var/lib/postgresql/certs/server.key -out /var/lib/postgresql/certs/server.csr -subj "/CN=postgres"

# Sign the server certificate with the CA
openssl x509 -req -in /var/lib/postgresql/certs/server.csr -CA /var/lib/postgresql/certs/ca.crt -CAkey /var/lib/postgresql/certs/ca.key -CAcreateserial -out /var/lib/postgresql/certs/server.crt -days 365

# Set permissions and ownership
chmod 600 /var/lib/postgresql/certs/server.key
