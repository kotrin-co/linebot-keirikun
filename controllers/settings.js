//stripeの設定
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

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
        success_url: 'https://liff.line.me/1655219547-eobVGLdB?session_id={CHECKOUT_SESSION_ID}',
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
  },

  checkoutSession: async (req,res) => {
    const { sessionId } = req.query;
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    res.send(session);
  },

  customerPortal: async (req,res) => {
    const { sessionId } = req.body;
    const checkoutsession = await stripe.checkout.sessions.retrieve(sessionId);
    const returnUrl = 'https://liff.line.me/1655219547-eobVGLdB';
    const portalsession = await stripe.billingPortal.sessions.create({
      customer: checkoutsession.customer,
      return_url: returnUrl
    });
    res.send({
      url: portalsession.url
    });
  },

  webhook: (req,res) => {
    let eventType;
    if (process.env.STRIPE_WEBHOOK_SECRET){
      let event;
      let signature = req.headers['stripe-signature'];

      try{
        event = stripe.webhooks.constructEvent(
          req.rawBody,
          signature,
          process.env.STRIPE_WEBHOOK_SECRET
        );
      }catch(err){
        console.log(`⚠️  Webhook signature verification failed.`);
        return res.sendStatus(400);
      }
      data = req.body.data;
      eventType = req.body.type;
    }
    if(eventType === 'checkout.session.completed'){
      console.log(`🔔  Payment received!`);
    }
    res.sendStatus(200);
  },

}