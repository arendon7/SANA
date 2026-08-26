(() => {
  'use strict';
  const SCHEMA='SANA_CAPTURE_SYNC_RUNTIME_BRIDGE_V1';
  const INTEGRITY='NEW_OFFLINE_QUEUE_LINK_EXPLICIT · LEGACY_QUEUE_UNCHANGED · LOCAL_CAPTURE ≠ SERVER_ACK · NO_NETWORK_TRANSPORT · NO_CANONICAL_WRITE';
  if(window.__SANA_CAPTURE_SYNC_RUNTIME_BRIDGE__)return;

  const original=window.saveModal;
  function linkNewEntries(beforeRecords,beforeQueue){
    if(!Array.isArray(storage?.records)||!Array.isArray(storage?.queue))return 0;
    const newRecords=storage.records.slice(beforeRecords);const newQueues=storage.queue.slice(beforeQueue);
    if(!newRecords.length||!newQueues.length)return 0;
    const record=newRecords.at(-1);let linked=0;
    for(const q of newQueues){
      if(q.recordId)continue;
      q.recordId=record.id;
      q.createdAt=q.createdAt||record.createdAt||new Date().toISOString();
      q.state=q.state||'PENDING_SERVER';
      q.provenance='CAPTURE_SYNC_RUNTIME_BRIDGE_V1';
      linked++;
    }
    if(linked&&typeof persist==='function')persist();
    return linked;
  }
  if(typeof original==='function'){
    window.saveModal=function(...args){
      const beforeRecords=storage?.records?.length||0;const beforeQueue=storage?.queue?.length||0;
      const result=original.apply(this,args);
      linkNewEntries(beforeRecords,beforeQueue);
      return result;
    };
  }
  window.__SANA_CAPTURE_SYNC_RUNTIME_BRIDGE__=Object.freeze({schema:SCHEMA,active:typeof original==='function',linkNewEntries,integrity:INTEGRITY});
})();
