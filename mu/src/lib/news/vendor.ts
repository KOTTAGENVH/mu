export interface VendorEntry {
  label: string;
  query: string;
  group: VendorGroup;
}

export const vendor_groups = [
  "Cloud & platform",
  "Silicon",
  "Devices & cameras",
  "Software & AI",
] as const;

export type VendorGroup = (typeof vendor_groups)[number];

export const vendors: VendorEntry[] = [
  // Cloud & platform
  { label: "Microsoft / Azure", query: "microsoft", group: "Cloud & platform" },
  { label: "AWS", query: "amazon", group: "Cloud & platform" },
  { label: "Google", query: "google", group: "Cloud & platform" },
  { label: "Cloudflare", query: "cloudflare", group: "Cloud & platform" },
  { label: "Vercel", query: "vercel", group: "Cloud & platform" },
  { label: "Koyeb", query: "koyeb", group: "Cloud & platform" },
  { label: "RunPod", query: "runpod", group: "Cloud & platform" },
  { label: "Zoho", query: "zoho", group: "Cloud & platform" },
  { label: "Starlink / SpaceX", query: "spacex", group: "Cloud & platform" },
  {
    label: "AliExpress / Alibaba",
    query: "alibaba",
    group: "Cloud & platform",
  },

  // Silicon
  { label: "Intel", query: "intel", group: "Silicon" },
  { label: "AMD", query: "amd", group: "Silicon" },
  { label: "NVIDIA", query: "nvidia", group: "Silicon" },
  { label: "ARM", query: "arm", group: "Silicon" },
  { label: "Qualcomm", query: "qualcomm", group: "Silicon" },
  { label: "Broadcom", query: "broadcom", group: "Silicon" },

  // Devices & cameras
  { label: "Apple", query: "apple", group: "Devices & cameras" },
  { label: "Samsung", query: "samsung", group: "Devices & cameras" },
  { label: "Hikvision", query: "hikvision", group: "Devices & cameras" },
  { label: "EZVIZ", query: "ezviz", group: "Devices & cameras" },
  { label: "Dahua", query: "dahua", group: "Devices & cameras" },
  { label: "ASUS", query: "asus", group: "Devices & cameras" },
  { label: "MSI", query: "msi", group: "Devices & cameras" },
  { label: "TP-Link", query: "tp-link", group: "Devices & cameras" },
  { label: "Yubico", query: "yubico", group: "Devices & cameras" },
  { label: "Solis / Ginlong", query: "solis", group: "Devices & cameras" },
  { label: "BYD", query: "byd", group: "Devices & cameras" },

  // Software & AI
  { label: "Anthropic / Claude", query: "anthropic", group: "Software & AI" },
  { label: "OpenAI", query: "openai", group: "Software & AI" },
  { label: "Cisco", query: "cisco", group: "Software & AI" },
  { label: "Fortinet", query: "fortinet", group: "Software & AI" },
  { label: "Ivanti", query: "ivanti", group: "Software & AI" },
  { label: "Atlassian", query: "atlassian", group: "Software & AI" },
  { label: "VMware", query: "vmware", group: "Software & AI" },
  { label: "Oracle", query: "oracle", group: "Software & AI" },
];

export const vendorsInGroup = (group: VendorGroup): VendorEntry[] =>
  vendors.filter((v) => v.group === group);
