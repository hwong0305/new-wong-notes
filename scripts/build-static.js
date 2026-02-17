import { $ } from "bun"

export async function buildStatic() {
  await $`bunx vite build`
}

if (import.meta.main) {
  buildStatic()
}
