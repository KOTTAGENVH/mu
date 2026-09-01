/*
Error Correction
*/
import { GF256 } from "./galiosField";

export class ReedSolomon {
  private gf = new GF256();

  encode(data: number[], eccCount: number): number[] {
    const generator = this.generatePolynomial(eccCount);
    const result = [...data, ...new Array(eccCount).fill(0)];

    for (let i = 0; i < data.length; i++) {
      const coef = result[i];
      if (coef !== 0) {
        for (let j = 0; j < generator.length; j++) {
          result[i + j] ^= this.gf.multiply(generator[j], coef);
        }
      }
    }

    return [...data, ...result.slice(data.length)];
  }

  private generatePolynomial(degree: number): number[] {
    const result = new Array(degree + 1).fill(0);
    result[0] = 1;

    for (let i = 0; i < degree; i++) {
      for (let j = result.length - 1; j > 0; j--) {
        result[j] =
          this.gf.multiply(result[j], this.gf.power(2, i)) ^ result[j - 1];
      }
      result[0] = this.gf.multiply(result[0], this.gf.power(2, i));
    }

    return result.reverse();
  }
}
