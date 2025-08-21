import "dotenv/config";
import { runAgent } from "./src/aiHandler.js";

console.log("🌐 Welcome to ChaiCode CLI!");

async function main() {
  await runAgent();
  console.log(`Thanks for Catching Up!`);
}

main().catch((err) => console.error("❌ Error:", err));
