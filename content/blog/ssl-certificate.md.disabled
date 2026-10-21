---
title: "How to read an SSL certificate"
description: "Issuer, validity, SANs, and the difference between a certificate that is valid and a certificate that is safe. Plus the most common SSL failures and what they mean."
date: "2026-10-08"
readingTime: "8 min"
category: "Email & certificates"
---

An SSL certificate does more than enable HTTPS. It tells you who issued it, who it was issued to, when it expires, and what other names it is valid for. Reading that information turns a certificate from "we have one" into "we have the right one, signed by a trusted party, expiring in 47 days."

## Why this exists

A browser cannot open a raw TLS connection to inspect a certificate the way openssl can. That is why this is a guide instead of a tool. The command runs in your terminal, and the explanation below helps you read what comes back.

When you would reach for it:

- A site is showing a certificate warning and you want to know why.
- You are about to renew a certificate and want to confirm what is currently installed.
- You are configuring a new service and want to verify the certificate chain is correct.
- An auditor asks for the issuer, validity period, and SAN list.

## How it actually works

`openssl s_client` opens a TLS connection to the server and prints out the handshake details - including the certificate the server presented. The output is long and unstructured, but the parts that matter are at the top.

The `-servername` flag is required for any host that uses SNI (Server Name Indication), which is most of them. Without it, the server returns the default certificate, which may not be the one you want to inspect.

## Walkthrough

`CONNECTED(000001A0)` -- The TCP connection succeeded. The hex code is the internal socket ID; ignore it.

`---` -- A separator. The interesting parts come after.

`Certificate chain` -- The list of certificates the server sent. Usually 2: the leaf (the one for your domain) and the intermediate (the one that signed the leaf). If you see 3, there is a cross-signed intermediate in the mix.

` 0 s:CN = example.com` -- The leaf certificate. The "CN" (Common Name) is the primary domain. For modern certificates, the SAN (Subject Alternative Name) list is what browsers actually check, not the CN.

`   i:CN = Example CA` -- The issuer. This is the certificate authority that signed this certificate. The CA must be in the trusted root store of whatever is connecting.

`   a:PKEY: rsaEncryption, 2048 (bit); sigalg: RSA-SHA256` -- The public key algorithm and signature algorithm. RSA-2048 with SHA-256 is the current baseline; anything weaker is suspect.

`    Not Before: Jan  1 00:00:00 2024 GMT` -- When the certificate became valid. If you see a Not Before in the future, your clock is wrong.

`    Not After : Dec 31 23:59:59 2025 GMT` -- When it expires. This is the number to monitor - renew well before this.

`    Subject: CN = example.com` -- The full subject. For modern certs, the CN is also in the SAN list below.

`    X509v3 Subject Alternative Name: DNS:example.com, DNS:www.example.com` -- The SAN list. This is the authoritative list of names the certificate is valid for. A request to `api.example.com` will fail unless `api.example.com` is in this list.

`    X509v3 Extended Key Usage: TLS Web Server Authentication` -- What the certificate is allowed to be used for. Web server auth is what you want for HTTPS. Other values are for code signing, email, etc.

`    X509v3 CRL Distribution Points:` -- Where to find the certificate revocation list. Most browsers do not check this anymore (they use OCSP instead), but the field is still required.

`---` -- End of the leaf certificate. The next section is the intermediate, then the root.

`Verify return code: 0 (ok)` -- The most important line at the very bottom. If this says `ok`, the chain is trusted. Any other value here means the certificate is broken in some way - and the code tells you how.

## What to look for

**The Not After date.** This is the one that breaks in production. Set a reminder 30 days before it expires.

**The SAN list.** A certificate for `example.com` does not necessarily cover `api.example.com` or `www.example.com`. Check the SAN list, not the CN.

**The issuer.** If you see a CA you do not recognize, or one that has been distrusted, the certificate is unsafe even if the chain validates locally.

**The signature algorithm.** Anything with "sha1" is now considered insecure. Modern certificates use SHA-256 or SHA-384.

## When the result is suspicious

- "self-signed certificate." The server is using a certificate that was not issued by a trusted CA. This is fine for internal services, broken for anything public.
- "certificate has expired." The Not After date is in the past. Replace it.
- "hostname mismatch." You connected to a host that is not in the SAN list. Either the certificate is wrong, or you are looking at the wrong server.
- "unable to get local issuer certificate." Your local trust store does not include the CA. Update the CA bundle, or check whether the server is using a private CA.

## Related on SiteTrace

- [HTTP headers](/tools/http-headers) - confirm HSTS and other security headers are configured alongside the certificate.
- [Email deliverability](/tools/email-deliverability) - certificate health overlaps with email authentication; both rely on DNS.
- [Port check](/blog/port-check) - when the certificate looks fine but the connection is failing; the port may not even be open.
```command
## windows
openssl s_client -connect example.com:443 -servername example.com < NUL
## linux
openssl s_client -connect example.com:443 -servername example.com < /dev/null
## darwin
openssl s_client -connect example.com:443 -servername example.com < /dev/null
## sample
CONNECTED(000001A0)
---
Certificate chain
 0 s:CN = example.com
   i:CN = Example CA
   a:PKEY: rsaEncryption, 2048 (bit); sigalg: RSA-SHA256
   v:NotBefore: Jan  1 00:00:00 2024 GMT
   v:NotAfter : Dec 31 23:59:59 2025 GMT
   s:subject: CN = example.com
   s:X509v3 Subject Alternative Name:
      DNS:example.com, DNS:www.example.com
   s:X509v3 Extended Key Usage:
      TLS Web Server Authentication
---
No client certificate CA names sent
---
SSL handshake has read 2531 bytes and written 386 bytes
Verification: OK
---
New, TLSv1.3, Cipher is TLS_AES_256_GCM_SHA384
Server public key is 2048 bit RSA, signed using RSA-SHA256
---
```