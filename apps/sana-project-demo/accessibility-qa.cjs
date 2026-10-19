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
    const result=await page.evaluate(async()=>{
     const axeResult=await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}});
     const visible=[...document.querySelectorAll('body *')].filter(el=>el.getClientRects().length&&el.textContent.trim()&&[...el.childNodes].some(n=>n.nodeType===Node.TEXT_NODE&&n.textContent.trim()));
     return {axeVersion:axe.version,violations:axeResult.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})),incomplete:axeResult.incomplete.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})),overflow:document.documentElement.scrollWidth>innerWidth,minText:Math.min(...visible.map(el=>parseFloat(getComputedStyle(el).fontSize)))};
    });
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
  console.log(JSON.stringify(reports.map(r=>({width:r.width,state:r.state,violations:r.violations,minText:r.minText,overflow:r.overflow})),null,2));
  assert.ok(reports.every(r=>!r.overflow),'unexpected horizontal overflow');
  assert.ok(reports.every(r=>r.minText>=14),'text smaller than the 14 px floor');
  assert.ok(reports.every(r=>r.violations.length===0),'automated accessibility violations');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
