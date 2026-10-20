// Local accessibility checks using an existing Playwright and axe-core installation.
const {chromium} = require(process.env.SANA_PLAYWRIGHT_PATH || 'playwright');
const fs = require('node:fs/promises');
const assert = require('node:assert/strict');
const axePath = process.env.SANA_AXE_PATH;
if (!axePath) throw new Error('Set SANA_AXE_PATH to an existing axe.min.js');
const output = process.env.SANA_A11Y_OUTPUT || '/private/tmp/sana-a11y';
(async()=>{
 await fs.mkdir(output,{recursive:true});
 const browser=await chromium.launch({headless:true});
 const reports=[];
 try {
  for(const width of [320,390,768,1280]){
   const ctx=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
   const page=await ctx.newPage();
   await page.goto('http://127.0.0.1:4175/apps/sana-project-demo/');
   await page.locator('#catalog-project-list button').waitFor();
   const audit=async(state)=>{
    await page.evaluate(await fs.readFile(axePath,'utf8'));
    const result=await page.evaluate(async(state)=>{
     const axeResult=await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}});
     const visible=[...document.querySelectorAll('body *')].filter(el=>el.getClientRects().length&&el.textContent.trim()&&[...el.childNodes].some(n=>n.nodeType===Node.TEXT_NODE&&n.textContent.trim()));
     const parseColor=(value)=>value.match(/[\d.]+/g).map(Number);
     const composite=(foreground,background)=>{const c=parseColor(foreground);const a=c[3]??1;return c.slice(0,3).map((v,i)=>Math.round(v*a+background[i]*(1-a)));};
     const luminance=(rgb)=>{const c=rgb.map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return .2126*c[0]+.7152*c[1]+.0722*c[2];};
     const contrast=(foreground,background)=>{const a=luminance(foreground),b=luminance(background);return Number(((Math.max(a,b)+.05)/(Math.min(a,b)+.05)).toFixed(2));};
     const manualContrast=[];
     if(state==='catalog'){
      const text=document.querySelector('.art-caption > span');
      const overlay=text.parentElement,base=overlay.parentElement;
      const background=composite(getComputedStyle(overlay).backgroundColor,parseColor(getComputedStyle(base).backgroundColor).slice(0,3));
      manualContrast.push({target:'.art-caption',foreground:getComputedStyle(text).color,background:`rgb(${background.join(', ')})`,ratio:contrast(parseColor(getComputedStyle(text).color),background)});
     }
     if(state==='participant'){
      for(const selector of ['#session-project-count','#session-reading-count','.session-overview__metrics > div:nth-child(3) > dd:nth-child(2)']){
       const text=document.querySelector(selector),card=text.parentElement,surface=card.closest('.session-overview');
       const background=composite(getComputedStyle(card).backgroundColor,parseColor(getComputedStyle(surface).backgroundColor).slice(0,3));
       manualContrast.push({target:selector,foreground:getComputedStyle(text).color,background:`rgb(${background.join(', ')})`,ratio:contrast(parseColor(getComputedStyle(text).color),background)});
      }
     }
     return {axeVersion:axe.version,violations:axeResult.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})),incomplete:axeResult.incomplete.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})),manualContrast,overflow:document.documentElement.scrollWidth>innerWidth,minText:Math.min(...visible.map(el=>parseFloat(getComputedStyle(el).fontSize)))};
    },state);
    reports.push({width,state,...result});
    await page.screenshot({path:`${output}/${width}-${state}.png`});
   };
   await audit('catalog');
   await page.locator('#nav-space').click();
   await audit('empty-participant');
   await page.locator('#nav-explore').click();
   await page.locator('#open-project-card').click();
   await page.locator('#read-content').waitFor({state:'visible'});
   await audit('project');
   if(width===390) {
    for(const id of ['project-structure','capital-model','field-reading']) await page.locator('#'+id).screenshot({path:`${output}/390-${id}-section.png`});
   }
   await page.locator('.project-nav a[href="#capital-model"]').click();
   const target=await page.locator('#capital-model').boundingBox();
   const header=await page.locator('.site-header').boundingBox();
   assert.ok(target.y>=header.height,`anchor obscured at ${width}`);
   await page.locator('#open-interest-secondary').click();
   await audit('interest');
   await page.getByRole('button',{name:'Ver confirmación simulada'}).click();
   await audit('validation-error');
   await page.locator('input[value="project-structure"]').check();
   await page.locator('#demo-acknowledgment').check();
   await page.getByRole('button',{name:'Ver confirmación simulada'}).click();
   await audit('confirmation');
   await page.locator('#view-demo-space').click();
   await audit('participant');
   await page.route('**/project-catalog-v1.json', route=>route.fulfill({status:503,body:'unavailable'}));
   await page.reload();
   await page.locator('#retry-catalog').waitFor({state:'visible'});
   await audit('catalog-error');
   await ctx.close();
  }
  await fs.writeFile(`${output}/result.json`,JSON.stringify(reports,null,2));
  console.log(JSON.stringify(reports.map(r=>({width:r.width,state:r.state,violations:r.violations,manualContrast:r.manualContrast,minText:r.minText,overflow:r.overflow})),null,2));
  assert.ok(reports.every(r=>!r.overflow),'unexpected horizontal overflow');
  assert.ok(reports.every(r=>r.minText>=14),'text smaller than the 14 px floor');
  assert.ok(reports.every(r=>r.violations.length===0),'automated accessibility violations');
  const manualContrast=reports.flatMap(r=>r.manualContrast);
  assert.ok(manualContrast.length>=4&&manualContrast.every(item=>item.ratio>=4.5),'manual contrast review below WCAG AA');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
