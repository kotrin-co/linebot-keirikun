//テスト用
const testShift = 0;

module.exports = {

  getYearParam: () => {

    //年度計算
    let year = new Date().getFullYear();
    const thisMonth = new Date().getMonth()+1;
    const today = new Date().getDate();
    if(thisMonth<3 || (thisMonth === 3 && today< (16 + testShift))){
      year--;
    }

    return year;
  },

  getStartPoint: () => {

    //年度計算
    let year = new Date().getFullYear();
    const thisMonth = new Date().getMonth()+1;
    const today = new Date().getDate();
    if(thisMonth<3 || (thisMonth === 3 && today< (16 + testShift))){
      year--;
    }
    return new Date(year,2,(16+testShift)).getTime();
  },

  getEndPoint: () => {

    //年度計算
    let year = new Date().getFullYear();
    const thisMonth = new Date().getMonth()+1;
    const today = new Date().getDate();
    if(thisMonth<3 || (thisMonth === 3 && today< (16 + testShift))){
      year--;
    }
    return new Date(year+1,2,(16+testShift)).getTime();
  }
}