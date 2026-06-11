import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT        = join(__dirname, "..");
const PENDING_DIR = join(ROOT, "public", "social-posts", "pending");
const OFFSET_FILE = join(ROOT, "public", "social-posts", ".telegram-offset");

const { TELEGRAM_BOT_TOKEN, LEONARDO_API_KEY, GEMINI_API_KEY,
        FACEBOOK_PAGE_ACCESS_TOKEN, FACEBOOK_PAGE_ID,
        LINKEDIN_ACCESS_TOKEN, LINKEDIN_ORG_ID } = process.env;

const TG = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

function getOffset() { return existsSync(OFFSET_FILE) ? parseInt(readFileSync(OFFSET_FILE,"utf8").trim())||0 : 0; }
function saveOffset(o) { writeFileSync(OFFSET_FILE, String(o)); }
function savePending(d) { if(!existsSync(PENDING_DIR))mkdirSync(PENDING_DIR,{recursive:true}); const id=randomUUID(); writeFileSync(join(PENDING_DIR,`${id}.json`),JSON.stringify(d)); return id; }
function readPending(id) { const f=join(PENDING_DIR,`${id}.json`); return existsSync(f)?JSON.parse(readFileSync(f,"utf8")):null; }
function deletePending(id) { const f=join(PENDING_DIR,`${id}.json`); if(existsSync(f))unlinkSync(f); }

async function tg(method,body={}){ const r=await fetch(`${TG}/${method}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)}); return r.json(); }
const sendMessage=(c,t,e={})=>tg("sendMessage",{chat_id:c,text:t,parse_mode:"HTML",...e});
const answerCb=(id,t="")=>tg("answerCallbackQuery",{callback_query_id:id,text:t});
const editCaption=(c,m,t)=>tg("editMessageCaption",{chat_id:c,message_id:m,caption:t,parse_mode:"HTML",reply_markup:{inline_keyboard:[]}});
const getUpdates=(o)=>tg("getUpdates",{offset:o,timeout:5,allowed_updates:["message","callback_query"]});

async function sendPhotoBuffer(chatId,buf,caption,keyboard){
  const form=new FormData();
  form.append("chat_id",String(chatId));
  form.append("caption",caption);
  form.append("parse_mode","HTML");
  form.append("reply_markup",JSON.stringify({inline_keyboard:keyboard}));
  form.append("photo",new Blob([buf],{type:"image/png"}),"stratec-post.png");
  const r=await fetch(`${TG}/sendPhoto`,{method:"POST",body:form});
  return r.json();
}

async function aplicarLogo(buf){
  const logoPath=join(ROOT,"public","stratec-logo.png");
  if(!existsSync(logoPath)){console.warn("Logo no encontrado");return buf;}
  const base=sharp(buf);
  const {width,height}=await base.metadata();
  const lw=Math.round(width*0.18);
  const lb=await sharp(logoPath).resize(lw).png().toBuffer();
  const lm=await sharp(lb).metadata();
  const margin=Math.round(width*0.03);
  return base.composite([{input:lb,left:width-lm.width-margin,top:height-lm.height-margin,blend:"over"}]).png().toBuffer();
}

async function generarImagen(tema){
  const prompt=`Professional B2B security consulting image for Mexican firm STRATEC. Theme: ${tema}. Corporate style, dark navy blue and gold palette, clean modern design, no text overlay, no human faces.`;
  const r=await fetch("https://cloud.leonardo.ai/api/rest/v1/generations",{method:"POST",headers:{Authorization:`Bearer ${LEONARDO_API_KEY}`,"Content-Type":"application/json"},body:JSON.stringify({prompt,modelId:"6bef9f1b-29cb-40c7-b9df-32b51c1f67d3",width:1024,height:1024,num_images:1,guidance_scale:7})});
  if(!r.ok)throw new Error(`Leonardo ${r.status}: ${await r.text()}`);
  const {sdGenerationJob}=await r.json();
  const genId=sdGenerationJob.generationId;
  for(let i=0;i<20;i++){
    await new Promise(r=>setTimeout(r,3000));
    const p=await fetch(`https://cloud.leonardo.ai/api/rest/v1/generations/${genId}`,{headers:{Authorization:`Bearer ${LEONARDO_API_KEY}`}});
    const {generations_by_pk}=await p.json();
    const imgs=generations_by_pk?.generated_images;
    if(imgs?.length>0){
      const raw=Buffer.from(await(await fetch(imgs[0].url)).arrayBuffer());
      return aplicarLogo(raw);
    }
  }
  throw new Error("Leonardo: timeout");
}

