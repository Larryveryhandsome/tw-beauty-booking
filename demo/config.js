/* =====================================================================
 * 美業預約與會員關係系統 示範設定檔
 * ---------------------------------------------------------------------
 * 要換成你自己店裡的資料，原則上只要改這一個檔案：
 *   1. shopName / weekStart / todayIdx / nowMin   店名、示範日期與「現在」幾點
 *   2. hours        每週營業時間（星期一到日；「休」代表公休）
 *   3. step         排程格子大小（分鐘）
 *   4. categories   服務類別（美髮／美甲／美睫／美容）與顏色
 *   5. services     服務項目：名稱、類別、時長、價格、建議回訪週期（天）
 *   6. designers    設計師：藝名、頭銜、會做哪些類別、固定休假日
 *   7. commission   各類別的抽成比例、客人「指定設計師」的加成
 *   8. topups / packs  儲值方案與套票
 *   9. customers / bookings / history  示範客人、預約、當月業績
 *  10. gapDiscount  空檔優惠折數
 * 改完存檔，重新整理網頁即可。所有資料都是示範用的虛構資料，
 * 電話一律 0900-000-xxx。
 * ===================================================================== */
window.BEAUTY_CONFIG = {
  // 1. 店名與示範日期（2026/11/23 是星期一；今天設在星期三 12:00）
  shopName: '示範美學館',
  weekStart: [2026, 11, 23],
  todayIdx: 2,          // 0=週一 … 6=週日；7 以上是下一週
  nowMin: 12 * 60,      // 現在幾點（分鐘數）：12:00

  // 2. 營業時間：依序是 週一～週日
  hours: ['休', '10:00-20:00', '10:00-20:00', '10:00-20:00', '10:00-20:00', '10:00-20:00', '10:00-19:00'],

  // 3. 排程格子（分鐘）。服務時長原則上要是這個數字的倍數
  step: 30,

  // 4. 服務類別（color 在 demo 裡是配色參考，實際配色由樣式表控制）
  categories: {
    hair: { name: '美髮', css: 'hair' },
    nail: { name: '美甲', css: 'nail' },
    lash: { name: '美睫', css: 'lash' },
    skin: { name: '美容', css: 'skin' }
  },

  // 5. 服務項目：cycle 是「建議回訪週期（天）」，後台可以自己改
  services: [
    { id: 'cut',    name: '剪髮',     cat: 'hair', dur: 60,  price: 800,  cycle: 35  },
    { id: 'dye',    name: '染髮',     cat: 'hair', dur: 150, price: 2800, cycle: 42  },   // 補染約 6 週
    { id: 'perm',   name: '燙髮',     cat: 'hair', dur: 180, price: 3500, cycle: 120 },
    { id: 'treat',  name: '護髮',     cat: 'hair', dur: 60,  price: 1200, cycle: 30  },
    { id: 'gel',    name: '凝膠美甲', cat: 'nail', dur: 90,  price: 1200, cycle: 25  },   // 約 3～4 週
    { id: 'lash',   name: '日系美睫', cat: 'lash', dur: 90,  price: 1300, cycle: 21  },
    { id: 'refill', name: '補睫',     cat: 'lash', dur: 60,  price: 900,  cycle: 21  },   // 約 3 週
    { id: 'facial', name: '臉部保養', cat: 'skin', dur: 60,  price: 1600, cycle: 28  },
    { id: 'deep',   name: '深層淨膚', cat: 'skin', dur: 90,  price: 2000, cycle: 28  }
  ],
  recallLead: 3,        // 週期前幾天就開始列入回訪提醒清單

  // 6. 設計師：cats＝會做哪些類別；off＝固定休假日（0=週一…6=週日）
  designers: [
    { id: 'amy',   name: 'Amy',   title: '資深髮型師', cats: ['hair'],         off: [1] },
    { id: 'ken',   name: 'Ken',   title: '髮型師',     cats: ['hair'],         off: [6] },
    { id: 'mia',   name: 'Mia',   title: '美甲師',     cats: ['nail'],         off: [1] },
    { id: 'joy',   name: 'Joy',   title: '美甲／美睫', cats: ['nail', 'lash'], off: [2] },
    { id: 'luna',  name: 'Luna',  title: '美睫師',     cats: ['lash'],         off: [6] },
    { id: 'chloe', name: 'Chloe', title: '美容師',     cats: ['skin'],         off: [1] }
  ],

  // 7. 抽成：各類別比例；客人「指定」該設計師時，再加 requestBonus
  commission: { hair: 0.40, nail: 0.45, lash: 0.45, skin: 0.40, requestBonus: 0.05 },

  // 8. 儲值方案與套票
  topups: [
    { id: 't5',  amount: 5000,  bonus: 500  },
    { id: 't10', amount: 10000, bonus: 1500 },
    { id: 't20', amount: 20000, bonus: 4000 }
  ],
  packs: [
    { id: 'lashpack',   name: '補睫 6 次卡',     svcIds: ['refill'], times: 6, price: 4800 },
    { id: 'gelpack',    name: '凝膠美甲 5 次卡', svcIds: ['gel'],    times: 5, price: 5400 },
    { id: 'facialpack', name: '臉部保養 4 次卡', svcIds: ['facial'], times: 4, price: 5600 }
  ],

  // 9a. 示範客人：last＝每個項目「距離上次做幾天」；stored＝儲值金餘額；packs＝持有的套票剩餘次數
  customers: [
    { id: 'c1',  name: '小雅',   phone: '0900-000-001', stored: 3200,  last: { dye: 40, cut: 12 },    packs: [] },
    { id: 'c2',  name: 'Emily',  phone: '0900-000-002', stored: 0,     last: { refill: 22 },          packs: [{ pid: 'lashpack', left: 3 }] },
    { id: 'c3',  name: '佩佩',   phone: '0900-000-003', stored: 5600,  last: { gel: 27 },             packs: [] },
    { id: 'c4',  name: '阿凱',   phone: '0900-000-004', stored: 0,     last: { cut: 41 },             packs: [] },
    { id: 'c5',  name: 'Joanna', phone: '0900-000-005', stored: 1500,  last: { facial: 30 },          packs: [] },
    { id: 'c6',  name: '小文',   phone: '0900-000-006', stored: 0,     last: { gel: 10 },             packs: [{ pid: 'gelpack', left: 2 }] },
    { id: 'c7',  name: 'Cindy',  phone: '0900-000-007', stored: 8200,  last: { treat: 33, perm: 60 }, packs: [] },
    { id: 'c8',  name: '芊芊',   phone: '0900-000-008', stored: 0,     last: { lash: 15 },            packs: [] },
    { id: 'c9',  name: 'Tina',   phone: '0900-000-009', stored: 2600,  last: { dye: 52 },             packs: [] },
    { id: 'c10', name: '怡君',   phone: '0900-000-010', stored: 400,   last: { deep: 45 },            packs: [] },
    { id: 'c11', name: 'Sandy',  phone: '0900-000-011', stored: 0,     last: { gel: 20 },             packs: [] },
    { id: 'c12', name: 'Grace',  phone: '0900-000-012', stored: 12000, last: { facial: 12, cut: 20 }, packs: [{ pid: 'facialpack', left: 3 }] },
    { id: 'c13', name: '小航',   phone: '0900-000-013', stored: 0,     last: { cut: 30 },             packs: [] },
    { id: 'c14', name: 'Betty',  phone: '0900-000-014', stored: 0,     last: { lash: 40 },            packs: [] }
  ],

  // 9b. 示範預約：星期|設計師|開始|項目|客人|是否指定(1/0)|狀態(可省略，done＝已完成)
  //     第 0 欄的數字 0～13：0 是示範週的星期一，7 是下一週星期一
  bookings: `
1|ken|11:00|cut|c9|1|done
1|luna|14:00|refill|c10|0|done
2|ken|10:00|cut|c13|1|done
2|amy|10:00|treat|c4|0|done
2|mia|14:00|gel|c3|1
2|luna|13:30|refill|c2|0
2|chloe|15:00|facial|c8|0
2|ken|15:00|treat|c11|0
3|ken|10:30|cut|c1|1
3|ken|13:00|perm|c7|1
3|ken|16:30|cut|c12|1
3|amy|10:00|treat|c13|1
3|amy|15:30|cut|c8|0
3|mia|11:00|gel|c6|0
3|luna|14:00|refill|c11|0
3|chloe|13:00|deep|c12|0
4|ken|10:00|dye|c14|1
4|ken|14:30|cut|c6|0
4|amy|11:00|perm|c5|1
4|mia|12:00|gel|c11|0
4|joy|11:00|lash|c3|1
4|luna|15:00|refill|c8|0
4|chloe|11:00|facial|c9|1
5|amy|10:00|dye|c13|1
5|amy|14:00|cut|c1|1
5|ken|11:00|perm|c10|0
5|mia|10:00|gel|c14|0
5|mia|13:00|gel|c12|1
5|joy|10:00|lash|c5|0
5|luna|11:00|refill|c4|1
5|luna|14:00|lash|c6|0
5|chloe|10:00|facial|c7|1
5|chloe|13:00|deep|c11|0
6|amy|10:00|cut|c2|1
6|amy|12:00|treat|c6|0
6|mia|14:00|gel|c4|0
6|joy|11:00|refill|c7|0
`,

  // 9c. 本月累計業績（示範資料）：設計師|項目|單數|其中客人指定的單數
  history: `
amy|cut|22|14
amy|dye|12|8
amy|perm|5|3
amy|treat|9|4
ken|cut|20|12
ken|dye|10|6
ken|perm|4|3
ken|treat|8|3
mia|gel|38|22
joy|gel|24|10
joy|lash|15|8
joy|refill|20|9
luna|lash|18|11
luna|refill|30|16
chloe|facial|20|12
chloe|deep|12|7
`,
  historyLabel: '11 月累計（1～25 日，示範資料）',

  // 10. 空檔優惠：0.9 ＝ 9 折（選配功能）
  gapDiscount: 0.9,

  // 一鍵示範：誰請假、哪一天（星期三＋1＝星期四）
  demo: { leaveDesigner: 'ken', leaveDay: 3 }
};
