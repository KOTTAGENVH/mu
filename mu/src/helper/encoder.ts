import { ReedSolomon } from "./reedSoloman";

export class QRCodeEncoder {
  private rs = new ReedSolomon();
  private readonly mode_byte = 0b0100; // Byte mode
  private functionModules: boolean[][] = [];

  private readonly version_info: Record<
    number,
    {
      totalData: number;
      eccPerBlock: number;
      groups: { blocks: number; dataPerBlock: number }[];
    }
  > = {
    1: {
      totalData: 16,
      eccPerBlock: 10,
      groups: [{ blocks: 1, dataPerBlock: 16 }],
    },
    2: {
      totalData: 28,
      eccPerBlock: 16,
      groups: [{ blocks: 1, dataPerBlock: 28 }],
    },
    3: {
      totalData: 44,
      eccPerBlock: 26,
      groups: [{ blocks: 1, dataPerBlock: 44 }],
    },
    4: {
      totalData: 64,
      eccPerBlock: 18,
      groups: [{ blocks: 2, dataPerBlock: 32 }],
    },
    5: {
      totalData: 86,
      eccPerBlock: 24,
      groups: [{ blocks: 2, dataPerBlock: 43 }],
    },
    6: {
      totalData: 108,
      eccPerBlock: 16,
      groups: [{ blocks: 4, dataPerBlock: 27 }],
    },
    7: {
      totalData: 124,
      eccPerBlock: 18,
      groups: [
        { blocks: 2, dataPerBlock: 31 },
        { blocks: 2, dataPerBlock: 31 },
      ],
    },
    8: {
      totalData: 154,
      eccPerBlock: 22,
      groups: [
        { blocks: 2, dataPerBlock: 38 },
        { blocks: 2, dataPerBlock: 39 },
      ],
    },
    9: {
      totalData: 182,
      eccPerBlock: 22,
      groups: [
        { blocks: 3, dataPerBlock: 36 },
        { blocks: 2, dataPerBlock: 37 },
      ],
    },
    10: {
      totalData: 216,
      eccPerBlock: 26,
      groups: [
        { blocks: 4, dataPerBlock: 43 },
        { blocks: 1, dataPerBlock: 44 },
      ],
    },
  };

  private readonly alignment_patterns: { [key: number]: number[] } = {
    2: [6, 18],
    3: [6, 22],
    4: [6, 26],
    5: [6, 30],
    6: [6, 34],
    7: [6, 22, 38],
    8: [6, 24, 42],
    9: [6, 26, 46],
    10: [6, 28, 50],
  };

