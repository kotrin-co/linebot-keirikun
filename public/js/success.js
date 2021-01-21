const urlParams = new URLSearchParams(window.location.search);
const sessionId = urlParams.get('session_id');
let customerId;

if(sessionId){
  let subscription;
  fetch('/checkout-session?sessionId='+sessionId)
    .then((result)=>{
      return result.json();
    })
    .then((session)=>{
      customerId = session.customer;
      const sessionJSON = JSON.stringify(session,null,2);
      document.querySelector('pre').textContent = sessionJSON;
      subscription = session.subscription;
    })
    .catch(err=>{
      console.log('Error when fetching Checkout session', err);
    });

    // const manageBillingForm = document.querySelector('#manage-billing-form');
    // manageBillingForm.addEventListener('submit',(e)=>{
    //   e.preventDefault();
    //   fetch('/customer-portal',{
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json'
    //     },
    //     body: JSON.stringify({
    //       sessionId: sessionId
    //     })
    //   })
    //   .then(response=>response.json())
    //   .then(data=>{
    //     window.location.href=data.url;
    //   })
    //   .catch(error=>{
    //     console.error('error:',error);
    //   });
    // });

    // const cancelButton = document.getElementById('cancel-button').addEventListener('click',(e)=>{
    //   e.preventDefault();
    //   fetch(`/cancel-subscription?sub=${subscription}`);
    // })
}