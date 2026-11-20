
function drawLuckyNumber() {
  return Math.floor(Math.random() * 16) + 1;
}

// ตัวอย่างการใช้งาน
const result = drawLuckyNumber();

console.log("เลขที่ได้รับ:", result);
