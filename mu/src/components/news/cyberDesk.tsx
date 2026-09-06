"use client";
import React, { useState } from "react";
import { Building2, Gauge, ScanSearch } from "lucide-react";
import { inter } from "@/app/fonts";
import { TabBar } from "./tabBar";
import VulnStats from "./vulnStats";
import VulnFeed from "./vulnFeed";
import VendorWatch from "./vendorWatch";
import CveLookup from "./cveLookup";

type Desk = "overview" | "lookup" | "vendors";

const desks: Array<{ key: Desk; label: string; icon: React.ReactNode }> = [
  { key: "overview", label: "Overview", icon: <Gauge className="w-4 h-4" /> },
  {
    key: "lookup",
    label: "CVE lookup",
    icon: <ScanSearch className="w-4 h-4" />,
  },
  {
    key: "vendors",
    label: "Vendor watch",
    icon: <Building2 className="w-4 h-4" />,
  },
];

function CyberDesk() {
  const [desk, setDesk] = useState<Desk>("overview");

  return (
    <section className="mt-6">
      <h2
        className={`${inter.className} text-lg font-semibold text-black dark:text-white`}
      >
        Cyber desk
      </h2>

      <div className="mt-4">
        <TabBar
          items={desks}
          active={desk}
          onSelect={setDesk}
          ariaLabel="Cyber desk section"
          idPrefix="cyber"
        />
      </div>

      <div
        role="tabpanel"
        id="cyber-panel-overview"
        aria-labelledby="cyber-tab-overview"
        hidden={desk !== "overview"}
        className="mt-5"
      >
        <VulnStats />
        <div className="mt-6">
          <VulnFeed />
        </div>
      </div>
      <div
        role="tabpanel"
        id="cyber-panel-lookup"
        aria-labelledby="cyber-tab-lookup"
        hidden={desk !== "lookup"}
        className="mt-5"
      >
        <CveLookup />
      </div>
      <div
        role="tabpanel"
        id="cyber-panel-vendors"
        aria-labelledby="cyber-tab-vendors"
        hidden={desk !== "vendors"}
      >
        <VendorWatch />
      </div>
    </section>
  );
}

export default CyberDesk;