  encode(text: string): number[][] {
    const mode = this.mode_byte;

    const requiredBits = 4 + 8 + text.length * 8 + 4;
    const requiredBytes = Math.ceil(requiredBits / 8);

    const version = this.findVersion(requiredBytes);
    const size = 21 + (version - 1) * 4;

    // Get version info with block structure
    const info = this.version_info[version];

    // Encode data
    const data = this.encodeData(text, mode, version, info.totalData);

    // Apply Reed Solomon with block interleaving
    const rsEncoded = this.encodeAndInterleave(data, version);

    // Create matrix
    const matrix = this.createMatrix(size);

    // Add patterns
    this.addFinderPatterns(matrix);
    this.addAlignmentPatterns(matrix, version);
    this.addTimingPatterns(matrix);
    this.addDarkModule(matrix, version);
    this.reserveFormatAreas(matrix);
    this.addVersionInfo(matrix, version);

    // Add data
    this.addData(matrix, rsEncoded);

    this.finalizeDataCells(matrix);

    // Choose best mask (0-7) by penalty scoring
    const { mask: maskPattern, maskedMatrix } = this.chooseBestMask(matrix);

    // Copy best-masked matrix back
    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix.length; c++) {
        matrix[r][c] = maskedMatrix[r][c];
      }
    }

    this.addFormatInfo(matrix, "M", maskPattern);

    return matrix;
  }

  private finalizeDataCells(matrix: number[][]): void {
    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix.length; c++) {
        // Convert any remaining -1 or -2 cells to 0
        // -2 cells are format areas that will be filled later
        // but need to be 0 for penalty calculation
        if (matrix[r][c] < 0) {
          matrix[r][c] = 0;
        }
      }
    }
  }

  //Version verification based on required data bytes
  private findVersion(requiredBytes: number): number {
    for (let v = 1; v <= 10; v++) {
      const info = this.version_info[v];
      if (info.totalData >= requiredBytes) {
        return v;
      }
    }
    console.warn("Data too large, using max version 10");
    return 10;
  }

  private encodeAndInterleave(data: number[], version: number): number[] {
    const info = this.version_info[version];

    // Split data into blocks
    const dataBlocks: number[][] = [];
    let offset = 0;
    for (const group of info.groups) {
      for (let b = 0; b < group.blocks; b++) {
        const block = data.slice(offset, offset + group.dataPerBlock);
        dataBlocks.push(block);
        // console.log(`  Block ${dataBlocks.length}: ${block.length} bytes`);
        offset += group.dataPerBlock;
      }
    }

    // RS encode each block and collect ECC
    const eccBlocks: number[][] = [];
    for (let i = 0; i < dataBlocks.length; i++) {
      const block = dataBlocks[i];
      const encoded = this.rs.encode(block, info.eccPerBlock);
      const ecc = encoded.slice(block.length);
      eccBlocks.push(ecc);
    }

    // Interleave data codewords
    const result: number[] = [];
    const maxDataPerBlock = Math.max(...dataBlocks.map((b) => b.length));

    for (let i = 0; i < maxDataPerBlock; i++) {
      for (const block of dataBlocks) {
        if (i < block.length) {
          result.push(block[i]);
        }
      }
    }

    // Interleave ECC codewords
    // const eccStart = result.length;
    for (let i = 0; i < info.eccPerBlock; i++) {
      for (const block of eccBlocks) {
        result.push(block[i]);
      }
    }

    return result;
  }

  private encodeData(
    text: string,
    mode: number,
    version: number,
    dataCodewords: number,
  ): number[] {
    const bits: number[] = [];

    // Mode indicator (4 bits)
    this.addBits(bits, mode, 4);

    // Character count
    const countBits = version < 10 ? 8 : 16;
    this.addBits(bits, text.length, countBits);

    // Data - log first few characters
    // const startLen = bits.length;
    for (let i = 0; i < text.length; i++) {
      this.addBits(bits, text.charCodeAt(i), 8);
    }

    const remainingBits = dataCodewords * 8 - bits.length;
    const terminatorLength = Math.min(4, remainingBits);
    if (terminatorLength > 0) {
      this.addBits(bits, 0, terminatorLength);
    }

    while (bits.length % 8 !== 0) {
      bits.push(0);
    }

    const bytes: number[] = [];
    for (let i = 0; i < bits.length; i += 8) {
      bytes.push(this.bitsToInt(bits.slice(i, i + 8)));
    }

    const padBytes = [236, 17];
    let padIndex = 0;

    while (bytes.length < dataCodewords) {
      bytes.push(padBytes[padIndex % 2]); // Always starts 236 then 17...
      padIndex++;
    }

    // console.log("Final data codewords (first 10):", bytes.slice(0, 10));

    return bytes.slice(0, dataCodewords);
  }

  // Helper to add bits to the bit array
  private addBits(bits: number[], value: number, count: number): void {
    for (let i = count - 1; i >= 0; i--) {
      bits.push((value >> i) & 1);
    }
  }

  // Convert an array of bits (0s and 1s) to an integer
  private bitsToInt(bits: number[]): number {
    let result = 0;
    for (let i = 0; i < bits.length; i++) {
      result = (result << 1) | bits[i];
    }
    return result;
  }

  private createMatrix(size: number): number[][] {
    this.functionModules = Array(size)
      .fill(null)
      .map(() => Array(size).fill(false));
    return Array(size)
      .fill(null)
      .map(() => Array(size).fill(-1));
  }

  private setFunctionModule(
    matrix: number[][],
    row: number,
    col: number,
    value: number,
  ): void {
    matrix[row][col] = value;
    this.functionModules[row][col] = true;
  }

  // Draws the 3 large finder patterns in the corners
  private addFinderPatterns(matrix: number[][]): void {
    const size = matrix.length;

    const drawFinder = (row: number, col: number) => {
      for (let r = -1; r <= 7; r++) {
        for (let c = -1; c <= 7; c++) {
          const rr = row + r;
          const cc = col + c;
          if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue;

          if (r === -1 || r === 7 || c === -1 || c === 7) {
            this.setFunctionModule(matrix, rr, cc, 0);
          } else if (r === 0 || r === 6 || c === 0 || c === 6) {
            this.setFunctionModule(matrix, rr, cc, 1);
          } else if (r === 1 || r === 5 || c === 1 || c === 5) {
            this.setFunctionModule(matrix, rr, cc, 0);
          } else {
            this.setFunctionModule(matrix, rr, cc, 1);
          }
        }
      }
    };

    drawFinder(0, 0);
    drawFinder(size - 7, 0);
    drawFinder(0, size - 7);
  }

  private addAlignmentPatterns(matrix: number[][], version: number): void {
    if (version === 1) return;

    const positions = this.alignment_patterns[version];
    if (!positions) return;

    const size = matrix.length;

    for (const row of positions) {
      for (const col of positions) {
        // Skip if overlaps with finder patterns
        if (
          (row < 10 && col < 10) ||
          (row < 10 && col > size - 10) ||
          (row > size - 10 && col < 10)
        ) {
          continue;
        }

        // Draw 5x5 alignment pattern
        for (let r = -2; r <= 2; r++) {
          for (let c = -2; c <= 2; c++) {
            const rr = row + r;
            const cc = col + c;

            if (rr >= 0 && rr < size && cc >= 0 && cc < size) {
              const isEdge = Math.abs(r) === 2 || Math.abs(c) === 2;
              const isCenter = r === 0 && c === 0;
              this.setFunctionModule(
                matrix,
                rr,
                cc,
                isEdge || isCenter ? 1 : 0,
              );
            }
          }
        }
      }
    }
  }

  //Draws a horizontal and vertical "dotted line"
  private addTimingPatterns(matrix: number[][]): void {
    for (let i = 8; i < matrix.length - 8; i++) {
      if (matrix[6][i] === -1) {
        this.setFunctionModule(matrix, 6, i, i % 2 === 0 ? 1 : 0);
      }
      if (matrix[i][6] === -1) {
        this.setFunctionModule(matrix, i, 6, i % 2 === 0 ? 1 : 0);
      }
    }
  }

  // Draws the fixed dark module
  private addDarkModule(matrix: number[][], version: number): void {
    this.setFunctionModule(matrix, 4 * version + 9, 8, 1);
  }

  private reserveFormatAreas(matrix: number[][]): void {
    const size = matrix.length;
    for (let i = 0; i < 9; i++) {
      if (matrix[8][i] === -1) this.setFunctionModule(matrix, 8, i, -2);
      if (matrix[i][8] === -1) this.setFunctionModule(matrix, i, 8, -2);
    }
    for (let i = 0; i < 8; i++) {
      if (matrix[8][size - 1 - i] === -1)
        this.setFunctionModule(matrix, 8, size - 1 - i, -2);
      if (matrix[size - 1 - i][8] === -1)
        this.setFunctionModule(matrix, size - 1 - i, 8, -2);
    }
  }

  //Adding v info on >V7 helps scanner to identify quick
  private addVersionInfo(matrix: number[][], version: number): void {
    if (version < 7) return; // Version info only for v7 and above

    let bits = version << 12;
    const generator = 0x1f25;
    for (let i = 11; i >= 0; i--) {
      if ((bits >> (i + 12)) & 1) {
        bits ^= generator << i;
      }
    }
    const versionBits = (version << 12) | (bits & 0xfff);
    const size = matrix.length;

    for (let i = 0; i < 18; i++) {
      const bit = (versionBits >> i) & 1;
      const a = size - 11 + (i % 3);
      const b = Math.floor(i / 3);

      this.setFunctionModule(matrix, b, a, bit);
      this.setFunctionModule(matrix, a, b, bit);
    }
  }

  //Zig Zag Navigator
  private addData(matrix: number[][], data: number[]): void {
    const bits: number[] = [];
    for (const byte of data) {
      for (let i = 7; i >= 0; i--) {
        bits.push((byte >> i) & 1);
      }
    }

    let bitIndex = 0;
    let direction = -1;
    let col = matrix.length - 1;

    while (col >= 0) {
      if (col === 6) col--;

      for (let i = 0; i < matrix.length; i++) {
        const row = direction === -1 ? matrix.length - 1 - i : i;

        for (let c = 0; c < 2; c++) {
          const currentCol = col - c;

          if (currentCol < 0) continue;

          if (matrix[row][currentCol] === -1) {
            matrix[row][currentCol] =
              bitIndex < bits.length ? bits[bitIndex++] : 0;
          }
        }
      }

      col -= 2;
      direction *= -1;
    }
  }

  private getMaskPattern(mask: number, row: number, col: number): boolean {
    switch (mask) {
      case 0:
        return (row + col) % 2 === 0;
      case 1:
        return row % 2 === 0;
      case 2:
        return col % 3 === 0;
      case 3:
        return (row + col) % 3 === 0;
      case 4:
        return (Math.floor(row / 2) + Math.floor(col / 3)) % 2 === 0;
      case 5:
        return ((row * col) % 2) + ((row * col) % 3) === 0;
      case 6:
        return (((row * col) % 2) + ((row * col) % 3)) % 2 === 0;
      case 7:
        return (((row + col) % 2) + ((row * col) % 3)) % 2 === 0;
      default:
        return false;
    }
  }

  private applyMask(matrix: number[][], mask: number): void {
    for (let row = 0; row < matrix.length; row++) {
      for (let col = 0; col < matrix.length; col++) {
        if (
          !this.functionModules[row][col] &&
          (matrix[row][col] === 0 || matrix[row][col] === 1)
        ) {
          if (this.getMaskPattern(mask, row, col)) {
            matrix[row][col] ^= 1;
          }
        }
      }
    }
  }

  // Deep clone a 2D matrix to test different masks without modifying the original
  private cloneMatrix(matrix: number[][]): number[][] {
    return matrix.map((row) => [...row]);
  }

  private chooseBestMask(matrix: number[][]): {
    mask: number;
    maskedMatrix: number[][];
  } {
    let bestMask = 0;
    let bestScore = Number.POSITIVE_INFINITY;
    let bestMatrix = matrix;

    for (let mask = 0; mask <= 7; mask++) {
      const candidate = this.cloneMatrix(matrix);
      this.applyMask(candidate, mask);
      const score = this.calculatePenalty(candidate);
      if (score < bestScore) {
        bestScore = score;
        bestMask = mask;
        bestMatrix = candidate;
      }
    }

    return { mask: bestMask, maskedMatrix: bestMatrix };
  }

  private calculatePenalty(matrix: number[][]): number {
    return (
      this.penaltyRule1(matrix) +
      this.penaltyRule2(matrix) +
      this.penaltyRule3(matrix) +
      this.penaltyRule4(matrix)
    );
  }

  //Penalty rules
  //No Long Streaks
  private penaltyRule1(matrix: number[][]): number {
    let penalty = 0;
    const size = matrix.length;

    const countRuns = (line: number[]): number => {
      let score = 0;
      let runColor = line[0];
      let runLength = 1;

      for (let i = 1; i < line.length; i++) {
        if (line[i] === runColor) {
          runLength++;
        } else {
          if (runLength >= 5) {
            score += 3 + (runLength - 5);
          }
          runColor = line[i];
          runLength = 1;
        }
      }
      if (runLength >= 5) {
        score += 3 + (runLength - 5);
      }
      return score;
    };

    for (let r = 0; r < size; r++) {
      penalty += countRuns(matrix[r]);
    }
    for (let c = 0; c < size; c++) {
      const col: number[] = [];
      for (let r = 0; r < size; r++) col.push(matrix[r][c]);
      penalty += countRuns(col);
    }

    return penalty;
  }

  //No 2x2 blocks of same color
  private penaltyRule2(matrix: number[][]): number {
    let penalty = 0;
    const size = matrix.length;
    for (let r = 0; r < size - 1; r++) {
      for (let c = 0; c < size - 1; c++) {
        const color = matrix[r][c];
        if (
          color === matrix[r][c + 1] &&
          color === matrix[r + 1][c] &&
          color === matrix[r + 1][c + 1]
        ) {
          penalty += 3;
        }
      }
    }
    return penalty;
  }

  //No patterns that look like finder patterns in the wrong places
  private penaltyRule3(matrix: number[][]): number {
    let penalty = 0;
    const size = matrix.length;
    const pattern1 = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0];
    const pattern2 = [0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1];

    const checkLine = (line: number[]): void => {
      for (let i = 0; i <= line.length - 11; i++) {
        let match1 = true;
        let match2 = true;
        for (let j = 0; j < 11; j++) {
          if (line[i + j] !== pattern1[j]) match1 = false;
          if (line[i + j] !== pattern2[j]) match2 = false;
          if (!match1 && !match2) break;
        }
        if (match1) penalty += 40;
        if (match2) penalty += 40;
      }
    };

    for (let r = 0; r < size; r++) checkLine(matrix[r]);
    for (let c = 0; c < size; c++) {
      const col: number[] = [];
      for (let r = 0; r < size; r++) col.push(matrix[r][c]);
      checkLine(col);
    }

    return penalty;
  }

  //Balance of dark and light modules
  private penaltyRule4(matrix: number[][]): number {
    const size = matrix.length;
    let darkCount = 0;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (matrix[r][c] === 1) darkCount++;
      }
    }
    const total = size * size;
    const percent = (darkCount * 100) / total;
    const fivePercentSteps = Math.abs(percent - 50) / 5;
    return Math.floor(fivePercentSteps) * 10;
  }

  private addFormatInfo(matrix: number[][], ecc: string, mask: number): void {
    const eccBits = { L: 0b01, M: 0b00, Q: 0b11, H: 0b10 }[ecc] || 0b00;
    const formatData = (eccBits << 3) | mask;

    // Calculate BCH code for format info
    let remainder = formatData << 10;
    for (let i = 4; i >= 0; i--) {
      if ((remainder >> (i + 10)) & 1) {
        remainder ^= 0x537 << i;
      }
    }

    // Combine format data and BCH code, then apply mask 0x5412
    const format = ((formatData << 10) | remainder) ^ 0x5412;
    const size = matrix.length;

    // Place format bits in the reserved areas
    // Top-left horizontal (row 8, cols 0-8 except 6)
    this.setFunctionModule(matrix, 8, 0, (format >> 14) & 1);
    this.setFunctionModule(matrix, 8, 1, (format >> 13) & 1);
    this.setFunctionModule(matrix, 8, 2, (format >> 12) & 1);
    this.setFunctionModule(matrix, 8, 3, (format >> 11) & 1);
    this.setFunctionModule(matrix, 8, 4, (format >> 10) & 1);
    this.setFunctionModule(matrix, 8, 5, (format >> 9) & 1);
    this.setFunctionModule(matrix, 8, 7, (format >> 8) & 1);
    this.setFunctionModule(matrix, 8, 8, (format >> 7) & 1);

    // Top-left vertical (col 8, rows 7, 5-0)
    this.setFunctionModule(matrix, 7, 8, (format >> 6) & 1);
    this.setFunctionModule(matrix, 5, 8, (format >> 5) & 1);
    this.setFunctionModule(matrix, 4, 8, (format >> 4) & 1);
    this.setFunctionModule(matrix, 3, 8, (format >> 3) & 1);
    this.setFunctionModule(matrix, 2, 8, (format >> 2) & 1);
    this.setFunctionModule(matrix, 1, 8, (format >> 1) & 1);
    this.setFunctionModule(matrix, 0, 8, (format >> 0) & 1);

    // Bottom-left vertical (col 8, rows size-1 down to size-7)
    this.setFunctionModule(matrix, size - 1, 8, (format >> 14) & 1);
    this.setFunctionModule(matrix, size - 2, 8, (format >> 13) & 1);
    this.setFunctionModule(matrix, size - 3, 8, (format >> 12) & 1);
    this.setFunctionModule(matrix, size - 4, 8, (format >> 11) & 1);
    this.setFunctionModule(matrix, size - 5, 8, (format >> 10) & 1);
    this.setFunctionModule(matrix, size - 6, 8, (format >> 9) & 1);
    this.setFunctionModule(matrix, size - 7, 8, (format >> 8) & 1);

    // Top-right horizontal (row 8, cols size-8 to size-1)
    this.setFunctionModule(matrix, 8, size - 8, (format >> 7) & 1);
    this.setFunctionModule(matrix, 8, size - 7, (format >> 6) & 1);
    this.setFunctionModule(matrix, 8, size - 6, (format >> 5) & 1);
    this.setFunctionModule(matrix, 8, size - 5, (format >> 4) & 1);
    this.setFunctionModule(matrix, 8, size - 4, (format >> 3) & 1);
    this.setFunctionModule(matrix, 8, size - 3, (format >> 2) & 1);
    this.setFunctionModule(matrix, 8, size - 2, (format >> 1) & 1);
    this.setFunctionModule(matrix, 8, size - 1, (format >> 0) & 1);
  }
}
