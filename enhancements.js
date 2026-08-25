/* Smart Med Competition Layer
   Adds browser notifications, reminder scheduler, prescription capture workflow,
   caregiver escalation, emergency contact controls, install/PWA support and demo telemetry.
   It intentionally does NOT claim clinical-grade OCR or replace pharmacist verification. */
(()=>{
  'use strict';
  const KEY='smartmed:v3';
  const get=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch(e){return null}};
  const set=x=>localStorage.setItem(KEY,JSON.stringify(x));
  const toast=(m)=>{let t=document.getElementById('toast');if(t){t.hidden=false;t.className='toast';t.textContent=m;setTimeout(()=>t.hidden=true,2600)}};
  const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
  function inject(){
    const css=`
      .sm-fab{position:fixed;right:18px;bottom:18px;z-index:40;border:0;border-radius:999px;padding:14px 17px;background:#0b6b5e;color:#fff;font-weight:900;box-shadow:0 10px 28px #0b6b5e44}.sm-banner{background:#e8f6f2;border:1px solid #cbe7df;padding:12px 14px;border-radius:14px;margin-bottom:14px}.sm-banner b{color:#0b6b5e}.sm-alert{background:#fff2db;border:1px solid #efd6a6;padding:12px;border-radius:12px}.sm-danger{background:#fae8e5;border:1px solid #edc0ba;padding:12px;border-radius:12px}.sm-actions{display:flex;gap:8px;flex-wrap:wrap}.sm-preview{max-width:100%;max-height:260px;border-radius:14px;margin-top:10px}.sm-kpi{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}@media(max-width:600px){.sm-kpi{grid-template-columns:1fr 1fr}}
    `;
    const s=document.createElement('style');s.textContent=css;document.head.appendChild(s);
  }
  async function notify(title,body){
    if(!('Notification' in window)){toast('Notifications are not supported in this browser.');return false}
    if(Notification.permission==='default') await Notification.requestPermission();
    if(Notification.permission==='granted'){new Notification(title,{body,tag:'smartmed-dose'});return true}
    toast('Please allow browser notifications for Smart Med reminders.');return false;
  }
  function requestNotifications(){notify('Smart Med notifications enabled','You will receive medication reminders while this app is open.');}
  function reminderLoop(){
    const d=get(); if(!d||!Array.isArray(d.meds)) return;
    const now=new Date(), hm=String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0');
    const today=now.toISOString().slice(0,10);
    d.meds.filter(m=>m.active!==false&&m.status==='confirmed').forEach(m=>{
      (m.times||[]).forEach(time=>{
        const k='smrem:'+today+':'+m.id+':'+time;
        if(time===hm&&!localStorage.getItem(k)){localStorage.setItem(k,'1');notify('Time for '+m.name,`${m.dose||''} • ${time}. Open Smart Med to record Taken or Skip.`);}
      });
    });
  }
  function markDose(id,taken){
    const d=get(); if(!d)return;
    const m=d.meds.find(x=>x.id===id); if(!m)return;
    if(!Array.isArray(m.adherence))m.adherence=[];
    m.adherence.push(taken?1:0);m.adherence=m.adherence.slice(-30);
    if(taken&&typeof m.refill==='number'&&m.refill>0)m.refill--;
    d.events=d.events||[];d.events.unshift({t:new Date().toLocaleString(),x:`${m.name} dose marked ${taken?'taken':'skipped'}`});d.events=d.events.slice(0,30);
    set(d);toast(taken?'Dose recorded ✓':'Dose skipped');if(typeof window.render==='function')window.render();
  }
  function addCompetitionButtons(){
    if(document.getElementById('smTools'))return;
    const box=document.createElement('div');box.id='smTools';box.innerHTML=`<button class="sm-fab" id="smToolsBtn">Smart Med+</button>`;document.body.appendChild(box);
    document.getElementById('smToolsBtn').onclick=()=>toolsModal();
  }
  function modal(inner){const d=document.createElement('div');d.className='modal';d.innerHTML=`<div class="sheet">${inner}</div>`;document.body.appendChild(d);return d}
  function toolsModal(){
    const d=get()||{};
    const m=modal(`<h2>Smart Med+</h2><p class="muted">Competition demonstration controls</p>
      <div class="card"><h3>Medication reminders</h3><p class="small muted">Browser notifications work while this web app is open. For true background mobile notifications, connect a push-notification backend.</p><button class="btn primary" id="smNotify">Enable notifications</button></div>
      <div class="card"><h3>Caregiver escalation</h3><p class="small">Simulate an escalation after a missed dose.</p><div class="sm-actions"><button class="btn outline" id="smMiss">Simulate missed dose</button><button class="btn outline" id="smEmergency">Emergency contact</button></div><div id="smEsc"></div></div>
      <div class="card"><h3>Prescription Intelligence</h3><p class="small muted">Capture a prescription image, preview it and send it to pharmacist verification. OCR is deliberately presented as assistive—not autonomous clinical interpretation.</p><input id="smFile" type="file" accept="image/*" capture="environment"><div id="smPreview"></div><div class="sm-actions"><button class="btn primary" id="smSubmit" disabled>Send for pharmacist verification</button></div></div>
      <div class="card"><h3>Care-team information</h3><div class="row"><b>Patient</b><span>${esc(d.name||'Demo patient')}</span></div><div class="row"><b>Caregiver</b><span>${esc(d.caregiver||'Caregiver')}</span></div><div class="row"><b>Doctor</b><span>${esc(d.doctor||'Doctor')}</span></div><div class="row"><b>Pharmacy</b><span>${esc(d.pharmacy||'Pharmacy')}</span></div></div>
      <button class="btn outline" id="smClose">Close</button>`);
    let imageData='';
    d.querySelector('#smClose').onclick=()=>d.remove();
    d.querySelector('#smNotify').onclick=requestNotifications;
    d.querySelector('#smMiss').onclick=()=>{const x=get();x.events=x.events||[];x.events.unshift({t:new Date().toLocaleString(),x:'Missed-dose escalation triggered: caregiver notification queued'});set(x);d.querySelector('#smEsc').innerHTML='<div class="sm-alert"><b>Escalation queued</b><br>Caregiver alert → pharmacist review → patient follow-up.</div>';toast('Caregiver escalation simulated');};
    d.querySelector('#smEmergency').onclick=()=>{const x=get();x.events=x.events||[];x.events.unshift({t:new Date().toLocaleString(),x:'Emergency contact action initiated'});set(x);d.querySelector('#smEsc').innerHTML='<div class="sm-danger"><b>Emergency workflow</b><br>In a production build this would call the configured emergency/caregiver service. No emergency call is made by this demo.</div>';};
    d.querySelector('#smFile').onchange=e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>{imageData=r.result;d.querySelector('#smPreview').innerHTML=`<img class="sm-preview" src="${imageData}" alt="Prescription preview"><div class="sm-banner"><b>Image captured.</b> Verify medicine names, strength and instructions with a pharmacist before activation.</div>`;d.querySelector('#smSubmit').disabled=false};r.readAsDataURL(f)};
    d.querySelector('#smSubmit').onclick=()=>{const x=get();x.events=x.events||[];x.events.unshift({t:new Date().toLocaleString(),x:'Prescription image submitted for pharmacist verification'});set(x);toast('Prescription sent to verification queue');d.querySelector('#smSubmit').disabled=true;};
  }
  function patchDoseButtons(){
    document.addEventListener('click',e=>{
      const t=e.target.closest('[data-take]');if(t){e.preventDefault();markDose(t.dataset.take,true);}
      const s=e.target.closest('[data-skip]');if(s){e.preventDefault();markDose(s.dataset.skip,false);}
    },{passive:false});
  }
  function installPWA(){
    const manifest={name:'Smart Med',short_name:'Smart Med',start_url:'./',display:'standalone',background_color:'#f4f7f6',theme_color:'#0b6b5e',description:'Smart medication reminders, adherence, refill and care-team workflow'};
    const blob=new Blob([JSON.stringify(manifest)],{type:'application/manifest+json'}),url=URL.createObjectURL(blob),link=document.createElement('link');link.rel='manifest';link.href=url;document.head.appendChild(link);
  }
  function boot(){inject();installPWA();addCompetitionButtons();patchDoseButtons();setInterval(reminderLoop,15000);reminderLoop();window.addEventListener('online',()=>toast('Smart Med is online'));window.addEventListener('offline',()=>toast('Offline mode: local medication data remains available'));}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();