import { readdirSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const VALID_CONVEX_PATH_COMPONENT = /^[A-Za-z0-9_.]+$/;

describe("Convex module paths", () => {
  it("uses only path components accepted by Convex deployments", () => {
    const convexDirectory = path.join(process.cwd(), "convex");
    const invalidPaths: string[] = [];

    visitDirectory(convexDirectory, "", invalidPaths);

    expect(invalidPaths).toEqual([]);
  });
});

function visitDirectory(
  directory: string,
  relativeDirectory: string,
  invalidPaths: string[],
) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const relativePath = path.join(relativeDirectory, entry.name);

    if (!VALID_CONVEX_PATH_COMPONENT.test(entry.name)) {
      invalidPaths.push(relativePath);
    }

    if (entry.isDirectory()) {
      visitDirectory(
        path.join(directory, entry.name),
        relativePath,
        invalidPaths,
      );
    }
  }
}
