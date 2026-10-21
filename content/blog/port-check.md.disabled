---
title: "How to read a port check"
description: "When a service is up but you cannot connect. TCP vs UDP, the difference between a closed port and a filtered one, and the three states you will see."
date: "2026-10-08"
readingTime: "7 min"
category: "Web & security"
---

A port check answers one question: if I try to connect to this port, does anything answer? The answer tells you whether a service is listening, whether a firewall is blocking the connection, or whether the host is unreachable at all. Reading the result correctly is the difference between "the server is down" and "the firewall is doing its job."

## Why this exists

A browser cannot open a raw TCP connection to arbitrary ports. That is why this is a guide instead of a tool. The command runs in your terminal, and the explanation below helps you read what comes back.

When you would reach for it:

- A service is not responding and you want to know if the port is open at all.
- You are setting up a firewall rule and want to verify it works.
- You are migrating a service to a new port and want to confirm it is listening.

## How it actually works

A port check tries to open a TCP connection to the target host and port. If something accepts the connection (or actively refuses it), you get an answer. If the connection just hangs, the packets are being dropped silently - usually by a firewall.

There are three possible outcomes:

- **Open** - the service accepted the connection.
- **Closed** - the host responded with a TCP RST (reset). Nothing is listening, but the host is reachable.
- **Filtered** - no response at all. A firewall is dropping the packets, or the host is down.

The same applies to UDP, but UDP does not send resets, so a UDP port check usually only tells you "open" or "silent." Most diagnostics are TCP.

## Walkthrough

`ComputerName : example.com` -- The target you asked about.

`RemoteAddress : 93.184.215.14` -- The IP the DNS lookup resolved to. If this surprises you, your DNS is doing something you did not expect.

`RemotePort : 443` -- The port you asked about. 443 is HTTPS, 80 is HTTP, 22 is SSH, 25 is SMTP. Knowing the well-known ports saves you from explaining the result to someone else.

`InterfaceAlias : Ethernet` -- The network interface on YOUR machine that the test ran from. If you are on Wi-Fi this will say Wi-Fi; if you are on a VPN, it will say the VPN adapter. This is the interface that would actually carry traffic.

`SourceAddress : 192.168.1.100` -- Your machine's IP, as seen by the test. Useful when debugging source-based firewall rules.

`TcpTestSucceeded : True` -- The answer. True means the port is open. False means either the host did not respond or it actively refused.

## What to look for

**The difference between "closed" and "filtered"** is the most important thing. An ICMP/TCP refusal means the host is alive but nothing is listening. A timeout means packets are being dropped, usually by a firewall. They look different when you run the test:

- Refusal: instant "refused" or "reset" message.
- Filtered: a long pause (the timeout), then a silent failure.

**The right tool for the job.** `nc -zv` is the classic. `Test-NetConnection` (PowerShell) is better on Windows because it tells you which interface. `nmap` is the most thorough but it is a separate install.

**Test from the right place.** If the service should be reachable only from inside your network, do not run the test from your laptop on a coffee shop Wi-Fi. Run it from a machine on the same network as the intended users.

## When the result is suspicious

- The port is open from inside your network but closed from outside. Expected. That is what a firewall is for. If you need external access, configure the firewall to allow it.
- The port is filtered from inside too. Either the host firewall is blocking your test, or you are on a VLAN that cannot reach the service. Check the firewall rules on the host itself.
- The host is unreachable at all. The issue is not the port - it is the network path. Traceroute first, then come back to port checks.

## Related on SiteTrace

- [HTTP headers](/tools/http-headers) - when the port is open and you want to know what server is on the other end.
- [SSL certificate](/blog/ssl-certificate) - when the port is 443 and you want to inspect the certificate.
- [Is it down?](/tools/is-it-down) - when the port test says "filtered" and you want to know if the site is reachable at all.
```command
## windows
Test-NetConnection -ComputerName example.com -Port 443
## linux
nc -zv example.com 443
## darwin
nc -zv example.com 443
## sample
ComputerName     : example.com
RemoteAddress    : 93.184.215.14
RemotePort       : 443
InterfaceAlias   : Ethernet
SourceAddress    : 192.168.1.100
TcpTestSucceeded : True
```