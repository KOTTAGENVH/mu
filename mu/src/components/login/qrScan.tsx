import React, { useEffect, useState } from "react";
import { inter, roboto } from "../../app/fonts";
import Image from "next/image";
import { motion } from "framer-motion";
import { generateQR } from "../../helper/qr";
import { QrCode, KeyRound, Copy, Check } from "lucide-react";

interface QrScanProps {
  url: string;
  secret: string;
  handleSetToken: (value: boolean) => void;
}

function QrScan({ url, secret, handleSetToken }: QrScanProps) {
  const [isLoading, setLoading] = useState(false);
  const [qrMatrix, setQrMatrix] = useState<number[][]>([]);
  const [isQrScan, setQrScan] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const moduleSize = 6; // Each QR code module is 12px x 12px
  const quietZone = 3 * moduleSize; // white border around the QR code (4 modules + 2 for padding)
  const size = qrMatrix.length * moduleSize; // Total size of the QR code (without quiet zone)

  useEffect(() => {
    const matrix = generateQR(url);
    setQrMatrix(matrix);
  }, [url]);

  const handleQRSecretClick = (scan: boolean) => {
    setQrScan(scan);
  };

  const handleVerifyClick = () => {
    setLoading(true);
    setTimeout(() => {
      handleSetToken(true);
      setLoading(false);
    }, 500);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(secret);
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 3000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="flex flex-col items-center text-center mb-8 w-full max-w-2xl bg-gray-100/60 dark:bg-gray-800/60 rounded-2xl p-8"
    >
      <Image
        src="/mu.png"
        alt="MU"
        width={98}
        height={98}
        className="mx-auto p-2 w-20 h-24 md:w-32 md:h-32 rounded-full object-cover transition-colors"
        priority
        draggable={false}
      />
      <h1
        className={`${inter.className} text-3xl md:text-4xl lg:text-5xl text-black dark:text-white mb-4 leading-tight`}
      >
        Welcome to{" "}
        <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          MU
        </span>
      </h1>
      <div className="inline-flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-full mb-4 border border-gray-200 dark:border-gray-700 shadow-inner mb-2">
        <button
          type="button"
          onClick={() => handleQRSecretClick(true)}
          disabled={isLoading}
          className={`
      group relative flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium
      text-gray-600 dark:text-gray-400
      hover:text-gray-900 dark:hover:text-white
      hover:bg-white dark:hover:bg-gray-700
      hover:shadow-sm
       ${isQrScan ? "opacity-40 cursor-not-allowed pointer-events-none" : "cursor-pointer"}
      ${isLoading ? "opacity-40 cursor-not-allowed pointer-events-none" : "cursor-pointer"}
    `}
        >
          <QrCode
            size={16}
            className="transition-transform duration-200 group-hover:scale-110"
          />
          <span>QR Scan</span>
        </button>

        <button
          type="button"
          onClick={() => handleQRSecretClick(false)}
          disabled={isLoading}
          className={`
      group relative flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium
      text-gray-600 dark:text-gray-400
      hover:text-gray-900 dark:hover:text-white
      hover:bg-white dark:hover:bg-gray-700
      hover:shadow-sm
      ${isQrScan ? "cursor-pointer" : "opacity-40 cursor-not-allowed pointer-events-none"}
      ${isLoading ? "opacity-40 cursor-not-allowed pointer-events-none" : "cursor-pointer"}
    `}
        >
          <KeyRound
            size={16}
            className="transition-transform duration-200 group-hover:scale-110"
          />
          <span>Secret Key</span>
        </button>
      </div>
      {isQrScan ? (
        <>
          <p
            className={`${roboto.className} w-full text-left text-base md:text-lg text-black dark:text-gray-400 leading-relaxed`}
          >
            Please scan the QR code with your authenticator app and click
            &quot;Verify Token&quot; to proceed.
          </p>
          {qrMatrix.length > 0 && (
            <div className="flex justify-center p-5 bg-transparent  mb-6  w-full">
              <svg
                width={size + quietZone * 2}
                height={size + quietZone * 2}
                viewBox={`0 0 ${size + quietZone * 2} ${size + quietZone * 2}`}
                className="bg-white rounded-lg shadow-lg max-w-full h-auto"
              >
                <rect
                  x={0}
                  y={0}
                  width={size + quietZone * 2}
                  height={size + quietZone * 2}
                  fill="white"
                />

                {qrMatrix.map((row, r) =>
                  row.map((cell, c) =>
                    cell === 1 ? (
                      <rect
                        key={`${r}-${c}`}
                        x={quietZone + c * moduleSize}
                        y={quietZone + r * moduleSize}
                        width={moduleSize}
                        height={moduleSize}
                        fill="black"
                      />
                    ) : null,
                  ),
                )}
              </svg>
            </div>
          )}
        </>
      ) : (
        <>
          <p
            className={`${roboto.className} w-full text-left text-base md:text-lg text-black dark:text-gray-400 leading-relaxed`}
          >
            Please copy the secret key and enter it in your authenticator app.
          </p>
          <div className="flex items-center justify-between w-full bg-gray-200 dark:bg-gray-700 rounded-lg p-4 mt-4 mb-6">
            <span
              className={`${roboto.className} text-sm md:text-base text-gray-800 dark:text-gray-200 break-all`}
            >
              {secret}
            </span>
            <button
              onClick={handleCopy}
              className={`ml-4 px-3 py-1 rounded-full text-sm font-medium
                text-gray-600 dark:text-gray-400
                hover:text-gray-900 dark:hover:text-white
                hover:bg-white dark:hover:bg-gray-700
                hover:shadow-sm
                `}
            >
              {isCopied ? (
                <Check
                  size={16}
                  className="transition-transform duration-200 text-green-500 scale-110"
                />
              ) : (
                <Copy
                  size={16}
                  className="transition-transform duration-200 group-hover:scale-110"
                />
              )}
            </button>
          </div>
        </>
      )}
      <button
        type="submit"
        onClick={() => {
          handleVerifyClick();
        }}
        disabled={isLoading}
        className={`
          w-auto flex items-center justify-center gap-2
          text-black dark:text-white mt-6 mb-4 px-6 py-3
          rounded-full bg-gray-300 dark:bg-gray-700
          hover:bg-green-400 dark:hover:bg-gray-600
          text-sm font-medium ${
            isLoading ? "opacity-50 cursor-not-allowed" : ""
          }`}
      >
        Enter Token
      </button>
    </motion.div>
  );
}

export default QrScan;
