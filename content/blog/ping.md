---
title: "How to read a ping"
description: "The four numbers that tell you if a host is reachable, how far away it is, and whether the path is healthy. Includes the difference between packet loss and silence."
date: "2026-10-08"
readingTime: "6 min"
category: "DNS & connectivity"
---

Ping is the most basic network diagnostic, and the one most often misunderstood. People look at the average and stop there. But the most useful information is in the four numbers at the bottom - the summary statistics - and in the consistency of the timings in the middle.

## Why this exists

A browser cannot send ICMP. That is why this is a guide instead of a tool. The command runs in your terminal, and the explanation below helps you read what comes back.

When you would reach for it:

- Verify a host is up before debugging something more complex.
- Measure the round-trip time to a specific server to know what "normal" looks like.
- Spot packet loss on a connection that otherwise seems fine.

## How it actually works

Ping sends an ICMP echo request to the target and waits for an ICMP echo reply. The default is 4 packets on Windows, infinite on Linux until you stop it. Each reply returns a round-trip time in milliseconds. A "time to live" (TTL) value is also reported; it starts at 255 and gets decremented by every router on the path, so the TTL in the reply tells you roughly how many hops you are from the destination.

## Walkthrough

`Pinging example.com [93.184.215.14] with 32 bytes of data` -- The header. The hostname and the resolved IP, plus the size of the probe packet.

`Reply from 93.184.215.14: bytes=32 time=24ms TTL=52` -- One successful round trip. The TTL of 52 means about 203 hops were used - except routers typically start with 64, 128, or 255, so the actual hop count is the initial value minus 52.

`Reply from 93.184.215.14: bytes=32 time=23ms TTL=52` -- A second reply. When the times are close to each other, the path is stable.

`Reply from 93.184.215.14: bytes=32 time=24ms TTL=52` -- A third. Consistency matters more than the absolute number; jitter above 50% of the mean is worth investigating.

`Reply from 93.184.215.14: bytes=32 time=24ms TTL=52` -- A fourth. Four replies means zero loss for this run.

`Packets: Sent = 4, Received = 4, Lost = 0 (0% loss)` -- The summary line. Zero percent loss is healthy. Anything above 1% on a local network is suspicious.

`Minimum = 23ms, Maximum = 24ms, Average = 23ms` -- The latency statistics. The minimum tells you the best the path can do. The maximum tells you the worst case. If they are far apart, the connection is unstable.

`Request timed out` -- The host did not reply within the timeout. A single timeout mid-run is often the host deprioritizing ICMP. A streak of timeouts means the host is unreachable or the path is dropping your packets.

## What to look for

**The standard deviation, not the average.** Average ping of 30 ms means nothing if some packets arrive in 30 ms and others in 300 ms. Run `ping -c 100` and look at the spread.

**Loss on a single run is not loss.** Run it again. A single dropped packet is normal; a 5% loss rate over 100 packets is a real signal.

**The TTL tells you the distance, not the speed.** A TTL of 52 means you are roughly 12-15 hops from a Linux host (which usually starts at 64) or 60+ hops from a Windows host (which starts at 128).

## When the result is suspicious

- All replies come from a different IP than you expected. Some sites use anycast - the nearest server answers - so the IP can change between runs.
- The host replies but with a different TTL each time. The path is changing. Usually fine; sometimes a sign of route flapping.
- Ping works but HTTP does not. The host is up but the service is not. Time to look at the service, not the network.

## Related on SiteTrace

- [Traceroute](/blog/traceroute) - when ping tells you the host is reachable but you want to know which hop is slow.
- [HTTP latency](/tools/http-latency) - when ping says "fine" but the website is slow.
```command
## windows
ping example.com -n 4
## linux
ping -c 4 example.com
## darwin
ping -c 4 example.com
## sample
Pinging example.com [93.184.215.14] with 32 bytes of data:
Reply from 93.184.215.14: bytes=32 time=24ms TTL=52
Reply from 93.184.215.14: bytes=32 time=23ms TTL=52
Reply from 93.184.215.14: bytes=32 time=24ms TTL=52
Reply from 93.184.215.14: bytes=32 time=24ms TTL=52

Ping statistics for 93.184.215.14:
    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),
Approximate round trip times in milli-seconds:
    Minimum = 23ms, Maximum = 24ms, Average = 23ms
```