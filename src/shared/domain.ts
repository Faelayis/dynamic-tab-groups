import { IGNORED_PROTOCOLS } from "./constants.ts";


export function extractDomain(url: string, groupChromePages = false): string | null {
  try {
    const parsed = new URL(url);

    if (IGNORED_PROTOCOLS.has(parsed.protocol)) {
      if (groupChromePages) {
        return `${parsed.protocol}//${parsed.hostname}`;
      }
      return null;
    }

    let hostname = parsed.hostname;

    if (hostname.startsWith("www.")) {
      hostname = hostname.substring(4);
    }

    hostname = hostname.replace(
      /\.(com|net|org|co|io|me|th|uk|in|us|app|dev|ac|edu|gov|tv|xyz|info|biz|site|tech|online|ai)(\.[a-z]{2})?$/i,
      ""
    );

    return hostname;
  } catch {
    return null;
  }
}
