const router = require('express').Router()
module.exports = router

router.use('/cart', require('./cart'))
router.use('/orders', require('./orders'))
router.use('/users', require('./users'))
router.use('/products', require('./products'))

router.use((req, res, next) => {
  const error = new Error('Not Found')
  error.status = 404
  next(error)
})
