import React from "react";
import { motion } from "framer-motion";
import { Card } from "./btnCard";
import { GitHubContent } from "./githubContent";
import { CoffeeContent } from "./coffeeContent";

function SourceAndSupport() {
  return (
    <>
      <style>{`
        @keyframes steam {
          0%   { transform: translateY(0) scaleX(1);   opacity: 0.6; }
          50%  { transform: translateY(-8px) scaleX(1.3); opacity: 0.3; }
          100% { transform: translateY(-16px) scaleX(0.8); opacity: 0; }
        }
        @keyframes grain {
          0%, 100% { transform: translate(0,0); }
          10%  { transform: translate(-2%,-3%); }
          30%  { transform: translate(3%, 2%); }
          50%  { transform: translate(-1%, 4%); }
          70%  { transform: translate(2%,-2%); }
          90%  { transform: translate(-3%, 1%); }
        }
        .steam-particle { animation: steam 1.8s ease-in infinite; }
        .steam-particle:nth-child(2) { animation-delay: 0.6s; }
        .steam-particle:nth-child(3) { animation-delay: 1.2s; }
      `}</style>

      <div
        id="source"
        className="flex h-auto w-full items-center justify-center bg-transparent p-6 md:p-10"
      >
        <div
          style={{
            width: "100%",
            maxWidth: "860px",
            display: "flex",
            flexDirection: "column",
            gap: "0",
          }}
        >
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            style={{
              fontFamily: '"DM Mono", monospace',
              fontSize: "10px",
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.2)",
              marginBottom: "20px",
              paddingTop: "2px",
            }}
          >
            Links
          </motion.p>
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            style={{
              height: "1px",
              background: "rgba(255,255,255,0.08)",
              transformOrigin: "left",
              marginBottom: "2px",
            }}
          />
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Card href="https://github.com/KOTTAGENVH/mu" delay={0.1}>
              <GitHubContent />
            </Card>
            <Card href="https://www.nowenkottage.com/mu?page=1" delay={0.2}>
              <CoffeeContent />
            </Card>
          </div>
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={{
              height: "1px",
              background: "rgba(255,255,255,0.08)",
              transformOrigin: "right",
              marginTop: "2px",
            }}
          />
        </div>
      </div>
    </>
  );
}

export default SourceAndSupport;
