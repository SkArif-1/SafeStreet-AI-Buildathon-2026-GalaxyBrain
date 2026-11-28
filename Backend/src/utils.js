const crypto = require("crypto");
const { z } = require("zod");

const id = () => crypto.randomUUID();
const now = () => new Date().toISOString();
const hashToken = token => crypto.createHash("sha256").update(token).digest("hex");
const safeUser = u => ({ id: u.id, name: u.name, email: u.email, role: u.role, area: u.area });
const reportSchema = z.object({
  category: z.string().trim().min(2).max(80),
  description: z.string().trim().min(8).max(1500),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180)
});
module.exports = { id, now, hashToken, safeUser, reportSchema };
