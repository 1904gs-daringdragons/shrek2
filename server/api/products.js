const router = require('express').Router()
const {Product} = require('../db/models')
module.exports = router

router.get('/', async (req, res, next) => {
  try {
    const products = await Product.findAll()
    res.json(products)
  } catch (err) {
    next(err)
  }
})

router.get('/:productId', async (req, res, next) => {
  try {
    const products = await Product.findByPk(req.params.productId)
    console.log('from server', products)
    res.json(products)
  } catch (err) {
    next(err)
  }
})
