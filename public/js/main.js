window.onload = () => {
  const myLiffId = '1655219547-2QEXPwR1';
  const divPage = document.getElementById('input-page');
  const userLabel = document.getElementById('user-name');

  liff
    .init({
      liffId: myLiffId
    })
    .then(()=>{
      liff.getProfile()
        .then(profile=>{
          const lineId = profile.userId;
          userLabel.textContent = lineId;
        })
        .catch(err=>console.log(err));
    })
    .catch(err=>alert(JSON.stringify(err)));
}