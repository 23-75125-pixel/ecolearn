declare module "*.jpeg" {
  const source: import("next").StaticImageData;
  export default source;
}
