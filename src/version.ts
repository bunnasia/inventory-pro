import packageJson from "../package.json" with { type: "json" }

export const appVersion: string = packageJson.version
