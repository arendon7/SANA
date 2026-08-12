import type { CapitalTotals, PortfolioProjectSummary } from '@agroway/invest-control-contracts';
function checked(value:number,code:string):void{if(!Number.isSafeInteger(value)||value<0)throw new Error(`${code}: invalid minor units`)}
function add(a:number,b:number,code:string):number{checked(a,code);checked(b,code);const x=a+b;if(!Number.isSafeInteger(x))throw new Error(`${code}: safe-integer overflow`);return x}
function bps(n:number,d:number):number{
  checked(n,'BPS_NUMERATOR');checked(d,'BPS_DENOMINATOR');if(d<=0)return 0;
  const value=(BigInt(n)*10000n+BigInt(d)/2n)/BigInt(d);const out=Number(value);if(!Number.isSafeInteger(out))throw new Error('BPS_OVERFLOW');return out;
}
export function aggregateCapital(projects:readonly PortfolioProjectSummary[]):readonly CapitalTotals[]{
  const by=new Map<string,{requiredMinor:number;committedMinor:number;deployedMinor:number;recoveredMinor:number}>();
  for(const p of projects){
    if(!/^[A-Z]{3}$/.test(p.currency))throw new Error('CURRENCY_CODE_INVALID');
    const x=by.get(p.currency)??{requiredMinor:0,committedMinor:0,deployedMinor:0,recoveredMinor:0};
    x.requiredMinor=add(x.requiredMinor,p.requiredMinor,'PORTFOLIO_REQUIRED');x.committedMinor=add(x.committedMinor,p.committedMinor,'PORTFOLIO_COMMITTED');
    x.deployedMinor=add(x.deployedMinor,p.deployedMinor,'PORTFOLIO_DEPLOYED');x.recoveredMinor=add(x.recoveredMinor,p.recoveredMinor,'PORTFOLIO_RECOVERED');by.set(p.currency,x);
  }
  return [...by.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([currency,x])=>({currency,...x,capitalCoverageBps:bps(x.committedMinor,x.requiredMinor),deploymentBps:bps(x.deployedMinor,x.requiredMinor),recoveryMultipleBps:bps(x.recoveredMinor,x.deployedMinor)}));
}
