const ACCOUNTS = ['収入','売上','支出','源泉所得税','交通費','会議費','接待交際費','通信費','衣装費','郵便代','保険料','年金','家賃','従業員報酬','その他'];

window.onload = () => {
  // import liff from '@line/liff';
  const myLiffId = '1655219547-2QEXPwR1';
  const divPage = document.getElementById('input-page');

  liff
    .init({
      liffId: myLiffId
    })
    .then(()=>{
      liff.getProfile()
        .then(async(profile)=>{
          const lineId = profile.userId;
          const response = await fetch(`api?line_uid=${lineId}`);
          const data = await response.json();
          document.getElementById('user-name').innerHTML=`${data.display_name}さん、会計データを入力してください`;

          //form要素の生成
          const formElement = document.createElement('form');
          formElement.setAttribute('name','account-input');

          // 金額フォームの生成
          const div_form_amount = document.createElement('div');
          div_form_amount.setAttribute('class','form-group form-inline');

          const label_amount = document.createElement('label');
          label_amount.setAttribute('class','label-amount');
          label_amount.innerHTML = '金額：';
          div_form_amount.appendChild(label_amount);

          const input_amount = document.createElement('input');
          input_amount.setAttribute('type','text');
          input_amount.setAttribute('class','form-control amount-input');
          input_amount.setAttribute('name','amountInput');
          div_form_amount.appendChild(input_amount);

          formElement.appendChild(div_form_amount);

          //勘定科目の選択
          const div_form_account = document.createElement('div');
          div_form_account.setAttribute('class','form-group form-inline');

          //勘定科目ラベル
          const label_account = document.createElement('label');
          label_account.setAttribute('class','label-account');
          label_account.innerHTML = '勘定科目：';
          div_form_account.appendChild(label_account);
          
          //勘定科目のselect
          const select_account = document.createElement('select');
          select_account.setAttribute('class','form-control account-selector');
          select_account.setAttribute('name','accountSelect');
          ACCOUNTS.forEach(account=>{
            const option = document.createElement('option');
            option.innerHTML = account;
            option.value = account;
            select_account.appendChild(option);
          });
          select_account.selectedIndex = -1;
          div_form_account.appendChild(select_account);
          formElement.appendChild(div_form_account);
          
          input_amount.onkeydown = (e) => {
            const key = e.keyCode || e.charCode || 0;
            if(key===13){
              select_account.focus();
              // e.preventDefault();
            }
          }

          //日時の選択
          const div_form_date = document.createElement('div');
          div_form_date.setAttribute('class','form-group form-inline');

          //日時ラベル
          const label_date = document.createElement('label');
          label_date.setAttribute('class','label-date');
          label_date.innerHTML = '日付：';
          div_form_date.appendChild(label_date);

          //月Select
          const select_month = document.createElement('select');
          select_month.setAttribute('class','form-control date-selector');
          select_month.setAttribute('name','selectedMonth');
          for(let i=0; i<12; i++){
            const option = document.createElement('option');
            option.innerHTML = i+1;
            option.value = i+1;
            select_month.appendChild(option);
          }
          select_month.selectedIndex = new Date().getMonth();
          div_form_date.appendChild(select_month);

          //月ラベル
          const label_month = document.createElement('label');
          label_month.setAttribute('class','label-month');
          label_month.innerHTML = '月';
          div_form_date.appendChild(label_month);

          //日Select
          const select_day = document.createElement('select');
          select_day.setAttribute('class','form-control date-selector');
          select_day.setAttribute('name','selectedDay');
          //その月の最終日を求める
          // const lastDay = new Date(new Date().getFullYear(),new Date().getMonth()+1,0).getDate();
          for(let i=0; i<31; i++){
            const option = document.createElement('option');
            option.innerHTML = i+1;
            option.value = i+1;
            select_day.appendChild(option);
          }
          select_day.selectedIndex = new Date().getDate() -1;
          div_form_date.appendChild(select_day);

          //日ラベル
          const label_day = document.createElement('label');
          label_day.setAttribute('class','label-day');
          label_day.innerHTML = '日';
          div_form_date.appendChild(label_day);

          formElement.appendChild(div_form_date);

          //postボタン
          const postButton = document.createElement('input');
          postButton.type = 'button';
          postButton.value = 'データ送信';
          postButton.setAttribute('class','btn btn-primary post-button');
          postButton.addEventListener('click',()=>{
            const formData = new FormData(formElement);
            formData.append('line_uid',lineId);
            // console.log('formData',...formData.entries());

            //金額入力値が適正か評価する
            const checkedInput = formData.get('amountInput').match(/^([1-9]\d*|0)$/);
            if(checkedInput){
              fetch('/api',{
                method:'POST',
                body:formData,
                credentials:'same-origin'
              })
              .then(response=>{
                if(response.ok){
                  response.text()
                    .then(text=>{
                      alert(text);
                      //入力値のクリア
                      input_amount.value = '';
                      select_account.selectedIndex = -1;
                      select_month.selectedIndex = -1;
                      select_day.selectedIndex = -1;
                    })
                    .catch(e=>console.log(e));
                }else{
                  alert('HTTPレスポンスエラー');
                }
              })
              .catch(error=>{
                alert(error);
                throw error;
              });
            }else{
              alert('金額には半角数値を入力してください');
            }
          });
          formElement.appendChild(postButton);

          divPage.appendChild(formElement);

        })
        .catch(err=>console.log(err));
    })
    .catch(err=>alert(JSON.stringify(err)));
}