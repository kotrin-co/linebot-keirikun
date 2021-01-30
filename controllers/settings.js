module.exports = {

  setup: (req,res) => {
    res.send({
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
      monthlyPrice: process.env.MONTHLY_PRICE_ID,
      yearlyPrice: process.env.YEARLY_PRICE_ID
    });
  }
}