import { getBenchmarkSpecsByCategory } from '../src/msds-db.js';

const res = getBenchmarkSpecsByCategory('02-1');
console.log('Category:', res?.categoryName);
console.log('PPE Hand Standard:', res?.ppeHandSpecs?.standard);
console.log('FKM:', res?.ppeHandSpecs?.fkm);
console.log('Waste general:', res?.wasteDisposalSpecs?.general_law_cn);
console.log('Regulations count:', res?.regulatorySpecs?.regulations_cn?.length);
