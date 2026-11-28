require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("./db");
const { auth, adminOnly } = require("./middleware/auth");
const { id, now, hashToken, safeUser, reportSchema } = require("./utils");
const { analyze } = require("./services/ai");

const app = express();
// Sample routes mirror the existing frontend demo and are explicitly flagged.
// These values are placeholders for judging/demo only, not verified observations.
function seedFrontendDemoRoutes() {
  const demoRoutes = [
    {id:"A",name:"Janpath main road",mins:22,km:5.1,path:[[20.2689,85.8434],[20.274,85.84],[20.28,85.835],[20.288,85.83],[20.296,85.8246]],scores:{lighting:[4.5,14],footpath:[3.8,11],crossing:[4.2,9],accessibility:[4.0,6]}},
    {id:"B",name:"Nandankanan Road",mins:27,km:5.9,path:[[20.2689,85.8434],[20.272,85.848],[20.283,85.846],[20.29,85.835],[20.296,85.8246]],scores:{lighting:[3.2,8],footpath:[2.9,7],crossing:[3.0,5],accessibility:[2.6,4]}},
    {id:"C",name:"Saheed Nagar inner lanes",mins:25,km:5.4,path:[[20.2689,85.8434],[20.265,85.838],[20.275,85.83],[20.286,85.823],[20.296,85.8246]],scores:{lighting:[2.8,6],footpath:[3.5,5],crossing:[3.9,4],accessibility:[3.4,2]}}
  ];
  const exists=db.prepare("SELECT id FROM routes WHERE id=?");
  const addRoute=db.prepare("INSERT OR IGNORE INTO routes(id,name,origin,destination,path_json,updated_at,is_demo) VALUES(?,?,?,?,?,?,1)");
  const addObservation=db.prepare("INSERT OR IGNORE INTO route_observations(id,route_id,dimension,score,source,verified,observed_at) VALUES(?,?,?,?,?,0,?)");
  const tx=db.transaction(()=>demoRoutes.forEach(r=>{
    addRoute.run(r.id,r.name,"Master Canteen","Jaydev Vihar",JSON.stringify(r.path),"2026-11-20T00:00:00.000Z");
    if(exists.get(r.id)) Object.entries(r.scores).forEach(([dimension,[score,count]])=>{
      for(let i=0;i<count;i++) addObservation.run(`demo-${r.id}-${dimension}-${i}`,r.id,dimension,score,"sample","2026-11-20T00:00:00.000Z");
    });
  }));tx();
}
seedFrontendDemoRoutes();
const uploadDir = path.resolve(process.env.UPLOAD_DIR || "./uploads");
fs.mkdirSync(uploadDir,{recursive:true});
app.use(helmet({crossOriginResourcePolicy:{policy:"cross-origin"}}));
const allowed = (process.env.FRONTEND_ORIGIN || "").split(",").map(s=>s.trim()).filter(Boolean);
app.use(cors({origin:(origin,cb)=>!origin || allowed.includes(origin) || process.env.NODE_ENV!=="production" ? cb(null,true) : cb(new Error("Origin not allowed")),credentials:true}));
app.use(express.json({limit:"1mb"}));
app.use(express.urlencoded({extended:true}));
app.use("/uploads",express.static(uploadDir,{maxAge:"7d"}));
app.use("/api",rateLimit({windowMs:15*60*1000,max:300,standardHeaders:true,legacyHeaders:false}));

const storage = multer.diskStorage({
  destination:(_req,_file,cb)=>cb(null,uploadDir),
  filename:(_req,file,cb)=>cb(null,`${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`)
});
const imageUpload = multer({
  storage, limits:{fileSize:(Number(process.env.MAX_UPLOAD_MB)||5)*1024*1024,files:1},
  fileFilter:(_req,file,cb)=>/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)?cb(null,true):cb(new Error("Only JPG, PNG, WEBP or GIF images are accepted."))
});

