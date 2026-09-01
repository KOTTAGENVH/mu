/*
QR Generator from scratch (References):
https://dev.to/maxart2501/let-s-develop-a-qr-code-generator-part-i-basic-concepts-510a
https://youtu.be/gB3-Sac1ovk
https://youtu.be/Ct2fyigNgPY
*/

import { QRCodeEncoder } from "./encoder";

export function generateQR(
  text: string,
): number[][] {
  const encoder = new QRCodeEncoder();
  return encoder.encode(text);
}
