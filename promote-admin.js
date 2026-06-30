const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

// Load .env manually
const envPath = path.join(__dirname, ".env");
const envContent = fs.readFileSync(envPath, "utf-8");
const envVars = {};
envContent.split("\n").forEach((line) => {
  const [key, ...value] = line.split("=");
  if (key && !key.startsWith("#")) {
    envVars[key.trim()] = value.join("=").trim();
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function promoteAdmin(email) {
  try {
    // 1. Get user by email
    const { data: { users }, error: searchError } = await supabase.auth.admin.listUsers();
    if (searchError) throw searchError;

    const user = users.find((u) => u.email === email);
    if (!user) {
      console.error(`❌ User not found: ${email}`);
      process.exit(1);
    }

    console.log(`Found user: ${user.id}`);

    // 2. Update profile role to admin
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ role: "admin" })
      .eq("id", user.id);

    if (updateError) throw updateError;

    console.log(`✅ User ${email} promoted to admin role`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

const emailToPromote = process.argv[2] || "admin@test.com";
promoteAdmin(emailToPromote);
