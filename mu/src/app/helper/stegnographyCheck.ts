export function stegWavChecker(fileBuffer: Buffer) {
  //header check
  if (
    fileBuffer.toString("utf8", 0, 4) !== "RIFF" ||
    fileBuffer.toString("utf8", 8, 12) !== "WAVE"
  ) {
    return { safe: false, reason: "Invalid file header. Not a WAV file." };
  }

  //size check
  const statedSize = fileBuffer.readUInt32LE(4);
  const actualSize = fileBuffer.length;

  //check if the file has more data than stated in the header
  if (actualSize > statedSize + 8) {
    return {
      safe: false,
      reason: `Payload detected! File has ${actualSize - (statedSize + 8)} extra bytes appended.`,
    };
  }

  //chunk parsing to find 'data' chunk
  let offset = 12;
  let dataOffset = -1;
  let dataSize = 0;

  while (offset < fileBuffer.length) {
    const chunkId = fileBuffer.toString("utf8", offset, offset + 4);
    const chunkSize = fileBuffer.readUInt32LE(offset + 4);

    if (chunkId === "data") {
      dataOffset = offset + 8;
      dataSize = chunkSize;
      break;
    }

    offset += 8 + chunkSize;
  }

  if (dataOffset === -1) {
    return { safe: false, reason: "Corrupt WAV: No audio data found." };
  }

  // entropy analysis of LSBs in the audio data
  let ones = 0;
  let totalSamples = 0;

  for (let i = dataOffset; i < dataOffset + dataSize; i += 10) {
    const byte = fileBuffer[i];
    if ((byte & 1) === 1) ones++;
    totalSamples++;
  }

  const ratio = ones / totalSamples;
  // A ratio close to 0.5 suggests random data, which is suspicious for LSBs in audio.
  const isSuspiciousEntropy = ratio > 0.48 && ratio < 0.52;

  const cleanBuffer = Buffer.from(fileBuffer);

  for (let i = dataOffset; i < dataOffset + dataSize; i++) {
    cleanBuffer[i] = cleanBuffer[i] & 0xfe; // zero out the LSB to sanitize the file
  }

  return {
    safe: !isSuspiciousEntropy,
    warning: isSuspiciousEntropy
      ? "High LSB entropy detected (potential steganography)."
      : null,
    sanitizedBuffer: cleanBuffer,
  };
}

export function stegMP3Checker(fileBuffer: Buffer) {
  let startIndex = 0;
  let endIndex = fileBuffer.length;

  //   strip metadata
  if (fileBuffer.toString("utf8", 0, 3) === "ID3") {
    const b1 = fileBuffer[6];
    const b2 = fileBuffer[7];
    const b3 = fileBuffer[8];
    const b4 = fileBuffer[9];
    const id3Size = (b1 << 21) | (b2 << 14) | (b3 << 7) | b4; //sync safe integer
    startIndex = id3Size + 10;
  }

  // Check for ID3v1 tag at the end of the file
  if (
    fileBuffer.toString(
      "utf8",
      fileBuffer.length - 128,
      fileBuffer.length - 125,
    ) === "TAG"
  ) {
    endIndex = fileBuffer.length - 128;
  }

  // Extract the pure audio data between startIndex and endIndex
  let pureAudioBuffer = fileBuffer.slice(startIndex, endIndex);

  // check the first 11 bits (Frame Sync word) of the audio data to confirm it looks like valid MP3 frames and not corrupted
  if (pureAudioBuffer[0] !== 0xff || (pureAudioBuffer[1] & 0xe0) !== 0xe0) {
    return {
      safe: false,
      reason:
        "Invalid MP3 structure. Could not find audio frames after stripping metadata.",
    };
  }

  return {
    safe: true,
    sanitizedBuffer: pureAudioBuffer,
  };
}
