/* Smart Med Drug Interaction Engine
 * Demo/decision-support layer. Not a substitute for pharmacist/doctor review.
 * Interaction content should be clinically validated before production use.
 */
(()=>{
'use strict';
const DB=[
['warfarin','ibuprofen','major','Bleeding risk may increase','Avoid/monitor closely; pharmacist review required.'],
['warfarin','diclofenac','major','Bleeding risk may increase','Avoid/monitor closely; pharmacist review required.'],
['warfarin','naproxen','major','Bleeding risk may increase','Avoid/monitor closely; pharmacist review required.'],
['warfarin','aspirin','major','Bleeding risk may increase','Assess indication and bleeding risk.'],
['warfarin','clopidogrel','major','Additive bleeding risk','Requires prescriber/pharmacist assessment.'],
['warfarin','clarithromycin','major','May increase anticoagulant effect','INR/bleeding monitoring may be required.'],
['warfarin','metronidazole','major','May increase anticoagulant effect','INR monitoring and dose assessment may be required.'],
['warfarin','amoxicillin + clavulanate','moderate','May alter anticoagulation control','Monitor INR when clinically appropriate.'],
['apixaban','ibuprofen','major','Additive bleeding risk','Avoid unless specifically directed and monitored.'],
['rivaroxaban','ibuprofen','major','Additive bleeding risk','Avoid unless specifically directed and monitored.'],
['apixaban','aspirin','major','Additive bleeding risk','Prescriber/pharmacist review required.'],
['rivaroxaban','aspirin','major','Additive bleeding risk','Prescriber/pharmacist review required.'],
['clopidogrel','omeprazole','moderate','May reduce clopidogrel activation','Consider an alternative acid-suppressing strategy with clinician input.'],
['clopidogrel','esomeprazole','moderate','May reduce clopidogrel activation','Consider an alternative acid-suppressing strategy with clinician input.'],
['sildenafil','nitroglycerin','contraindicated','Severe hypotension risk','Do not combine; urgent clinical review if exposure occurs.'],
['tadalafil','nitroglycerin','contraindicated','Severe hypotension risk','Do not combine; urgent clinical review if exposure occurs.'],
['sildenafil','isosorbide','contraindicated','Severe hypotension risk','Do not combine.'],
['tadalafil','isosorbide','contraindicated','Severe hypotension risk','Do not combine.'],
['sertraline','tramadol','major','Serotonin toxicity and seizure risk','Prescriber/pharmacist review required.'],
['fluoxetine','tramadol','major','Serotonin toxicity and seizure risk','Prescriber/pharmacist review required.'],
['escitalopram','tramadol','major','Serotonin toxicity risk','Prescriber/pharmacist review required.'],
['duloxetine','tramadol','major','Serotonin toxicity risk','Prescriber/pharmacist review required.'],
['linezolid','sertraline','contraindicated','Serotonin toxicity risk','Specialist/prescriber review required.'],
['linezolid','fluoxetine','contraindicated','Serotonin toxicity risk','Specialist/prescriber review required.'],
['methotrexate','ibuprofen','major','Potential methotrexate toxicity','Dose/regimen and renal function require clinical assessment.'],
['methotrexate','trimethoprim','major','Potential methotrexate toxicity','Prescriber/pharmacist review required.'],
['ramipril','spironolactone','major','Hyperkalemia and renal risk','Monitor potassium/renal function when clinically appropriate.'],
['losartan','spironolactone','major','Hyperkalemia and renal risk','Monitor potassium/renal function when clinically appropriate.'],
['telmisartan','spironolactone','major','Hyperkalemia and renal risk','Monitor potassium/renal function when clinically appropriate.'],
['levothyroxine','calcium','moderate','Reduced levothyroxine absorption','Separate administration according to product/clinician instructions.'],
['levothyroxine','iron','moderate','Reduced levothyroxine absorption','Separate administration according to product/clinician instructions.'],
['levothyroxine','magnesium','moderate','Reduced levothyroxine absorption','Separate administration according to product/clinician instructions.'],
['ciprofloxacin','calcium','moderate','Reduced antibiotic absorption','Separate administration according to product instructions.'],
['ciprofloxacin','iron','moderate','Reduced antibiotic absorption','Separate administration according to product instructions.'],
['ciprofloxacin','magnesium','moderate','Reduced antibiotic absorption','Separate administration according to product instructions.'],
['metronidazole','alcohol','major','Adverse reaction risk','Avoid alcohol during treatment and for the period specified by the product label.'],
['alprazolam','clonazepam','major','Additive CNS depression','Concurrent use requires clinician assessment.'],
['clonazepam','tramadol','major','Additive CNS/respiratory depression','Concurrent use requires clinician assessment.'],
['pregabalin','tramadol','major','Additive CNS/respiratory depression','Concurrent use requires clinician assessment.']
];
const norm=x=>String(x||'').toLowerCase().replace(/\s+/g,' ').trim();
const match=(a,b)=>{a=norm(a);b=norm(b);return a===b||a.includes(b)||b.includes(a)};
function check(a,b){return DB.filter(r=>(match(a,r[0])&&match(b,r[1]))||(match(a,r[1])&&match(b,r[0]))).map(r=>({drugA:a,drugB:b,level:r[2],effect:r[3],action:r[4]}))}
function checkList(names){const out=[];for(let i=0;i<names.length;i++)for(let j=i+1;j<names.length;j++)out.push(...check(names[i],names[j]));return out}
window.SmartMedInteractions={database:DB,check,checkList};
function style(){if(document.getElementById('smi-style'))return;const s=document.createElement('style');s.id='smi-style';s.textContent='.smi-major{background:#fae8e5;border:1px solid #e7b8b1}.smi-moderate{background:#fff3dc;border:1px solid #ecd39c}.smi-contraindicated{background:#f7d9d5;border:2px solid #c4372d}.smi-ok{background:#e7f6ed;border:1px solid #bfe3cb}.smi-box{padding:14px;border-radius:14px;margin:9px 0}.smi-tag{display:inline-block;padding:4px 8px;border-radius:99px;font-size:11px;font-weight:900;margin-right:6px}.smi-checker{margin-top:10px}.smi-checker select{margin-bottom:5px}';document.head.appendChild(s)}
function openChecker(){style();const names=[...new Set((JSON.parse(localStorage.getItem('smartmed:v3')||'{}').meds||[]).map(x=>x.name).filter(Boolean))];const options=['<option value="">Select medicine</option>',...names.map(n=>`<option>${n}</option>`)].join('');const box=document.createElement('div');box.className='modal';box.innerHTML=`<div class="sheet"><h2>⚕ Drug Interaction Checker</h2><p class="muted">Screens selected medicines against the Smart Med interaction knowledge base.</p><div class="card smi-checker"><label>Medicine 1<select id="smi-a">${options}</select></label><label>Medicine 2<select id="smi-b">${options}</select></label><button class="btn primary" id="smi-run">Check interaction</button></div><div id="smi-result"></div><p class="small muted">Decision-support only. Interaction data can vary by dose, indication, patient factors and product labeling. Confirm clinically significant results with a pharmacist/doctor.</p><button class="btn outline" id="smi-close">Close</button></div>`;document.body.appendChild(box);box.querySelector('#smi-close').onclick=()=>box.remove();box.querySelector('#smi-run').onclick=()=>{const a=box.querySelector('#smi-a').value,b=box.querySelector('#smi-b').value,r=check(a,b);box.querySelector('#smi-result').innerHTML=!a||!b?'<div class="smi-box smi-moderate">Select two medicines.</div>':r.length?r.map(x=>`<div class="smi-box smi-${x.level}"><span class="smi-tag">${x.level.toUpperCase()}</span><b>${x.drugA} + ${x.drugB}</b><p>${x.effect}</p><div class="small"><b>Suggested action:</b> ${x.action}</div></div>`).join(''):'<div class="smi-box smi-ok"><b>No interaction found in the current Smart Med knowledge base.</b><div class="small">This does not prove that no interaction exists.</div></div>'}}
function boot(){style();if(!document.getElementById('smi-open')){const b=document.createElement('button');b.id='smi-open';b.className='sm-fab';b.style.right='145px';b.textContent='⚕ Interactions';b.onclick=openChecker;document.body.appendChild(b)}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();