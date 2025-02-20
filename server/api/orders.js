const router = require('express').Router()
const {User, Order, LineItem, Product} = require('../db/models')
const mailer = require('./nodemailer')

const generateLineItems = async (newOrder, cart) => {
  let totalPrice = 0
  for (let product in cart) {
    if (cart[product].id) {
      console.log(cart[product])

      const curProduct = await Product.findOne({
        where: {
          id: product
        }
      })
      const quantity = cart[product].quantity
      const itemPrice = curProduct.price

      totalPrice += itemPrice * quantity
      const lineItem = await LineItem.create({
        quantity,
        itemPrice
      })
      await lineItem.setOrder(newOrder)
      await lineItem.setProduct(curProduct)
    }
  }
  await newOrder.update({totalPrice})
}

router.post('/', async (req, res, next) => {
  try {
    const {
      recipientName,
      confirmationEmail,
      shippingAddress,
      shippingCity,
      shippingState,
      shippingZipcode,
      userId,
      payPalConfirmationNumber,
      cart
    } = req.body
    const shippingAndBilling = {
      recipientName,
      confirmationEmail,
      shippingAddress,
      shippingCity,
      shippingState,
      shippingZipcode,
      payPalConfirmationNumber
    }
    if (req.user) {
      if (userId === req.user.id) {
        const newOrder = await Order.findOne({
          where: {
            userId,
            orderStatus: 'CART'
          }
        })
        await newOrder.update({
          orderStatus: 'CREATED',
          ...shippingAndBilling
        })
        try {
          await mailer(
            req.user.email,
            'order',
            recipientName,
            JSON.stringify(cart)
          )
        } catch (error) {
          console.error(error)
        }
        res.status(204).send()
      } else {
        res.status(403).send('ACCESS DENIED')
      }
    } else if (userId === 0) {
      const newOrder = await Order.create({
        ...shippingAndBilling
      })
      await generateLineItems(newOrder, cart)
      try {
        await mailer(
          confirmationEmail,
          'order',
          recipientName,
          JSON.stringify(cart)
        )
      } catch (error) {
        console.error(error)
      }

      res.status(204).send()
    }
  } catch (error) {
    next(error)
  }
})

router.get('/', async (req, res, next) => {
  try {
    if (req.user.isAdmin) {
      const orders = await Order.findAll()
      res.json(orders)
    } else {
      res.status(403).send('Access Denied')
    }
  } catch (error) {
    next(error)
  }
})

router.get('/:userId', async (req, res, next) => {
  try {
    if (+req.params.userId === +req.user.id) {
      const {userId} = req.params
      const orders = await Order.findAll({where: {userId}})
      res.json(orders)
    } else {
      res.send(
        'You are not logged in as this user. Put yourself in their shoes.'
      )
    }
  } catch (error) {
    next(error)
  }
})

router.put('/:orderId', async (req, res, next) => {
  try {
    const id = req.params.orderId
    const order = await Order.findOne({where: {id}})
    if (+order.userId === +req.user.id || req.user.isAdmin) {
      const {orderStatus} = req.body
      console.log(orderStatus)
      await order.update({orderStatus})
      res.status(200).send()
    } else {
      res.send(
        'You are not logged in as this user. Put yourself in their shoes.'
      )
    }
  } catch (error) {
    next(error)
  }
})

router.get('/details/:orderId', async (req, res, next) => {
  try {
    const {orderId} = req.params
    const {userId} = await Order.findOne({
      where: {
        id: orderId
      }
    })
    if (+userId === +req.user.id || req.user.isAdmin) {
      const details = await LineItem.findAll({where: {orderId}})
      res.send(details)
    } else {
      res.status(403).send('Sorry, not this time.')
    }
  } catch (error) {
    next(error)
  }
})

module.exports = router
