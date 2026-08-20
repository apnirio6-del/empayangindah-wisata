(() => {
'use strict';
const $=id=>document.getElementById(id);
const rp=n=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(n)||0);
let sb=null, trips=[];
function ready(){
 const c=window.EGW_CONFIG||{};
 if(window.supabase && c.SUPABASE_URL && !c.SUPABASE_URL.includes('YOUR-')) sb=window.supabase.createClient(c.SUPABASE_URL,c.SUPABASE_ANON_KEY);
 return !!sb;
}
function esc(v){return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
async function load(){
 if(!ready()){$('trip-list').innerHTML='<p class="notice">Database belum dikonfigurasi. Isi assets/config.js sesuai petunjuk README v8.</p>';return}
 const [{data:td,error:te},{data:cs,error:ce}]=await Promise.all([sb.from('trips').select('*').order('created_at'),sb.from('company_settings').select('*').eq('id',1).maybeSingle()]);
 if(te){console.error(te);$('trip-list').innerHTML='<p class="notice">Gagal memuat perjalanan dari database.</p>';return}
 trips=td||[]; renderTrips();
 const s=cs||{}; $('company-address').textContent=s.address||''; const p=$('company-phone');p.textContent=s.phone||'Telepon';p.href='tel:'+String(s.phone||'').replace(/[^\d+]/g,''); $('company-tiktok').href=s.tiktok||'#'; $('company-instagram').href=s.instagram||'#';
}
function card(x){return `<article class="card"><div class="trip-image"><img src="${x.image||'assets/images/bandung.svg'}" alt="${esc(x.location||x.destination)}" loading="lazy"><span class="image-label">${esc(x.location||x.destination||'')}</span></div><div class="card-body"><span class="badge">${esc(x.type)}</span><h3>${esc(x.name)}</h3><div class="route-line"><strong>${esc(x.origin)}</strong><span>→</span><strong>${esc(x.destination)}</strong></div><div class="row"><span>${esc(x.date)}</span><span>Berangkat ${esc(x.departure)}</span></div><div class="row"><span>${x.seats} kursi</span><span class="price">${rp(x.price)}</span></div><button class="btn primary full choose" data-id="${x.id}">Pilih perjalanan</button></div></article>`}
function renderTrips(){
 const open=trips.filter(x=>x.type==='Open Trip'), sh=trips.filter(x=>x.type==='Shuttle');
 $('trip-list').innerHTML=open.map(card).join('')||'<p class="muted">Belum ada Open Trip.</p>';
 $('shuttle-list').innerHTML=sh.map(card).join('')||'<p class="muted">Belum ada Shuttle.</p>';
 $('schedule-list').innerHTML=trips.map(x=>`<div class="schedule"><div><strong>${esc(x.origin)} → ${esc(x.destination)}</strong><div class="muted">${esc(x.date)} • Berangkat ${esc(x.departure)}</div></div><strong class="price">${rp(x.price)}</strong></div>`).join('');
 const route=$('booking-route'); route.innerHTML=trips.map(x=>`<option value="${x.id}">${esc(x.origin)} → ${esc(x.destination)} — ${rp(x.price)} • ${esc(x.departure)}</option>`).join('');
 document.querySelectorAll('.choose').forEach(b=>b.onclick=()=>{route.value=b.dataset.id;$('booking').scrollIntoView({behavior:'smooth'});});
}
function waNumber(phone){let n=String(phone||'').replace(/\D/g,''); if(n.startsWith('0')) n='62'+n.slice(1); return n;}
async function setupBooking(){
 $('booking-form').addEventListener('submit',async e=>{
  e.preventDefault(); if(!sb){alert('Database belum terhubung.');return}
  const f=new FormData(e.target), trip=trips.find(x=>x.id===f.get('route')); if(!trip){alert('Perjalanan tidak ditemukan.');return}
  const qty=Number(f.get('qty')); const code='EGW-'+Date.now().toString().slice(-7); const booking={code,name:f.get('name'),phone:f.get('phone'),type:trip.type,trip_id:trip.id,origin:trip.origin,destination:trip.destination,departure:trip.departure,date:f.get('date'),qty,pickup:f.get('pickup'),note:f.get('note'),price:Number(trip.price),total:Number(trip.price)*qty,status:'Menunggu'};
  const {error}=await sb.from('bookings').insert(booking); if(error){console.error(error);alert('Booking gagal disimpan. Coba lagi.');return}
  const {data:s}=await sb.from('company_settings').select('phone').eq('id',1).maybeSingle();
  const msg=`Halo Empayangindah.wisata, saya ingin melakukan pembayaran/konfirmasi booking.%0A%0AKode: ${code}%0ANama: ${booking.name}%0ARute: ${booking.origin} → ${booking.destination}%0ATanggal: ${booking.date}%0AJam: ${booking.departure}%0AJumlah: ${qty} penumpang%0ATotal: ${rp(booking.total)}%0ATitik jemput: ${booking.pickup}%0A%0AMohon informasi pembayaran. Terima kasih.`;
  const phone=waNumber(s?.phone); $('form-message').innerHTML=`Booking <strong>${code}</strong> tersimpan. Mengalihkan ke WhatsApp...`;
  setTimeout(()=>{if(phone) location.href=`https://wa.me/${phone}?text=${msg}`; else alert('Nomor WhatsApp perusahaan belum diatur admin.');},500);
 });
}
async function init(){await load();await setupBooking();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
