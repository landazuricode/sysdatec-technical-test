import Prism from "prismjs";

if (typeof globalThis !== "undefined") {
  (globalThis as typeof globalThis & { Prism: typeof Prism }).Prism = Prism;
}

export { Prism };
