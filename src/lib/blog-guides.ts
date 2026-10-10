// Blog guide data, ported from falling-code-sparkle (commit ae4758f) and
// extended with a what-is-my-ip entry. The original lived in a structured
// TypeScript file so the rendering component can pull the same fields
// everywhere; this keeps the prose editable in one place per tool.

export type Guide = {
  summary: string;
  purpose: string;
  steps: string[];
  terms: { label: string; meaning: string }[];
  takeaway: string;
  mac: { command?: string; note: string };
  windows: { command?: string; note: string };
  limit: string;
};

export const guides: Record<string, Guide> = {
  "ip-lookup": {
    "summary": "Find out who owns an IP address—and what its location really tells you.",
    "purpose": "An IP address is a network address, not a person's identity. A lookup helps you recognize the provider behind a connection and understand where its network is registered.",
    "steps": [
      "Enter an IPv4 or IPv6 address, such as 8.8.8.8.",
      "Choose Preview lookup. The current diagnostic uses a fixed example, even if you enter a different address.",
      "Start with the organization and network, then treat the location as an estimate."
    ],
    "terms": [
      { "label": "Organization", "meaning": "Google LLC is the organization associated with the example address. It is not the name of a person using it." },
      { "label": "Location", "meaning": "Mountain View, US is an approximate network location. It does not locate a device or street address." },
      { "label": "AS15169", "meaning": "An autonomous system number identifies a network that routes internet traffic. Here it belongs to Google." },
      { "label": "Hostname", "meaning": "dns.google is a name associated with the address. Reverse names can be absent or outdated." }
    ],
    "takeaway": "The example is consistent with Google's public DNS service. It does not tell you where an individual user lives.",
    "mac": {
      "command": "nslookup 8.8.8.8",
      "note": "Open Terminal and run this built-in command for a reverse name lookup. It does not provide location or ownership details."
    },
    "windows": {
      "command": "nslookup 8.8.8.8",
      "note": "Open Windows Terminal, choose PowerShell, and run this command. For location or ownership, use an IP information provider in your browser."
    },
    "limit": "Geolocation can be inaccurate, especially for mobile networks and VPNs. A lookup is context, not proof of identity."
  },
  "ip-reputation": {
    "summary": "Understand blocklist results without mistaking a clean report for a safety guarantee.",
    "purpose": "Reputation checks look for an address on known abuse or spam lists. They help investigate suspicious traffic or mail delivery problems, but a listing needs context.",
    "steps": [
      "Enter the IP address you want to investigate.",
      "Choose Preview reputation to view the four-source example report.",
      "Read each source individually and verify any real listing with that source's official lookup."
    ],
    "terms": [
      { "label": "Listed: 0 of 4", "meaning": "None of the four sample sources flags this address. This is not a live blocklist check." },
      { "label": "Risk signal: Low", "meaning": "A summary of the sample listings, not a guarantee that traffic is safe." },
      { "label": "Not listed", "meaning": "The example has no listing for that source. A failed query in a real check must not be counted as clean." },
      { "label": "Sources", "meaning": "Different blocklists have different purposes, update times, and removal procedures." }
    ],
    "takeaway": "The example has no reported listings. Keep normal security checks in place; an unlisted address can still cause harm.",
    "mac": { "note": "On Mac, open the relevant blocklist's official lookup page in a browser and paste the address. No Terminal command or installation is needed." },
    "windows": { "note": "On Windows, use the same official browser lookup. Read the listing reason and follow the owner's removal process if it is your address." },
    "limit": "The sources shown are illustrative and may no longer operate. DNS blocklist queries have provider access rules and error codes; do not treat every 127.x reply as a listing."
  },
  "vpn-check": {
    "summary": "Learn the difference between VPN, proxy, Tor, and hosting signals.",
    "purpose": "This check describes how a network connection may be routed. It is useful for understanding unusual traffic, but it cannot prove who is using an address.",
    "steps": [
      "Enter an IP address.",
      "Choose Preview signals. The example is a Google datacenter address.",
      "Compare all four signals instead of relying on a single yes or no."
    ],
    "terms": [
      { "label": "VPN", "meaning": "A known VPN-network signal. No means the sample does not identify one, not that VPN use is impossible." },
      { "label": "Proxy", "meaning": "A proxy relays requests. It may be a legitimate company gateway or an anonymizing service." },
      { "label": "Tor exit node", "meaning": "An address known to send traffic out of the Tor network. Exit lists change frequently." },
      { "label": "Hosting: Yes", "meaning": "The address belongs to a datacenter network. Hosting is not the same as VPN use." }
    ],
    "takeaway": "The sample identifies hosting, but no VPN, proxy, or Tor signal. Datacenter traffic is not automatically malicious.",
    "mac": { "note": "On Mac, use a provider's VPN/proxy lookup in your browser. Full privacy classifications often require a paid plan or an API token." },
    "windows": { "note": "On Windows, use the same browser lookup. Ordinary IP ownership information does not include reliable VPN detection." },
    "limit": "These are probabilistic signals. New services, shared networks, and residential proxies can produce false positives or missed detections."
  },
  "subnet-calculator": {
    "summary": "Turn /24 into a network, an address range, and a usable host count.",
    "purpose": "A subnet groups IP addresses together. The slash number, called a CIDR prefix, says how much of the address identifies the network.",
    "steps": [
      "Enter an IPv4 network such as 192.168.1.0/24.",
      "Choose Calculate subnet. This utility calculates your actual input in the browser.",
      "Use the network and host range when planning a network you manage."
    ],
    "terms": [
      { "label": "Network", "meaning": "192.168.1.0/24 is the whole subnet, not one device." },
      { "label": "Subnet mask", "meaning": "255.255.255.0 is another way to write the /24 boundary." },
      { "label": "Total addresses", "meaning": "A /24 contains 256 addresses. In a normal /24, the first and last are reserved." },
      { "label": "Usable hosts", "meaning": "254 addresses run from 192.168.1.1 to 192.168.1.254. /31 and /32 use different rules." }
    ],
    "takeaway": "A router and devices in this example normally use the usable host range. Do not assign the network or broadcast address to an ordinary host.",
    "mac": {
      "command": "python3 -c \"import ipaddress; n=ipaddress.ip_network('192.168.1.0/24'); print(n, n.netmask, n.broadcast_address, n.num_addresses)\"",
      "note": "Use the SiteTrace calculator in Safari or Chrome. If Python 3 is installed separately, this command shows the subnet; Python is not guaranteed to be installed on a Mac."
    },
    "windows": {
      "command": "py -3 -c \"import ipaddress; n=ipaddress.ip_network('192.168.1.0/24'); print(n, n.netmask, n.broadcast_address, n.num_addresses)\"",
      "note": "Use the calculator in your browser. If Python 3 and its Windows launcher are installed, run this in PowerShell."
    },
    "limit": "This calculator covers IPv4, not IPv6. Check your router's DHCP settings before assigning a static address to avoid conflicts."
  },
  "ping-test": {
    "summary": "Read latency and packet loss, and understand what a timeout does not prove.",
    "purpose": "Ping sends small test packets and waits for replies. It helps compare connection delay and spot dropped replies from your own connection.",
    "steps": [
      "Enter a domain or IP, then choose packet count and region.",
      "Choose Preview ping to see four sample replies.",
      "Read packet loss first, then compare average, minimum, and maximum delay."
    ],
    "terms": [
      { "label": "Average: 24.8 ms", "meaning": "The mean round-trip delay: about 25 thousandths of a second to send a packet and get a reply." },
      { "label": "Minimum / maximum", "meaning": "22.1–27.6 ms is the sample range. A large spread can indicate variable delay." },
      { "label": "Packet loss: 0%", "meaning": "All sample packets received a reply. Four packets are only a small snapshot." },
      { "label": "Sequence", "meaning": "Each row is one packet. Received means that reply arrived within the test's timeout." }
    ],
    "takeaway": "This short example shows consistent replies with no loss. Repeat a real test before blaming the connection for an occasional spike.",
    "mac": { "command": "ping -c 4 example.com", "note": "Open Terminal and run this command. -c 4 stops after four packets." },
    "windows": { "command": "ping -n 4 example.com", "note": "Open PowerShell or Command Prompt. -n 4 sends four packets. Time is shown in milliseconds." },
    "limit": "Some hosts block ping but still serve websites normally. A timeout alone does not mean the site is down. Your own test does not use the preview's selected region."
  },
  "dns-lookup": {
    "summary": "Find a domain's DNS records and understand addresses, mail routes, and TTL.",
    "purpose": "DNS translates names into records. You can use it to find a website's address, a domain's mail servers, or verification text.",
    "steps": [
      "Enter a domain without https://, such as example.com.",
      "Choose a record type and resolver, then Preview records.",
      "Compare the returned name, type, and value with the record you expected."
    ],
    "terms": [
      { "label": "A", "meaning": "An IPv4 address record. AAAA is the IPv6 equivalent." },
      { "label": "Value", "meaning": "93.184.215.14 and .15 are illustrative addresses in the sample, not a current answer for example.com." },
      { "label": "TTL: 300", "meaning": "A resolver may cache this answer for 300 seconds, or five minutes. Remaining TTL may decrease." },
      { "label": "MX / TXT / CNAME", "meaning": "MX routes mail, TXT holds text such as verification records, and CNAME points one name to another." }
    ],
    "takeaway": "Two A records can be normal when traffic is shared across servers. A record existing does not prove the website is reachable.",
    "mac": { "command": "dig example.com A", "note": "Open Terminal. Change A to MX or TXT for other records. A targeted query is more useful than ANY, which may return only a limited answer." },
    "windows": { "command": "Resolve-DnsName example.com -Type A", "note": "Open PowerShell. Change A to MX or TXT. This uses your system's DNS settings unless you specify -Server." },
    "limit": "DNS records change and caches can differ. Check the correct hostname; example.com and www.example.com may have different records."
  },
  "dns-propagation": {
    "summary": "Compare DNS answers and decide whether a recent change is still spreading.",
    "purpose": "After a DNS change, different resolvers may keep old cached answers for a while. Comparing them helps explain why different users see different destinations.",
    "steps": [
      "Enter the domain and the record type you changed.",
      "Choose Preview propagation to see six illustrative resolver locations.",
      "Look at the answer in each row, not just the agreement count."
    ],
    "terms": [
      { "label": "Agreement: 5 of 6", "meaning": "Five sample rows return the same address. This is agreement between sampled answers, not proof of worldwide completion." },
      { "label": "Resolver", "meaning": "The DNS service that supplied the answer. Location is a sample test location." },
      { "label": "Matches", "meaning": "The row agrees with the sample's common answer. It does not prove the address is the intended one." },
      { "label": "Different", "meaning": "The Brazil row ends in .15 instead of .14. It could represent cached or intentionally different routing." }
    ],
    "takeaway": "The example has one differing answer. Verify the authoritative record and TTL before changing DNS again.",
    "mac": {
      "command": "dig @8.8.8.8 example.com A\ndig @1.1.1.1 example.com A",
      "note": "Run both lines in Terminal and compare the answers. These query two public DNS services from your Mac."
    },
    "windows": {
      "command": "nslookup -type=A example.com 8.8.8.8\nnslookup -type=A example.com 1.1.1.1",
      "note": "Run both lines in PowerShell and compare addresses. They do not test from two different countries."
    },
    "limit": "Public resolvers use anycast and caches. Different answers can be intentional, including load balancing and geographic routing; agreement is not always expected."
  },
  "is-it-down": {
    "summary": "Distinguish a working HTTP response from an actual outage.",
    "purpose": "A website check follows the connection through DNS, encrypted transport, and HTTP. It helps narrow down whether the failure is local, network-related, or at the server.",
    "steps": [
      "Enter the full URL, including https://.",
      "Choose a region and Preview availability.",
      "Check the status, then inspect DNS, TLS, and redirects."
    ],
    "terms": [
      { "label": "200 OK", "meaning": "The server returned a successful response. The page can still contain an error message or broken application." },
      { "label": "Response time: 142 ms", "meaning": "The sample response delay. It is not the time needed to load every image or script." },
      { "label": "DNS resolved", "meaning": "The name was translated into a network address." },
      { "label": "TLS established", "meaning": "An encrypted connection was established. HTTP comes after this step." }
    ],
    "takeaway": "The sample responds successfully. If your browser still fails, try a second network and check the exact URL.",
    "mac": { "command": "curl -I https://example.com", "note": "Run in Terminal to request headers. -I uses HEAD; some sites handle it differently from a normal browser GET request." },
    "windows": { "command": "curl.exe -I https://example.com", "note": "Run in PowerShell on current Windows 10/11. Use curl.exe to avoid the older PowerShell curl alias." },
    "limit": "A check from your computer only reflects your connection. 403 can mean access is blocked, and 5xx suggests a server-side problem; neither should be reduced to a universal yes/no."
  },
  "bulk-url-status": {
    "summary": "Read several URL results at once and spot redirects and errors.",
    "purpose": "A bulk check is useful after publishing or moving pages. It shows which URLs respond, which redirect, and which need attention.",
    "steps": [
      "Paste full HTTP or HTTPS URLs, one per line, up to 50.",
      "Choose Preview URL report for the fixed three-URL example.",
      "Review errors first, then confirm that redirected pages reach the intended destination."
    ],
    "terms": [
      { "label": "URLs: 3", "meaning": "Three entries are shown in the example. Your submitted list is not checked live." },
      { "label": "200 OK", "meaning": "The two sample pages respond successfully." },
      { "label": "301 Redirect", "meaning": "A permanent move. Review the destination and update internal links when appropriate." },
      { "label": "Final destination", "meaning": "Where the example redirect points. Redirect chains can introduce delay or lead to the wrong page." }
    ],
    "takeaway": "The example has two successful URLs and one redirect. A redirect is not necessarily an error, but its destination matters.",
    "mac": {
      "command": "for url in https://example.com https://example.org; do\n  printf \"%s \" \"$url\"\n  curl -s -o /dev/null -w \"%{http_code}\\n\" \"$url\"\ndone",
      "note": "Paste this small loop into Terminal. It prints a status for each URL without following redirects."
    },
    "windows": {
      "command": "\"https://example.com\", \"https://example.org\" | ForEach-Object {\n  Write-Output $_\n  curl.exe -s -o NUL -w \"%{http_code}\\n\" $_\n}",
      "note": "Paste into PowerShell on Windows 10/11. 000 indicates no HTTP status was received; inspect the connection error."
    },
    "limit": "Only check URLs you are allowed to access, and avoid large rapid batches. This example does not follow redirects; add curl's -L only when you intend to follow them."
  },
  "http-headers": {
    "summary": "Understand the small response fields that control caching and content delivery.",
    "purpose": "Headers are instructions and metadata sent with an HTTP response. They help investigate caching, content types, redirects, and how a server delivers a page.",
    "steps": [
      "Enter a full website URL.",
      "Choose HEAD or GET and the redirect setting, then Preview headers.",
      "Read the status first and then the header relevant to your problem."
    ],
    "terms": [
      { "label": "Content-Type", "meaning": "text/html; charset=UTF-8 says the response is an HTML document using UTF-8 text." },
      { "label": "Cache-Control", "meaning": "max-age=3600 allows caching for up to one hour, subject to other cache rules." },
      { "label": "Content-Encoding", "meaning": "gzip means the response body was compressed. It does not describe its file format." },
      { "label": "Server", "meaning": "nginx is the sample server label. This field can be hidden or changed, so it is not proof of server software." }
    ],
    "takeaway": "The example is a successful, compressed HTML response with caching instructions. Check cache rules before expecting an edit to appear immediately.",
    "mac": { "command": "curl -I https://example.com", "note": "Open Terminal. For a GET request that prints headers but discards the body, use curl -s -D - -o /dev/null https://example.com." },
    "windows": { "command": "curl.exe -I https://example.com", "note": "Open PowerShell. For GET headers use curl.exe -s -D - -o NUL https://example.com." },
    "limit": "HEAD and GET responses can differ. To inspect what your browser actually received, open its developer tools, choose Network, reload, and select the document's Headers tab."
  },
  "security-headers": {
    "summary": "Read a protection report without treating a grade as a complete security audit.",
    "purpose": "Security headers instruct browsers to restrict certain behaviors. They can reduce risks, but they do not fix unsafe application code or replace a security review.",
    "steps": [
      "Enter the full HTTPS URL.",
      "Choose Preview security report to see the illustrative B grade.",
      "Review missing headers and the actual values of headers marked present."
    ],
    "terms": [
      { "label": "HSTS", "meaning": "Strict-Transport-Security asks browsers to use HTTPS on future visits. Configure it carefully; it can affect subdomains." },
      { "label": "Content-Security-Policy", "meaning": "Defines permitted sources for scripts and other content. The sample is missing it. Test a policy before enforcing it." },
      { "label": "X-Content-Type-Options", "meaning": "nosniff asks the browser not to guess a different content type." },
      { "label": "Permissions-Policy", "meaning": "Restricts features such as camera or location. Missing does not mean those features are automatically in use." }
    ],
    "takeaway": "The example needs a considered CSP and Permissions-Policy. A present header with a weak value may still need improvement.",
    "mac": { "command": "curl -I https://example.com", "note": "Read the response headers in Terminal. The command displays values; it does not calculate a security grade." },
    "windows": { "command": "curl.exe -I https://example.com", "note": "Read the headers in PowerShell. Browser developer tools also show headers under Network → the document request." },
    "limit": "The B grade is illustrative. A valid header configuration depends on your app; copy-pasting strict policies can break scripts, embeds, or sign-in."
  },
  "email-deliverability": {
    "summary": "Learn what SPF, DKIM, and DMARC say about your domain's mail setup.",
    "purpose": "Email authentication helps receiving servers verify who may send mail for your domain. It reduces impersonation risk, but it cannot guarantee inbox placement.",
    "steps": [
      "Enter your sending domain, not a full email address.",
      "Enter the DKIM selector supplied by your email service.",
      "Choose Preview email report and read SPF, DKIM, DMARC, and MX together."
    ],
    "terms": [
      { "label": "SPF: Valid", "meaning": "The sample TXT record authorizes specified senders. ~all is a soft fail for others. Real validity also depends on DNS lookup limits." },
      { "label": "DKIM: Found", "meaning": "A public key exists for the sample selector. This alone does not prove outgoing messages are signed correctly." },
      { "label": "DMARC: Monitoring", "meaning": "p=none requests reports without asking receivers to quarantine or reject mail solely through this policy." },
      { "label": "MX", "meaning": "The servers that receive mail for the domain. MX does not authorize outgoing senders." }
    ],
    "takeaway": "The example has authentication records but a monitoring-only DMARC policy. Review real message headers and reports before tightening the policy.",
    "mac": {
      "command": "dig example.com TXT\ndig default._domainkey.example.com TXT\ndig _dmarc.example.com TXT\ndig example.com MX",
      "note": "Run in Terminal. Replace default with your actual DKIM selector; the sample key and SPF domain are fictional."
    },
    "windows": {
      "command": "Resolve-DnsName example.com -Type TXT\nResolve-DnsName default._domainkey.example.com -Type TXT\nResolve-DnsName _dmarc.example.com -Type TXT\nResolve-DnsName example.com -Type MX",
      "note": "Run in PowerShell. Use the selector from your mail provider."
    },
    "limit": "Reputation, message content, recipient filters, and SPF/DKIM alignment affect delivery. Records being found does not prove a message passed authentication."
  },
  "ssl-certificate": {
    "summary": "Check the name, dates, issuer, and trust behind an HTTPS certificate.",
    "purpose": "A TLS certificate helps your browser authenticate a website and encrypt the connection. People often call it an SSL certificate, although modern sites use TLS.",
    "steps": [
      "Enter the domain and port, normally 443.",
      "Choose Preview certificate for the illustrative certificate details.",
      "Check the hostname, validity dates, and trust chain—not just the issuer."
    ],
    "terms": [
      { "label": "Subject / alternative names", "meaning": "The certificate must cover the hostname you opened. Modern hostname checks use the subject alternative names, or SANs." },
      { "label": "Issuer", "meaning": "The authority that signed the certificate. The sample's Example Certificate Authority is fictional." },
      { "label": "Valid from / expires", "meaning": "The period the certificate is valid. The sample dates are illustrative and do not count down or update." },
      { "label": "Valid chain / TLS 1.3", "meaning": "Trust depends on a chain accepted by the client. TLS 1.3 is the connection protocol, not a safety rating for the site." }
    ],
    "takeaway": "The sample claims a matching, trusted certificate. A real trusted certificate protects transport; it does not prove a website or business is honest.",
    "mac": { "note": "Open the HTTPS page in Chrome on Mac. Click the site controls beside the address, then Connection is secure → Certificate is valid to view dates and names." },
    "windows": { "note": "In Chrome or Edge on Windows, open the page, click the site controls beside the address, and open the connection or certificate details. No extra software is required." },
    "limit": "Never bypass a browser certificate warning just to complete a check. An expired certificate, wrong hostname, or untrusted issuer needs investigation by the site owner."
  },
  "seo-checker": {
    "summary": "Read page titles, descriptions, and indexing checks without chasing a perfect score.",
    "purpose": "An on-page SEO check looks at information search engines use to understand a page. It helps identify missing or confusing metadata, not predict search rankings.",
    "steps": [
      "Enter the page's full URL.",
      "Choose Preview SEO audit for the six-check example.",
      "Fix meaningful warnings first, and check that each page has its own accurate title and summary."
    ],
    "terms": [
      { "label": "Score: 86 / 100", "meaning": "An illustrative summary, not a search engine score or ranking forecast." },
      { "label": "Page title / H1", "meaning": "The title labels the browser tab and search result; H1 is the main visible heading. Both should describe this page." },
      { "label": "Meta description warning", "meaning": "The sample is missing a useful summary. Search engines may rewrite descriptions even when you supply one." },
      { "label": "Canonical / robots", "meaning": "Canonical suggests the preferred URL. Robots instructions influence crawling and indexing; Allowed is not proof of indexing." }
    ],
    "takeaway": "The example needs a descriptive summary. Good metadata supports useful content; it cannot guarantee traffic or indexing.",
    "mac": { "note": "In Chrome on Mac, open the page, choose View → Developer → View Source, and search for <title, description, canonical, and robots. Read the visible main heading too." },
    "windows": { "note": "In Chrome or Edge on Windows, right-click the page and choose View page source. Search for title, description, canonical, and robots." },
    "limit": "Page source may not show content added by JavaScript. Alt text should explain meaningful images; a technical pass does not establish that the wording is useful."
  },
  "open-graph-preview": {
    "summary": "Understand the title, description, and image that appear when someone shares a link.",
    "purpose": "Open Graph metadata describes a page to social platforms. A preview helps catch missing images or vague titles before sharing, though each platform renders cards differently.",
    "steps": [
      "Enter the full page URL and choose a platform.",
      "Choose Preview social card. The current sample uses the same illustrative card across platforms.",
      "Compare title, description, domain, and image with the page you intend to share."
    ],
    "terms": [
      { "label": "og:title", "meaning": "Example Domain is the sample sharing headline. It can differ from the browser title, but should still describe the page." },
      { "label": "og:description", "meaning": "A short summary for the card. Platforms may shorten it." },
      { "label": "og:image: Not provided", "meaning": "The example has no image, so the preview shows a placeholder. A real image should be publicly accessible." },
      { "label": "og:url / og:type", "meaning": "The preferred page URL and content type. website is common; an editorial post can use article." }
    ],
    "takeaway": "The example is missing a social image. Add an appropriate image and verify the final card on the target platform.",
    "mac": { "command": "curl -sL https://example.com | grep -i \"og:\"", "note": "Run in Terminal to look for Open Graph tags in downloaded HTML. This is a quick tag check, not a card renderer." },
    "windows": { "command": "curl.exe -sL https://example.com | Select-String \"og:\"", "note": "Run in PowerShell on Windows 10/11. Also check twitter: tags for X-specific metadata." },
    "limit": "Platforms cache previews and may need a refresh through their sharing debugger. Tags present in HTML do not guarantee the image is fetchable or that every platform uses them."
  },
  "password-generator": {
    "summary": "Choose length and character types, then create a password that is truly yours.",
    "purpose": "This local utility uses your browser's cryptographic randomness to generate a password. Long, unique passwords are harder to guess and reduce damage when another account is breached.",
    "steps": [
      "Choose a length from 8 to 128; 24 is the example setting.",
      "Keep at least one character type selected, then Generate password.",
      "Use a newly generated password for one account only and store it in a password manager."
    ],
    "terms": [
      { "label": "Length", "meaning": "The number of characters. A 24-character random password is much stronger than a short predictable phrase." },
      { "label": "Character types", "meaning": "The selected groups: uppercase, lowercase, numbers, and symbols. Each selected group appears in the generated password." },
      { "label": "Cryptographic", "meaning": "Random bytes come from the browser's secure random generator, not ordinary Math.random." },
      { "label": "Not saved", "meaning": "SiteTrace does not save the result. Clipboard tools, screenshots, and your device can still expose it." }
    ],
    "takeaway": "The password in this guide's screenshot is public example data. Never use it for an account; generate a fresh one privately.",
    "mac": { "note": "Open the generator in Safari or Chrome. For a real account, your password manager can generate and save a unique password without putting it on the clipboard." },
    "windows": { "note": "Open the generator in Edge or Chrome. A password manager is the simplest way to create, store, and autofill a different password for every account." },
    "limit": "Follow the account's allowed-character rules. Never reuse passwords or share screenshots of them. Enable multi-factor authentication when available."
  },
  "random-color": {
    "summary": "Read HEX, RGB, and HSL and use the same color in a design.",
    "purpose": "This utility produces a random color and writes it in a format that design and web tools understand. It is a starting point for a palette, not a finished accessible color scheme.",
    "steps": [
      "Choose HEX, RGB, or HSL.",
      "Select Generate color. The swatch and values describe the same newly generated color.",
      "Copy the value into a design tool, then check contrast against its intended background."
    ],
    "terms": [
      { "label": "HEX", "meaning": "A # followed by six hexadecimal digits. The pairs encode red, green, and blue." },
      { "label": "RGB", "meaning": "Three channel values from 0 to 255. Larger values add more of that channel." },
      { "label": "HSL", "meaning": "Hue is an angle around the color wheel; saturation and lightness are percentages." },
      { "label": "Swatch", "meaning": "A visual preview. Colors can look different on different displays, so rely on the value for consistency." }
    ],
    "takeaway": "Each generation changes the color. The screenshot is one example, not the color every reader will receive.",
    "mac": { "note": "Generate a color in your browser, copy its HEX value, and paste it into a color field in a design tool such as Figma. No Terminal is required." },
    "windows": { "note": "Use the same browser steps on Windows. Choose a design tool that accepts the selected color format, or switch the output to HEX." },
    "limit": "Random colors can have poor contrast. Test normal-sized text for at least a 4.5:1 contrast ratio; large text generally needs 3:1 under WCAG AA."
  },
  "word-counter": {
    "summary": "Know what counts as a word, character, sentence, or minute of reading.",
    "purpose": "A word counter helps estimate text length for a draft, caption, or form. This utility counts locally, so your text is not sent to a service.",
    "steps": [
      "Paste or type your text.",
      "Choose Count text to calculate the current text.",
      "Use words for draft length and characters for fields with length limits."
    ],
    "terms": [
      { "label": "Words", "meaning": "Whitespace-separated groups count as words here. This simple method is not a language-aware word segmenter." },
      { "label": "Characters", "meaning": "Unicode code points, including spaces and line breaks. Some emoji sequences can count as several characters." },
      { "label": "Without spaces", "meaning": "Removes whitespace, including tabs and line breaks, before counting." },
      { "label": "Reading time", "meaning": "An estimate rounded up at 200 words per minute. Sentences split at ., !, or ?, and paragraphs at blank lines." }
    ],
    "takeaway": "Different editors can count the same text differently. For a strict limit, check the target app's own counter too.",
    "mac": { "command": "wc -w your-file.txt", "note": "In Terminal, run this on a text file to count words. Replace the filename with yours; add quotes around filenames with spaces." },
    "windows": { "command": "(Get-Content -Raw \"your-file.txt\" | Measure-Object -Word).Words", "note": "Run in PowerShell on a saved text file. The counting rules can differ from SiteTrace." },
    "limit": "Do not use estimated reading time as an exact promise. Blank lines, punctuation, emoji, and languages without spaces can affect these simple counts."
  },
  "smart-dispatcher": {
    "summary": "Choose the right tool after identifying a domain, URL, or IP address.",
    "purpose": "The dispatcher looks at the shape of your input and suggests a next step. It does not scan the target or establish whether the address is safe.",
    "steps": [
      "Enter a domain, full HTTP/HTTPS URL, or valid IP address.",
      "Choose Identify target. This classification happens locally.",
      "Select a suggested tool for the question you actually want to answer."
    ],
    "terms": [
      { "label": "Target", "meaning": "The hostname from a URL, or the address/name you entered." },
      { "label": "Type", "meaning": "Website URL, IP address, or Domain. This is a format classification, not a diagnosis." },
      { "label": "Protocol", "meaning": "HTTP or HTTPS when a full URL is provided. A dash means no URL protocol was supplied." },
      { "label": "Suggested tools", "meaning": "IP inputs suggest ownership and reputation checks; URLs suggest page/header checks; domains suggest DNS and certificate checks." }
    ],
    "takeaway": "For example.com, start with DNS if the name does not resolve. For a working URL with a sharing issue, choose Open Graph preview.",
    "mac": { "note": "Open SiteTrace in your browser, paste the target, and use the suggested tool links. To classify it manually, https:// starts a URL; dotted numeric addresses are usually IPv4." },
    "windows": { "note": "Use the same browser workflow on Windows. No Terminal or installation is needed for classification." },
    "limit": "Suggested tools are starting points, not automatic conclusions. An address being valid does not mean it exists or is safe to visit."
  },
  "traceroute": {
    "summary": "Read network hops, delays, and asterisks without blaming the wrong router.",
    "purpose": "Traceroute asks successive routers along a path to reply. It helps locate where replies stop or delay increases, but the return path and router policies affect the result.",
    "steps": [
      "Enter a domain or IP and choose a hop limit and region.",
      "Choose Preview route to see the fixed five-hop example.",
      "Follow the rows in order and compare later hops before interpreting one slow row."
    ],
    "terms": [
      { "label": "Hop", "meaning": "A step along the observed network path. Hop 1 is often your local gateway in a test from your computer." },
      { "label": "IP / hostname", "meaning": "A replying router's address and optional name. Private addresses near the start can be normal." },
      { "label": "Latency", "meaning": "Round-trip time for that hop's reply. It is not the time spent only inside that router." },
      { "label": "Path: Complete", "meaning": "The sample reaches the destination in five hops. Its addresses are illustrative, not a real traced path." }
    ],
    "takeaway": "The example reaches the destination at 24.8 ms. In a real trace, one slow intermediate hop is not evidence of congestion if later hops reply quickly.",
    "mac": { "command": "traceroute -m 30 example.com", "note": "Open Terminal. This limits the trace to 30 hops. The default Mac trace commonly sends UDP probes." },
    "windows": { "command": "tracert -h 30 example.com", "note": "Open PowerShell or Command Prompt. Windows tracert uses ICMP probes, so its path or replies can differ from a Mac trace." },
    "limit": "An asterisk means no reply arrived for that probe; routers may filter or deprioritize replies. A trace that stops does not prove that ordinary website traffic also stops."
  },
  "port-check": {
    "summary": "Tell an open TCP port from a refused or unanswered connection.",
    "purpose": "A port identifies a service on a host. Checking a specific port helps diagnose whether your computer can make a connection to that service.",
    "steps": [
      "Use a host you own or are authorized to test.",
      "Enter its port, such as 443 for HTTPS, and choose a protocol.",
      "Choose Preview port check. The fixed sample shows a successful TCP connection."
    ],
    "terms": [
      { "label": "Port: 443", "meaning": "The conventional HTTPS port. A different application can still use this number." },
      { "label": "TCP", "meaning": "A connection-based protocol. A successful TCP handshake is easier to establish than UDP availability." },
      { "label": "Open / accepted", "meaning": "The sample accepts a connection. This does not prove the service will respond correctly to application requests." },
      { "label": "Response time", "meaning": "The sample connection delay, not a complete application or page-load measurement." }
    ],
    "takeaway": "The example accepts TCP on 443. If the browser still fails, check TLS and HTTP next.",
    "mac": { "command": "nc -zv example.com 443", "note": "Run in Terminal to test a TCP connection. This does not audit TLS or scan every port." },
    "windows": { "command": "Test-NetConnection example.com -Port 443", "note": "Run in PowerShell. TcpTestSucceeded: True means the TCP connection succeeded from your PC." },
    "limit": "Only test systems you are authorized to check. A refusal usually means the connection was actively rejected; no reply can mean filtering or packet loss. These commands test TCP, not UDP."
  },
  "what-is-my-ip": {
    "summary": "Find your public IP and understand what it really says about you.",
    "purpose": "Your public IP is the address other servers see when you connect to them. It is the network your ISP gives you, not a personal identifier or a fixed device ID.",
    "steps": [
      "Open this page; the tool runs without any input.",
      "Read the IP, then look at the country, region, and ISP together.",
      "Compare the result with what your VPN reports, if you use one."
    ],
    "terms": [
      { "label": "Your IP", "meaning": "The sample address is what an outside server would see. A new network or VPN session changes this number." },
      { "label": "Country / region", "meaning": "The geolocation is approximate; mobile networks and corporate gateways often report a different city from where you are." },
      { "label": "ISP", "meaning": "The provider that handed out the address. It is who assigns it, not necessarily who is using the device." },
      { "label": "Local address hidden", "meaning": "SiteTrace only sees the public address. The router's private 192.168.x.x or 10.x.x.x address stays inside your home network." }
    ],
    "takeaway": "Your public IP identifies a network, not a person. The ISP and approximate location are accurate; the specific room or device is not.",
    "mac": { "command": "curl https://api.ipify.org", "note": "Run in Terminal for a plain-text reply. For more fields, use curl https://ipinfo.io/json in Terminal or a similar provider in your browser." },
    "windows": { "command": "(Invoke-WebRequest -UseBasicParsing https://api.ipify.org).Content", "note": "Run in PowerShell. The same ipinfo.io/json link gives additional fields." },
    "limit": "If you are on a corporate or school network, the IP belongs to that gateway, not to your device at home. The result also changes when you switch Wi-Fi or reconnect."
  },
};

// Slugs that have a guide. Used by the blog index to decide which cards to show.
export const guideSlugs = Object.keys(guides);
