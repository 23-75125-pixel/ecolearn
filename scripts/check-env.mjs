import fs from "node:fs";

// Match Next.js load order: `.env` first, then `.env.local` overrides it.
// `.env.local` is what the README setup instructions actually tell people to
// create, so only checking `.env` here would silently miss real credentials.
for (const envFile of [".env", ".env.local"]) {
  if (fs.existsSync(envFile)) {
    for (const line of fs.readFileSync(envFile, "utf8").split(/\r?\n/)) {
      const match = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/);
      if (match && !process.env[match[1]]) process.env[match[1]] = match[2].trim();
    }
  }
}

const required = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"];
const missing = required.filter((name) => !process.env[name]?.trim());

if (missing.length > 0) {
  console.error(`Missing required environment variables: ${missing.join(", ")}`);
  console.error("Add them to Vercel Project Settings > Environment Variables for Production, Preview, and Development as needed.");
  process.exit(1);
}

try {
  const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
  if (!url.protocol.startsWith("http")) throw new Error("unsupported protocol");
} catch {
  console.error("NEXT_PUBLIC_SUPABASE_URL must be a valid http(s) URL.");
  process.exit(1);
}
