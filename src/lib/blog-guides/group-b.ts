// Blog guide copy for the tools in this group.
//
// Each entry is a standalone tutorial: the technique, the fields the tool
// returns and what to do with the answer. The editorial block on the tool
// page already explains the widget, so it is not repeated here.

import type { Guide } from "../guide-types";

export const groupB: Record<string, Guide> = {
  "security-headers": {
    title: "Security headers: what each missing header would have protected",
    summary: "Read a site's security headers and learn what each missing one protects against.",
    purpose:
      "Every HTTP response can carry instructions that tell the browser how to handle the page: refuse framing, refuse other content types, demand HTTPS next time. Auditing those instructions is a small job with a clear technique: fetch the page, read the response headers, and compare what arrived with what should have arrived. The SiteTrace audit performs that fetch live and grades the result.",
    steps: [
      "Request the homepage yourself with a HEAD or GET call and keep the response headers, since that is the exact set the audit scores.",
      "Mark each header you recognise as present or absent, and note the value you found rather than assuming the default one.",
      "Treat a missing Content-Security-Policy as the first thing to design, because a policy that breaks your app is worse than none.",
      "Check the values of headers that are present, since a weak HSTS lifetime or a wide-open CSP still leaves the gap open.",
      "Compare your manual result with the live SiteTrace audit, which fetches the same URL from its own servers and grades what comes back."
    ],
    terms: [
      { label: "Grade", meaning: "A letter from the weighted set of headers the audit found. It reflects only the response it fetched, not the state of your application." },
      { label: "Present / Missing", meaning: "Whether the header arrived in the response. Missing rows carry a recommendation instead of a value, describing what to add." },
      { label: "Strict-Transport-Security", meaning: "max-age=31536000 tells browsers to use HTTPS on every later visit to that host. A short lifetime weakens the guarantee." },
      { label: "Content-Security-Policy", meaning: "Restricts which script and style sources a page may load. A policy must be written for your own application, not copied blindly." },
      { label: "Info leak · server", meaning: "Rows exposing headers such as server or x-powered-by, which advertise your stack and its version to anyone who asks." }
    ],
    takeaway:
      "A missing header is a gap with a known remedy, and a present header is not automatically a strong one. Read the values before you copy any recommended policy into your server config, then re-run the audit and confirm the same headers now arrive.",
    mac: {
      command: "curl -sI https://example.com",
      note: "Run this in Terminal and read the header block line by line. The command prints values only, so scoring the result is left to you."
    },
    windows: {
      command: "curl.exe -sI https://example.com",
      note: "Run this in PowerShell on Windows 10 or 11. The same headers appear in Chrome under Network, by selecting the document request and opening its Headers tab."
    },
    limit:
      "The audit captures one response from one server, so a CDN edge, a cache or a bot filter can change the answer between runs. It also measures nothing about your code, your dependencies or your TLS configuration, and a strict policy pasted in without testing can break sign-in or embedded content."
  },
  "email-deliverability": {
    title: "Email deliverability: reading SPF, DKIM, DMARC and MX yourself",
    summary: "Read SPF, DKIM, DMARC and MX records yourself, and know what each one controls.",
    purpose:
      "Receiving mail servers decide whether a message is genuine by reading DNS records published by the sending domain. SPF lists the servers allowed to send, DKIM publishes a signing key, DMARC states what to do when a check fails, and MX names the hosts that accept mail. SiteTrace reads all four live for any domain, scores them and lists the problems it found.",
    steps: [
      "Look up the TXT records for the sending domain to read SPF, then find the DKIM public key under the selector your provider signs with.",
      "Read the DMARC record at _dmarc and note the policy, since none only collects reports while quarantine and reject act on failures.",
      "Check the MX records to confirm which hosts are set up to receive mail for that domain.",
      "Compare each record with the addresses your sending service actually uses, because an outdated SPF list authorises the wrong servers.",
      "Run the same four lookups through the live SiteTrace check, which scores the set and adds any issues it detects."
    ],
    terms: [
      { label: "SPF", meaning: "The TXT record listing authorised senders, usually ending in ~all or -all. It says nothing about who may receive mail." },
      { label: "DKIM · selector", meaning: "The public key published at that selector name. Not found usually means the selector is wrong, not that signing is broken." },
      { label: "DMARC", meaning: "The policy at _dmarc. none collects reports, quarantine sets failures aside, reject asks receivers to refuse them." },
      { label: "MX", meaning: "The hosts that accept mail for the domain, with a preference number deciding which one is tried first." },
      { label: "Risk / Issues", meaning: "The grade for the record set and a count of problems, each spelled out as a row you can act on." }
    ],
    takeaway:
      "A domain with all four records present has a clear path for its mail. A strong score says the records are well formed, not that messages land in an inbox, because reputation, content and alignment decide that part. Move from p=none to a stricter policy only after your aggregate reports look clean.",
    mac: {
      command: "dig example.com TXT; dig default._domainkey.example.com TXT; dig _dmarc.example.com TXT; dig example.com MX",
      note: "Query the four records in Terminal with dig, substituting your real selector for default. These lookups read the same public DNS that any receiving server sees."
    },
    windows: {
      command: "Resolve-DnsName example.com -Type TXT; Resolve-DnsName default._domainkey.example.com -Type TXT; Resolve-DnsName _dmarc.example.com -Type TXT; Resolve-DnsName example.com -Type MX",
      note: "Run the same four queries in PowerShell, using -Type TXT for SPF, DKIM and DMARC and -Type MX for the mail hosts. Add -Server to target a resolver."
    },
    limit:
      "Records found in DNS do not prove that a particular message passed authentication, since alignment also depends on the sending server. Nothing here measures sender reputation, blocklists or inbox placement, and a policy of none is recorded as valid even though it enforces nothing."
  },
  "ping-test": {
    title: "Ping test: measuring latency and packet loss from your own machine",
    summary: "Measure round-trip delay and packet loss from your own machine with four pings.",
    purpose:
      "A ping test sends a small packet to a host and measures how long the reply takes to come back. Run repeatedly, it reveals two things a page load does not: how stable the delay is and whether replies ever go missing. There is no browser tool for this, so the work happens in a terminal on your own network.",
    steps: [
      "Choose a host you want to reach, using a hostname so the test also exercises your DNS resolution.",
      "Send four packets with ping, which is enough to see the pattern without tying up the connection for long.",
      "Read the packet loss line first, because a single dropped reply matters more than a slightly higher average.",
      "Compare the minimum, maximum and average times to spot a connection whose delay swings between packets.",
      "Repeat the run at different times of day, since one sample says little about a link that carries real traffic."
    ],
    terms: [
      { label: "Packets transmitted / received", meaning: "How many packets you sent and how many came back. A gap between the two numbers is the packet loss you are looking for." },
      { label: "Packet loss", meaning: "The share of packets that never returned within the timeout. Zero loss across a short run is a good sign, not a guarantee." },
      { label: "Round-trip min/avg/max", meaning: "The fastest, typical and slowest reply times. A wide spread points at jitter rather than a link that is simply slow." },
      { label: "time=24.8 ms", meaning: "The delay for one packet, measured from sending it to receiving the echo reply. Latency and bandwidth are different things." },
      { label: "Request timeout", meaning: "How long the tool waits before declaring a packet lost. A short timeout can report loss on a link that is merely slow." }
    ],
    takeaway:
      "A run with no loss and a tight spread means the path back is working well from where you stand. Timeouts prove less than they appear to: many servers and firewalls drop ping packets while serving web traffic normally, so confirm a suspected outage with an HTTP request.",
    mac: {
      command: "ping -c 4 example.com",
      note: "In Terminal, this sends four packets and stops. Add -i 1 to space them one second apart when you want to watch the delay change over time."
    },
    windows: {
      command: "ping -n 4 example.com",
      note: "In PowerShell or Command Prompt, this sends four packets and stops. Windows prints the same round-trip figures in milliseconds under its statistics summary once the run ends."
    },
    limit:
      "The result describes one path from your network to one host at one moment. It says nothing about throughput, DNS resolution time or how the site performs for other users, and an ICMP filter on the far side can make a healthy server look unreachable."
  },
  "ssl-certificate": {
    title: "SSL certificate: reading issuer, dates and names from a handshake",
    summary: "Read a TLS certificate's issuer, dates and names straight from the handshake.",
    purpose:
      "When you open an HTTPS site, the server presents a certificate and your browser checks who signed it, when it expires and whether it covers the hostname you asked for. openssl lets you read the same document directly. SiteTrace has no browser tool for this, so the inspection happens on your own machine with a command.",
    steps: [
      "Open a TLS connection to the host and port you want to inspect, usually 443 for HTTPS.",
      "Ask the server for its certificate and read the subject, issuer and validity dates from the output.",
      "List the subject alternative names, since modern browsers match the hostname against those rather than the subject field.",
      "Follow the chain up to a root you trust, because a certificate signed by an unknown authority is not a valid one.",
      "Check the protocol version the server negotiated, which describes the connection and nothing about the site behind it."
    ],
    terms: [
      { label: "subject / subjectAltName", meaning: "The names the certificate covers. The host you connected to must appear in the alternative names for the browser to accept it." },
      { label: "issuer", meaning: "The certificate authority behind the signature. Its chain should lead back to a root your system already trusts." },
      { label: "notBefore / notAfter", meaning: "The window in which the certificate is valid. A browser refuses the connection once that window has passed." },
      { label: "Verify return code: 0 (ok)", meaning: "The verdict OpenSSL itself gives after checking the chain against the trusted roots in its store." },
      { label: "Protocol / cipher", meaning: "The negotiated TLS version and cipher suite. Both describe the transport, not the content carried inside it." }
    ],
    takeaway:
      "A certificate with the right names, current dates and a trusted issuer means the channel to the server is encrypted and the server proved control of the domain. It says nothing about who runs the site, what the business does, or whether the page itself is safe.",
    mac: {
      command: "openssl s_client -connect example.com:443 -servername example.com </dev/null 2>/dev/null | openssl x509 -noout -subject -issuer -dates -ext subjectAltName",
      note: "Run this in Terminal. The first half opens the handshake and the second prints subject, issuer, dates and the alternative names without the connection noise."
    },
    windows: {
      command: "$tcp = New-Object System.Net.Sockets.TcpClient('example.com',443); $ssl = New-Object System.Net.Security.SslStream($tcp.GetStream(),$false,({$true} -as [System.Net.Security.RemoteCertificateValidationCallback])); $ssl.AuthenticateAsClient('example.com'); $ssl.RemoteCertificate | Format-List Subject,Issuer,NotBefore,NotAfter",
      note: "Windows has no openssl by default, so this PowerShell line opens the TLS stream and prints the certificate fields. It shows the details even when the chain is untrusted."
    },
    limit:
      "A certificate is public and proves only domain control at the moment of issuance. It carries no information about the site's content or owner, and one can be perfectly valid on a site that is harmful, so never treat a padlock as a trust mark."
  },
  "seo-checker": {
    title: "SEO checker: separating real metadata problems from conventions",
    summary: "Audit the metadata of one page and separate real problems from conventions.",
    purpose:
      "Search engines read a page's head section before anything else: the title, the description, the canonical link and the robots directive. Checking them is mostly a matter of fetching the HTML and reading the tags. The SiteTrace audit does exactly that against a live page and returns a weighted score with one row per check.",
    steps: [
      "Fetch the page as a crawler would and open the HTML source, because what you see on screen may be rendered by JavaScript.",
      "Read the title tag and count its characters, since it doubles as the headline in a search result.",
      "Check that the meta description says something specific about this page rather than repeating the title.",
      "Confirm the canonical link points at the address you want indexed, and read the robots directive next to it.",
      "Compare the H1 and the image alt attributes with the visible content, then run the live audit to see the same fields scored."
    ],
    terms: [
      { label: "Score", meaning: "A weighted total for the checks that ran, out of 100. It is a checklist result from this tool, not a ranking or a search engine metric." },
      { label: "Passed / Warnings", meaning: "How many checks passed and how many returned a warning. A warning marks something worth looking at, not an automatic fault." },
      { label: "Page title", meaning: "The title tag with its character count. It becomes the headline of a search listing and the title of the browser tab." },
      { label: "Meta description", meaning: "The summary a search engine may show under the title. Engines often rewrite it, so describe the page rather than a list of keywords." },
      { label: "Canonical URL", meaning: "The address the page declares as its preferred version, used when several URLs carry the same content." },
      { label: "Robots", meaning: "The directive that permits or blocks crawling and indexing. A permitted page is still not guaranteed to be indexed." }
    ],
    takeaway:
      "Most pages score well enough that the score itself stops being interesting, and the remaining warnings are where the work is. Fix the title and description on each template, then check that the canonical and robots directives match what you want search engines to do.",
    mac: {
      command: "curl -sL https://example.com | grep -i -E '<title|description|canonical|robots'",
      note: "In Chrome on a Mac, choose View, then Developer, then View Source, and search the markup for the same tags. The rendered page can differ from that source."
    },
    windows: {
      command: "curl.exe -sL https://example.com | Select-String -Pattern '<title|description|canonical|robots'",
      note: "On Windows, open the document source from Chrome or Edge — right-click the page and pick View page source — then use Ctrl+F to locate the same tags. That document is what the audit parses."
    },
    limit:
      "The audit reads the HTML as the fetch received it, so text injected by JavaScript afterwards stays invisible to it. It does not measure backlinks, speed, structured data or how the page ranks, and a page that passes every check can still be poor writing."
  },
  "open-graph-preview": {
    title: "Open Graph preview: what a social platform finds in your link",
    summary: "See what a social platform will find when someone shares your link.",
    purpose:
      "When a link is pasted into a chat, the platform does not open the page. It reads a handful of meta tags that describe it, and those tags decide the headline, the summary and the picture in the card. Fetching the page and reading those tags is the whole technique, and SiteTrace does it live against the URL you give it.",
    steps: [
      "Fetch the page and search the head for tags that start with og:, which is where the sharing values live.",
      "Read og:title and og:description and ask whether either would make sense to someone who has never seen the page.",
      "Check og:image and confirm it points at a file published on a public address, since a blocked URL will not render in a feed.",
      "Look at og:type to see whether the page describes itself as a website or as an article.",
      "Run the live SiteTrace preview for the same URL, then confirm the finished card in the platform's own sharing debugger."
    ],
    terms: [
      { label: "og:title", meaning: "The headline a platform shows on the card. It may not match the browser title, but it should describe the same page." },
      { label: "og:description", meaning: "The summary printed under the headline. Platforms often cut it to fit, so put the important part first." },
      { label: "og:image", meaning: "The picture address for the card. It reads Not provided when the page carries no such tag at all." },
      { label: "og:type", meaning: "The content type, usually website for a landing page or article for a dated post. It changes how a card is laid out." },
      { label: "og:site_name / og:locale", meaning: "A brand name and a language that can travel with the link, both optional and often left out." },
      { label: "twitter:card", meaning: "The tag X reads when it wants a summary, large image or video layout instead of the standard card." }
    ],
    takeaway:
      "A page with a title, a description and a public image produces a card that reads well before anyone opens the link. The preview card here shows a placeholder in the image area rather than the real picture, so check the finished card in the platform you will post to.",
    mac: {
      command: "curl -sL https://example.com | grep -i 'og:'",
      note: "Pipe the page through curl and grep for og: in Terminal to read the tags as text. That inspects the markup only, it does not build the card a platform would draw."
    },
    windows: {
      command: "curl.exe -sL https://example.com | Select-String 'og:'",
      note: "Run this in PowerShell on Windows 10 or 11. Check the twitter: tags as well, because X gives those priority over the og ones when both are present."
    },
    limit:
      "Each platform crops and reorders cards differently, and this view cannot reproduce that. The image URL is listed as written without being fetched, and platforms cache previews for a while, so a fixed tag may need a refresh in their debugger."
  },
  "password-generator": {
    title: "Password generator: how a random password is drawn in the browser",
    summary: "Generate a random password in the browser and understand how the characters are drawn.",
    purpose:
      "A long random password removes the guesswork that makes human-chosen ones weak. The generator draws characters from the Web Crypto random source, guarantees at least one character from each selected group, and shuffles the order so the result carries no pattern. Everything happens in the page, and the finished string is never stored.",
    steps: [
      "Set the length, where 24 characters is a sensible floor for an account that matters.",
      "Leave every character group selected unless the service you are signing up to rejects one of them.",
      "Generate the password and move it straight into your password manager instead of leaving it in a note.",
      "Give each account its own value, because one reused password exposes every service that shares it.",
      "Turn on two-factor authentication where it is offered, since a strong password alone cannot stop a phished login."
    ],
    terms: [
      { label: "Length", meaning: "The number of characters produced, between 8 and 128. Length does more for strength than any trick with character symbols." },
      { label: "Character types", meaning: "How many of the four groups were enabled. Each enabled group contributes at least one character to the result." },
      { label: "Randomness", meaning: "It reads Cryptographic because the bytes come from the Web Crypto generator, not from a predictable function such as Math.random." },
      { label: "Storage", meaning: "It reads Not saved because the site keeps no copy of the result. Your clipboard, screenshots and password manager still hold one." }
    ],
    takeaway:
      "The value shown in a screenshot is public example data and must never be reused on a real account. Produce a new password, keep it in a password manager, and let each service have its own.",
    mac: {
      command: "openssl rand -base64 24",
      note: "This gives 24 random bytes in base64, a strong secret for a machine rather than a memorable password. For one you will type, use the generator in the browser instead."
    },
    windows: {
      command: "$b = New-Object byte[] 24; [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); [Convert]::ToBase64String($b)",
      note: "Run this in PowerShell on Windows 10 or 11. It produces the same kind of random secret without needing openssl installed on the machine at all."
    },
    limit:
      "The generator does not check the result against breach databases, so a repeated pattern can still appear by chance. It also ignores the character rules a particular service imposes, and the tool is only as safe as the device you generated it on."
  },
  "random-color": {
    title: "Random color: reading one color as HEX, RGB and HSL",
    summary: "Roll a random color and read it as HEX, RGB or HSL.",
    purpose:
      "Random colors are useful when you need a placeholder accent, a test fixture, or the seed of a palette you build out from. The generator picks three random bytes and shows the same color written three ways, so you can copy whichever notation your design tool expects. Everything is computed in the page, and no value is sent anywhere.",
    steps: [
      "Pick the notation your tool expects, since HEX, RGB and HSL all describe the same color in different forms.",
      "Generate a color and read the swatch and the three values together, since they all refer to one result.",
      "Copy the value into the color field of your design tool or stylesheet, then look at it in context.",
      "Check the contrast of that color against the background it will sit on, because random picks rarely suit text.",
      "Generate again whenever the result does not fit, since each run produces a completely different value."
    ],
    terms: [
      { label: "HEX", meaning: "Six hexadecimal digits after a hash, where each pair of digits is one color channel running from 00 to FF." },
      { label: "RGB", meaning: "The red, green and blue amounts, each on a scale from 0 to 255. A bigger number pushes the mix toward that channel." },
      { label: "HSL", meaning: "Hue measured as a rotation on the color wheel, with saturation and lightness as percentages. It suits building tints and shades." },
      { label: "Swatch", meaning: "The visual block showing the result. Two screens can render the same value differently, so trust the numbers over the preview." }
    ],
    takeaway:
      "Every run gives a different color, so the one you see is only yours for that moment. Keep the value you choose rather than the screenshot, and pair it with a checked contrast ratio before it carries any text.",
    mac: {
      command: "openssl rand -hex 3",
      note: "This prints six hexadecimal digits in Terminal. Put a # in front of them to turn the output into a CSS color you can paste straight into a stylesheet."
    },
    windows: {
      command: "$b = New-Object byte[] 3; [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); '#' + (($b | ForEach-Object { $_.ToString('x2') }) -join '')",
      note: "Run this in PowerShell on Windows 10 or 11 to get a random color with its hash already in place. The browser generator is easier if you also want the RGB and HSL forms."
    },
    limit:
      "A random color carries no design intent, and a large share of them fail a contrast check against a white or dark background. Nothing here suggests a palette or tests legibility, so treat the result as a starting point for your own choices."
  },
  "word-counter": {
    title: "Word counter: counting words, characters, sentences and paragraphs",
    summary: "Count words, characters, sentences and paragraphs as you type.",
    purpose:
      "Length limits are everywhere: form fields, meta descriptions, captions, abstracts. Counting by hand is slow and inaccurate, so a counter gives you the numbers in one pass. This one splits your text on whitespace, counts characters as code points, and estimates reading time, all inside the browser without sending the text anywhere.",
    steps: [
      "Paste the draft into the text box, which is the only input the counter needs.",
      "Count the text and read the word total first, since most length rules are written in words.",
      "Switch to the character total when a field measures characters, and use the figure without spaces for code-style limits.",
      "Read sentences and paragraphs separately, since the two counters split on different punctuation and blank lines.",
      "Treat the reading time as a rough guide rather than a promise, because it is derived from the word count alone."
    ],
    terms: [
      { label: "Words", meaning: "Groups of text separated by whitespace. Punctuation attached to a word stays part of it, so this is not a language-aware count." },
      { label: "Characters", meaning: "Each code point in the text counts as one, spaces and line breaks included. A combined emoji can count as several." },
      { label: "Without spaces", meaning: "The same text with every space, tab and line break removed, which is how many strict limits are measured." },
      { label: "Sentences", meaning: "Pieces of text separated by a full stop, question mark or exclamation mark. An abbreviation can split one sentence in two." },
      { label: "Paragraphs", meaning: "Blocks separated by a blank line. A single line break inside a block does not create a new paragraph." },
      { label: "Reading time", meaning: "The word count divided by 200 and rounded up to whole minutes. It assumes a fixed pace rather than your own reading speed." }
    ],
    takeaway:
      "The counters are quick and good enough for drafting, but different editors count the same text differently. When a submission has a hard limit, check the counter built into the form you are filling before you trust any number.",
    mac: {
      command: "wc -w your-file.txt",
      note: "On a saved file, run this in Terminal for a quick word count. Its counting rules differ slightly from the ones the browser tool applies to the same text."
    },
    windows: {
      command: "(Get-Content -Raw 'your-file.txt' | Measure-Object -Word).Words",
      note: "In PowerShell on Windows 10 or 11, run this against a saved text file. That pipeline counts differently from the browser tool, so compare before you rely on it."
    },
    limit:
      "The counts come from simple splitting rules, so languages without spaces and text with heavy punctuation will not match a professional editor. The reading time assumes a fixed 200 words per minute, which ignores your actual speed, and no grammar or readability measure is offered."
  }
};
