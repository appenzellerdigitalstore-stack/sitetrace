// Static image paths for the blog guide cards. Each guide slug maps to a
// JPG inside /public/blog-images/, fetched from the Lovable CDN at build time
// and copied here. Updating this map is the only way to point a guide at a
// different image.

import bulkUrlStatus from "/blog-images/bulk-url-status.jpg";
import dnsLookup from "/blog-images/dns-lookup.jpg";
import dnsPropagation from "/blog-images/dns-propagation.jpg";
import emailDeliverability from "/blog-images/email-deliverability.jpg";
import httpHeaders from "/blog-images/http-headers.jpg";
import ipLookup from "/blog-images/ip-lookup.jpg";
import ipReputation from "/blog-images/ip-reputation.jpg";
import isItDown from "/blog-images/is-it-down.jpg";
import openGraphPreview from "/blog-images/open-graph-preview.jpg";
import passwordGenerator from "/blog-images/password-generator.jpg";
import pingTest from "/blog-images/ping-test.jpg";
import portCheck from "/blog-images/port-check.jpg";
import randomColor from "/blog-images/random-color.jpg";
import securityHeaders from "/blog-images/security-headers.jpg";
import seoChecker from "/blog-images/seo-checker.jpg";
import smartDispatcher from "/blog-images/smart-dispatcher.jpg";
import sslCertificate from "/blog-images/ssl-certificate.jpg";
import subnetCalculator from "/blog-images/subnet-calculator.jpg";
import traceroute from "/blog-images/traceroute.jpg";
import vpnCheck from "/blog-images/vpn-check.jpg";
import wordCounter from "/blog-images/word-counter.jpg";

export const blogImages: Record<string, string> = {
  "bulk-url-status": bulkUrlStatus,
  "dns-lookup": dnsLookup,
  "dns-propagation": dnsPropagation,
  "email-deliverability": emailDeliverability,
  "http-headers": httpHeaders,
  "ip-lookup": ipLookup,
  "ip-reputation": ipReputation,
  "is-it-down": isItDown,
  "open-graph-preview": openGraphPreview,
  "password-generator": passwordGenerator,
  "ping-test": pingTest,
  "port-check": portCheck,
  "random-color": randomColor,
  "security-headers": securityHeaders,
  "seo-checker": seoChecker,
  "smart-dispatcher": smartDispatcher,
  "ssl-certificate": sslCertificate,
  "subnet-calculator": subnetCalculator,
  "traceroute": traceroute,
  "vpn-check": vpnCheck,
  "word-counter": wordCounter,
  // Guides without a downloaded image (e.g. what-is-my-ip) fall through to
  // a transparent 1x1 placeholder so the page still renders. The blog-guide
  // component hides the figure when no image is present.
  "what-is-my-ip": "",
};
