const maximum_object_depth = 12;
const maximum_total_nodes = 20_000;
const maximum_string_length = 4_000;
const maximum_array_elements = 1_000;
const maximum_object_keys = 200;
const maximum_key_length = 100;
const maximum_url_length = 2_048;

const prototype_pollution_keys = new Set([
  "__proto__",
  "constructor",
  "prototype",
]);

const link_field_names = new Set([
  "source",
  "sourceUrl",
  "image",
  "link",
  "url",
  "legal",
  "canonical",
  "thumbnail",
  "references",
]);

const permitted_url_protocols = new Set(["https:"]);
const stripped_link_replacement = "";

const control_character_pattern =
  /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g;

const bidi_and_invisible_pattern = /[\u202A-\u202E\u2066-\u2069\u200B\uFEFF]/g;

const scheme_url_pattern = /\b[a-z][a-z0-9+.-]*:\/\/[^\s<>"'`]+/gi;

const protocol_relative_url_pattern =
  /(^|[\s(])\/\/[a-z0-9-]+(?:\.[a-z0-9-]+)+[^\s<>"'`]*/gi;

const www_url_pattern = /\bwww\.[a-z0-9-]+(?:\.[a-z0-9-]+)+[^\s<>"'`]*/gi;

const executable_scheme_pattern =
  /\b(?:javascript|data|vbscript|file|blob|about)\s*:/gi;

const private_hostname_patterns: RegExp[] = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(?:1[6-9]|2\d|3[01])\./,
  /^169\.254\./,
  /^0\./,
  /\.local$/i,
  /\.internal$/i,
  /\.localhost$/i,
];

function removeUnsafeCharacters(text: string): string {
  return text
    .replace(control_character_pattern, "")
    .replace(bidi_and_invisible_pattern, "");
}

function stripEmbeddedLinks(text: string): string {
  return text
    .replace(scheme_url_pattern, stripped_link_replacement)
    .replace(protocol_relative_url_pattern, stripped_link_replacement)
    .replace(www_url_pattern, stripped_link_replacement)
    .replace(executable_scheme_pattern, stripped_link_replacement)
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\s+([.,;:!?])/g, "$1")
    .trim();
}

function sanitiseTextValue(text: string): string {
  return stripEmbeddedLinks(removeUnsafeCharacters(text)).slice(
    0,
    maximum_string_length,
  );
}

function sanitiseKeyName(keyName: string): string {
  return removeUnsafeCharacters(keyName).slice(0, maximum_key_length);
}

function isPrivateHostname(hostname: string): boolean {
  if (hostname === "[::1]") return true;
  if (/^\[f[cd]/i.test(hostname)) return true; // unique local IPv6
  return private_hostname_patterns.some((pattern) => pattern.test(hostname));
}

export function sanitiseUrlValue(rawUrl: string): string | null {
  const trimmedUrl = removeUnsafeCharacters(rawUrl).trim();
  if (trimmedUrl.length === 0 || trimmedUrl.length > maximum_url_length) {
    return null;
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(trimmedUrl);
  } catch {
    return null;
  }

  if (!permitted_url_protocols.has(parsedUrl.protocol)) return null;
  if (parsedUrl.username !== "" || parsedUrl.password !== "") return null;
  if (isPrivateHostname(parsedUrl.hostname)) return null;

  return parsedUrl.toString();
}

export type SanitiseResult = {
  value: unknown;
  droppedNodeCount: number;
};

export function sanitiseJsonWithReport(input: unknown): SanitiseResult {
  let visitedNodeCount = 0;
  let droppedNodeCount = 0;

  const walkValue = (
    currentValue: unknown,
    currentDepth: number,
    parentKeyName?: string,
  ): unknown => {
    if (currentDepth > maximum_object_depth) {
      droppedNodeCount++;
      return null;
    }
    if (++visitedNodeCount > maximum_total_nodes) {
      droppedNodeCount++;
      return null;
    }
    if (currentValue === null) return null;

    switch (typeof currentValue) {
      case "string": {
        const isLinkField =
          parentKeyName !== undefined && link_field_names.has(parentKeyName);
        return isLinkField
          ? sanitiseUrlValue(currentValue)
          : sanitiseTextValue(currentValue);
      }
      case "number":
        return Number.isFinite(currentValue) ? currentValue : null;
      case "boolean":
        return currentValue;
      case "object":
        break;
      default:
        droppedNodeCount++;
        return null;
    }

    if (Array.isArray(currentValue)) {
      if (currentValue.length > maximum_array_elements) {
        droppedNodeCount += currentValue.length - maximum_array_elements;
      }
      return currentValue
        .slice(0, maximum_array_elements)
        .map((arrayElement) =>
          walkValue(arrayElement, currentDepth + 1, parentKeyName),
        );
    }

    const sanitisedObject: Record<string, unknown> = Object.create(null);
    let keptKeyCount = 0;

    for (const [propertyName, propertyValue] of Object.entries(
      currentValue as Record<string, unknown>,
    )) {
      if (prototype_pollution_keys.has(propertyName)) {
        droppedNodeCount++;
        continue;
      }
      if (++keptKeyCount > maximum_object_keys) {
        droppedNodeCount++;
        break;
      }
      sanitisedObject[sanitiseKeyName(propertyName)] = walkValue(
        propertyValue,
        currentDepth + 1,
        propertyName,
      );
    }

    return { ...sanitisedObject };
  };

  return { value: walkValue(input, 0), droppedNodeCount };
}

export function sanitiseJson(input: unknown): unknown {
  const { value, droppedNodeCount } = sanitiseJsonWithReport(input);
  if (droppedNodeCount > 0) {
    console.warn(`[sanitise] dropped ${droppedNodeCount} node(s) from payload`);
  }
  return value;
}