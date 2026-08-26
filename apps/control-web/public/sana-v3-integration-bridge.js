(() => {
  'use strict';

  document.addEventListener('click',event=>{
    const saveButton=event.target.closest('#modal-save');
    if(!saveButton||typeof modalAction==='undefined'||modalAction!=='impact-methodology-review')return;
    const form=document.getElementById('modal-form');
    if(!form)return;
    const values=Object.fromEntries(new FormData(form).entries());
    let dossier={};
    try{dossier=JSON.parse(localStorage.getItem('sana.v3.capital.dossier')||'{}')}catch{}
    dossier.impactMethodologyReviewed=values.status==='reviewed';
    dossier.impactMethodologySource='sana.v3.impact.methodology';
    dossier.impactMethodologyLinkedAt=new Date().toISOString();
    dossier.localOnly=true;
    localStorage.setItem('sana.v3.capital.dossier',JSON.stringify(dossier));
  },true);
})();
