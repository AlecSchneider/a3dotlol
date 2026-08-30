/// <reference types="vite/client" />

// convex-test 0.0.56 uses a generated module to locate the Convex root, so the
// test module map must include declaration files under `_generated` as well.
export const modules = import.meta.glob("./**/*.*s");
