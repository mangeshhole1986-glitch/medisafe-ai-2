/* Smart Med Safety Engine v1
   Demo/educational decision support only. Not a substitute for a clinician/pharmacist or validated CDS database.
*/
(()=>{
'use strict';
const KEY='smartmed:v3';
const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9+ ]/g,' ').replace(/\s+/g,' ').trim();
const rules=[
 {a:['warfarin'],b:['ibuprofen','diclofenac','naproxen','aceclofenac','mefenamic acid','aspirin','clopidogrel'],sev:'Major',type:'Drug–drug',effect:'Increased bleeding risk',action:'Pharmacist/doctor review required.'},
 {a:['warfarin'],b:['clarithromycin','erythromycin','azithromycin'],sev:'Moderate',type:'Drug–drug',effect:'May increase anticoagulant effect/bleeding risk',action:'Check current INR and prescriber guidance.'},
 {a:['apixaban','rivaroxaban'],b:['ibuprofen','diclofenac','naproxen','aspirin','clopidogrel'],sev:'Major',type:'Drug–drug',effect:'Increased bleeding risk',action:'Review necessity and bleeding risk.'},
 {a:['clopidogrel'],b:['omeprazole','esomeprazole'],sev:'Moderate',type:'Drug–drug',effect:'May reduce clopidogrel activation',action:'Prescriber/pharmacist review recommended.'},
 {a:['sildenafil','tadalafil'],b:['nitroglycerin','isosorbide'],sev:'Contraindicated',type:'Drug–drug',effect:'Potential severe hypotension',action:'Do not combine without urgent specialist direction.'},
 {a:['tramadol','linezolid'],b:['sertraline','escitalopram','fluoxetine','duloxetine'],sev:'Major',type:'Drug–drug',effect:'Serotonin toxicity risk',action:'Urgent medication review.'},
 {a:['methotrexate'],b:['ibuprofen','diclofenac','naproxen','trimethoprim'],sev:'Major',type:'Drug–drug',effect:'Potential methotrexate toxicity',action:'Prescriber/pharmacist review required.'},
 {a:['telmisartan','losartan','olmesartan','ramipril'],b:['spironolactone'],sev:'Moderate',type:'Drug–drug',effect:'Hyperkalaemia risk',action:'Consider potassium/renal monitoring per clinician.'},
 {a:['levothyroxine'],b:['calcium','iron','magnesium','sucralfate'],sev:'Moderate',type:'Drug–food/supplement',effect:'Reduced levothyroxine absorption',action:'Separate administration according to product/clinician instructions.'},
 {a:['ciprofloxacin','ofloxacin','moxifloxacin'],b:['calcium','iron','magnesium'],sev:'Moderate',type:'Drug–food/supplement',effect:'Reduced antibiotic absorption for interacting minerals',action:'Check product-specific separation instructions.'},
 {a:['metronidazole'],b:['alcohol'],sev:'Major',type:'Drug–food',effect:'Potential adverse reaction',action:'Avoid alcohol during treatment and follow product guidance.'}
];
const diseaseRules=[
 {d:'asthma',drugs:['propranolol','atenolol','metoprolol'],sev:'Moderate',effect:'Beta-blockers may worsen bronchospasm in susceptible patients'},
 {d:'pregnancy',drugs:['warfarin','methotrexate'],sev:'Major',effect:'Potential fetal harm; specialist review required'},
 {d:'kidney disease',drugs:['ibuprofen','diclofenac','naproxen'],sev:'Major',effect:'NSAIDs may worsen renal function'},
 {d:'liver disease',drugs:['paracetamol'],sev:'Moderate',effect:'Dose/clinical context requires review'}
];
const allergies=['penicillin','amoxicillin','sulfa','sulfonamide','aspirin','nsaid','ibuprofen','latex'];
function matches(name,terms){let n=norm(name);return terms.some(t=>n.includes(norm(t)))}
function pair(a,b){return rules.filter(r=>(matches(a,r.a)&&matches(b,r.b))||(matches(a,r.b)&&matches(b,r.a)))}
function check(meds,opts={}){let out=[];const active=(meds||[]).map(x=>typeof x==='string'?x:x.name).filter(Boolean);for(let i=0;i<active.length;i++)for(let j=i+1;j<active.length;j++)pair(active[i],active[j]).forEach(r=>out.push({...r,medicines:[active[i],active[j]]}));
 if(opts.food) active.forEach(m=>pair(m,opts.food).forEach(r=>out.push({...r,medicines:[m,opts.food]})));
 if(opts.diseases) (opts.diseases||[]).forEach(d=>diseaseRules.filter(r=>norm(d).includes(r.d)).forEach(r=>active.forEach(m=>matches(m,r.drugs)&&out.push({sev:r.sev,type:'Drug–disease',effect:r.effect,action:'Clinician review recommended.',medicines:[m,d]}))));
 if(opts.allergies) active.forEach(m=>{if(opts.allergies.some(a=>matches(m,[a])))out.push({sev:'Major',type:'Allergy',effect:'Possible allergy match',action:'Do not assume tolerance; verify documented allergy and clinical record.',medicines:[m]})});
 return out;
}
window.SmartMedSafety={check,rules,diseaseRules};
function injectUI(){if(!document.body)return;const btn=document.createElement('button');btn.textContent='⚕ Safety Check';btn.className='sm-safety-btn';Object.assign(btn.style,{position:'fixed',right:'18px',bottom:'70px',zIndex:45,border:0,borderRadius:'999px',padding:'12px 15px',background:'#fff',color:'#0b6b5e',fontWeight:'900',boxShadow:'0 8px 24px #103b3525'});btn.onclick=()=>open();document.body.appendChild(btn)}
function open(){const d=JSON.parse(localStorage.getItem(KEY)||'{}');const meds=(d.meds||[]).filter(m=>m.active!==false&&m.status==='confirmed');const results=check(meds,{diseases:d.diseases||[],allergies:d.allergies||[]});const modal=document.createElement('div');modal.className='modal';const rows=results.length?results.map(r=>`<div class="row"><div><span class="pill ${r.sev==='Major'||r.sev==='Contraindicated'?'bad':'warn'}">${r.sev}</span> <b>${r.type}</b><div class="small">${r.medicines.join(' + ')}</div><div class="muted small">${r.effect}</div><div class="small">${r.action}</div></div></div>`).join(''):'<div class="empty">No alerts found in the current demo ruleset.</div>';modal.innerHTML=`<div class="sheet"><h2>⚕ Smart Safety Check</h2><p class="muted small">Screening current medicines against the app's embedded demo safety rules.</p>${rows}<div class="sm-danger" style="margin-top:12px;background:#fff8e8;border:1px solid #efd6a6;padding:12px;border-radius:12px"><b>Safety notice</b><br>Absence of an alert does not mean a combination is safe. This prototype is not a complete clinical interaction database. Verify against authoritative references and the patient's clinical record.</div><button class="btn outline" id="closeSafety" style="margin-top:12px">Close</button></div>`;document.body.appendChild(modal);modal.querySelector('#closeSafety').onclick=()=>modal.remove()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',injectUI);else injectUI();
})();