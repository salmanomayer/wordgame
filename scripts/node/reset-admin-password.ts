import bcrypt from "bcryptjs"

async function generateAdminHash() {
  const password = "Admin123!"
  const salt = await bcrypt.genSalt(10)
  const hash = await bcrypt.hash(password, salt)

  console.log("Password:", password)
  console.log("Hash:", hash)
  console.log("\nRun this SQL in PostgreSQL to update the admin user:")
  console.log(`UPDATE admin_users SET password_hash = '${hash}' WHERE email = 'admin@test.com';`)
}

generateAdminHash()
