---
title: "How to read a traceroute"
description: "Every hop between you and a destination, what the times mean, why some lines show asterisks, and how to spot a real network problem from a normal one."
date: "2026-10-08"
readingTime: "8 min"
category: "DNS & connectivity"
---

Traceroute is the diagnostic you reach for when something on the network feels slow and you want to know where the delay is. Every router between you and the destination leaves a fingerprint - and learning to read those fingerprints is the difference between "the internet is slow" and "hop 7 is dropping 40% of packets."

## Why this exists

A browser cannot send ICMP, which is the protocol traceroute uses. That is why this guide is here instead of a tool. The command runs in your terminal, and the explanation below helps you read what comes back.

When you would reach for it:

- A user reports a site is slow, but only from one office.
- A new deployment is timing out and you do not know if the issue is your app, your network, or the path between.
- You want to confirm that traffic to a SaaS provider is actually leaving your network, and not getting hijacked by a misconfigured proxy.

## How it actually works

Traceroute sends packets with increasing TTL (Time To Live) values, starting at 1. Every router on the path decrements the TTL by 1. When it hits 0, the router drops the packet and sends back an "ICMP time exceeded" message. By listening for those messages, traceroute maps each router hop in order.

Three probes per hop, so you see three round-trip times per line. Big variance between the three numbers is normal; persistent spikes at one hop are not.

## Walkthrough

`traceroute to example.com (93.184.215.14), 30 hops max` -- The header. The destination hostname and the resolved IP, plus the TTL ceiling.

`1  192.168.1.1 (192.168.1.1)  1.234 ms  1.012 ms  0.998 ms` -- Your local router. Sub-millisecond times are normal - this hop is on your LAN.

`2  10.0.0.1 (10.0.0.1)  4.567 ms  4.456 ms  4.345 ms` -- The first hop outside your network. Anything under 10 ms here means your ISP is doing its job.

`3  203.0.113.1 (203.0.113.1)  12.345 ms  12.234 ms  12.123 ms` -- Your ISP's edge router. The 12 ms jump from hop 2 means the traffic has now hit a long-haul link.

`4  93.184.215.14 (example.com)  24.567 ms  24.456 ms  24.345 ms` -- The destination. The final hop is rarely the same as the previous ones; it is the server itself.

`5  * * *` -- An asterisk means a router did not reply within the timeout. One line of asterisks is normal; three in a row often means the router is configured to drop ICMP (some ISPs do this) or is genuinely overloaded.

`6  (10.42.0.1)  145.678 ms  142.123 ms  150.234 ms` -- A sudden jump. Anything over 100 ms here is where slow feels slow. Note whether every later hop stays high (the problem is here) or comes back down (this router is just slow at responding but not the bottleneck).

## What to look for

**Where the slowdown starts.** If hop 3 is fine and hop 4 spikes, the problem is between your ISP and the next network. If all hops are slow, the issue is closer to you.

**Asterisks that cluster.** A single line of `* * *` is a router that does not respond to ICMP. Three or more in a row, especially mid-path, often means packet loss.

**The last hop is rarely the answer.** Traceroute stops at the destination, but the destination's reply is often deprioritized. Focus on the hop *before* a sudden change in latency, not the last one.

## When the result is suspicious

- The route changes every time you run it. This is load balancing and usually benign.
- The path goes through an unexpected country. BGP hijacks are rare but they happen; verify with a second traceroute from a different network.
- Every hop shows the same time. Either the path is genuinely short or you are being intercepted by a transparent proxy.

## Related on SiteTrace

- [DNS lookup](/tools/dns-lookup) - resolve the hostnames that appear in traceroute hops.
- [HTTP latency](/tools/http-latency) - when the path looks fine but the site still feels slow, this is the next step.
```command
## windows
tracert -h 30 example.com
## linux
traceroute -m 30 example.com
## darwin
traceroute -m 30 example.com
## sample
traceroute to example.com (93.184.215.14), 30 hops max
 1  192.168.1.1 (192.168.1.1)  1.234 ms  1.012 ms  0.998 ms
 2  10.0.0.1 (10.0.0.1)  4.567 ms  4.456 ms  4.345 ms
 3  203.0.113.1 (203.0.113.1)  12.345 ms  12.234 ms  12.123 ms
 4  93.184.215.14 (example.com)  24.567 ms  24.456 ms  24.345 ms
```