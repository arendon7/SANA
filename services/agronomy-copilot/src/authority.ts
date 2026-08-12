import type {CopilotInquiry} from './model.js';
const transactional=/\b(approve|approved|authorize|authorized|execute|executed|apply now|purchase|order|disburse|deploy capital|resolve alert|suppress alert)\b/i;
export function assertAdvisoryOnly(inquiry:CopilotInquiry):void{if(transactional.test(inquiry.question))throw new Error('COPILOT_TRANSACTIONAL_INTENT_DENIED');}
