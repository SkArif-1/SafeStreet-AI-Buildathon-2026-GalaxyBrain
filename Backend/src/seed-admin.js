require("dotenv").config();
const bcrypt=require("bcryptjs");
const db=require("./db");
(async()=>{
 const email=(process.env.ADMIN_EMAIL||"admin@safestreet.local").toLowerCase();
 if(db.prepare("SELECT id FROM users WHERE role='admin'").get()) {
   console.log("An admin already exists. No admin account was changed.");process.exit(0);
 }
 const name=process.env.ADMIN_NAME||"SafeStreet Administrator",password=process.env.ADMIN_PASSWORD;
 if(!password||password.length<8){console.error("Set ADMIN_PASSWORD (minimum 8 characters) in .env");process.exit(1);}
 db.prepare("INSERT INTO users(id,name,email,password_hash,role,area,created_at) VALUES(?,?,?,?,?,?,?)")
 .run(require("crypto").randomUUID(),name,email,await bcrypt.hash(password,12),"admin","",new Date().toISOString());
 console.log(`Admin provisioned: ${email}`);
})();
