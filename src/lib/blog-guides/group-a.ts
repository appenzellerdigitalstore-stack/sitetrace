import type { Guide } from "../guide-types";

export const groupA: Record<string, Guide> = {
  "ip-lookup": {
    title: "IP lookup: who operates an address and where it routes",
    summary: "See which network operates an address, and where its traffic enters the internet.",
    purpose:
      "Every routed connection carries the address of the network that transports it. Pulling that address apart shows which organization operates the link, the autonomous system announcing it, and the country and city where the address is registered. Treat every geographic value here as a property of the address range, not of the person using it.",
    steps: [
      "Type the address you want to read, either four dotted numbers or a colon-separated IPv6 form. Nothing is sent until you run the lookup.",
      "Press Look up IP and let the request finish. The answer comes from a live public geolocation and routing database.",
      "Read Organization and Network first. These come from the address registration and tell you who actually routes the traffic.",
      "Then compare Country, Region and City against the coordinates listed with them. A wide gap means the address is registered somewhere other than where it is used.",
      "Check the Address type row before drawing conclusions. A public IPv6 address can look residential while belonging to a provider that hands out blocks of addresses.",
    ],
    terms: [
      { label: "Organization", meaning: "The company that registered the address range, taken from routing and registration records. It names a network operator, not a subscriber." },
      { label: "Network", meaning: "The autonomous system number announcing this address on the internet, prefixed with AS. Nearby addresses often sit in the same system." },
      { label: "Location", meaning: "The city and country the address range is registered in. This is a registration attribute and can be hundreds of kilometres from the actual user." },
      { label: "ISP", meaning: "The company that sells connectivity to end customers on that network, which is often a different legal entity from the organization above." },
      { label: "Timezone", meaning: "The timezone identifier and UTC offset for the registered location, useful for reading a timestamp or scheduling a call against a server." },
      { label: "Address type", meaning: "Whether the address is IPv4 or IPv6. The field only reports the protocol version, so a private-range address still shows up as IPv4." },
    ],
    takeaway:
      "A clean result tells you who operates the address and how it is routed, nothing more. When the organization matches a provider you recognise, the lookup has done its job. If you are chasing a specific person, a house, or a login, you need logs or records that this kind of database does not hold.",
    mac: {
      command: "curl https://ipinfo.io/8.8.8.8",
      note: "Open Terminal and run the command to pull a JSON record with the city, country and network name for the address. It is a lighter answer than the full table, and it needs no installation.",
    },
    windows: {
      command: "curl https://ipinfo.io/8.8.8.8",
      note: "Run the same command in Windows Terminal. PowerShell and Command Prompt both accept it, and the JSON output includes the organization, city and postal code for the address.",
    },
    limit:
      "Geolocation here comes from address registry data, so it is wrong whenever the operator registers a block far from where the lines terminate. Mobile carriers, VPNs and corporate egress gateways all blur the trail. Nothing in this output identifies a person, and the coordinates describe the range rather than any device.",
  },
  "ip-reputation": {
    title: "IP reputation: reading abuse blocklist signals in context",
    summary: "Cross-check an address against abuse blocklists and read the result in context.",
    purpose:
      "Mail servers and gateways decide whether to accept traffic using shared lists of addresses that have misbehaved. Running an address against those lists shows whether it currently appears on them and why. A listing is a signal worth investigating, not a verdict, and the detail row tells you which code triggered it.",
    steps: [
      "Type or paste the address under investigation. Residential, server and mailbox IPs are all accepted, and the check runs live against the blocklist set.",
      "Press Check reputation and read the Listed counter first. It compares the number of lists that flagged the address with the number that answered.",
      "Work through the table row by row. A row marked LISTED with a code tells you which list flagged the address and under what reason.",
      "Treat a row that ends in Error as unknown rather than clean. A list that failed to answer has not cleared the address.",
      "Compare the Risk signal and Score with the listing count, then verify any hit on that provider's own lookup page before acting on it.",
    ],
    terms: [
      { label: "Listed", meaning: "How many of the queried blocklists flagged the address, over how many answered the query. The denominator can drop when a list errors out." },
      { label: "Status", meaning: "One of LISTED, Clean, Error or Unknown for each list. Only the LISTED state means the list confirmed the address is present." },
      { label: "Detail", meaning: "The reason code behind a listing, or No listing found when the list replied without a match. Codes are specific to each provider." },
      { label: "Risk signal", meaning: "A coarse label such as Low, Medium or High derived from the listing count. It summarizes the lists, not the behaviour of the traffic." },
      { label: "Score", meaning: "A numeric summary of the same evidence on a scale out of one hundred. Treat it as a sorting aid rather than a measured probability of abuse." },
      { label: "Hosting, Proxy and Mobile", meaning: "Extra rows describing the address itself, such as datacenter hosting or a mobile carrier, which change how a blocklist hit should be read." },
    ],
    takeaway:
      "A report with no listings means the address is clean on the lists that answered, and nothing more. It does not rule out abuse that has not been reported yet, and it does not describe the traffic. If the address is yours and it is listed, the listing reason decides whether you ask for removal or change your sending pattern.",
    mac: {
      command: "nslookup 8.8.8.8.zen.spamhaus.org",
      note: "Open Terminal and run the query to reverse the address into a blocklist name. A reply in the 127.0.0.0/8 range means Spamhaus matched it, with the last octet naming the reason.",
    },
    windows: {
      command: "nslookup 8.8.8.8.zen.spamhaus.org",
      note: "Run the same lookup in Windows Terminal. Point it at other lists by swapping the suffix, and remember that each provider only answers for addresses it has actually listed.",
    },
    limit:
      "Blocklists change by the hour, so a clean result today says little about tomorrow. Queries can also be refused or answered with an error code that must not be read as a listing. The lists track reported sending addresses, not intent, and a shared mail relay can put an innocent address on a list.",
  },
  "vpn-check": {
    title: "VPN check: sorting an address by the network that issued it",
    summary: "Sort an address into the kind of network that issued it.",
    purpose:
      "Before deciding how much to trust a connection, it helps to know what sort of network it came from. This check reads the registered details of the network operator and sorts the address into datacenter, mobile, or residential and business. The classification is a property of the network, not of the person at the keyboard.",
    steps: [
      "Supply the address under inspection. The check runs live against a routing and registration database and reads the network operator's name.",
      "Press Inspect IP and read the Connection label first. It resolves to datacenter, mobile carrier, or residential and business.",
      "Confirm the Hosting row. A yes here means the operator runs the range in a datacenter rather than handing it to households.",
      "Check whether Mobile carrier says yes. Mobile ranges are shared, reassigned between subscribers, and unreliable as an identity signal.",
      "Use the ASN, Organization and ISP rows to verify who is behind the range, then compare that with what you expected to find.",
    ],
    terms: [
      { label: "Connection", meaning: "The classification derived from the operator's name and network: Datacenter / hosting, Mobile carrier, or Residential / business." },
      { label: "Hosting", meaning: "Yes when the network matches a known datacenter operator. Hosting traffic often looks automated and carries no residential history." },
      { label: "Mobile carrier", meaning: "Yes when the range belongs to a cellular network, where one address is shared by many subscribers and reassigned over time." },
      { label: "ASN", meaning: "The autonomous system number that announces the address, formatted with an AS prefix. It is the most stable identifier of the network." },
      { label: "Organization and ISP", meaning: "Two names for related roles: the company that owns the network and the company that sells access to end users through it." },
      { label: "Country, Region, City", meaning: "Where the address is registered. Because carrier ranges are reused, the location can drift away from the current subscriber." },
    ],
    takeaway:
      "A datacenter classification tells you the address belongs to infrastructure, not to a household. It is worth knowing before you weigh a complaint, a signup, or a payment. It does not make the traffic abusive, and it does not confirm that a VPN is in use.",
    mac: {
      command: "curl https://ipinfo.io/8.8.8.8",
      note: "Run the command in Terminal to read the organization and network behind the address as plain JSON. The classification itself is made by the lookup tool, not by curl.",
    },
    windows: {
      command: "curl https://ipinfo.io/8.8.8.8",
      note: "Run the same command in Windows Terminal and compare the organization string against the provider you expect. Reading the raw name is often the quickest way to spot a reseller.",
    },
    limit:
      "The classification comes from matching words in the operator's name, so it is a hint and not a verdict. It cannot name the VPN product in use, and it cannot confirm Tor or proxy traffic, because those services publish no field that says so. Residential proxies and shared corporate gateways will read as ordinary business networks.",
  },
  "subnet-calculator": {
    title: "Subnet calculator: hosts, addresses and ranges inside a CIDR",
    summary: "Reveal the addresses inside a CIDR prefix and the hosts you can actually use.",
    purpose:
      "A CIDR prefix says how many leading bits of an address belong to the network, and everything after that identifies a host inside it. Doing that arithmetic by hand is slow and easy to get wrong. This calculator runs entirely in the browser, so the network, mask, and usable range appear as you type.",
    steps: [
      "Type the network in CIDR form, for example 192.168.1.0/24. Only IPv4 addresses with a prefix from zero to thirty-two are accepted.",
      "Read the Network and Subnet mask metrics. The mask is the same boundary written as four octets instead of a slash number.",
      "Check Total addresses against Usable hosts. For a normal prefix the two differ by two, the network address and the broadcast address.",
      "Note the first and last usable addresses, then write them down before you give a machine a fixed address.",
      "Read the Wildcard mask row if you are writing an ACL or a route entry. It is the inverse of the subnet mask.",
    ],
    terms: [
      { label: "Network", meaning: "The base address of the block with the host bits cleared, written with the prefix. It names the entire range rather than a single host." },
      { label: "Subnet mask", meaning: "A /24 shown in dotted notation, where the twenty-four leading bits are set and the remaining eight are free." },
      { label: "Total addresses", meaning: "How many addresses the block contains, counting the network and broadcast addresses that cannot be assigned to hosts." },
      { label: "Usable hosts", meaning: "The addresses available for devices, normally two fewer than the total. Prefixes of thirty-one and thirty-two follow RFC 3021 instead." },
      { label: "Broadcast address", meaning: "The last address in the block, reserved for directed broadcasts. On a thirty-one or thirty-two prefix the tool reports it as not applicable." },
      { label: "Wildcard mask", meaning: "The inverted subnet mask, used where ACLs and routing entries expect zeros to mean ignore. It is a matching rule, not a range." },
    ],
    takeaway:
      "The calculator gives you the whole shape of a block in one pass: where it starts, where it ends, and how many devices can live inside it. Two addresses are usually spoken for, the network and broadcast ends. A prefix of thirty-one or thirty-two is the exception, and the tool handles both without a special mode.",
    mac: {
      command: "python3 -c \"import ipaddress; n=ipaddress.ip_network('192.168.1.0/24'); print(n, n.netmask, n.broadcast_address, n.num_addresses)\"",
      note: "Open the calculator in a browser tab, or run this in Terminal if Python 3 is installed. The library prints the same network and mask without touching the network.",
    },
    windows: {
      command: "py -3 -c \"import ipaddress; n=ipaddress.ip_network('192.168.1.0/24'); print(n, n.netmask, n.broadcast_address, n.num_addresses)\"",
      note: "Run it in PowerShell where the Python launcher is available, or work it out in the browser. The launcher form needs Python 3 installed separately.",
    },
    limit:
      "This is an IPv4 calculator only, so an IPv6 prefix will be rejected. It knows nothing about your router, and it cannot warn you that a static address sits inside a range your DHCP server already hands out. Check the DHCP pool before you fix an address by hand.",
  },
  "dns-lookup": {
    title: "DNS lookup: reading the records a public resolver returns",
    summary: "Read the records a public resolver returns for a domain name.",
    purpose:
      "DNS is the directory the internet uses to turn a name into something connectable. Each record type answers a different question: addresses for the web, mail servers for inbox routing, text entries for ownership proofs and policy. Querying a resolver shows what the world is being told about a domain right now, cache included.",
    steps: [
      "Enter the domain without a protocol, for example example.com. A subdomain is worth checking on its own, since records often differ.",
      "Choose the record type that matches your question, A for addresses and MX for mail, and run the lookup. The query is made live.",
      "Count the Records metric before reading the table. It tells you how many answers came back, which is often the first clue.",
      "Read Name, Type, TTL and Value row by row. The TTL is how long any resolver is allowed to keep that answer.",
      "Compare the values with what you expected to publish. A record that exists still leaves open whether the host behind it answers.",
    ],
    terms: [
      { label: "Records", meaning: "The number of answers the resolver returned for the requested type. Zero means the type is not published, not that the domain is broken." },
      { label: "TTL", meaning: "The lifetime in seconds that the answer may be cached. A low value speeds up changes, a high value keeps traffic steady." },
      { label: "A and AAAA", meaning: "The IPv4 and IPv6 address records for the name. Two address rows usually mean the site is served from more than one host." },
      { label: "MX", meaning: "The mail exchangers for the domain, each with a preference number. The lowest preference is tried first when mail arrives." },
      { label: "TXT", meaning: "Free-form text entries, where SPF, DKIM and domain verification records live. The value is the string the provider asked you to publish." },
      { label: "CNAME and NS", meaning: "CNAME points one name at another, and NS lists the servers authoritative for the zone. A CNAME cannot sit at the apex of a domain." },
    ],
    takeaway:
      "An answer that matches what you published means the change is live and visible. A missing record type is the more common finding, often a forgotten TXT entry or a mail exchanger that was never pointed anywhere. Remember that what you see here is one resolver's cache, not the authoritative zone.",
    mac: {
      command: "dig example.com A",
      note: "Run the query in Terminal and swap the type for MX, TXT or CNAME as needed. dig talks to the resolver configured on your machine, not necessarily a public one.",
    },
    windows: {
      command: "Resolve-DnsName example.com -Type A",
      note: "Run it in PowerShell and change the type the same way. Add -Server 1.1.1.1 to query a specific resolver instead of the one your network hands out by default.",
    },
    limit:
      "A resolver returns what it has cached, so a freshly edited record may not appear yet. Private and split-horizon zones are invisible from the public internet, and the query only ever covers the exact name you typed. Confirm a change at the authoritative server before you assume the edit failed.",
  },
  "dns-propagation": {
    title: "DNS propagation: comparing six resolvers on one record",
    summary: "Compare what six public resolvers answer for one record.",
    purpose:
      "When you point a name at a new host, the change reaches users at different speeds because each resolver keeps its own cache. Comparing the answers from several public resolvers shows whether the move has settled or whether some are still serving the old address. The comparison is a sample of a handful of caches, not a view of the whole internet.",
    steps: [
      "Enter the exact hostname you changed, including any subdomain. Propagation is tracked per name, so the bare domain may look fine while mail still lags.",
      "Pick the record type you edited and press Check propagation. Six public resolvers answer the query live, each from its own network.",
      "Read the Agreement counter. Five of six matching means one resolver still holds a different answer, not that the change is broken.",
      "Open the table and find the rows marked Different. The resolver column tells you which network answered and the answer column shows the old value.",
      "Compare the TTL on the record with the age of your change. If the old TTL has not expired yet, waiting is usually enough.",
    ],
    terms: [
      { label: "Agreement", meaning: "How many resolvers returned an answer identical to the first one received. Full agreement here still leaves uncached and regional resolvers unasked." },
      { label: "Resolver", meaning: "The public DNS service that answered, identified by name and address. Each one maintains its own cache with its own expiry times." },
      { label: "Answer", meaning: "The value the resolver returned for the record type you chose. Multiple addresses in one cell mean the name resolves to a set of hosts." },
      { label: "Matches", meaning: "The resolver returned the same value as the first answer received, so its cache agrees with the majority in this sample." },
      { label: "Different", meaning: "The resolver returned something else, usually a still-cached old record or a deliberately different regional answer. Neither reading proves a broken change." },
      { label: "Error", meaning: "The resolver did not answer. It is neither agreement nor disagreement, and it should not be counted as a mismatch when you read the counter." },
    ],
    takeaway:
      "One resolver still holding the old answer is normal for a while after a change and rarely a problem on its own. Persistent disagreement across several rows is worth checking against the authoritative server. If a majority of resolvers agree on an address you did not publish, that is a bigger signal than a single lagging cache.",
    mac: {
      command: "dig @8.8.8.8 example.com A\ndig @1.1.1.1 example.com A",
      note: "Enter both queries in Terminal to compare two public resolvers directly. Each answer carries its own TTL, so a stale value shows up with a low remaining time.",
    },
    windows: {
      command: "nslookup -type=A example.com 8.8.8.8\nnslookup -type=A example.com 1.1.1.1",
      note: "Enter each query in PowerShell and read the Address lines under the server heading. The nameserver parameter picks the resolver, while the lookup still leaves your machine.",
    },
    limit:
      "Six resolvers are a sample, not a census, and large networks run their own internal resolvers that none of them represent. Answers can differ on purpose through load balancing or regional routing, so disagreement does not always mean a change is still spreading. Expect agreement to lag behind the authoritative server, not the other way round.",
  },
  "is-it-down": {
    title: "Is it down: telling a dead site apart from a blocked one",
    summary: "Find out whether a site answers for you, or for nobody at all.",
    purpose:
      "A page that will not load has more than one possible cause: the host is down, the network path is broken, or the request never left your machine. A server-side check removes your machine from the equation and asks the site directly. The status code, the final URL, and the time to answer tell you where the problem sits.",
    steps: [
      "Enter the full address including the scheme. A bare hostname is accepted, but the exact path you care about is worth testing.",
      "Press Check availability. The site is contacted live from the server side, so the result does not depend on your connection or your browser.",
      "Read the HTTP status first. A 200 means the server answered, a 4xx means it refused the request, and a 5xx means it failed.",
      "Compare the Final URL with what you typed. A Redirected value of yes plus a different final address means the request was moved.",
      "Treat an Unreachable result as a question, not a verdict. Compare the response time with a known good site to separate host trouble from network trouble.",
    ],
    terms: [
      { label: "HTTP status", meaning: "The status line the server returned, such as 200 OK. It describes the response to your request, not whether the page content is correct." },
      { label: "Response time", meaning: "How long the server-side request took to complete, measured in milliseconds. Assets and scripts are not fetched as part of this measurement." },
      { label: "Availability", meaning: "Reachable when a status code came back, or Down or unreachable when the connection failed before any response arrived." },
      { label: "Final URL", meaning: "The address the request ended on after any redirects. Comparing it with the input shows where the site actually wants you." },
      { label: "Redirected", meaning: "Yes when the server sent the request somewhere else. The status code in the response is the hop, not the final page." },
      { label: "Source", meaning: "The line marking the result as a live server-side fetch, made without browser cross-origin restrictions." },
    ],
    takeaway:
      "A 200 with a short response time means the site is up and answering, even if the page behind it looks wrong. An unreachable result points upstream, toward the host or the route to it. It does not tell you whether every visitor is affected, and it says nothing about why a page rendered badly.",
    mac: {
      command: "curl -I https://example.com",
      note: "Run it in Terminal to fetch only the headers and read the status line yourself. If the server treats HEAD as an odd request, repeat the call with a GET that discards the body.",
    },
    windows: {
      command: "curl.exe -I https://example.com",
      note: "Run it in PowerShell and spell the command with the .exe suffix, which avoids the older alias that maps curl to something else entirely. The status line prints first.",
    },
    limit:
      "One successful request proves the site answered for that moment and that path. Blocking bots, rate limits, and maintenance pages can all make a site look broken to a single caller. The check reports the response, not the reason behind it, and it never exercises the browser code that actually renders the page.",
  },
  "bulk-url-status": {
    title: "Bulk URL status: checking a list of addresses in one pass",
    summary: "Test a list of addresses and get one status line for each.",
    purpose:
      "After a migration or a launch, the risk is rarely in one page. It is in the two hundred addresses nobody remembered to check. Submitting a list of URLs and reading the status column together turns that pile into a short worklist: what answers, what moved, and what failed outright.",
    steps: [
      "Paste the addresses into the box, one per line, up to fifty. Plain domains are fine, since the scheme is added for you.",
      "Press Check URLs and let the requests run. Every entry is fetched live, and the counts at the top fill in as they finish.",
      "Read the Errors count first and open those rows. The status column carries the reason the request could not be completed.",
      "Work through the Redirected rows and check where each one lands. A redirect to a page you retired is a broken link in disguise.",
      "Compare the Time column across the list. A page far slower than its neighbours usually points at a backend problem rather than a routing one.",
    ],
    terms: [
      { label: "URLs", meaning: "The number of entries submitted and checked. The tool accepts up to fifty addresses per run." },
      { label: "Reachable", meaning: "The count of entries that returned a successful or redirected status without a connection error." },
      { label: "Redirected", meaning: "The count of entries that answered with a 3xx status, meaning the address now points somewhere else." },
      { label: "Status", meaning: "The code and reason phrase for each entry, or an Error line with the underlying failure when no response arrived." },
      { label: "Time", meaning: "Milliseconds spent on each request. Server-side timing gives a rough comparison between entries in the same run." },
      { label: "Final destination", meaning: "Where the request ended up after following redirects. Compare it against the URL you submitted to spot a stale target." },
    ],
    takeaway:
      "A clean list shows every address answering with the status you expect. One redirect is a normal part of a migration, and a redirect to the wrong page is not. The fastest route from this table to a fix is to sort by error, fix those entries first, and then confirm the redirects land where you meant.",
    mac: {
      command: "for url in https://example.com https://example.org; do\n  printf \"%s \" \"$url\"\n  curl -s -o /dev/null -w \"%{http_code}\\n\" \"$url\"\ndone",
      note: "Paste the loop into Terminal and extend the list. It prints one status code per address and stops at the first, so a slow entry holds up the rest.",
    },
    windows: {
      command: "\"https://example.com\", \"https://example.org\" | ForEach-Object {\n  Write-Output $_\n  curl.exe -s -o NUL -w \"%{http_code}\\n\" $_\n}",
      note: "Paste the pipeline into PowerShell and add more URLs to the array. A code of 000 means the request never produced a status line, so check the transport error.",
    },
    limit:
      "Only check addresses you are allowed to request, and keep batches small enough to stay polite. The check follows redirects and reports where each one lands, so a 301 in the table is not a failure by itself. A status code says nothing about whether the page renders correctly once the browser receives it.",
  },
  "http-headers": {
    title: "HTTP headers: reading the metadata behind every response",
    summary: "Read the metadata a server sends back with every response.",
    purpose:
      "Every HTTP response carries a block of metadata before the body: the status, the content type, caching rules, compression, and transport policy. Reading that block tells you why a change is not showing up, whether the server is compressing the payload, and how long the content may be cached. It is the first place to look when a page behaves differently than expected.",
    steps: [
      "Enter the address you want to inspect and choose the method. HEAD returns headers only, while GET fetches the body and its headers.",
      "Press Fetch headers. The call goes out live and the table below lists every header the server sent back.",
      "Start with the Status metric and the Final URL. They tell you whether the request succeeded and whether a redirect moved it.",
      "Find the header that matches your problem, Cache-Control for stale content or Content-Encoding for slow pages, and read its value.",
      "Compare a GET and a HEAD run of the same address. When the two differ, the server treats the methods differently and that is worth knowing.",
    ],
    terms: [
      { label: "Status", meaning: "The status line the server returned, such as 200 OK or 301 Moved Permanently. It is the outcome of the request itself." },
      { label: "Headers", meaning: "How many header lines came back. The count varies with the server, the method, and any redirect that was followed." },
      { label: "Content-Type", meaning: "The media type of the body, usually with a charset. It tells a browser how to interpret the bytes it received." },
      { label: "Cache-Control", meaning: "The caching policy for the response. A max-age value sets how long a browser or proxy may reuse the stored copy." },
      { label: "Content-Encoding", meaning: "The compression applied to the body, such as gzip or br. It tells you the payload was shrunk, and says nothing about the document type." },
      { label: "Strict-Transport-Security", meaning: "A policy telling browsers to use HTTPS for this host on later visits. The max-age value sets how long the rule is remembered." },
    ],
    takeaway:
      "A healthy response answers with a 200, declares its content type, and states how the body may be cached. That is enough to explain most surprises: an edit that never appears is often a cache rule, and a slow page is often a compression setting. The Server field is a self-reported label, so treat it as a hint.",
    mac: {
      command: "curl -I https://example.com",
      note: "Run it in Terminal and read the block of headers printed above the blank line. To use a GET instead, add -s -D - -o /dev/null to the same command.",
    },
    windows: {
      command: "curl.exe -I https://example.com",
      note: "Run it in Windows Terminal and keep the .exe suffix so PowerShell does not substitute its own alias. For a GET variant, replace the flag with -s -D - and discard the body with -o NUL.",
    },
    limit:
      "HEAD and GET responses are not always identical, and some servers handle one badly or block it outright. Headers describe the response, not the application behind it, so a correct set of headers can still sit on a broken page. For what your own browser received, read the document request in the developer tools.",
  },
};
