const router = require('express').Router();
const ctrl = require('../controllers/restaurants');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate, authorize('owner'));
router.get('/restaurant', ctrl.ownerRestaurant);
router.get('/reviews', ctrl.ownerReviews);

module.exports = router;
