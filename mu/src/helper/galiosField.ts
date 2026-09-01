/*
Error Correction
*/
export class GF256 {
  private exp: number[] = []; //2^i
  private log: number[] = []; //log2(x)

  constructor() {
    let x = 1;
    for (let i = 0; i < 255; i++) {
      this.exp[i] = x;
      this.log[x] = i;
      x <<= 1; //Shift left (multiply by 2)
      if (x >= 256) {
        //8 bits | 2^8
        x ^= 0x11d; // Primitive Polynomial | XOR | Rubber band
      }
    }
    this.exp[255] = this.exp[0]; //Circular buffer for multiplication || Array out of bounds
  }

  //Add logs then look up result in exp table
  multiply(a: number, b: number): number {
    if (a === 0 || b === 0) return 0;
    return this.exp[(this.log[a] + this.log[b]) % 255];
  }

  //Subtract logs and adding 255 ensures a positive result for the modulo
  divide(a: number, b: number): number {
    if (a === 0) return 0;
    if (b === 0) throw new Error("Division by zero");
    return this.exp[(this.log[a] - this.log[b] + 255) % 255];
  }

  //Multiply the log of the base by the exponent
  power(a: number, b: number): number {
    if (a === 0) return 0;
    return this.exp[(this.log[a] * b) % 255];
  }
}
