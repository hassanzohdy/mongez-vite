import path from "path";

export const root = (childPath = "") => path.resolve(process.cwd(), childPath);
