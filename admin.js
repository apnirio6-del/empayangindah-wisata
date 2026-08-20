(() => {
'use strict';
const $=id=>document.getElementById(id), rp=n=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(n)||0);
let sb=null;
const CFG=window.EGW_CONFIG||{};
if(window.supabase && CFG.SUPABASE_URL && !CFG.SUPABASE_URL.includes('YOUR-')) sb=window.supabase.createClient(CFG.SUPABASE_URL,CFG.SUPABASE_ANON_KEY);
const DEFAULTS={address:'Lokasi perusahaan belum diatur.',phone:'08xxxxxxxxxx',tiktok:'https://www.tiktok.com/',instagram:'https://www.instagram.com/'};
function esc(v){return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function msg(el,text){if($(el))$(el).textContent=text}
async function isAdmin(){if(!sb)return false;const {data:{user}}=await sb.auth.getUser();if(!user)return false;const {data}=await sb.from('admin_users').select('user_id,name').eq('user_id',user.id).maybeSingle();return !!data}
async function showAuth(){
 if(!sb){$('setup-panel').style.display='block';$('signin-panel').style.display='none';msg('setup-msg','Database belum dikonfigurasi. Isi assets/config.js terlebih dahulu.');return}
 const {data:{session}}=await sb.auth.getSession();
 if(session && await isAdmin()){openDash();return}
 $('login-panel').style.display='block';$('dashboard').style.display='none';
 // Setup is available until the first admin exists; the RPC safely allows only the first claim.
 $('setup-panel').style.display='block'; $('signin-panel').style.display='block';
}
async function createAdmin(){
 if(!sb){msg('setup-msg','Database belum dikonfigurasi.');return}
 const name=$('setup-name').value.trim(), username=$('setup-username').value.trim(), p=$('setup-password').value, c=$('setup-confirm').value;
 if(name.length<2)return msg('setup-msg','Nama admin minimal 2 karakter.');
 if(username.length<3)return msg('setup-msg','Email minimal 3 karakter.');
 if(p.length<8)return msg('setup-msg','Password minimal 8 karakter.');
 if(p!==c)return msg('setup-msg','Konfirmasi password tidak sama.');
 msg('setup-msg','Membuat akun online...');
 const {data,error}=await sb.auth.signUp({email:username,password:p,options:{data:{name}}});
 if(error){msg('setup-msg',error.message);return}
 if(!data.session){msg('setup-msg','Akun dibuat. Jika Supabase meminta verifikasi email, verifikasi dulu lalu login dengan email/password yang sama.');return}
 const {data:claimed,error:ce}=await sb.rpc('claim_first_admin',{p_name:name});
 if(ce){msg('setup-msg',ce.message);return}
 if(!claimed){msg('setup-msg','Akun admin pertama sudah dibuat oleh akun lain. Silakan login.');return}
 openDash();
}
async function login(){
 if(!sb)return;
 const u=$('login-username').value.trim(),p=$('admin-password').value;
 const {error}=await sb.auth.signInWithPassword({email:u,password:p});
 if(error){msg('login-msg',error.message);return}
 if(!(await isAdmin())){
  const {data:{user}}=await sb.auth.getUser();
  const {data:claimed}=await sb.rpc('claim_first_admin',{p_name:user?.user_metadata?.name||'Admin'});
  if(!claimed){await sb.auth.signOut();msg('login-msg','Akun ini bukan admin.');return}
 }
 openDash();
}
function openDash(){$('login-panel').style.display='none';$('dashboard').style.display='block';loadAll();window.scrollTo({top:0,behavior:'smooth'})}
async function renderCompany(){const {data}=await sb.from('company_settings').select('*').eq('id',1).maybeSingle();const s=data||DEFAULTS;$('company-address-input').value=s.address||'';$('company-phone-input').value=s.phone||'';$('company-tiktok-input').value=s.tiktok||'';$('company-instagram-input').value=s.instagram||''}
async function saveCompany(){const s={address:$('company-address-input').value.trim(),phone:$('company-phone-input').value.trim(),tiktok:$('company-tiktok-input').value.trim(),instagram:$('company-instagram-input').value.trim(),updated_at:new Date().toISOString()};const {error}=await sb.from('company_settings').upsert({...s,id:1});msg('company-saved',error?error.message:'✓ Informasi perusahaan tersimpan online');setTimeout(()=>msg('company-saved',''),3000)}
async function renderTrips(){const {data,error}=await sb.from('trips').select('*').order('created_at');if(error){alert(error.message);return}const rows=data||[];$('trip-manager').innerHTML=rows.map((x,i)=>`<article class="admin-trip-editor"><div class="editor-top"><div><span class="badge">${esc(x.type)}</span><h3>${esc(x.name)}</h3></div><button class="btn danger delete-trip" data-id="${x.id}">Hapus</button></div><div class="admin-form-grid"><label>Nama Perjalanan<input data-field="name" data-id="${x.id}" value="${esc(x.name)}"></label><label>Dari / Keberangkatan<input data-field="origin" data-id="${x.id}" value="${esc(x.origin)}"></label><label>Tujuan<input data-field="destination" data-id="${x.id}" value="${esc(x.destination)}"></label><label>Tanggal / Jadwal<input data-field="date" data-id="${x.id}" value="${esc(x.date)}"></label><label>Jam Keberangkatan<input type="time" data-field="departure" data-id="${x.id}" value="${esc(x.departure)}"></label><label>Harga / Penumpang<input type="number" data-field="price" data-id="${x.id}" value="${Number(x.price)||0}"></label><label>Jumlah Kursi<input type="number" data-field="seats" data-id="${x.id}" value="${Number(x.seats)||1}"></label><label>Lokasi Wisata<input data-field="location" data-id="${x.id}" value="${esc(x.location||'')}"></label></div><div class="image-edit-row"><img id="trip-img-${x.id}" src="${x.image||'assets/images/bandung.svg'}" alt=""><label class="btn ghost upload-label">Ganti Gambar<input class="file-input" type="file" accept="image/png,image/jpeg,image/webp" data-id="${x.id}"></label><span id="trip-saved-${x.id}" class="saved"></span></div><button class="btn primary save-trip" data-id="${x.id}">Simpan Perjalanan Online</button></article>`).join('')||'<p class="muted">Belum ada perjalanan.</p>';
 document.querySelectorAll('.save-trip').forEach(b=>b.onclick=()=>saveTrip(b.dataset.id));document.querySelectorAll('.delete-trip').forEach(b=>b.onclick=()=>deleteTrip(b.dataset.id));document.querySelectorAll('.file-input').forEach(e=>e.onchange=handleImage)}
async function saveTrip(id){const fields=['name','origin','destination','date','departure','price','seats','location'],obj={};fields.forEach(f=>{const e=document.querySelector(`[data-field="${f}"][data-id="${id}"]`);obj[f]=(f==='price'||f==='seats')?Number(e.value):e.value.trim()});obj.route=`${obj.origin} → ${obj.destination}`;const {error}=await sb.from('trips').update(obj).eq('id',id);if(error)alert(error.message);else renderTrips()}
async function deleteTrip(id){if(!confirm('Hapus perjalanan ini dari database?'))return;const {error}=await sb.from('trips').delete().eq('id',id);if(error)alert(error.message);else renderTrips()}
async function addTrip(){const type=prompt('Jenis perjalanan: Open Trip atau Shuttle','Open Trip');if(!type)return;const {error}=await sb.from('trips').insert({type:type.toLowerCase().includes('shuttle')?'Shuttle':'Open Trip',name:'Perjalanan Baru',origin:'Kota Asal',destination:'Kota Tujuan',date:'Jadwal baru',departure:'08:00',price:0,seats:10,image:'assets/images/bandung.svg',location:'Lokasi tujuan'});if(error)alert(error.message);else renderTrips()}
function handleImage(e){const f=e.target.files?.[0];if(!f)return;if(f.size>700*1024){alert('Gambar maksimal 700 KB agar database tetap ringan.');return}const r=new FileReader();r.onload=async()=>{const id=e.target.dataset.id;const {error}=await sb.from('trips').update({image:r.result}).eq('id',id);if(error)alert(error.message);else{$(`trip-img-${id}`).src=r.result;msg(`trip-saved-${id}`,'✓ Gambar tersimpan online')}};r.readAsDataURL(f)}
async function renderBookings(){const {data,error}=await sb.from('bookings').select('*').order('created_at',{ascending:false});if(error){alert(error.message);return}const d=data||[];$('total-booking').textContent=d.length;$('pending-booking').textContent=d.filter(x=>x.status==='Menunggu').length;$('revenue').textContent=rp(d.reduce((s,x)=>s+Number(x.total||0),0));$('booking-table').innerHTML=d.map(x=>`<tr><td>${esc(x.code)}</td><td>${esc(x.name)}</td><td>${esc(x.origin)} → ${esc(x.destination)}</td><td>${esc(x.departure||'-')}</td><td>${esc(x.date)}</td><td>${x.qty}</td><td>${rp(x.total)}</td><td>${esc(x.status)}</td></tr>`).join('')||'<tr><td colspan="8">Belum ada booking.</td></tr>'}
async function exportCSV(){const {data}=await sb.from('bookings').select('*').order('created_at',{ascending:false});const rows=[['Kode','Nama','WhatsApp','Dari','Tujuan','Jam','Tanggal','Qty','Total','Status'],...(data||[]).map(x=>[x.code,x.name,x.phone,x.origin,x.destination,x.departure,x.date,x.qty,x.total,x.status])];const csv=rows.map(r=>r.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(',')).join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='booking-empayangindah.csv';a.click()}
async function changePassword(){const p=$('new-admin-password').value,c=$('new-admin-confirm').value;if(p.length<8)return alert('Password minimal 8 karakter.');if(p!==c)return alert('Konfirmasi password tidak sama.');const {error}=await sb.auth.updateUser({password:p});if(error)alert(error.message);else{ $('new-admin-password').value='';$('new-admin-confirm').value='';msg('password-saved','✓ Password berhasil diubah')}}
async function loadAll(){await Promise.all([renderCompany(),renderTrips(),renderBookings()]);const {data:{user}}=await sb.auth.getUser();const {data:a}=await sb.from('admin_users').select('*').eq('user_id',user.id).maybeSingle();if(a){$('admin-account-name').textContent=a.name;$('admin-account-username').textContent=user.email}}
async function init(){
 $('create-admin-btn').onclick=createAdmin;$('login-btn').onclick=login;$('save-company').onclick=saveCompany;$('add-trip').onclick=addTrip;$('export-btn').onclick=exportCSV;$('change-password-btn').onclick=changePassword;
 $('logout-btn').onclick=async()=>{await sb.auth.signOut();location.reload()};$('admin-password').onkeydown=e=>{if(e.key==='Enter')login()};$('setup-confirm').onkeydown=e=>{if(e.key==='Enter')createAdmin()};
 const toggle=(b,i)=>$(b)?.addEventListener('click',()=>{const el=$(i);el.type=el.type==='password'?'text':'password';$(b).textContent=el.type==='password'?'Lihat':'Sembunyikan'});toggle('setup-toggle','setup-password');toggle('toggle-password','admin-password');
 await showAuth();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
