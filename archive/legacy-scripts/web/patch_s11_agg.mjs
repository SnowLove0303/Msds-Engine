import fs from 'fs';
let content = fs.readFileSync('./src/smart-matching.js', 'utf8');
const isCrlf = content.includes('\r\n');
if (isCrlf) content = content.replace(/\r\n/g, '\n');

const targetAnchor = `          repItem.value = repItem.value.replace(/\\r\\n|\\r/g, '\\n').trim();
        }
      }
    }`;

const newAddition = `          repItem.value = repItem.value.replace(/\\r\\n|\\r/g, '\\n').trim();
        }
      }

      // Section 11 附加信息聚合：若存在多个附加信息或重复剂量中毒未匹配项，统合至 additional_info
      let addInfoSlot = matchedRows.find((r) => r.key === 'additional_info');
      const extraAddInfoRows = matchedRows.filter((r) => r !== addInfoSlot && (/重复剂量|病理变化|附加信息|饮酒精/i.test(r.value || '') || /重复剂量/i.test(r.standardLabel || '')));
      if (extraAddInfoRows.length > 0) {
        const parts = [];
        if (addInfoSlot && addInfoSlot.value) parts.push(addInfoSlot.value.trim());
        for (const extra of extraAddInfoRows) {
          if (extra.value) parts.push(extra.value.trim());
        }
        if (!addInfoSlot) {
          addInfoSlot = {
            key: 'additional_info',
            slotId: 's11:additional_info',
            standardLabel: '11.9  附加信息：',
            conditionQualifier: '',
            value: parts.join('\\n\\n'),
            status: 'MATCHED',
            confidence: 0.95,
          };
          matchedRows.push(addInfoSlot);
        } else {
          addInfoSlot.value = parts.join('\\n\\n');
          addInfoSlot.status = 'MATCHED';
        }
      }
    }`;

if (!content.includes(targetAnchor)) {
  console.log('targetAnchor not found!');
  process.exit(1);
}

content = content.replace(targetAnchor, newAddition);
if (isCrlf) content = content.replace(/\n/g, '\r\n');

fs.writeFileSync('../scratch/smart-matching.proposed.js', content, 'utf8');
console.log('Successfully created ../scratch/smart-matching.proposed.js');
