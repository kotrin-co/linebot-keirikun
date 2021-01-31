const ACCOUNTS = ['売上','仕入','交通費','会議費','接待交際費','通信費','衣装費','消耗品費','荷造運賃','車両費','研修費','新聞図書費','外注工賃','広告宣伝費','諸会費','雑費','利子割引料','給料','雑給','従業員報酬','ｽﾀｯﾌ源泉所得税','家賃','水道光熱費','支払手数料','税理士・弁護士報酬','保険料','年金','雑収入','備品'];
const TRANSACTIONS = ['現金','振込・振替','クレカ'];

window.onload = () => {
  // import liff from '@line/liff';
  const myLiffId = '1655219547-2QEXPwR1';
  const divPage = document.getElementById('input-page');

  //備忘　課金してないとページを表示させない処理を入れること！！
  liff
    .init({
      liffId: myLiffId
    })
    .then(()=>{
      
      const idToken = liff.getIDToken();
      document.getElementById('top-font').innerHTML=`${idToken}`;
      const jsonData = JSON.stringify({
        id_token: idToken
      });
      fetch('/api/idToken',{
        method: 'POST',
        headers: {
          'Content-Type':'application/json'
        },
        body: jsonData,
        creadentials: 'same-origin'
      })
      .then(res=>{

      })
      .catch(e=>console.log(e));
      // liff.getProfile()
      //   .then(async(profile)=>{
      //     const lineId = profile.userId;
      //     const response = await fetch(`api?line_uid=${lineId}`);
      //     const data = await response.json();
          
      //     //利用可能チェック
      //     let available;
      //     switch(data.subscription){

      //       case '':
      //         available = false;
      //         break;
        
      //       case 'trial':
      //         const today = new Date().getTime();
      //         const registeredDate = data.timestamp;
      //         if((today-registeredDate)<FREE_TRIAL_PERIOD*24*60*60*1000){
      //           available = true;
      //         }else{
      //           available = false;
      //         }
      //         break;
            
      //       case 'guest':
      //         available = true;
      //         break;
            
      //       default:
      //         available = true;
      //         break;
      //     }

      //     //利用可能な場合に入力項目を表示する
      //     if(available){
      //       //タイトルテキスト
      //       document.getElementById('top-font').innerHTML=`${data.display_name}さん、会計データを入力してください！`;

      //       //form要素の生成
      //       const formElement = document.createElement('form');
      //       formElement.setAttribute('name','account-input');

      //       // 金額フォームの生成
      //       const div_form_amount = document.createElement('div');
      //       div_form_amount.setAttribute('class','form-group form-inline');

      //       const label_amount = document.createElement('label');
      //       label_amount.setAttribute('class','label-amount');
      //       label_amount.innerHTML = '金額：';
      //       div_form_amount.appendChild(label_amount);

      //       const input_amount = document.createElement('input');
      //       input_amount.setAttribute('type','text');
      //       input_amount.setAttribute('class','form-control amount-input');
      //       input_amount.setAttribute('name','amountInput');
      //       div_form_amount.appendChild(input_amount);

      //       formElement.appendChild(div_form_amount);

      //       //取引方法の選択
      //       const div_form_transaction = document.createElement('div');
      //       div_form_transaction.setAttribute('class','form-group form-inline');

      //       //取引方法ラベル
      //       const label_transaction = document.createElement('label');
      //       label_transaction.setAttribute('class','label-account');
      //       label_transaction.innerHTML = '取引方法：';
      //       div_form_transaction.appendChild(label_transaction);
            
      //       //取引方法のselect
      //       const select_transaction = document.createElement('select');
      //       select_transaction.setAttribute('class','form-control account-selector');
      //       select_transaction.setAttribute('name','selectedTransaction');
      //       TRANSACTIONS.forEach((transaction,index)=>{
      //         const option = document.createElement('option');
      //         option.innerHTML = transaction;
      //         option.value = index;
      //         select_transaction.appendChild(option);
      //       });
      //       select_transaction.selectedIndex = -1;
      //       div_form_transaction.appendChild(select_transaction);

      //       //勘定科目の選択
      //       const div_form_account = document.createElement('div');
      //       div_form_account.setAttribute('class','form-group form-inline');

      //       //勘定科目ラベル
      //       const label_account = document.createElement('label');
      //       label_account.setAttribute('class','label-account');
      //       label_account.innerHTML = '勘定科目：';
      //       div_form_account.appendChild(label_account);
            
      //       //勘定科目のselect
      //       const select_account = document.createElement('select');
      //       select_account.setAttribute('class','form-control account-selector');
      //       select_account.setAttribute('name','selectedAccount');
      //       ACCOUNTS.forEach((account,index)=>{
      //         const option = document.createElement('option');
      //         option.innerHTML = account;
      //         option.value = index;
      //         select_account.appendChild(option);
      //       });
      //       select_account.selectedIndex = -1;
      //       div_form_account.appendChild(select_account);
            
      //       //数字インプットでエンターを押した時に、科目選択にフォーカスされるようにする
      //       input_amount.onkeydown = (e) => {
      //         const key = e.keyCode || e.charCode || 0;
      //         if(key===13){
      //           select_account.focus();
      //           // e.preventDefault();
      //         }
      //       }

      //       //勘定科目を入力したら取引方法をリセットする
      //       select_account.addEventListener('change',()=>{
      //         //子ノードの全削除
      //         if(select_transaction.hasChildNodes()){
      //           while(select_transaction.childNodes.length>0){
      //             select_transaction.removeChild(select_transaction.firstChild);
      //           }
      //         }
      //         const l = select_account.selectedIndex === 27 ? 2:3;
      //         for(let i=0;i<l;i++){
      //           const option = document.createElement('option');
      //           option.innerHTML = (select_account.selectedIndex === 0 && i === l-1) ? '源泉所得税' : TRANSACTIONS[i];
      //           option.value = i;
      //           select_transaction.appendChild(option);
      //         }
      //         select_transaction.selectedIndex = -1;
      //       });

      //       //formElementへの追加
      //       formElement.appendChild(div_form_account);
      //       formElement.appendChild(div_form_transaction);

      //       //日時の選択
      //       const div_form_date = document.createElement('div');
      //       div_form_date.setAttribute('class','form-group form-inline');

      //       //日時ラベル
      //       const label_date = document.createElement('label');
      //       label_date.setAttribute('class','label-date');
      //       label_date.innerHTML = '日付：';
      //       div_form_date.appendChild(label_date);

      //       //月Select
      //       const select_month = document.createElement('select');
      //       select_month.setAttribute('class','form-control date-selector');
      //       select_month.setAttribute('name','selectedMonth');
      //       for(let i=0; i<12; i++){
      //         const option = document.createElement('option');
      //         option.innerHTML = i+1;
      //         option.value = i+1;
      //         select_month.appendChild(option);
      //       }
      //       select_month.selectedIndex = new Date().getMonth();
      //       div_form_date.appendChild(select_month);

      //       //月ラベル
      //       const label_month = document.createElement('label');
      //       label_month.setAttribute('class','label-month');
      //       label_month.innerHTML = '月';
      //       div_form_date.appendChild(label_month);

      //       //日Select
      //       const select_day = document.createElement('select');
      //       select_day.setAttribute('class','form-control date-selector');
      //       select_day.setAttribute('name','selectedDay');
      //       //その月の最終日を求める
      //       const lastDay = new Date(new Date().getFullYear(),new Date().getMonth()+1,0).getDate();
      //       for(let i=0; i<lastDay; i++){
      //         const option = document.createElement('option');
      //         option.innerHTML = i+1;
      //         option.value = i+1;
      //         select_day.appendChild(option);
      //       }
      //       select_day.selectedIndex = new Date().getDate() -1;
      //       div_form_date.appendChild(select_day);

      //       //日ラベル
      //       const label_day = document.createElement('label');
      //       label_day.setAttribute('class','label-day');
      //       label_day.innerHTML = '日';
      //       div_form_date.appendChild(label_day);

      //       formElement.appendChild(div_form_date);

      //       //月選択を入力したら日選択をリセットする
      //       select_month.addEventListener('change',()=>{
      //         //子ノードの全削除
      //         if(select_day.hasChildNodes()){
      //           while(select_day.childNodes.length>0){
      //             select_day.removeChild(select_day.firstChild);
      //           }
      //         }
      //         const l = new Date(new Date().getFullYear(),select_month.selectedIndex+1,0).getDate();
      //         for(let i=0;i<l;i++){
      //           const option = document.createElement('option');
      //           option.innerHTML = i+1;
      //           option.value = i+1;
      //           select_day.appendChild(option);
      //         }
      //         select_day.selectedIndex = -1;
      //       });

      //       //postボタン
      //       const postButton = document.createElement('input');
      //       postButton.type = 'button';
      //       postButton.value = 'データ送信';
      //       postButton.setAttribute('class','btn btn-primary post-button');
      //       postButton.addEventListener('click',()=>{
      //         const formData = new FormData(formElement);
      //         formData.append('line_uid',lineId);
      //         // console.log('formData',...formData.entries());

      //         //入力チェック
      //         let check = true;

      //         //金額入力値が適正か評価する
      //         const checkedInput = formData.get('amountInput').match(/^[+\-]?([1-9]\d*|0)$/);
      //         if(!checkedInput) check = false;

      //         //勘定科目が選択されているか
      //         if(select_account.selectedIndex === -1) check = false;

      //         //取引方法が入力されているか
      //         if(select_transaction.selectedIndex === -1) check = false;

      //         //月が入力されているか
      //         if(select_month.selectedIndex === -1) check = false;

      //         //日が入力されているか
      //         if(select_day.selectedIndex === -1) check = false;

      //         if(check){
      //           fetch('/api',{
      //             method:'POST',
      //             body:formData,
      //             credentials:'same-origin'
      //           })
      //           .then(response=>{
      //             if(response.ok){
      //               response.text()
      //                 .then(text=>{
      //                   alert(text);
      //                   //入力値のクリア
      //                   input_amount.value = '';
      //                   select_account.selectedIndex = -1;
      //                   select_transaction.selectedIndex = -1;
      //                   select_month.selectedIndex = -1;
      //                   select_day.selectedIndex = -1;
      //                 })
      //                 .catch(e=>console.log(e));
      //             }else{
      //               alert('HTTPレスポンスエラー');
      //             }
      //           })
      //           .catch(error=>{
      //             alert(error);
      //             throw error;
      //           });
      //         }else{
      //           alert('入力に不備があります');
      //         }
      //       });
      //       formElement.appendChild(postButton);

      //       divPage.appendChild(formElement);
      //     }else{
      //       document.getElementById('top-font').innerHTML=`${data.display_name}さん、<br>無料トライアルが終わってしまいました><<br>設定画面からご購入をお願いいたします！`;
      //     }
      //   })
      //   .catch(err=>console.log(err));
    })
    .catch(err=>alert(JSON.stringify(err)));
}