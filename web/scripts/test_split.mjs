import { safeColonSplit, resolveSlotBySemantics } from '../src/smart-matching.js';

console.log(resolveSlotBySemantics('安全操作', 7));
console.log(resolveSlotBySemantics('安全储存', 7));
console.log(resolveSlotBySemantics('误服', 4));
console.log(resolveSlotBySemantics('接触眼睛', 4));
console.log(resolveSlotBySemantics('合适的灭火剂', 5));
console.log(resolveSlotBySemantics('不合适的灭火剂', 5));
