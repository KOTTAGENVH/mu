export enum IpType {
  IPv4 = "IPv4",
  IPv6 = "IPv6",
  MappedIPv4 = "IPv4 (mapped IPv6)",
  Unknown = "unknown",
}

export type ParsedIp = {
  ip: string;
  type: IpType;
  valid: boolean;
};

const unknown: ParsedIp = {
  ip: "unknown",
  type: IpType.Unknown,
  valid: false,
};

const localhost: ParsedIp = {
  ip: "127.0.0.1",
  type: IpType.IPv4,
  valid: true,
};

const max_length = 45;

const ipv4_pattern =
  /^(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)$/;

const hex_group_pattern = /^[0-9a-f]{1,4}$/;

function toIpv6Groups(address: string): number[] | null {
  let text = address.toLowerCase();

  // Drop the zone index: fe80::1%eth0
  const zoneMark = text.indexOf("%");
  if (zoneMark !== -1) text = text.slice(0, zoneMark);

  if (text.length === 0 || text.length > max_length) return null;

  const lastColon = text.lastIndexOf(":");
  if (lastColon === -1) return null;

  // Rewrite an embedded IPv4 ending (2001:db8::192.0.2.1) as two hex groups
  const ending = text.slice(lastColon + 1);
  if (ending.includes(".")) {
    const match = ending.match(ipv4_pattern);
    if (!match) return null;

    const octets = [
      Number(match[1]),
      Number(match[2]),
      Number(match[3]),
      Number(match[4]),
    ];
    const high = ((octets[0] << 8) | octets[1]).toString(16);
    const low = ((octets[2] << 8) | octets[3]).toString(16);

    text = text.slice(0, lastColon + 1) + high + ":" + low;
  }

  const readGroups = (section: string): number[] | null => {
    if (section === "") return [];

    const groups: number[] = [];
    for (const group of section.split(":")) {
      if (!hex_group_pattern.test(group)) return null;
      groups.push(parseInt(group, 16));
    }
    return groups;
  };

  const sides = text.split("::");
  if (sides.length > 2) return null;

  if (sides.length === 2) {
    const before = readGroups(sides[0]);
    const after = readGroups(sides[1]);
    if (!before || !after) return null;

    const missing = 8 - before.length - after.length;
    if (missing < 1) return null;

    return [...before, ...new Array(missing).fill(0), ...after];
  }

  const groups = readGroups(text);
  if (!groups || groups.length !== 8) return null;
  return groups;
}

// Canonical /64 key. A single client normally controls a whole /64,
// so bucketing there stops trivial rotation inside one allocation.
function toIpv6Key(groups: number[]): string {
  const prefix = groups
    .slice(0, 4)
    .map((group) => group.toString(16).padStart(4, "0"))
    .join(":");
 
  return prefix + "::/64";
}

function toIpv4(groups: number[]): string {
  return [
    (groups[6] >> 8) & 0xff,
    groups[6] & 0xff,
    (groups[7] >> 8) & 0xff,
    groups[7] & 0xff,
  ].join(".");
}
 
function isMappedIpv4(groups: number[]): boolean {
  return (
    groups[0] === 0 &&
    groups[1] === 0 &&
    groups[2] === 0 &&
    groups[3] === 0 &&
    groups[4] === 0 &&
    groups[5] === 0xffff
  );
}
 

// Helper: normalize and detect IP type
export function parseIp(address: string | null | undefined): ParsedIp {
  if (typeof address !== "string") return unknown;
 
  const text = address.trim();
  if (text.length === 0 || text.length > max_length) return unknown;
 
  if (text === "::1" || text === "127.0.0.1") return localhost;
 
  if (ipv4_pattern.test(text)) {
    return { ip: text, type: IpType.IPv4, valid: true };
  }
 
  const groups = toIpv6Groups(text);
  if (!groups) return unknown;
 
  if (isMappedIpv4(groups)) {
    return { ip: toIpv4(groups), type: IpType.MappedIPv4, valid: true };
  }
 
  return { ip: toIpv6Key(groups), type: IpType.IPv6, valid: true };
}

//Get the IP address of the client by takung into account possible proxies
export async function getClientIp(req: Request): Promise<ParsedIp> {
  if (process.env.NODE_ENV !== "production") return localhost;
 
  // Preferred: a header your platform overwrites on every request
  const headerName = process.env.CLIENT_IP_HEADER;
  if (headerName) {
    const value = req.headers.get(headerName);
    if (value) return parseIp(value.split(",")[0]);
  }
 
  // Fallback: X-Forwarded-For, counted from the right
  const hops = Number(process.env.TRUSTED_PROXY_HOPS ?? 1);
  const forwarded = req.headers.get("x-forwarded-for");
  if (!forwarded || hops < 1) return unknown;
 
  const entries = forwarded
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
 
  const index = entries.length - hops;
  if (index < 0 || index >= entries.length) return unknown;
 
  return parseIp(entries[index]);
}
