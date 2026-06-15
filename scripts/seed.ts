import { seedIfEmpty } from "../lib/db";

seedIfEmpty();
console.log("✔ Seeded data/db.json with default users and automations.");
console.log("  Admin → admin@conversight.ai / admin123");
console.log("  User  → user@conversight.ai / user123");
