import type { ToolPageGuide } from "../tool-guide-types";

// Reference implementation. Every other tool guide in this folder follows the
// same shape, the same tone and roughly the same length. Keep the overview
// under 110 words, the bullets to one sentence each, and the limits honest:
// say what the tool cannot do rather than padding.

export const dnsLookupGuide: ToolPageGuide = {
  overview:
    "DNS turns a domain name into the addresses browsers connect to. This tool resolves a name and shows the records a resolver returns: the A and AAAA addresses, the mail exchangers, the TXT entries that carry SPF, DKIM and domain verification, and the nameservers authoritative for the zone. Read it when a site resolves for you but not for a customer, when mail starts landing in spam, or when you are pointing a domain at a new host and want to confirm the change actually propagated.",
  howToUse: [
    "Enter the domain you want to resolve. Subdomains work too, so you can check one host instead of the whole zone.",
    "Run the lookup. SiteTrace asks a public resolver, which is the same view most of your visitors get.",
    "Start with the address records. They are the first thing to check when a page will not load at all.",
    "Move to the mail exchangers next if you are chasing delivery problems. The SPF, DKIM and DMARC policies live in the TXT records below them.",
    "Compare the nameservers against what your registrar shows. If the two disagree, the zone is being served from somewhere you did not expect.",
  ],
  readingResults: [
    "Address records map the name to the servers that answer web requests. Two addresses usually mean a load-balanced pair, and both should return identical content.",
    "Mail exchangers decide where mail for the domain lands. The lower the preference number, the earlier that server is tried.",
    "TXT records carry mail authentication and domain-ownership proofs. If your SPF or DKIM record is missing from this list, mail will be filtered no matter what you send.",
    "The nameserver row shows which server is authoritative. Resolvers cache an answer for the TTL in the record, so a fresh change can take time to appear here.",
    "The resolver address and response time tell you where the answer came from. A slow response usually means the authoritative server is slow, not that your network is.",
  ],
  limits: [
    "This is one public resolver at one moment. A different resolver can hold a different cached answer, especially before a change has finished propagating.",
    "It says nothing about whether the server behind an address is healthy or responding. That is what the HTTP headers and status tools are for.",
    "Private and split-horizon DNS setups are invisible from the public internet by design, so a clean result here does not rule out an internal resolver.",
    "Mail authentication records are only half the story. Whether a message passes SPF, DKIM and DMARC also depends on the sending server.",
  ],
  nextSteps:
    "A clean result means the name resolves to the servers you expect, with the mail and verification records you set up in place. If the addresses are wrong, fix them at your host and wait for the TTL to expire before checking again. If mail records are missing, check the mail provider first and the registrar second. To read the records straight from the authoritative server instead of a resolver, run the same lookup in your terminal with dig.",
};
