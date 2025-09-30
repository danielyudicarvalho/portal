// Override for corrupted d3-ease types
declare module 'd3-ease' {
  export function easeLinear(t: number): number;
  export function easeQuad(t: number): number;
  export function easeCubic(t: number): number;
  export function easePoly(t: number): number;
  export function easeSin(t: number): number;
  export function easeExp(t: number): number;
  export function easeCircle(t: number): number;
  export function easeBounce(t: number): number;
  export function easeBack(t: number): number;
  export function easeElastic(t: number): number;
}