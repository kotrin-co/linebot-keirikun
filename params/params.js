//年度計算
const nowTimestamp = new Date().getTime();
let year;
const thisMonth = new Date(nowTimestamp+9*60*60*1000).getMonth()+1;
const today = new Date(nowTimestamp+9*60*60*1000).getDate();
if(thisMonth<3 || (thisMonth === 3 && today<14)){
  year = new Date(nowTimestamp+9*60*60*1000).getFullYear() - 1;
}else{
  year = new Date(nowTimestamp+9*60*60*1000).getFullYear();
}

module.exports = {
  ACCOUNTS: ['売上','仕入','交通費','会議費','接待交際費','通信費','衣装費','消耗品費','荷造運賃','車両費','研修費','新聞図書費','外注工賃','広告宣伝費','諸会費','雑費','利子割引料','給料','雑給','従業員報酬','ｽﾀｯﾌ源泉所得税','家賃','水道光熱費','支払手数料','税理士・弁護士報酬','保険料','年金','雑収入','備品'],
  DEBITS:[
    '現金','普通預金','事業主貸', //売上
    '仕入','仕入','仕入', //仕入
    '旅費交通費','旅費交通費','旅費交通費', //交通費
    '会議費','会議費','会議費', //会議費
    '接待交際費','接待交際費','接待交際費', //接待交際費
    '通信費','通信費','通信費', //通信費
    '消耗品費','消耗品費','消耗品費', //衣装費
    '消耗品費','消耗品費','消耗品費', //消耗品費
    '荷造運賃','荷造運賃','荷造運賃', //荷造運賃
    '車両費','車両費','車両費', //車両費
    '研修費','研修費','研修費', //研修費
    '新聞図書費','新聞図書費','新聞図書費', //新聞図書費
    '外注工賃','外注工賃','外注工賃', //外注工賃
    '広告宣伝費','広告宣伝費','広告宣伝費', //広告宣伝費
    '諸会費','諸会費','諸会費', //諸会費
    '雑費','雑費','雑費', //雑費
    '利子割引料','利子割引料','利子割引料', //利子割引料
    '給料','給料','給料', //給料
    '雑給','雑給','雑給', //雑給
    '従業員報酬','従業員報酬','従業員報酬', //従業員報酬
    '仮払税金','仮払税金','仮払税金', //スタッフ源泉所得税
    '地代家賃','地代家賃','地代家賃', //家賃
    '水道光熱費','水道光熱費','水道光熱費', //水道光熱費
    '支払手数料','支払手数料','支払手数料', //支払手数料
    '税理士弁護士報酬','税理士弁護士報酬','税理士弁護士報酬', //税理士弁護士報酬
    '事業主貸','事業主貸','事業主貸', //保険料
    '事業主貸','事業主貸','事業主貸', //年金
    '現金','普通預金', //雑収入
    '備品','備品','備品' //備品
  ],
  CREDITS:[
    '売上高','売上高','売上高', //売上
    '現金','普通預金','事業主借', //仕入
    '現金','普通預金','事業主借', //交通費
    '現金','普通預金','事業主借', //接待交際費
    '現金','普通預金','事業主借', //通信費
    '現金','普通預金','事業主借', //衣装費
    '現金','普通預金','事業主借', //消耗品費
    '現金','普通預金','事業主借', //荷造運賃
    '現金','普通預金','事業主借', //車両費
    '現金','普通預金','事業主借', //研修費
    '現金','普通預金','事業主借', //新聞図書費
    '現金','普通預金','事業主借', //外注工賃
    '現金','普通預金','事業主借', //広告宣伝費
    '現金','普通預金','事業主借', //諸会費
    '現金','普通預金','事業主借', //交通費
    '現金','普通預金','事業主借', //雑費
    '現金','普通預金','事業主借', //利子割引料
    '現金','普通預金','事業主借', //給料
    '現金','普通預金','事業主借', //雑給
    '現金','普通預金','事業主借', //従業員報酬
    '現金','普通預金','事業主借', //スタッフ源泉所得税
    '現金','普通預金','事業主借', //家賃
    '現金','普通預金','事業主借', //水道光熱費
    '現金','普通預金','事業主借', //支払手数料
    '現金','普通預金','事業主借', //税理士・弁護士報酬
    '現金','普通預金','事業主借', //保険料
    '現金','普通預金','事業主借', //年金
    '雑収入','普通預金', //雑収入
    '現金','普通預金','事業主借', //備品
  ],
  NUMBER_OF_ROWS: 4,
  NUMBER_OF_COLUMNS: 2,
  BUTTON_COLOR: '#434DFF',
  BUTTON_COLOR_D: '#CC0000',
  TRANSACTIONS: ['現金','振込・振替','クレカ'],
  original_SSID_0: '13Y2AZYNHWnQNKdSzK5Vxna_YPdf4YnT61imptdiM_MU',
  original_SSID_1: '1HWs2SBoh8ElvvA0MC7W7UT9zMsfEtE495mzpmCNeQYI', //閏年用
  original_SID: [0,1786699057,251943700,1686142823,661995045,1312117404,550715539],
  FREE_TRIAL_PERIOD: 0.007, //無料試用期間→日数単位で書く
  ADMIN: 'kentaro523@gmail.com',
  CORRECTED_YEAR: year
}