function issueToken(user) {
  return jwt.sign({sub:user.id,role:user.role},process.env.JWT_SECRET,{expiresIn:process.env.JWT_EXPIRES_IN||"7d"});
}
function responseReport(r) {
  return {
    ...r,
    ticketNo: r.ticket_no,
    lat: r.latitude,
    lng: r.longitude,
    image: r.image_url,
    logs: db.prepare(
      "SELECT created_at AS t, new_status AS s, note FROM report_history WHERE report_id = ? ORDER BY created_at"
    ).all(r.id)
  };
}
function findDuplicate(lat,lng,category) {
  return db.prepare(`SELECT id FROM reports WHERE category=? AND status!='rejected'
    AND ABS(latitude-?)<0.001 AND ABS(longitude-?)<0.001 ORDER BY created_at DESC LIMIT 1`).get(category,lat,lng);
}

app.get("/api/health",(_req,res)=>res.json({success:true,service:"SafeStreet AI API",status:"healthy",timestamp:now()}));
app.get("/api",(_req,res)=>res.json({success:true,name:"SafeStreet AI",version:"1.0.0",docs:"See README.md"}));

app.post("/api/auth/register",async(req,res,next)=>{
  try {
    const schema=require("zod").z.object({name:require("zod").z.string().trim().min(2).max(100),email:require("zod").z.string().email().max(180),password:require("zod").z.string().min(8).max(100),area:require("zod").z.string().max(100).optional().default("")});
    const p=schema.parse(req.body), email=p.email.toLowerCase();
    if(db.prepare("SELECT id FROM users WHERE email=?").get(email)) return res.status(409).json({success:false,message:"An account with this email already exists."});
    const user={id:id(),name:p.name,email,role:"citizen",area:p.area,password_hash:await bcrypt.hash(p.password,12),created_at:now()};
    db.prepare("INSERT INTO users(id,name,email,password_hash,role,area,created_at) VALUES(@id,@name,@email,@password_hash,@role,@area,@created_at)").run(user);
    res.status(201).json({success:true,message:"Account created.",token:issueToken(user),user:safeUser(user)});
  }catch(e){next(e);}
});
app.post("/api/auth/login",async(req,res,next)=>{
  try{
    const {email,password,role="citizen"}=req.body||{};
    if(!email||!password||!["citizen","admin"].includes(role)) return res.status(400).json({success:false,message:"Email, password and valid role are required."});
    const user=db.prepare("SELECT * FROM users WHERE email=?").get(String(email).toLowerCase().trim());
    if(!user||!(await bcrypt.compare(String(password),user.password_hash))||user.role!==role)
      return res.status(401).json({success:false,message:"Email, password or selected role is incorrect."});
    res.json({success:true,message:"Logged in.",token:issueToken(user),user:safeUser(user)});
  }catch(e){next(e);}
});
app.get("/api/auth/me",auth,(req,res)=>res.json({success:true,user:safeUser(req.user)}));
app.post("/api/auth/forgot-password",(req,res)=>{
  const email=String(req.body?.email||"").toLowerCase().trim();
  const user=db.prepare("SELECT id,email FROM users WHERE email=?").get(email);
  // Return the same response whether the email exists or not.
  const message="If an account exists, a reset link has been created.";
  if(user){
    const token=crypto.randomBytes(32).toString("hex"), expires=new Date(Date.now()+30*60*1000).toISOString();
    db.prepare("INSERT INTO password_resets(id,user_id,token_hash,expires_at) VALUES(?,?,?,?)").run(id(),user.id,hashToken(token),expires);
    const link=`${process.env.APP_BASE_URL||"http://localhost:5500"}/reset-password.html?token=${token}`;
    console.log(`\n[Password reset link for ${email}] ${link}\n`);
  }
  res.json({success:true,message});
});
app.get("/api/auth/reset-password/:token",(req,res)=>{
  const row=db.prepare("SELECT id FROM password_resets WHERE token_hash=? AND used_at IS NULL AND expires_at>?").get(hashToken(req.params.token),now());
  res.json({success:true,valid:!!row});
});
app.post("/api/auth/reset-password",async(req,res,next)=>{
  try{
    const {token,password}=req.body||{};
    if(!token||!password||String(password).length<8) return res.status(400).json({success:false,message:"Token and password of at least 8 characters are required."});
    const row=db.prepare("SELECT * FROM password_resets WHERE token_hash=? AND used_at IS NULL AND expires_at>?").get(hashToken(token),now());
    if(!row) return res.status(400).json({success:false,message:"Reset link is invalid or expired."});
    const hash=await bcrypt.hash(password,12), t=now();
    const tx=db.transaction(()=>{db.prepare("UPDATE users SET password_hash=? WHERE id=?").run(hash,row.user_id);db.prepare("UPDATE password_resets SET used_at=? WHERE id=?").run(t,row.id);});
    tx();res.json({success:true,message:"Password updated. Please log in."});
  }catch(e){next(e);}
});

