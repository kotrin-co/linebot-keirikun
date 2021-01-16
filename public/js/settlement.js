const handleFetchResult = (result) => {
  if(!result.ok){
    return result.json()
      .then((json)=>{
        if(json.error && json.error.message){
          throw new Error(result.url + ' '+result.status+' '+json.error.message);
        }
      })
      .catch((err)=>{
        showErrorMessage(err);
        throw err;
      });
  }
  return result.json();
}

const createCheckoutSession = (priceId) => {
  return fetch('/create-checkout-session',{
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      priceId: priceId
    })
  })
  .then(handleFetchResult);
}

const handleResult = (result) => {
  if(result.error){
    showErrorMessage(result.error.message);
  }
}

const showErrorMessage = (message) => {
  const errorEl = document.getElementById('error-message');
  errorEl.textContent = message;
  errorEl.style.display = 'block';
}

fetch('/setup')
  .then(handleFetchResult)
  .then((json)=>{
    const publishableKey = json.publishableKey;
    const basicPriceId = json.basicPrice;
    const proPriceId = json.proPrice;

    const stripe = Stripe(publishableKey);

    document.getElementById('basic-plan-btn')
      .addEventListener('click',(e)=>{
        createCheckoutSession(basicPriceId)
          .then((data)=>{
            stripe
              .redirectToCheckout({
                sessionId: data.sessionId
              })
              .then(handleResult);
          });
      });
    
    document.getElementById('pro-plan-btn')
      .addEventListener('click',(e)=>{
        createCheckoutSession(proPriceId)
          .then((data)=>{
            stripe
              .redirectToCheckout({
                sessionId: data.sessionId
              })
              .then(handleResult);
          });
      });
  });