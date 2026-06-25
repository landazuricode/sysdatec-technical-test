import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

const prismjsGlobalShim = {
  name: "prismjs-global-shim",
  enforce: "pre" as const,
  transform(code: string, id: string) {
    if (/[/\\]prismjs[/\\]components[/\\]prism-(?!core)/.test(id)) {
      return { code: `import Prism from "prismjs";\n${code}`, map: null };
    }

    if (/[/\\]@lexical[/\\]code[/\\]LexicalCode\.(dev|prod)\.mjs$/.test(id)) {
      return { code: `import Prism from "prismjs";\n${code}`, map: null };
    }
  },
};

export default defineConfig({
  plugins: [prismjsGlobalShim, tailwindcss(), reactRouter()],
  resolve: {
    tsconfigPaths: true,
  },
  optimizeDeps: {
    rolldownOptions: {
      output: {
        strictExecutionOrder: true,
      },
    },
  },
  build: {
    rolldownOptions: {
      output: {
        strictExecutionOrder: true,
      },
    },
  },
});
