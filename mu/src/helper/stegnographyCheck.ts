export function stegWavChecker(fileBuffer: Buffer) {
  if (fileBuffer.length < 44) {
    return { safe: false, reason: "File is too small to be a valid WAV." };
  }

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

  while (offset + 8 <= fileBuffer.length) {
    const chunkId = fileBuffer.toString("utf8", offset, offset + 4);
    const chunkSize = fileBuffer.readUInt32LE(offset + 4);

    if (chunkId === "data") {
      dataOffset = offset + 8;
      dataSize = Math.min(chunkSize, fileBuffer.length - dataOffset);
      break;
    }

    offset += 8 + chunkSize + (chunkSize % 2);
  }

  if (dataOffset === -1) {
    return { safe: false, reason: "Corrupt WAV: No audio data found." };
  }

  // entropy analysis of LSBs in the audio data
  // Sample a fixed number of points rather than scaling with file length,
  // a 2-hour WAV would otherwise block the event loop for millions of reads.
  const sampleStep = Math.max(10, Math.floor(dataSize / 100_000));
  let ones = 0;
  let totalSamples = 0;

  for (let i = dataOffset; i < dataOffset + dataSize; i += sampleStep) {
    if ((fileBuffer[i] & 1) === 1) ones++;
    totalSamples++;
  }

  const ratio = totalSamples > 0 ? ones / totalSamples : 0;
  const isSuspiciousEntropy = totalSamples > 0 && ratio > 0.48 && ratio < 0.52;

  const cleanBuffer = Buffer.from(fileBuffer);

  for (let i = dataOffset; i < dataOffset + dataSize; i++) {
    cleanBuffer[i] = cleanBuffer[i] & 0xfe; // zero the LSB
  }

  return {
    // Zeroing the LSBs already destroys any payload hidden there, so high
    // entropy is logged rather than treated as fatal, clean 16-bit PCM sits
    // near 0.5 anyway and would otherwise be rejected constantly.
    safe: true,
    warning: isSuspiciousEntropy
      ? "High LSB entropy detected (potential steganography)."
      : null,
    sanitizedBuffer: cleanBuffer,
  };
}

export function stegMP3Checker(fileBuffer: Buffer) {
  if (fileBuffer.length < 10) {
    return { safe: false, reason: "File is too small to be a valid MP3." };
  }

  let startIndex = 0;
  let endIndex = fileBuffer.length;

  if (fileBuffer.toString("utf8", 0, 3) === "ID3") {
    const id3Size =
      (fileBuffer[6] << 21) |
      (fileBuffer[7] << 14) |
      (fileBuffer[8] << 7) |
      fileBuffer[9];
    startIndex = id3Size + 10;
    // A corrupt or hostile tag size can point past the end of the file.
    if (startIndex >= fileBuffer.length) {
      return { safe: false, reason: "Invalid MP3: metadata size exceeds file." };
    }
  }

  // ID3v1 is a fixed 128-byte trailer; only look for it if the file is that long.
  if (
    fileBuffer.length >= startIndex + 128 &&
    fileBuffer.toString("utf8", fileBuffer.length - 128, fileBuffer.length - 125) === "TAG"
  ) {
    endIndex = fileBuffer.length - 128;
  }

  if (endIndex - startIndex < 4) {
    return { safe: false, reason: "Invalid MP3: no audio data found." };
  }

  const pureAudioBuffer = fileBuffer.subarray(startIndex, endIndex);

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
