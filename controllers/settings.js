module.exports = {

  setup: (req,res) => {
    res.send({
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
      monthlyPrice: process.env.MONTHLY_PRICE_ID,
      yearlyPrice: process.env.YEARLY_PRICE_ID
    });
  },

  createCheckoutSession: async (req,res) => {
    const domainURL = 'https://lienbot-keiri.herokuapp.com';
    const { priceId } = req.body;
    
    try{
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1
          }
        ],
        // success_url: 'https://linebot-keiri.herokuapp.com/success?session_id={CHECKOUT_SESSION_ID}',
        success_url: 'https://liff.line.me/1655219547-2EG4LMYx?session_id={CHECKOUT_SESSION_ID}',
        cancel_url: `${domainURL}/canceled`
      });
      console.log('session',session);
      res.send({
        sessionId: session.id
      });

    }catch(e){
      res.status(400);
      return res.send({
        error: {
          message: e.message
        }
      });
    }
  }
}