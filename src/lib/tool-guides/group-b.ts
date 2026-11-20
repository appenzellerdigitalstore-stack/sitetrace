import type { ToolPageGuide } from "../tool-guide-types";

// Editorial copy for the /tools/<slug> pages of the tools in this group.
// Each entry explains how to drive the workspace on the page and how to read
// the numbers it returns. The longer reference guide under /blog/<slug> is a
// separate article and is not repeated here.

export const groupB: Record<string, ToolPageGuide> = {
  "security-headers": {
    overview:
      "Security headers are instructions a site sends in every HTTP response, telling the browser what it may load and how to treat the page. This tool fetches your site live, reads the response headers, and scores seven of the headers that carry the most weight: HSTS, Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy and X-XSS-Protection. Each one is marked present or missing, with the exact value it found, or the setting to add when it is absent. It also flags version headers such as server and x-powered-by, because they advertise your stack to anyone who asks.",
    howToUse: [
      "Enter the address of the site you want to audit. A bare domain is fine, since https:// is added for you.",
      "Press Audit security. The request runs from SiteTrace's servers, so the result is what a visitor's browser would receive.",
      "Check the Grade and Score first to see the overall picture, then read the table row by row.",
      "Work down the Missing rows and add the recommended header at your host or application level.",
      "Re-run the audit after each change to confirm the header is now present and carries the value you intended.",
      "Compare the values with your deployment, since hosts and CDNs often add or rewrite headers on the way through.",
    ],
    readingResults: [
      "Grade and Score summarise the same result: a letter from the weighted total of the headers that were found.",
      "Present counts how many of the seven checked headers arrived, so five of seven means two are still missing.",
      "Each row shows the header name, whether it was present, and either its real value or the setting to apply.",
      "Info leak rows appear when headers such as server or x-powered-by reveal the software and version behind the site.",
      "A Present row does not mean the value is strong. A one-year HSTS or a wide-open CSP still needs work.",
    ],
    limits: [
      "It audits the final response after redirects, so a CDN or platform layer can change what your origin sends.",
      "Presence is not strength. The tool does not judge how restrictive a policy is, only whether it exists.",
      "It tests headers only, not application flaws, exposed data or the correctness of your TLS certificate.",
      "The fetch happens from SiteTrace's servers, so headers that vary by country or user agent may differ.",
    ],
    nextSteps:
      "Add the missing headers one at a time, starting with Content-Security-Policy and Permissions-Policy, then re-run the audit to confirm the change. Introduce a CSP in report-only mode before enforcing it, so a strict policy does not block your own scripts or sign-in flow. Once every row reads Present, check the values by hand in your browser developer tools under Network, and treat the grade as one signal rather than a full security review.",
  },
  "http-latency": {
    overview:
      "This tool times one live HTTP request and splits the time it takes into the parts the server can actually measure. A run reports the status code, the total round trip, the time to first byte, and how long the body took to download. The DNS lookup, TCP connect and TLS handshake rows are listed for reference, but a server-side run cannot separate them, so they come back empty. Read it when a page feels slow and you want to know whether the time went to the server thinking or to the page itself.",
    howToUse: [
      "Enter the full page URL you want to time, including the path when the slow page is not the home page.",
      "Press Measure latency. One GET request runs from SiteTrace's servers and the response is read to the end.",
      "Look at Total time first. It is the end-to-end cost of the request as the server measured it.",
      "Then compare the TTFB and download rows to see whether the delay happened before or after the first byte.",
      "Run the same URL a few times, because a single request is one sample and the numbers move between runs.",
      "If you need the DNS, TCP and TLS phases for your own connection, use a browser timing tool instead.",
    ],
    readingResults: [
      "Status shows the HTTP code the page returned, so a redirect or an error explains a surprising total time.",
      "Total time is the whole request from start to finish, including the connection and the body download.",
      "TTFB is the wait until the server began answering. High values point at slow backend work or a cold cache.",
      "Content download is what remained after the first byte, with the number of bytes received shown beside it.",
      "DNS lookup, TCP connect and TLS handshake read as empty because the platform handles those phases for the server.",
    ],
    limits: [
      "The measurement comes from SiteTrace's servers, not from your machine, your office line or your customers.",
      "The empty phase rows are honest limits of a server-side fetch, and the note row says so in the result.",
      "It fetches the first megabyte of the body, so a very large page is not downloaded in full.",
      "One run is a single sample. Network conditions, caching and server load all move the numbers.",
    ],
    nextSteps:
      "If TTFB dominates the total, the time was spent before the page started arriving, so look at server rendering, cache hits and database work. If the download row dominates, the page is sending too much markup or assets. Because the numbers come from SiteTrace's servers, repeat the check from your own network with a browser developer tools timing panel to compare. A slow result here means slow for at least one real client, which is already worth chasing.",
  },
  "email-deliverability": {
    overview:
      "Email authentication is the set of DNS records that tell receiving servers who is allowed to send mail for your domain. This tool reads those records live for any domain: SPF, the DKIM public key at the selector you choose, the DMARC policy at _dmarc, and the MX servers that accept the mail. It scores the four of them out of 100 and flags the issues it found. Run it on a domain that sends mail, and again on any subdomain you send from, because each one needs its own records.",
    howToUse: [
      "Enter the sending domain, such as example.com, not a full email address and not a page URL.",
      "Set the DKIM selector to the one your mail provider gave you. The default value of default is only a guess.",
      "Press Check email. The records are read from DNS live and the score is calculated from what came back.",
      "Read the four record rows together, because SPF, DKIM, DMARC and MX each cover a different part of delivery.",
      "Look at the Issue rows at the bottom of the table for a plain statement of what is missing or malformed.",
    ],
    readingResults: [
      "Score is the weighted total out of 100, and Risk turns that number into low, medium or high.",
      "SPF lists the authorized senders. A valid record ends in a qualifier such as ~all or -all for everyone else.",
      "DKIM shows the public key published at your selector. Not found usually means the selector name is wrong.",
      "DMARC shows the policy: none only collects reports, quarantine sets aside failures, reject blocks them.",
      "MX lists the servers that receive mail for the domain. Missing MX means nothing is set up to accept it.",
    ],
    limits: [
      "Correct records do not mean a message will reach the inbox, and a passing check is not a placement guarantee.",
      "DKIM is judged on the record existing at that selector, not on whether your sending server signs with the matching key.",
      "The tool does not check sender reputation, blocklists, content filters or SPF alignment with the From domain.",
      "A DMARC policy of none is recorded as valid, so a monitoring-only domain can still score well here.",
    ],
    nextSteps:
      "Fix the missing records in the DNS zone of the domain you entered, then re-run the check once the change has propagated. DMARC p=none is the usual starting point, so move to quarantine and later reject only after the aggregate reports show your legitimate senders passing alignment. If DKIM reads Not found, ask your mail provider which selector they sign with and repeat the check with that name. Reputation, blocklists and inbox placement need a separate review.",
  },
  "email-header-parser": {
    overview:
      "A raw email header records the journey a message took, one hop at a time, and it also carries the verdict of the receiving server. Paste the header text into this tool and it separates the useful fields for you: who sent it, who received it, the subject, the date, the message identifier, the return path, and the number of servers it passed through. The SPF, DKIM and DMARC results are read from the Authentication-Results line the receiving mail server wrote. Nothing is uploaded, so a real header can be pasted here as it is.",
    howToUse: [
      "Open the message in your mail client and show the original source, not the rendered conversation view.",
      "Copy everything above the blank line that starts the body, including all of the Received lines.",
      "Paste it into the header box. An example header is already there, so you can see the format first.",
      "Press Parse header. Fields that are absent from the paste stay blank instead of being invented.",
      "Compare the Originating IP with the sending server you expect, and check the hop count for odd detours.",
      "Keep the whole header when you share the result, because the chain of Received lines is the evidence.",
    ],
    readingResults: [
      "From, To, Subject and Date are copied straight from the header, so they show what the sender claimed.",
      "SPF, DKIM and DMARC carry the pass, fail or neutral verdict written by the receiving server, not a fresh test.",
      "Originating IP is the bracketed address from the topmost Received line, the last hop before the receiver.",
      "Hops counts the Received headers, so a large number means the message crossed many servers before delivery.",
      "Message-ID and Return-Path identify the message and the envelope sender, which differ from the visible From.",
    ],
    limits: [
      "The authentication results are copied from the header, so this tool does not recompute SPF, DKIM or DMARC itself.",
      "A sender can forge the headers above the first Received line, so treat the earliest hops with suspicion.",
      "It reads only the header you paste. Attachments, links and the body are never inspected.",
      "IPv6 addresses in a Received line are not extracted, so Originating IP can come back empty for IPv6 senders.",
    ],
    nextSteps:
      "Start with the Originating IP and the SPF, DKIM and DMARC results, since they show whether the receiving server accepted the message's authentication. If all three pass but the message looks wrong, the forgery happened before the first Received line. If DKIM failed, check whether the sending server signs with a selector your domain does not publish, then ask it which one it uses.",
  },
  "seo-checker": {
    overview:
      "This tool fetches one page and reads the metadata that search engines and social platforms parse from the HTML. It runs eight checks on the page you give it: the title, the meta description, the canonical URL, the first heading, the robots directive, the language attribute, the image alt text, and how much text the page carries. Each check returns Passed or Warning with a detail line explaining the measurement, and the weighted score adds up to 100. Use it after a page is published to catch missing or badly sized metadata.",
    howToUse: [
      "Enter the URL of the exact page you want to check. Each page is audited on its own, not the site.",
      "Press Audit SEO. The HTML is fetched live from SiteTrace's servers and parsed as it arrives.",
      "Read the Score first for a quick summary, then work through the check rows in order.",
      "Treat a Warning as a prompt to look, not a rule to obey. Length limits are conventions, not requirements.",
      "Fix the highest-value warnings first: title, description and alt text affect how the page is read and listed.",
      "Re-run the audit after publishing so the check reads the same HTML your visitors receive.",
    ],
    readingResults: [
      "Score is a weighted total out of 100 across the eight checks. It is a checklist result, not a search ranking.",
      "Passed and Warnings count the checks, so five of eight passed leaves three to look at.",
      "The title row counts characters and warns below 30 or above 65, and the detail line suggests aiming for 50 to 60.",
      "The description row wants roughly 120 to 155 characters, and the detail line shows the current length.",
      "The word count row reports how much text the page contains and flags anything under 300 words.",
      "Image alt text passes when every image carries an alt attribute, even an empty one, and the detail names how many lack it.",
    ],
    limits: [
      "It reads the HTML the fetch received, so text added by JavaScript after load may be missing from the results.",
      "The robots check passes when a robots tag exists, so a page set to noindex still shows as Passed.",
      "It says nothing about backlinks, crawl budget, Core Web Vitals, structured data or keyword targeting.",
      "One URL is one page. Site-wide templates and internal linking need a crawler, not this check.",
    ],
    nextSteps:
      "Fix the warnings in order of what a reader sees first: the title, then the description, then the heading and alt text. Keep the title under about 60 characters so it is not cut in search results, and write the description for a human, since search engines may still rewrite it. Run the check on a handful of representative pages, because a template problem repeats across every page of a site.",
  },
  "open-graph-preview": {
    overview:
      "When you paste a link into a chat or social network, the platform does not read your page. It reads a small set of meta tags that describe the page, and those tags are what Open Graph preview collects for you. Give it a URL and it fetches the page, pulls the og: values, and shows them beside a card mock-up with the title, description and domain. If a tag is missing it falls back to the twitter: version, then to the plain title tag, so you can see what a platform would end up using.",
    howToUse: [
      "Paste the exact URL you plan to share, including any campaign parameters you want checked.",
      "Choose a platform from the dropdown to label the report for where you intend to post.",
      "Press Preview social. The page is fetched live and its meta tags are parsed from the HTML.",
      "Compare the card on the right with what you expect the post to look like.",
      "Check each tag row, because the platform reads the tags, not the visible page content.",
      "Share the URL through the platform's own debugger after you fix the tags, since it caches previews.",
    ],
    readingResults: [
      "Title and Description in the metrics are the values a platform would use, shortened when they are long.",
      "Type comes from og:type, where website suits a landing page and article suits a dated post.",
      "The og:image row shows the picture URL, cut short when it is long, or Not provided when there is none.",
      "og:site_name and og:locale let a brand name and a language travel with the link.",
      "twitter:card is listed separately, since X reads that tag when the page carries one.",
      "The card shows the domain, title and description. Its image area is always a placeholder in this view.",
    ],
    limits: [
      "The platform dropdown only labels the report. The same tags are parsed for every choice.",
      "It cannot tell you how a specific platform will crop, shrink or re-order the card.",
      "An og:image URL is listed as written. The tool does not check that the file loads or is publicly reachable.",
      "Tags injected by JavaScript after the page loads are not seen, because the HTML is parsed as it arrives.",
    ],
    nextSteps:
      "If the title or description is missing, add the og:title and og:description tags to the page head and re-run the check. For a social image, publish it at a stable public URL and reference it with og:image, since a link behind a login will not render in a feed. The card here is a reconstruction, so verify the final look with the platform's own sharing debugger after you change the tags.",
  },
  "jwt-decoder": {
    overview:
      "A JSON Web Token is three base64url strings separated by dots: a header, a payload and a signature. Paste one into this tool and it decodes the first two into readable JSON, then lists the fields that matter in practice: the algorithm, the token type, the issuer, the subject, the audience, the issued-at time and the expiry. Decoding is not verification. Anyone can craft a token with any content, and this tool does not check the signature against a key.",
    howToUse: [
      "Paste the full token, including all three parts and the dots between them.",
      "Press Decode token. A token with a different number of parts is rejected with a clear message.",
      "Read the metric row for the algorithm, type, issue time and expiry at a glance.",
      "Open the JSON block for the complete header and payload, including any custom claims.",
      "Use the field table to check the issuer, subject and audience against what you expect.",
      "Only paste tokens you own or were given to inspect, because a decoded token still holds live claims.",
    ],
    readingResults: [
      "Algorithm is the alg field in the header. It says how the token claims to be signed, not whether it is.",
      "Type is the typ header value, usually JWT, and the JSON block shows the whole header beside it.",
      "Issued at and Expires are converted from Unix timestamps into readable dates, and stay empty when absent.",
      "payload.iss, sub, aud and jti identify the issuer, subject, audience and the unique token identifier.",
      "Signature is only the first sixteen characters of the third part, shown so you can compare tokens.",
      "Storage says the token was decoded in the browser and sent nowhere.",
    ],
    limits: [
      "The signature is never verified. A token can be decoded even when its signature is invalid or forged.",
      "It cannot tell you whether a token was revoked, whether it is expired, or whether it came from your issuer.",
      "Only standard claim names are listed in the table, so check the JSON block for anything custom.",
      "Encrypted tokens are not supported, because the tool expects exactly three dot-separated parts.",
    ],
    nextSteps:
      "Read the payload as a claim, not as proof. Confirm that the issuer and audience match the service you are talking to, and check the expiry date before trusting any identity or permission inside it. If you need to validate a token, verify the signature with the public key of the issuing service, in your own code or with a library built for that. This tool reads what a token says, and nothing leaves your browser.",
  },
  "password-generator": {
    overview:
      "This generator builds a password from random bytes taken from the browser's cryptographic random source, then shuffles the result so the character order carries no information. Set a length between 8 and 128 and choose which character groups to draw from: uppercase, lowercase, numbers and symbols. Every selected group is guaranteed at least one character. The password appears once on the page, the site keeps no copy of it, and nothing is sent to a server.",
    howToUse: [
      "Set the password length. Longer is stronger, and 24 characters is a sensible starting point.",
      "Keep every character group selected unless the target service forbids one of them.",
      "Press Generate password. A new value is produced on every press of the button.",
      "Read the password from the result panel and move it straight into your password manager.",
      "Check the metrics row: length, how many character types were used, randomness and storage.",
      "Generate a separate password for every account instead of reusing one across services.",
    ],
    readingResults: [
      "Length is the number of characters produced, matching the number you set.",
      "Character types counts the groups you enabled, and each one contributes at least one character.",
      "Randomness reads Cryptographic because the values come from the Web Crypto random generator, not Math.random.",
      "Storage reads Not saved. The site keeps no record, though your clipboard or screen can still hold a copy.",
      "The result text is the password itself, so copy it before starting another generation.",
    ],
    limits: [
      "It does not check the password against breach databases, so a repeated pattern can still be generated.",
      "The character set is fixed, and it cannot produce a passphrase or a password with custom characters.",
      "Nothing on the page is stored, but clipboard managers, screenshots and screen sharing can expose it.",
      "Each run is independent, so the tool cannot promise that a password differs from one you made earlier.",
    ],
    nextSteps:
      "Generate the password and paste it into your password manager, then clear it from the clipboard. Use a different password for every service, and let the password manager generate and store the ones it can, so nothing has to travel by clipboard. Turn on multi-factor authentication wherever it is offered, since a long random password protects the account only when it is not reused.",
  },
  "random-color": {
    overview:
      "Press the button and this tool draws three random bytes, one for each of the red, green and blue channels, and shows them as a colour you can use. The same colour is written in the format you choose: HEX for web styles, RGB for image editors, HSL for design work. It runs entirely in your browser using the secure random generator, so each run produces a fresh colour and nothing is sent anywhere. It is a starting point for a palette, not a finished scheme.",
    howToUse: [
      "Pick the output format: HEX for stylesheets, RGB for image editors, HSL for design tools.",
      "Press Generate color. The swatch and the three values always describe the same colour.",
      "Copy the value in your chosen format, or copy the HEX one and convert it later.",
      "Press the button again whenever you want a different colour, and keep the ones you like.",
      "Build a palette from the colours you keep, then check contrast before using them on text.",
      "For a fixed brand colour, edit the value in your design file instead of generating a new one.",
    ],
    readingResults: [
      "HEX is the value as a hash followed by six digits, where each pair encodes one colour channel.",
      "RGB lists the three channel numbers from 0 to 255, so a higher number means more of that channel.",
      "HSL gives the hue as an angle, with saturation and lightness as percentages of the maximum.",
      "The swatch paints the HEX value so you can see the colour, although screens differ slightly.",
      "All three formats describe one colour, so copying a different format never changes the result.",
    ],
    limits: [
      "There is no contrast or accessibility check, so a generated colour can be unreadable as text.",
      "The HSL values are rounded, so converting them back to RGB can differ slightly from the original.",
      "Each colour is random and unseeded, so there is no way to reproduce a colour you liked later.",
      "A single colour is not a palette, and nothing here guarantees the shades work together.",
    ],
    nextSteps:
      "Copy the value in the format your tool expects, paste it into the design file, and check it in the place it will be used, since the same value can look different on another display. If you plan to put text on it, check the contrast ratio against the background and keep the pairing above 4.5 to 1 for normal text. Generate a few more colours and treat them as candidates for a small palette rather than a finished design.",
  },
  "word-counter": {
    overview:
      "This counter measures a block of text as you paste it, entirely in your browser. It reports the word count, the number of characters with and without spaces, an estimate of reading time, and a breakdown of sentences, paragraphs and lines. Words are counted as groups separated by whitespace, which keeps the result predictable but simple. Use it to check a draft against a limit, to size a form field, or to see how long a page will feel.",
    howToUse: [
      "Paste or type your text into the box. Nothing is uploaded, and the count stays on the page.",
      "Press Count text to calculate the current statistics for the text you pasted.",
      "Start with Words for a length check and Characters for fields with a character limit.",
      "Use Without spaces when the limit excludes spaces, such as some meta description and title rules.",
      "Compare the result with the counter in the target application before you paste the text.",
      "Clear the box before pasting a different text, so the two are never counted together.",
    ],
    readingResults: [
      "Words counts groups of text separated by whitespace, so a hyphenated compound counts as one word.",
      "Characters counts every character including spaces and line breaks, which is what form limits usually count.",
      "Without spaces strips all whitespace, including tabs and line breaks, before counting.",
      "Reading time divides the word count by 200 words a minute and rounds up to the next minute.",
      "Sentences splits at full stops, question marks and exclamation marks, so abbreviations inflate the number.",
      "Paragraphs counts blank-line separated blocks, and Lines counts the line breaks in the text.",
    ],
    limits: [
      "The counting is not language aware, so Chinese or Japanese text counts very differently from English.",
      "Characters are counted as code points, so an emoji or a combined symbol can count as more than one.",
      "Reading time is a fixed estimate at 200 words a minute and says nothing about your actual speed.",
      "Other editors count differently, so a strict limit is better checked in the application that enforces it.",
    ],
    nextSteps:
      "Use the figure that matches the rule you are working to: words for a draft, characters for a form field, characters without spaces for a metadata limit. If you are near a hard limit, check the target application's own counter too, since the counting rules are rarely identical. Nothing you pasted is stored or transmitted, so it is safe to count a draft that has not been published yet.",
  },
  "smart-dispatcher": {
    overview:
      "Not every diagnostic fits every problem, and this one points you at the right one. Paste a URL, a domain or an IP address, and the dispatcher reads the shape of your input and names the kind of target it is. It then suggests the tools that suit that target: header and latency checks for a page, ownership and reputation checks for an address, resolution and registration lookups for a domain. The classification runs in your browser, and nothing is sent to the target.",
    howToUse: [
      "Paste the target you are working with: a full URL, a bare domain, or an IP address.",
      "Press Identify target. The input is classified locally and no lookup is made.",
      "Read the Type row to confirm the dispatcher understood the input the way you meant it.",
      "Open one of the suggested tools from the buttons under the table.",
      "Carry the same target over, since each tool keeps its own input separate.",
      "If the type is wrong, edit the input, for example by adding https:// to a full address.",
    ],
    readingResults: [
      "Target shows the hostname, so a full URL is reduced to the part a tool will actually query.",
      "Type names the target as Website URL, IP address or Domain, based on the shape of the input.",
      "Protocol reads HTTP or HTTPS for a full URL and a dash when you gave a bare hostname.",
      "The suggested tool rows explain the purpose of each option, so pick the one that answers your question.",
      "Each suggestion opens as a button that carries you to that tool with the right kind of input.",
    ],
    limits: [
      "The dispatcher only classifies. It does not run a check, so it says nothing about the target's condition.",
      "It cannot tell you whether the address exists, is reachable, or is safe to visit.",
      "A hostname containing a colon is read as an IP address, which is right for IPv6 and wrong for a host and port.",
      "Suggestions are starting points. The right tool depends on the question you are actually asking.",
    ],
    nextSteps:
      "Open the suggested tool that matches your question and paste the same target into it, since each tool has its own input field. Start with DNS lookup when a domain does not resolve, and with Is it down when you need to know whether a page answers at all. If a URL was classified as a domain, add the scheme and try again.",
  },
};
