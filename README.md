# sevrer certificates
Generate private key and CSR using openssl
>openssl genrsa -out server.key 2048

Generate a CSR using that key
>openssl req -new -key server.key -out server.csr

Generate a certificate using certbot (need to use a CN, not an IP, use api.brightmindsresearch.com that is configured in wordpress)
>sudo certbot certonly --csr /path/to/server.csr

Rename the .pem into a .crt