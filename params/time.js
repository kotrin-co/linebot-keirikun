//テスト用パラメータ
const {
  TEST_SHIFT
} = require('./params');

module.exports = {

  getYearParam: () => {

    //年度計算
    let year = new Date().getFullYear();
    const thisMonth = new Date().getMonth()+1;
    const today = new Date().getDate();
    if(thisMonth<3 || (thisMonth === 3 && today< (16 + TEST_SHIFT))){
      year--;
    }

    return year;
  },

  getStartPoint: () => {

    //年度計算
    let year = new Date().getFullYear();
    const thisMonth = new Date().getMonth()+1;
    const today = new Date().getDate();
    if(thisMonth<3 || (thisMonth === 3 && today< (16 + TEST_SHIFT))){
      year--;
    }
    return new Date(year,2,(16+TEST_SHIFT)).getTime();
  },

  getEndPoint: () => {

    //年度計算
    let year = new Date().getFullYear();
    const thisMonth = new Date().getMonth()+1;
    const today = new Date().getDate();
    if(thisMonth<3 || (thisMonth === 3 && today< (16 + TEST_SHIFT))){
      year--;
    }
    return new Date(year+1,2,(16+TEST_SHIFT)).getTime();
  }
}