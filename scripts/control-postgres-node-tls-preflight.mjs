import net from 'node:net';
import tls from 'node:tls';
import assert from 'node:assert/strict';

const required=name=>{const value=process.env[name];if(!value)throw new Error(`ALPHA14_ENV_REQUIRED:${name}`);return value};
const host=required('ALPHA14_PG_HOST');
const port=Number(process.env.ALPHA14_PG_PORT||'5432');
const ca=Buffer.from(required('ALPHA14_PG_CA_B64'),'base64').toString('utf8');
const timeoutMs=5000;
const sslRequest=Buffer.alloc(8);sslRequest.writeInt32BE(8,0);sslRequest.writeInt32BE(80877103,4);
const withTimeout=(promise,label)=>Promise.race([promise,new Promise((_,reject)=>setTimeout(()=>reject(new Error(`${label}_TIMEOUT`)),timeoutMs))]);
const socket=await withTimeout(new Promise((resolve,reject)=>{const s=net.connect({host,port},()=>resolve(s));s.once('error',reject)}),'ALPHA14_TCP_CONNECT');
try{
  socket.write(sslRequest);
  const response=await withTimeout(new Promise((resolve,reject)=>{socket.once('data',resolve);socket.once('error',reject)}),'ALPHA14_SSL_RESPONSE');
  assert.equal(response[0],83,'POSTGRES_SSL_NOT_SUPPORTED');
  socket.removeAllListeners('data');socket.removeAllListeners('error');
  const secure=await withTimeout(new Promise((resolve,reject)=>{const s=tls.connect({socket,servername:host,ca,rejectUnauthorized:true},()=>resolve(s));s.once('error',reject)}),'ALPHA14_NODE_TLS_HANDSHAKE');
  try{
    assert.equal(secure.authorized,true,'NODE_TLS_NOT_AUTHORIZED');
    console.log('PASS_CONTROL_POSTGRES_NODE_TLS_PREFLIGHT',secure.getProtocol(),secure.getCipher()?.name,secure.servername);
  }finally{secure.destroy()}
}catch(error){socket.destroy();throw error}
