const router = require('express').Router();
const reviews = require('../controllers/reviews');
const { authenticate, authorize, validateId } = require('../middleware/auth');

router.put('/:id', validateId('id'), authenticate, authorize('customer'), reviews.update);
router.delete('/:id', validateId('id'), authenticate, authorize('customer', 'admin'), reviews.remove);

module.exports = router;