app.get("/api/reports", (req,res)=>{
  const {status,category,limit=100}=req.query;
  let sql="SELECT r.*,u.name AS citizen_name FROM reports r JOIN users u ON u.id=r.user_id WHERE 1=1", args=[];
  if(status){sql+=" AND r.status=?";args.push(status);}
  if(category){sql+=" AND r.category=?";args.push(category);}
  sql+=" ORDER BY r.created_at DESC LIMIT ?";args.push(Math.min(250,Math.max(1,Number(limit)||100)));
  res.json({success:true,data:db.prepare(sql).all(...args).map(responseReport)});
});

app.post("/api/reports", auth, imageUpload.single("image"), async (req, res, next) => {
  try {
    const p = reportSchema.parse(req.body);
    const t = now();
    const reportId = id();

    const ai = await analyze(p.description, p.category);
    const duplicate = findDuplicate(p.lat, p.lng, ai.category);

    const imageUrl = req.file
      ? `/uploads/${req.file.filename}`
      : null;

    // Generate ticket number and save report atomically
    const createReport = db.transaction(() => {
      const ticketNo = db
        .prepare(
          "SELECT COALESCE(MAX(ticket_no), 100) + 1 AS next FROM reports"
        )
        .get().next;

      const report = {
        id: reportId,
        ticket_no: ticketNo,
        user_id: req.user.id,
        category: p.category,
        description: p.description,
        latitude: p.lat,
        longitude: p.lng,
        image_url: imageUrl,
        status: "pending",
        severity: ai.severity,
        ai_category: ai.category,
        ai_confidence: ai.confidence,
        ai_summary: ai.summary,
        ai_provider: ai.provider,
        duplicate_of: duplicate?.id || null,
        ward: "",
        created_at: t,
        updated_at: t
      };

      db.prepare(`
        INSERT INTO reports (
          id,
          ticket_no,
          user_id,
          category,
          description,
          latitude,
          longitude,
          image_url,
          status,
          severity,
          ai_category,
          ai_confidence,
          ai_summary,
          ai_provider,
          duplicate_of,
          ward,
          created_at,
          updated_at
        )
        VALUES (
          @id,
          @ticket_no,
          @user_id,
          @category,
          @description,
          @latitude,
          @longitude,
          @image_url,
          @status,
          @severity,
          @ai_category,
          @ai_confidence,
          @ai_summary,
          @ai_provider,
          @duplicate_of,
          @ward,
          @created_at,
          @updated_at
        )
      `).run(report);

      db.prepare(`
        INSERT INTO report_history (
          id,
          report_id,
          actor_id,
          old_status,
          new_status,
          note,
          created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        id(),
        reportId,
        req.user.id,
        null,
        "pending",
        "Report submitted by citizen",
        t
      );

      return report;
    });

    const report = createReport();

    res.status(201).json({
      success: true,
      message: "Report submitted for review.",
      data: responseReport(report)
    });

  } catch (e) {
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }

    next(e);
  }
});

app.get("/api/reports/:id",auth,(req,res)=>{
  const r=db.prepare("SELECT r.*,u.name AS citizen_name FROM reports r JOIN users u ON u.id=r.user_id WHERE r.id=?").get(req.params.id);
  if(!r)return res.status(404).json({success:false,message:"Report not found."});
  if(req.user.role!=="admin"&&r.user_id!==req.user.id)return res.status(403).json({success:false,message:"You can only view your own report."});
  res.json({success:true,data:responseReport(r)});
});
app.get("/api/my/reports",auth,(req,res)=>res.json({success:true,data:db.prepare("SELECT * FROM reports WHERE user_id=? ORDER BY created_at DESC").all(req.user.id).map(responseReport)}));
app.patch("/api/reports/:id/status",auth,adminOnly,(req,res)=>{
  const {status,note=""}=req.body||{};
  if(!["pending","verified","resolved","rejected"].includes(status))return res.status(400).json({success:false,message:"Invalid status."});
  const old=db.prepare("SELECT * FROM reports WHERE id=?").get(req.params.id);
  if(!old)return res.status(404).json({success:false,message:"Report not found."});
  const t=now(),tx=db.transaction(()=>{
    db.prepare("UPDATE reports SET status=?,updated_at=? WHERE id=?").run(status,t,old.id);
    db.prepare("INSERT INTO report_history(id,report_id,actor_id,old_status,new_status,note,created_at) VALUES(?,?,?,?,?,?,?)").run(id(),old.id,req.user.id,old.status,status,String(note).slice(0,500),t);
  });tx();
  res.json({success:true,message:"Report status updated.",data:responseReport(db.prepare("SELECT * FROM reports WHERE id=?").get(old.id))});
});

app.get("/api/admin/reports",auth,adminOnly,(req,res)=>{
  const {status,category,severity,search,limit=250}=req.query;
  let sql="SELECT r.*,u.name AS citizen_name,u.email AS citizen_email,u.area AS citizen_area FROM reports r JOIN users u ON u.id=r.user_id WHERE 1=1",args=[];
  for(const [key,val] of [["status",status],["category",category],["severity",severity]])if(val){sql+=` AND r.${key}=?`;args.push(val);}
  if(search){sql+=" AND (r.description LIKE ? OR r.id LIKE ? OR u.name LIKE ?)";args.push(`%${search}%`,`%${search}%`,`%${search}%`);}
  sql+=" ORDER BY r.created_at DESC LIMIT ?";args.push(Math.min(500,Math.max(1,Number(limit)||250)));
  res.json({success:true,data:db.prepare(sql).all(...args).map(responseReport)});
});
app.get("/api/admin/analytics",auth,adminOnly,(_req,res)=>{
  const totals=db.prepare(`SELECT COUNT(*) total,
    SUM(status='pending') pending,SUM(status='verified') verified,
    SUM(status='resolved') resolved,SUM(status='rejected') rejected FROM reports`).get();
  const categories=db.prepare("SELECT category,COUNT(*) count FROM reports GROUP BY category ORDER BY count DESC").all();
  const severity=db.prepare("SELECT severity,COUNT(*) count FROM reports GROUP BY severity").all();
  const wards=db.prepare("SELECT COALESCE(NULLIF(ward,''),'Unassigned') ward,COUNT(*) count,SUM(status='resolved') resolved FROM reports GROUP BY ward ORDER BY count DESC").all();
  res.json({success:true,data:{totals,categories,severity,wards}});
});
app.get("/api/admin/users",auth,adminOnly,(_req,res)=>res.json({success:true,data:db.prepare("SELECT id,name,email,role,area,created_at FROM users ORDER BY created_at DESC LIMIT 500").all()}));
app.get("/api/admin/reports/:id/history",auth,adminOnly,(req,res)=>res.json({success:true,data:db.prepare("SELECT h.*,u.name actor_name FROM report_history h LEFT JOIN users u ON u.id=h.actor_id WHERE report_id=? ORDER BY created_at").all(req.params.id)}));

/* Routes: location/route geometry and scores are stored evidence, not safety guarantees. */
app.get("/api/routes",(_req,res)=>{
  const routes=db.prepare("SELECT * FROM routes ORDER BY name").all().map(r=>({...r,path:JSON.parse(r.path_json),evidence:getRouteEvidence(r.id),demo:!!r.is_demo}));
  res.json({success:true,data:routes});
});
function getRouteEvidence(routeId){
  const rows=db.prepare("SELECT dimension,AVG(score) score,COUNT(*) count,SUM(verified) verified_count,MAX(observed_at) updated_at FROM route_observations WHERE route_id=? GROUP BY dimension").all(routeId);
  const map={lighting:null,footpath:null,crossing:null,accessibility:null};
  rows.forEach(r=>map[r.dimension]={score:Number(r.score.toFixed(2)),count:r.count,verified_count:r.verified_count,updated_at:r.updated_at});
  return map;
}
app.post("/api/routes/compare",(req,res)=>{
  const {from,to}=req.body||{};
  if(!from||!to||from===to)return res.status(400).json({success:false,message:"Select two different places."});
  const routes=db.prepare("SELECT * FROM routes WHERE (origin=? AND destination=?) OR (origin=? AND destination=?)").all(from,to,to,from);
  const data=routes.map(r=>{
    const evidence=getRouteEvidence(r.id), dims=Object.values(evidence).filter(Boolean),count=dims.reduce((n,x)=>n+x.count,0);
    return {id:r.id,name:r.name,origin:r.origin,destination:r.destination,path:JSON.parse(r.path_json),scores:evidence,evidence_count:count,demo:!!r.is_demo,overall_score:dims.length?Number((dims.reduce((s,x)=>s+x.score,0)/dims.length).toFixed(2)):null,limited_data:count<3,updated_at:r.updated_at};
  });
  res.json({success:true,data,disclaimer:"Sample route values mirror the supplied frontend demo and are not verified city observations. Scores are not a guarantee of personal safety."});
});
app.post("/api/routes/:id/observations",auth,(req,res)=>{
  const {dimension,score}=req.body||{};
  if(!["lighting","footpath","crossing","accessibility"].includes(dimension)||!Number.isFinite(Number(score))||score<0||score>5)return res.status(400).json({success:false,message:"Provide a valid dimension and score between 0 and 5."});
  if(!db.prepare("SELECT id FROM routes WHERE id=?").get(req.params.id))return res.status(404).json({success:false,message:"Route not found."});
  db.prepare("INSERT INTO route_observations(id,route_id,dimension,score,source,verified,observed_at) VALUES(?,?,?,?,?,?,?)").run(id(),req.params.id,dimension,Number(score),"citizen",0,now());
  res.status(201).json({success:true,message:"Observation recorded; it is unverified until reviewed."});
});

app.use((err,_req,res,_next)=>{
  if(err instanceof multer.MulterError)return res.status(400).json({success:false,message:err.code==="LIMIT_FILE_SIZE"?"Image exceeds upload size limit.":err.message});
  if(err.name==="ZodError")return res.status(400).json({success:false,message:"Please check the submitted fields.",errors:err.issues.map(i=>({field:i.path.join("."),message:i.message}))});
  if(err.message?.includes("Only JPG"))return res.status(400).json({success:false,message:err.message});
  console.error(err);
  res.status(500).json({success:false,message:"Unexpected server error."});
});
app.use((_req,res)=>res.status(404).json({success:false,message:"API endpoint not found."}));
module.exports=app;
