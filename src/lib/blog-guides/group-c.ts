import type { Guide } from "../guide-types";

export const groupC: Record<string, Guide> = {
  "smart-dispatcher": {
    title: "Smart dispatcher: matching a target to the right diagnostic",
    summary: "Recognise the kind of target you have, then pick the diagnostic that fits.",
    purpose:
      "Before you can test a target, you need to know what kind of target it is. This helper reads the string you pasted and sorts it into one of three buckets: a website address, an IP address, or a domain name. It then points you at the checks that suit that bucket. The whole thing runs in your browser, so nothing reaches the target.",
    steps: [
      "Paste the target exactly as you have it: a full address with a scheme, a bare domain, or a numeric address.",
      "Run the classifier. It reads only the characters you typed and never contacts the host, so a wrong guess costs nothing.",
      "Read the Type line first, because it decides which suggestions the panel lists underneath.",
      "Pick a suggestion that answers your actual question, such as ownership for an address or record lookups for a name.",
      "If the target was misclassified, fix the input rather than the check, since a bare hostname cannot answer questions about a page.",
    ],
    terms: [
      { label: "Target", meaning: "The hostname pulled out of a full address, or the string you entered when no scheme was present." },
      { label: "Type", meaning: "The bucket the input falls into: Website URL, IP address, or Domain. It reflects formatting alone, not the state of the host." },
      { label: "Protocol", meaning: "HTTP or HTTPS when you pasted a full address. A dash appears when the input carried no scheme." },
      { label: "Suggested tool", meaning: "One of three fixed checks offered for the bucket, so the list does not change with your particular question." },
      { label: "Purpose", meaning: "The one line reason that check was offered, describing the kind of question it was built to answer." },
    ],
    takeaway:
      "Start from what you need to know, not from the target you happen to have. A name that will not resolve wants a DNS record check; a page that loads badly wants response headers; an address that looks unfamiliar wants ownership and reputation. The classifier only shortens that decision, it never makes it.",
    mac: {
      command:
        "T=\"https://example.com\"\ncase \"$T\" in\n  http://*|https://*) echo \"Website URL\" ;;\n  [0-9]*.[0-9]*.[0-9]*.[0-9]*) echo \"IP address\" ;;\n  *) echo \"Domain\" ;;\nesac",
      note:
        "Open the helper in your browser and paste the target. The shell equivalent is a small case statement that tests the same three shapes; use it when you want the classification inside a script instead of on screen.",
    },
    windows: {
      command:
        "$t = \"https://example.com\"\nif ($t -match '^https?://') { \"Website URL\" }\nelseif ($t -match '^\\d{1,3}(\\.\\d{1,3}){3}$') { \"IP address\" }\nelse { \"Domain\" }",
      note:
        "Same routine on Windows, in PowerShell. Nothing needs installing and nothing is sent over the network, so the classification is safe to run against a host you have not checked with anyone else yet.",
    },
    limit:
      "The output is a shape test, not a verdict. A hostname can be well formed and still not exist, and a valid-looking address can belong to something you would rather not visit. Treat the suggestion as the next place to look, and confirm with a real check before you draw a conclusion.",
  },
  "traceroute": {
    title: "Traceroute: following the hops to find where a path slows down",
    summary: "Follow the hops a packet takes and find where the path slows down.",
    purpose:
      "A traceroute asks each router along a path to identify itself, one hop at a time, so you can watch a connection move across the internet. The output shows how many routers answered, how long each reply took, and where replies stopped. There is no browser tool for this, so the work happens in a terminal.",
    steps: [
      "Open a terminal and run the traceroute command for the host you want to study, keeping a sensible hop limit.",
      "Read the hop numbers in order, starting with the gateway that sits closest to your own machine.",
      "Compare the three round-trip figures on each line, because the spread between them says more than the average.",
      "Note the first hop whose reply times climb and stay high, since that is where the delay is being added.",
      "Watch where the lines turn into asterisks, and treat that as silence rather than as proof that traffic is blocked.",
    ],
    terms: [
      { label: "Hop number", meaning: "The step count from your machine towards the destination. The first entry is normally your own local gateway." },
      { label: "Router address", meaning: "The IP address of a router that answered the probe, sometimes followed by a reverse DNS name in brackets." },
      { label: "Round-trip time", meaning: "The milliseconds a probe took to reach that router and come back, printed three times for three separate probes." },
      { label: "* (no reply)", meaning: "That router did not answer the probe. It may be filtering the packet rather than being broken." },
      { label: "Final hop", meaning: "The last router that answered. Reaching it means the path was traced as far as the host allowed." },
    ],
    takeaway:
      "A trace is a map, not a verdict. Delay usually belongs to the long-haul links in the middle of the path, and a single slow hop does not make the whole route slow. The useful question is whether the time grows gradually after a certain hop or jumps in one place.",
    mac: {
      command: "traceroute -m 20 example.com",
      note:
        "macOS ships traceroute in Terminal, so no install is needed. The default probe is UDP, and the limit set here keeps a trace from running for minutes when a host never answers.",
    },
    windows: {
      command: "tracert -h 20 example.com",
      note:
        "Windows uses the same idea under a different name, and its probes go out as ICMP instead of UDP. For that reason alone, the route it reports will not match what a Mac shows.",
    },
    limit:
      "Every traceroute tells you about one direction from one machine at one moment. The reply route can be entirely different, and a router that ignores probes still forwards real traffic happily. If the trace completes, the site is reachable; if it stalls, check the site itself before blaming the network.",
  },
  "port-check": {
    title: "Port check: what open, refused and filtered TCP results mean",
    summary: "Test one TCP port and learn what open, refused and filtered really mean.",
    purpose:
      "A port number points at one service on a machine, and a TCP connect attempt tells you whether that service is reachable from where you sit. The interesting part is the difference between a refusal and a silence. This check has no browser tool, so you run it from a terminal on your own machine.",
    steps: [
      "Decide which host and port you have the right to test, and write them down before you open a terminal.",
      "Run the connect command for that port and read the single line it prints back.",
      "Separate the three outcomes: a completed handshake, an active refusal, or a timeout with no answer.",
      "If the port answers, move on to the protocol above it, since an open port can still refuse to speak HTTP or TLS.",
      "Repeat from a second network if the first result is a timeout, since a local firewall can block the probe before it leaves.",
    ],
    terms: [
      { label: "Connection refused", meaning: "The host answered with a rejection, which normally means nothing is listening on that port." },
      { label: "Connection timed out", meaning: "No answer arrived before the deadline. A firewall usually drops the probe instead of refusing it." },
      { label: "Handshake succeeded", meaning: "The three-way TCP exchange completed, so a process on the host accepted the connection." },
      { label: "Remote address", meaning: "The address the probe was sent to, which is the host you typed rather than the machine you ran it on." },
      { label: "Source address", meaning: "The local interface the probe left from. On a laptop with several networks this can change the result." },
    ],
    takeaway:
      "A refused port is a closed door and a timed out port is a wall. Both mean the service is not usable from your machine, but they point at different causes and different fixes. An open port only proves that something accepted a connection, never that the application behind it works.",
    mac: {
      command: "nc -zv -w 3 example.com 443",
      note:
        "nc ships with macOS and tests a single TCP port without scanning the rest of the host. Add -v so the result is spelled out, and -w 3 so an unresponsive port gives up in three seconds.",
    },
    windows: {
      command: "Test-NetConnection -ComputerName example.com -Port 443",
      note:
        "PowerShell builds this in, so nothing needs installing. Read the TcpTestSucceeded line, and remember that a failed ping alongside it says more about ICMP than about the port itself.",
    },
    limit:
      "Only test machines you own or have permission to probe. These commands cover TCP, and a UDP service stays invisible to them. A timeout can also come from your own firewall or the network in between, so it never proves the host is down.",
  },
  "what-is-my-ip": {
    title: "What is my IP: the public address servers see and what it hides",
    summary: "See the public address servers see, and what the details behind it mean.",
    purpose:
      "Your public IP address is the number a remote server writes down when you connect to it. The tool asks a geolocation service about the address that request came from, then reports the country, city, network operator and timezone it associates with that number. The lookup runs live from your browser and needs no input at all.",
    steps: [
      "Open the page and let it run. There is nothing to type, because the address is detected from the request itself.",
      "Read the public address first, then check whether it matches the network you believe you are on.",
      "Compare the city and region with your actual location, expecting an approximate match rather than a precise one.",
      "Note the network operator and ASN, which identify the provider holding the address block you sit in.",
      "Check the address again after switching networks or starting a VPN, since the number changes with the exit point.",
    ],
    terms: [
      { label: "Public IP", meaning: "The routable address of the connection you are on. It belongs to a network rather than to your device." },
      { label: "Country", meaning: "The country the provider's address block is registered in, which is usually but not always where you are." },
      { label: "City", meaning: "The nearest city in the provider's database, often pointing at the network's hub rather than your street." },
      { label: "ISP", meaning: "The organisation that hands out addresses in this block. It is the network owner, not the person at the keyboard." },
      { label: "Timezone", meaning: "The zone the address is registered against, useful for spotting a mismatch when a remote server guesses your clock." },
      { label: "ASN", meaning: "The autonomous system number for the announcing network. It identifies the operator in routing terms." },
    ],
    takeaway:
      "Expect the country and provider to be right and the city to be roughly right. The number identifies the network connection you are using, so it changes when you move between a home line, a phone hotspot or a VPN tunnel. Anyone can look it up, which is why it is not a personal identifier.",
    mac: {
      command: "curl -s https://ipinfo.io/json",
      note:
        "Run this in Terminal and the service replies with JSON holding the same fields plus a few extras. The plain endpoint ipinfo.io/ip returns only the address if you want just the number.",
    },
    windows: {
      command: "curl.exe -s https://ipinfo.io/json",
      note:
        "Same request from PowerShell. On current Windows the real curl.exe is the one to call, because the old PowerShell alias is a different tool that will not understand this address.",
    },
    limit:
      "On a company or campus network the address belongs to the shared gateway, not to your machine. Geolocation comes from address databases and is routinely wrong at city level. A VPN or a proxy makes the answer describe that service instead of your real network.",
  },
  "whois-lookup": {
    title: "WHOIS lookup: reading domain registration and who holds it",
    summary: "Read registration data for a domain and learn who holds it.",
    purpose:
      "Every registered domain carries a record of who bought it, who serves its DNS and when the registration runs out. This tool pulls that record over RDAP, the structured successor to the old WHOIS protocol, and lays it out as plain fields. The request is made live from the site.",
    steps: [
      "Type the domain with no scheme, such as example.com, and run the lookup to query the registry for that name.",
      "Start with the registrar row, which names the company you would deal with to renew or move the domain.",
      "Compare the nameservers against what your DNS lookup returns, since the two lists should agree.",
      "Read the expiry date as a calendar reminder, because most domains are renewed automatically and rarely lapse.",
      "Check the DNSSEC row, which tells you whether the registry has a signed delegation in place for that name.",
    ],
    terms: [
      { label: "Registrar", meaning: "The company that holds the registration on behalf of the owner and handles renewals and transfers." },
      { label: "Creation date", meaning: "The day the domain was first registered, which is a useful age signal when a name looks unfamiliar." },
      { label: "Expiration date", meaning: "The day the current registration ends. After that the name is usually held for a short grace period." },
      { label: "Nameservers", meaning: "The servers that hold the zone for this domain. They are the hosts your DNS lookup should be answering from." },
      { label: "DNSSEC", meaning: "Whether the delegation is signed. A signed delegation lets resolvers check that answers were not altered." },
      { label: "Locks", meaning: "Registrar restrictions currently applied, such as a transfer lock that stops the domain moving without a code." },
    ],
    takeaway:
      "A live RDAP answer is the registry's own view of the domain at that moment. Some privacy services replace the registrant details, and the registrar row may point at a reseller rather than the company you paid. What you can trust is the structure: dates, nameservers, locks and DNSSEC.",
    mac: {
      command: "curl -s https://rdap.org/domain/example.com",
      note:
        "rdap.org redirects to the authoritative RDAP server for that top-level domain, so this returns the same structured record the site reads. The classic port 43 whois protocol gives a similar answer in plain text if you have that client installed.",
    },
    windows: {
      command: "curl.exe -s https://rdap.org/domain/example.com",
      note:
        "Use curl.exe rather than the PowerShell alias, because the alias points at an older tool with different argument handling. The reply is JSON, so pipe it through ConvertFrom-Json if you want to read a single field.",
    },
    limit:
      "RDAP is only published for top-level domains that offer it, so a lookup for an unusual suffix can fail even when the domain exists. Redacted records hide the registrant, and the record reflects the registry's data rather than the hosting account. Nothing here describes what the site serves.",
  },
  "http-latency": {
    title: "HTTP latency: splitting a request between server wait and download",
    summary: "See how a request's time splits between server wait and download.",
    purpose:
      "Every page load spends its time in a handful of places, and most of it is usually spent waiting for the server to answer. This check makes a real request to the URL you give it and reports the total, the time to first byte and the download time as separate numbers. The measurement is performed live from the site.",
    steps: [
      "Paste the full URL including the scheme, then run the measurement so the request is made from the site's own network.",
      "Read the status code next, because an error page can return quickly and still be the wrong thing to measure.",
      "Compare time to first byte with the download figure, since the split tells you whether the server or the payload is slow.",
      "Look at the DNS, TCP and TLS rows, which come back empty here because the platform handles those phases internally.",
      "Run the curl command below on your own machine when you want the connection phases, since the terminal exposes all of them.",
    ],
    terms: [
      { label: "Total time", meaning: "The end-to-end duration of the request as the server saw it, from starting the fetch to the last byte." },
      { label: "Time to first byte", meaning: "How long the server took before the response began. This is the number that grows with slow backends." },
      { label: "Content download", meaning: "The time spent pulling the body down after the response started, shown alongside the byte count received." },
      { label: "DNS lookup", meaning: "The row comes back empty because the hosting platform resolves the name itself and does not report the timing." },
      { label: "TCP connect", meaning: "Also empty here, for the same reason. A local curl run does fill this row in." },
      { label: "TLS handshake", meaning: "The certificate exchange time, left blank in this measurement and visible when you run the terminal command yourself." },
    ],
    takeaway:
      "A large time to first byte points at the server doing the work, while a large download time points at a heavy page. Run the measurement more than once, because the first request to a cold page is often the slowest. Numbers from the site's network are not the same as numbers from your desk.",
    mac: {
      command:
        "curl -s -o /dev/null -w \"dns: %{time_namelookup}s\\ntcp: %{time_connect}s\\ntls: %{time_appconnect}s\\nttfb: %{time_starttransfer}s\\ntotal: %{time_total}s\\n\" https://example.com",
      note:
        "curl prints one line per phase, and each value adds the previous ones up, so the TLS number already includes DNS and TCP. The -o /dev/null flag discards the body so only the timings remain on screen.",
    },
    windows: {
      command:
        "curl.exe -s -o NUL -w \"dns: %{time_namelookup}s\\ntcp: %{time_connect}s\\ntls: %{time_appconnect}s\\nttfb: %{time_starttransfer}s\\ntotal: %{time_total}s\\n\" https://example.com",
      note:
        "The same flags work in PowerShell, with NUL standing in for the discarded body. Remember that time_appconnect is the moment TLS finished, so subtract time_connect to get the handshake on its own.",
    },
    limit:
      "This measurement cannot separate DNS, TCP and TLS, so those three rows stay blank and the total is not a full breakdown. It also measures one request from one place, with no second request to compare. A cached or personalised response will not resemble the first load a visitor sees.",
  },
  "email-header-parser": {
    title: "Email header parser: reading the route an email took",
    summary: "Read the route an email took and the checks it passed or failed.",
    purpose:
      "Every message carries a block of headers recording who sent it, which servers accepted it and what the receiving server decided about its authenticity. This parser reads that block and pulls out the parts that matter during a delivery investigation. It runs entirely in your browser, so the header never leaves your machine.",
    steps: [
      "Open the original source of a message, which is the view that shows the full header block with every hop intact.",
      "Copy everything above the blank line that separates the headers from the body, and paste it into the parser.",
      "Read the Received lines from the bottom up, since the oldest hop is the one closest to the sending server.",
      "Check the SPF, DKIM and DMARC results, which are written by the receiving server and cannot be edited by the sender.",
      "Note the originating IP and compare it with the sending address, since a mismatch is the first thing worth questioning.",
    ],
    terms: [
      { label: "From", meaning: "The display name and address the sender chose. It is a text field and proves nothing about who sent the mail." },
      { label: "Subject", meaning: "The headline of the message, copied straight from the header block with no verification attached to it." },
      { label: "Date", meaning: "The timestamp the sending client recorded, which can differ from the times stamped by the servers in between." },
      { label: "SPF", meaning: "The result the receiving server wrote for SPF, showing whether the sending server was authorised for that domain." },
      { label: "DKIM", meaning: "The signature check result, which confirms the message body was not altered in transit when it says pass." },
      { label: "Hops", meaning: "The number of Received lines in the block, which counts the servers that handled the message." },
    ],
    takeaway:
      "A clean set of passes means the receiving server found the message authentic, not that the content is trustworthy. The Received chain tells you where the message travelled and how long each stage took. When a message is rejected or quarantined, the receiving server's own verdict in Authentication-Results is the line to read first.",
    mac: {
      command: "grep -E '^(Received|Authentication-Results):' message.eml",
      note:
        "Save the raw message as a file first, then run this to pull out the hop chain and the authentication verdict. If you only pasted the visible part of the mail, the parser will find nothing to show you.",
    },
    windows: {
      command: "Select-String -Path message.eml -Pattern '^(Received|Authentication-Results):'",
      note:
        "PowerShell can search the saved file in the same way. Keep the file in plain text, since a saved .eml with unusual encoding can hide the Received lines from the parser.",
    },
    limit:
      "The parser only reads what you paste. It does not look up the addresses, contact the servers or open any attachment. Results depend on the header being complete, and forwarded mail often carries a shortened chain that hides the true origin.",
  },
  "jwt-decoder": {
    title: "JWT decoder: reading a token's contents without trusting it",
    summary: "Read the contents of a JSON Web Token without trusting it.",
    purpose:
      "A JSON Web Token carries three base64url parts joined by dots: a header naming the algorithm, a payload holding the claims, and a signature. This tool decodes the first two and shows them as formatted JSON. It runs entirely in your browser and it does not check the signature at all.",
    steps: [
      "Paste the whole token, including all three dot-separated parts, since dropping the signature makes it a different string.",
      "Read the algorithm from the header first, because the algorithm inside a token is the one an attacker would like you to trust.",
      "Read the payload claims and check the issued at and expires times against the current date.",
      "Confirm that the audience and issuer values match what your own application expects from a valid token.",
      "Hand the token to the server that issued it, or to a library, when you need the signature actually checked.",
    ],
    terms: [
      { label: "Algorithm", meaning: "The signing algorithm named in the header, such as HS256. It describes the token, it does not confirm the token." },
      { label: "Type", meaning: "The typ header value, usually JWT. A value of none is a red flag that deserves investigation." },
      { label: "Issued at", meaning: "The iat claim converted to a date and time, telling you when the token was created." },
      { label: "Expires", meaning: "The exp claim converted to a date and time. Past that moment a server should refuse the token." },
      { label: "payload.aud", meaning: "The audience the token was minted for. A token meant for another service should not be accepted here." },
      { label: "Signature preview", meaning: "The first part of the signature segment as text. It is shown for reference and is never verified." },
    ],
    takeaway:
      "Decoding tells you what a token says and nothing about whether it is genuine. Anyone can craft a token with any claims they like, and this tool will happily print them. Verification means checking the signature with the issuer's key, which only the server or a proper library can do.",
    mac: {
      command: "echo \"$TOKEN\" | cut -d. -f1-2 | tr '.' '\\n' | tr '_-' '/+' | base64 -d",
      note:
        "This splits the first two segments, swaps the base64url characters and decodes them in turn, giving the header and then the payload. Some builds want padding added, so append equals signs if it refuses.",
    },
    windows: {
      command:
        "$t = $env:TOKEN -split '\\.'\n$t[0..1] | ForEach-Object { $s = $_.Replace('-','+').Replace('_','/'); while ($s.Length % 4) { $s += '=' }; [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($s)) }",
      note:
        "PowerShell does the same job and pads the string to a length of four before decoding. Set the token in the environment first, then read the two JSON objects the command prints.",
    },
    limit:
      "Decoding is not verification. The tool reads the two base64url segments and prints them, and it never contacts a key server or recomputes the signature. Treat every claim it shows as unverified input, and never accept a token on the strength of a decoded payload alone.",
  },
};
