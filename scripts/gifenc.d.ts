/** The part of gifenc (MIT, CommonJS, no types of its own) that scripts/docs.tsx uses. */
declare module "gifenc" {
  type Palette = number[][];
  const gifenc: {
    quantize(rgba: Uint8Array | Uint8ClampedArray, maxColors: number, options?: { format?: "rgb565" | "rgb444" | "rgba4444" }): Palette;
    applyPalette(rgba: Uint8Array | Uint8ClampedArray, palette: Palette, format?: "rgb565" | "rgb444" | "rgba4444"): Uint8Array;
    GIFEncoder(): {
      writeFrame(index: Uint8Array, width: number, height: number, options?: { palette?: Palette; delay?: number; repeat?: number; transparent?: boolean }): void;
      finish(): void;
      bytes(): Uint8Array;
    };
  };
  export default gifenc;
}
