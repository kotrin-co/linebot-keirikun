module.exports = {

  getYearParam: () => {
    //テスト用シフト（ここだけ変えれば良い）
    const testShift = 0;

    //年度計算
    let year = new Date().getFullYear();
    const thisMonth = new Date().getMonth()+1;
    const today = new Date().getDate();
    if(thisMonth<3 || (thisMonth === 3 && today< (16 + testShift))){
      year--;
    }

    return year;

    //年度スタートおよび終了のタイムスタンプ計算
    
    
    console.log('params',year,thisMonth,today,startPoint,endPoint);
  },

  getStartPoint: () => {
    //テスト用シフト（ここだけ変えれば良い）
    const testShift = 0;

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
    //テスト用シフト（ここだけ変えれば良い）
    const testShift = 0;

    //年度計算
    let year = new Date().getFullYear();
    const thisMonth = new Date().getMonth()+1;
    const today = new Date().getDate();
    if(thisMonth<3 || (thisMonth === 3 && today< (16 + testShift))){
      year--;
    }
    return endPoint = new Date(year+1,2,(16+testShift)).getTime();
  }
}