async function generarCaptions(tema){
  const prompt=`Eres el community manager de STRATEC, consultoria en seguridad institucional y proteccion civil en Morelos Mexico. Clientes: Directores de Seguridad, CEOs, responsables de Proteccion Civil.\n\nTema: "${tema}"\n\nRedacta DOS publicaciones en espanol mexicano profesional.\n\nLINKEDIN (160-200 palabras, max 2 emojis, CTA: Agenda una consulta sin costo en stratecsecurity.com, hashtags: #SeguridadInstitucional #ProteccionCivil #GestionDeRiesgos + 2 relevantes)\n\nFACEBOOK (90-120 palabras, 2-3 emojis, CTA: Mas informacion en stratecsecurity.com, 4 hashtags)\n\nResponde UNICAMENTE con JSON: {"linkedin":"...","facebook":"..."}`;
  const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{parts:[{text:prompt}]}]})});
  if(!r.ok)throw new Error(`Gemini ${r.status}`);
  const d=await r.json();
  const t=d.candidates[0].content.parts[0].text;
  const m=t.match(/\{[\s\S]*\}/);
  if(!m)throw new Error("Gemini: JSON no encontrado");
  return JSON.parse(m[0]);
}

async function publicarFacebook(buf,caption){
  if(!FACEBOOK_PAGE_ACCESS_TOKEN||!FACEBOOK_PAGE_ID)return false;
  const form=new FormData();
  form.append("source",new Blob([buf],{type:"image/png"}),"post.png");
  form.append("message",caption);
  form.append("access_token",FACEBOOK_PAGE_ACCESS_TOKEN);
  const r=await fetch(`https://graph.facebook.com/v19.0/${FACEBOOK_PAGE_ID}/photos`,{method:"POST",body:form});
  if(!r.ok)throw new Error(`Facebook: ${await r.text()}`);
  return true;
}

async function publicarLinkedIn(buf,caption){
  if(!LINKEDIN_ACCESS_TOKEN||!LINKEDIN_ORG_ID)return false;
  const orgUrn=`urn:li:organization:${LINKEDIN_ORG_ID}`;
  const h={Authorization:`Bearer ${LINKEDIN_ACCESS_TOKEN}`,"Content-Type":"application/json","X-Restli-Protocol-Version":"2.0.0"};
  const rg=await fetch("https://api.linkedin.com/v2/assets?action=registerUpload",{method:"POST",headers:h,body:JSON.stringify({registerUploadRequest:{recipes:["urn:li:digitalmediaRecipe:feedshare-image"],owner:orgUrn,serviceRelationships:[{relationshipType:"OWNER",identifier:"urn:li:userGeneratedContent"}]}})});
  if(!rg.ok)return false;
  const {value}=await rg.json();
  const uploadUrl=value.uploadMechanism["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"].uploadUrl;
  const assetId=value.asset;
  await fetch(uploadUrl,{method:"PUT",headers:{Authorization:`Bearer ${LINKEDIN_ACCESS_TOKEN}`,"Content-Type":"image/png"},body:buf});
  const pr=await fetch("https://api.linkedin.com/v2/ugcPosts",{method:"POST",headers:h,body:JSON.stringify({author:orgUrn,lifecycleState:"PUBLISHED",specificContent:{"com.linkedin.ugc.ShareContent":{shareCommentary:{text:caption},shareMediaCategory:"IMAGE",media:[{status:"READY",media:assetId,title:{text:"STRATEC"}}]}},visibility:{"com.linkedin.ugc.MemberNetworkVisibility":"PUBLIC"}})});
  return pr.ok;
}

