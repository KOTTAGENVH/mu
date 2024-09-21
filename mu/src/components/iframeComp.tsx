import React from "react";
import Iframe from "react-iframe";
import { useTheme } from "@/contextApi/iframContext";

function IframeComp() {
  const { scene } = useTheme();
  
  return (
    <div className="rouded-3xl h-96 ml-40 mt-10 mb-6 mr-6 w-2/5 h-full">
      {scene === 0 && (
        <Iframe
          url={
            process.env.NEXT_PUBLIC_IFRAME_0 ?? "https://www.nowenkottage.com/"
          }
          width="100%"
          height="100%"
          id="myId"
          display="initial"
          position="relative"
          allowFullScreen
          styles={{ borderRadius: "24px" }}
        />
      )}
      {scene === 1 && (
        <Iframe
          url={
            process.env.NEXT_PUBLIC_IFRAME_1 ?? "https://www.nowenkottage.com/"
          }
          width="100%"
          height="100%"
          id="myId"
          display="initial"
          position="relative"
          allowFullScreen
          styles={{ borderRadius: "24px" }}
        />
      )}
      {scene === 2 && (
        <Iframe
          url={
            process.env.NEXT_PUBLIC_IFRAME_2 ?? "https://www.nowenkottage.com/"
          }
          width="100%"
          height="100%"
          id="myId"
          display="initial"
          position="relative"
          allowFullScreen
          styles={{ borderRadius: "24px" }}
        />
      )}
      {scene === 3 && (
        <Iframe
          url={
            process.env.NEXT_PUBLIC_IFRAME_3 ?? "https://www.nowenkottage.com/"
          }
          width="100%"
          height="100%"
          id="myId"
          display="initial"
          position="relative"
          allowFullScreen
          styles={{ borderRadius: "24px" }}
        />
      )}
      {scene === 4 && (
        <Iframe
          url={
            process.env.NEXT_PUBLIC_IFRAME_4 ?? "https://www.nowenkottage.com/"
          }
          width="100%"
          height="100%"
          id="myId"
          display="initial"
          position="relative"
          allowFullScreen
          styles={{ borderRadius: "24px" }}
        />
      )}
      {scene === 5 && (
        <Iframe
          url={
            process.env.NEXT_PUBLIC_IFRAME_5 ?? "https://www.nowenkottage.com/"
          }
          width="100%"
          height="100%"
          id="myId"
          display="initial"
          position="relative"
          allowFullScreen
          styles={{ borderRadius: "24px" }}
        />
      )}
      {scene === 6 && (
        <Iframe
          url={
            process.env.NEXT_PUBLIC_IFRAME_6 ?? "https://www.nowenkottage.com/"
          }
          width="100%"
          height="100%"
          id="myId"
          display="initial"
          position="relative"
          allowFullScreen
          styles={{ borderRadius: "24px" }}
        />
      )}
      {scene === 7 && (
        <Iframe
          url={
            process.env.NEXT_PUBLIC_IFRAME_7 ?? "https://www.nowenkottage.com/"
          }
          width="100%"
          height="100%"
          id="myId"
          display="initial"
          position="relative"
          allowFullScreen
          styles={{ borderRadius: "24px" }}
        />
      )}
      {scene === 8 && (
        <Iframe
          url={
            process.env.NEXT_PUBLIC_IFRAME_8 ?? "https://www.nowenkottage.com/"
          }
          width="100%"
          height="100%"
          id="myId"
          display="initial"
          position="relative"
          allowFullScreen
          styles={{ borderRadius: "24px" }}
        />
      )}
    </div>
  );
}

export default IframeComp;
