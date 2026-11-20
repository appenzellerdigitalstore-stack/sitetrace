import type { ToolPageGuide } from "../tool-guide-types";

export const groupA: Record<string, ToolPageGuide> = {
  "what-is-my-ip": {
    overview:
      "Every server you visit sees one address for your connection, and this page reports it. The tool asks a public IP database to describe that address: the country and region, the city it maps to, the ISP that assigned it, and the timezone. It also lists the network details behind the number, plus the browser you are using right now. Use it when you need to know what an outside service sees, when a site blocks or challenges you unexpectedly, or when you are comparing a VPN address with your real one.",
    howToUse: [
      "Open the page and the detection runs on its own, because there is no input field and nothing to type.",
      "Start with the public IP in the metrics panel, then read country, ISP, and timezone together.",
      "Check the network rows for the ASN and organization that actually own the address.",
      "Look at the browser rows for user agent, platform, language, and screen size, which describe this session.",
      "Compare the address with what your VPN or proxy app shows, because a difference means your traffic is routed through it.",
      "Copy or download the result if you need to share the exact numbers with someone.",
    ],
    readingResults: [
      "Public IP is the address an outside server sees, not the private address your router assigns inside your home network.",
      "ISP and organization identify the network operator that handed out the address, which can be your provider or your employer.",
      "Country, city, and region come from the provider's own database, so they describe the network's location rather than your exact address.",
      "The ASN row names the autonomous system that routes traffic for this address, the closest thing to an owner in routing terms.",
      "The connection row shows whether the browser currently has a working network connection at all.",
      "The source row names the database that answered, and the cached row confirms the answer was not stored for later.",
    ],
    limits: [
      "A VPN or corporate proxy changes what this shows, because the tool reports the exit address your browser connects from.",
      "The location is an estimate for the network, and mobile or shared connections often report a city far from you.",
      "It cannot see your private 192.168.x.x or 10.x.x.x address, and it does not identify a device or a person.",
      "The browser rows describe this browser session only, so they say nothing about the machine you use elsewhere.",
      "Some fields stay empty when the fallback provider answers, so an empty currency or language row is not an error.",
    ],
    nextSteps:
      "A sensible result is an address, an ISP that matches the plan you pay for, and a country you expect. If the address belongs to a VPN or hosting network, the service you are testing sees that exit point instead of you, which explains odd logins or blocks. If the country or city is wrong, check your provider's exit node or the database rather than your device. To find out who owns a different address, run IP lookup on it.",
  },
  "ip-lookup": {
    overview:
      "An IP address is a network coordinate, and this lookup explains the network behind it. Give it any IPv4 or IPv6 address and it returns the organization that operates it, the autonomous system that routes its traffic, and the country, region, and city where the address is registered. The same panel separates the ISP from the organization and shows whether the address is IPv4 or IPv6. Read it when an access log names an unfamiliar address, when a server blocks a request, or before you classify traffic you did not recognize.",
    howToUse: [
      "Type the address into the IP address field, where both IPv4 and IPv6 work and 8.8.8.8 is filled in as a starting point.",
      "Choose Look up IP and the request goes to a public IP database, where the answer appears in a few seconds.",
      "Read the four metrics first, which are the address, the organization, the location, and the network.",
      "Use the detail rows to separate the ISP from the organization, since the two are often different companies.",
      "Copy the result before you leave if you are documenting an incident or passing the address to someone else.",
    ],
    readingResults: [
      "Organization names the company the address is registered to, which is the closest thing to an owner that IP data can give.",
      "Network shows the ASN, the routing identifier for the network that carries this address across the internet.",
      "Location combines the city and country the database assigns to the address, and it is an estimate for the network.",
      "Address type tells you whether the value is IPv4 or IPv6, which matters when you are writing rules or filters.",
      "ISP names the company that provides connectivity to end users, and it may differ from the organization above it.",
      "Source identifies the database that answered, so you know which data you are looking at.",
    ],
    limits: [
      "Geolocation is derived from network records, so it points at the network's location and rarely at the device itself.",
      "The tool cannot tell you whether the host runs a service, is malicious, or appears on someone else's blocklist.",
      "Free geolocation databases lag behind address reassignments, so a moved block can still show its old owner.",
      "A lookup describes an address, and never the person or the account using it.",
    ],
    nextSteps:
      "If the organization matches a provider you expect, the address is unremarkable and any block you saw probably came from elsewhere. If it names a hosting or cloud company, run the VPN check to see how the traffic is classified. If it names a provider you do not recognize, run IP reputation on the address before you trust the traffic. To see which DNS record points a domain at that address, use the DNS lookup tool.",
  },
  "ip-reputation": {
    overview:
      "Reputation checks look for an address on lists that record abuse, and this one queries several of them at once. Enter an IPv4 address and the tool asks a group of DNS-based blocklists whether they list it, then adds a few network signals from a geo database, such as proxy, hosting, and mobile flags. The result ends in a simple score and a risk band you can read in one line. Use it when mail bounces, when a signup form rejects an address, or when you want to know what a firewall might think of an incoming connection.",
    howToUse: [
      "Enter the IPv4 address you want to check, because only IPv4 is accepted by the blocklist lookups behind this tool.",
      "Choose Check reputation and the tool queries seven blocklists over DNS while pulling network flags from a geo source.",
      "Read the risk band and the listed count before you scroll into the table, because they summarise everything below.",
      "Work down the blocklist rows and read the detail column, which shows the listing codes when a list flags the address.",
      "Check the network rows at the bottom for proxy, hosting, and mobile flags, which explain a low score even without a listing.",
    ],
    readingResults: [
      "Listed counts how many of the queried blocklists returned a listing, out of the seven the tool checks.",
      "Risk band comes from the score: 80 or above is low, 50 to 79 is medium, and below 50 is high.",
      "Score starts at 100 and loses points for each listing and for proxy or hosting flags, so it rates this check rather than the sender.",
      "Clean means that particular list returned no listing, while Unknown or Error means the query itself failed.",
      "Codes appear in the detail column when a list returns a reason, and that code is the one the list owner publishes.",
      "Proxy, hosting, and mobile rows describe the network type, which changes how a receiving server treats the traffic.",
    ],
    limits: [
      "A clean report is not a safety guarantee, because the tool only sees the lists it queries.",
      "Blocklists lag behind new abuse and sometimes list shared addresses, so a listing needs confirming at the list owner.",
      "A failed DNS query is not a clean result, and the table marks those rows as Unknown or Error.",
      "The tool cannot tell you why an address was listed, only that a list still carries the record.",
    ],
    nextSteps:
      "Treat a low risk band as one useful signal, not a verdict. If a list flags the address, read the code and follow the list owner's removal process, and check whether the address is shared with other users first. If nothing is listed but traffic is still blocked, the rule is probably in an application or a reputation service outside this check. Use IP lookup to confirm the address belongs to the network you expect before you act.",
  },
  "vpn-check": {
    overview:
      "Network operators describe themselves in their registration records, and this tool reads that description. Enter an IP address and it checks the organization, ISP, and autonomous system behind it, then classifies the connection as datacenter, mobile carrier, or residential and business. The signal comes from the operator's own name, which is why the answer is about the kind of network rather than about a specific app. Use it to understand why a site treats an address differently, or to confirm that your own traffic is leaving through a hosting network.",
    howToUse: [
      "Enter the IP address you want to classify, noting that the field starts with 8.8.8.8, a well known datacenter address.",
      "Choose Inspect IP and the lookup goes to a public IP database, where the classification is calculated from its answer.",
      "Read the Connection metric first, since it names the network type in a single word.",
      "Check the hosting and mobile carrier rows to see which rule fired and what detail was attached to it.",
      "Compare the provider and network rows with what you expect, especially when the address should belong to a home line.",
    ],
    readingResults: [
      "Connection summarizes the classification, and it comes from matching the network operator's name against known provider patterns.",
      "Provider is the organization that owns the address, and it is usually the clearest hint about the network type.",
      "Hosting says yes when the operator's name matches a cloud, hosting, or datacenter pattern, and No otherwise.",
      "Mobile carrier says yes for cellular operators, which matters because carrier networks often share addresses between subscribers.",
      "ASN and organization rows tell you which network announced the route, which is the basis for every other signal.",
      "Country, region, and city are included for context, but they describe the registered address rather than the physical user.",
    ],
    limits: [
      "The tool reads the network operator's name, so it cannot identify a specific VPN product, proxy, or Tor exit node.",
      "A residential address can still route traffic through a proxy the operator knows nothing about.",
      "Shared business connections and mobile networks blur the line between the categories.",
      "It cannot prove who is using the address or what they are doing with it.",
    ],
    nextSteps:
      "A datacenter classification usually explains a failed sign-in, a fraud check, or a blocked upload. If you expected a residential line and got a datacenter, the traffic is leaving through a tunnel, a hosted proxy, or a cloud instance, so check the running app rather than your router. If the address is yours and the classification is wrong, the fix is in how the network announces itself. IP reputation adds the blocklist view of the same connection.",
  },
  "subnet-calculator": {
    overview:
      "A CIDR prefix tells you how an IPv4 address is split into a network and a set of hosts, and this calculator does that arithmetic for you. Enter a network such as 192.168.1.0/24 and it returns the network address, the subnet mask, the broadcast address, the first and last usable host, the wildcard mask, and the number of addresses in each group. Everything runs in your browser, so no address leaves the page. Use it when you plan a VLAN, write firewall rules, or need to know how many devices a given prefix actually supports.",
    howToUse: [
      "Type an IPv4 network with its prefix, for example 192.168.1.0/24, into the CIDR field.",
      "Choose Calculate subnet and the calculation happens locally in your browser, so no request leaves the page.",
      "Use the network address as the identifier for the whole block, and the mask to see the boundary in dotted form.",
      "Read the usable host range to find where your DHCP pool should start and stop.",
      "Compare the total address count with the usable host count, since the difference is the reserved network and broadcast addresses.",
    ],
    readingResults: [
      "Network shows the masked base address of the block, so an input of 192.168.1.55/24 returns 192.168.1.0/24.",
      "Subnet mask gives the same boundary in dotted decimal, which is the form most router interfaces ask for.",
      "Total addresses is the whole size of the block, including the two reserved addresses in a normal prefix.",
      "Usable hosts removes the network and broadcast addresses, which cannot be assigned to an ordinary device.",
      "First and last usable addresses mark the range you can hand out inside the block.",
      "Wildcard mask is the inverse of the subnet mask, the form used in access lists and packet filter rules.",
    ],
    limits: [
      "The calculator covers IPv4 only, so an IPv6 prefix returns an error instead of a result.",
      "It does not check your router, so it cannot tell you whether a range overlaps a live DHCP pool.",
      "It does not split a block into smaller subnets, so a VLSM plan still has to be worked out by hand.",
      "A /31 or /32 follows the host route rules, so the usable host count differs from a normal block.",
    ],
    nextSteps:
      "A /24 gives 256 addresses and 254 usable hosts, which is why it suits a small office or a home lab. Use the first and last usable addresses as the edges of your DHCP range and keep the network address for the router. Before you reserve a static address outside the pool, compare the range with the one already configured on the router. To confirm what your own machine holds, check the adapter settings on your device.",
  },
  "whois-lookup": {
    overview:
      "Every domain is registered, and the registry keeps a record of who registered it, when, and where it points. This lookup reads that record through RDAP, the structured successor to the old whois command. It returns the registrar, the creation, update, and expiry dates, the domain's current locks, the nameservers listed for the zone, and whether the domain is signed with DNSSEC. Use it when you are checking a domain's age, comparing a registrar's dates against a sale, or confirming that a domain you own is pointed at the host you expect.",
    howToUse: [
      "Type the domain name without a protocol, for example example.com, into the Domain field.",
      "Choose Look up WHOIS and the tool finds the registry service for that top level domain, then queries it directly.",
      "Read the date metrics first, because creation and expiry dates explain most questions about a domain's history.",
      "Check the Nameservers row against the DNS provider you actually use, which is where most surprises show up.",
      "Read the DNSSEC row for the signing state and the Locks row for transfer or update restrictions.",
    ],
    readingResults: [
      "Registrar is the company that handles the registration for you, and it is the one you contact to renew or move the domain.",
      "Registered, last updated, and expires are registry events, so they record when the record changed rather than when the site was built.",
      "Status counts the active locks in plain language, with transfer, update, delete, and hold locks translated from registry codes.",
      "Nameservers are the servers the registry delegates to, and they should match the provider shown in your DNS control panel.",
      "DNSSEC reads signedDelegation or unsigned, which tells you whether resolvers can cryptographically verify the answers.",
      "Source confirms the answer came from a live RDAP query, and the cached row confirms nothing was stored for reuse.",
    ],
    limits: [
      "Registrant contact details are not returned, because most registries redact them and this lookup does not request them.",
      "Only top level domains that publish RDAP can be queried, and the tool reports an error for the ones that do not.",
      "A domain's hostnames and mail servers live in DNS, so check them with the DNS lookup tool.",
      "Registry dates describe the domain, not the website, and a domain can be old while the site on it is new.",
    ],
    nextSteps:
      "An old creation date with recent nameservers means the domain was kept and moved, which is worth knowing before you judge its history. Check the expiry date first if you own the domain, then confirm the registrar is one you can reach. If the nameservers are wrong, the fix belongs in your DNS provider, not at the registry. Once the zone is right, run DNS propagation to confirm it serves what you expect.",
  },
  "dns-propagation": {
    overview:
      "When you change a DNS record, the new answer does not appear everywhere at once, because resolvers keep their own cached copy until the record's time to live expires. This tool shows that disagreement directly. It sends your record type to six public resolvers, from Cloudflare, Google, and Quad9, and lists the answer each one returns. The agreement count at the top gives you a one-line summary of the spread. Use it after a records change, when a colleague still sees the old site, or when a cutover needs to be confirmed before you send traffic.",
    howToUse: [
      "Type the domain you changed into the Domain field, and pick the record type you edited from the dropdown.",
      "Choose Check propagation and the tool queries six public resolvers over DNS over HTTPS.",
      "Read the agreement metric to see how many resolvers returned the same answer.",
      "Compare the answer column row by row, because one outdated cache is easier to spot than a single number.",
      "Re-run the check a few minutes apart if the answers still differ, since each resolver keeps the old record until its cache expires.",
    ],
    readingResults: [
      "Agreement counts the resolvers whose answer matches the first one returned, so five of six means one resolver serves something else.",
      "Resolver names the service and its address, so you know exactly which cache produced each answer.",
      "The answer column shows the record value each resolver holds right now, which is the comparison that matters.",
      "Matches means the row agrees with the most common answer, and Different means it holds another value entirely.",
      "An error row means that resolver could not be reached or returned no data, and it should not be read as agreement.",
      "Record type is fixed by your selection, so a change to a TXT record stays invisible to an A record query.",
    ],
    limits: [
      "Each row is a resolver queried from your browser, so it shows that resolver's cache rather than a measurement taken inside a country.",
      "Agreement between resolvers does not prove the answer is correct, only that several of them currently agree.",
      "The check cannot see your own resolver, so your browser may still show a cached result after everything else agrees.",
      "A difference can be intentional, because anycast and geo routing often serve different addresses by design.",
    ],
    nextSteps:
      "If every row matches, the change has reached the resolvers people use most, and the remaining delay is usually your own local cache. If one row still differs, give it time to expire and check the time to live on the record you changed. When one location is stuck, compare that resolver's answer with the authoritative server, which the DNS lookup tool shows. If the answers never converge, the record itself is probably wrong.",
  },
  "is-it-down": {
    overview:
      "This tool answers a narrow question: does the server answer right now. It sends a request to the URL you give it from SiteTrace's own infrastructure and reports the status code, the time the response took, and where the request finally landed. Redirects are followed, so the report shows the destination as well as the hop. Use it when a colleague says a site is broken, when you are about to announce an outage, or when you need to separate a dead server from a problem on your own connection.",
    howToUse: [
      "Type the address to test into the Website URL field, where a bare domain works and gets the https prefix added.",
      "Choose Check availability and the request is made from the server, so your own network is not involved.",
      "Read the HTTP status metric first, since the code decides whether the site answered at all.",
      "Look at the final URL and the redirected row to see whether you were moved somewhere else.",
      "Compare the response time with the site's normal range before you treat a slow answer as an outage.",
    ],
    readingResults: [
      "HTTP status is the code the server returned, and 200 means it handled the request successfully.",
      "Response time is how long that single request took, not how long the full page takes to load in a browser.",
      "Availability reads as Reachable when the server answered, and as Down or unreachable when the request never completed.",
      "Final URL is where the request ended up after redirects, which is often the page a visitor really sees.",
      "Redirected tells you whether the address you typed is the final one, so a permanent move is visible here.",
      "Source records that the check ran from the server rather than from your machine.",
    ],
    limits: [
      "The check runs from SiteTrace's infrastructure, so a failure that only affects your own network will not appear.",
      "A 200 response proves the server answered, not that the page behind it works correctly.",
      "The request uses the HEAD method, and some servers handle it poorly even when the page opens normally in a browser.",
      "It tests one URL from one place, so it cannot show a partial outage or a problem for a specific region.",
    ],
    nextSteps:
      "An unreachable result means the request failed, so check the final URL for a broken redirect. If the status is a 4xx or 5xx, that is a different problem: 4xx means the server refused the request, and 5xx means it failed while handling it. When a site works for others but not for you, compare the DNS lookup result with the address the site expects. The HTTP headers tool then shows the raw response for the same URL.",
  },
  "bulk-url-status": {
    overview:
      "After a migration, a launch, or a change of links, you usually have a list of addresses and no time to open them one by one. This tool takes up to fifty URLs, requests each one in parallel from the server, and returns one row per address with its status, its response time, and the destination it ended at. The metrics above the table count what responded, what redirected, and what failed. Use it to verify a set of links, confirm that a batch of pages came back after a deployment, or find the addresses that need attention.",
    howToUse: [
      "Paste the addresses into the text area, one per line, since hosts without a protocol are accepted and get https added.",
      "Keep the list to fifty addresses or fewer, which is the limit the check accepts.",
      "Choose Check URLs and every address is requested in parallel, so one slow site does not hold up the rest.",
      "Read the reachable, redirected, and error counts above the table to get the overall picture in one line.",
      "Work through the rows in order and note the final destination for every address that redirected.",
    ],
    readingResults: [
      "URL shows the address exactly as you entered it, which makes it easy to match a row back to your list.",
      "Status is the response code and its reason phrase, or an Error entry when the address could not be reached at all.",
      "Time is the duration of that individual request, so a slow row points at one slow server.",
      "Final destination is the address the request landed on after redirects, and it is where the redirect chain ended.",
      "Reachable counts every answer from 200 up to 399, so redirected addresses are included in that number as well.",
      "Errors counts the addresses that failed or returned a status of 400 or above.",
    ],
    limits: [
      "Only the addresses you list are checked, and the tool cannot discover the rest of a site for you.",
      "The request uses the HEAD method, and a server that handles it badly can look broken when a browser loads it fine.",
      "Private and internal addresses are refused, so this cannot be used to check your own local network.",
      "A redirect is counted as reachable, so the reachable total alone does not tell you the links are final.",
    ],
    nextSteps:
      "Sort out the error rows first, then look at every redirect and decide whether it should stay. If a URL moved on purpose, update the places that still point at the old address, because the report shows where traffic ends up now. For a URL that failed, run it through the is it down tool to see the status and the final destination in detail. Then use the HTTP headers tool on anything that answered but behaved oddly.",
  },
  "http-headers": {
    overview:
      "Every HTTP response carries a set of headers that describe the content and the rules for handling it. This tool fetches a URL and lists the headers the server returned, so you can see the content type, the cache policy, the compression, the redirect target, and the server software in one table. It works on any page, including ones you do not control, which makes it a quick way to compare your own headers with someone else's. Use it when a change is not appearing, when a cache is serving stale content, or when you are debugging a redirect that will not settle.",
    howToUse: [
      "Type the address into the Website URL field and choose HEAD or GET from the method dropdown.",
      "Leave the method on HEAD for a quick check of the response without pulling the page body.",
      "Choose Fetch headers and the request runs from the server, where the header table appears on the right.",
      "Read the status, final URL, and time in the metrics row before you dig into the table.",
      "Copy or download the full header list when you need to paste it into a ticket or a support request.",
    ],
    readingResults: [
      "Status is the response code from the server, and it tells you whether the request was handled, redirected, or refused.",
      "Final URL is where the request ended after redirects, which shows the address a visitor actually receives.",
      "Time is the duration of that request from the server's side, which is a single sample rather than an average.",
      "Headers counts how many header lines came back, and the table lists each name with its value.",
      "Content-Type states the media type and character set, so text/html with a charset tells you the encoding.",
      "Cache-Control holds the caching rules, which decide how long a browser or proxy may reuse the stored response.",
    ],
    limits: [
      "The server sees SiteTrace's request, so a CDN or firewall can answer differently than it answers your browser.",
      "HEAD and GET can differ, because some servers return different headers or status codes for each.",
      "Only the first value of a repeated header is kept, so a header sent twice appears once.",
      "This tool reads headers, not the page content, so it cannot show a broken layout or a failed script.",
    ],
    nextSteps:
      "Read cache-control first when an edit does not appear, since the stored copy is usually the reason. Look at location when a redirect loop appears, and at set-cookie when a session will not hold. Once you know what the server sends, run the security headers tool to see which protective headers are missing. The HTTP latency tool breaks the same request into phases, which tells you whether the site is slow at the server or on the way.",
  },
};