async function procesarComando(chatId,tema){
  await sendMessage(chatId,`Generando post sobre: <b>${tema}</b>\n\nImagen + texto en ~30 segundos...`);
  const [imgBuf,captions]=await Promise.all([generarImagen(tema),generarCaptions(tema)]);
  const pid=savePending({imageBase64:imgBuf.toString("base64"),linkedin:captions.linkedin,facebook:captions.facebook,tema});
  const preview=`Preview: ${tema}\n\nFacebook:\n${captions.facebook.substring(0,350)}\n\nLinkedIn:\n${captions.linkedin.substring(0,200)}...`;
  await sendPhotoBuffer(chatId,imgBuf,preview,[[{text:"Publicar ahora",callback_data:`pub:${pid}`},{text:"Regenerar",callback_data:`reg:${pid}`}]]);
}

async function procesarAprobacion(chatId,messageId,pid,cbId){
  await answerCb(cbId,"Publicando...");
  const p=readPending(pid);
  if(!p){await sendMessage(chatId,"Post no encontrado. Genera uno nuevo con /genera");return;}
  const buf=Buffer.from(p.imageBase64,"base64");
  const [fb,li]=await Promise.allSettled([publicarFacebook(buf,p.facebook),publicarLinkedIn(buf,p.linkedin)]);
  deletePending(pid);
  const redes=[(fb.status==="fulfilled"?"Facebook OK":"Facebook ERROR"),(li.value===true?"LinkedIn OK":"LinkedIn pendiente de token")];
  await editCaption(chatId,messageId,`Publicacion completada\n\n${redes.join("\n")}\n\nTema: ${p.tema}`);
}

async function procesarRegeneracion(chatId,pid,cbId){
  await answerCb(cbId,"Regenerando...");
  const p=readPending(pid);
  deletePending(pid);
  await procesarComando(chatId,p?.tema||"contenido STRATEC");
}

async function main(){
  const offset=getOffset();
  const updates=await getUpdates(offset);
  if(!updates.ok||!updates.result?.length){console.log("Sin mensajes.");return;}
  let next=offset;
  for(const u of updates.result){
    next=Math.max(next,u.update_id+1);
    try{
      if(u.callback_query){
        const {id,data,message}=u.callback_query;
        if(data.startsWith("pub:"))await procesarAprobacion(message.chat.id,message.message_id,data.slice(4),id);
        else if(data.startsWith("reg:"))await procesarRegeneracion(message.chat.id,data.slice(4),id);
        continue;
      }
      const msg=u.message;
      if(!msg?.text)continue;
      const text=msg.text.trim();
      if(/^\/(genera|post)\s+/i.test(text))await procesarComando(msg.chat.id,text.replace(/^\/(genera|post)\s+/i,"").trim());
      else if(/^\/(genera|post)$/.test(text))await sendMessage(msg.chat.id,"Escribe el tema. Ejemplo:\n<code>/genera auditoria de seguridad industrial Morelos</code>");
      else if(/^\/(start|ayuda)/.test(text))await sendMessage(msg.chat.id,"<b>STRATEC Bot</b>\n\nComandos:\n/genera [tema] - Crea imagen y post\n\nEjemplo:\n<code>/genera programa interno de proteccion civil</code>");
    }catch(e){console.error(`Error update ${u.update_id}:`,e.message);}
  }
  saveOffset(next);
  console.log(`Procesados: ${updates.result.length}. Offset: ${next}`);
}

main().catch(e=>{console.error("Error:",e.message);process.exit(1);});
