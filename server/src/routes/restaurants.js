const router = require('express').Router();
const ctrl = require('../controllers/restaurants');
const reviews = require('../controllers/reviews');
const { authenticate, optionalAuth, authorize, validateId } = require('../middleware/auth');

router.get('/', optionalAuth, ctrl.list);
router.get('/filters', ctrl.filters);
router.post('/', authenticate, authorize('admin'), ctrl.create);

router.get('/:id', validateId('id'), optionalAuth, ctrl.getOne);
router.get('/:id/distribution', validateId('id'), ctrl.distribution);
router.get('/:id/reviews', validateId('id'), reviews.listForRestaurant);
router.post('/:id/reviews', validateId('id'), authenticate, authorize('customer'), reviews.create);

router.put('/:id', validateId('id'), authenticate, authorize('admin', 'owner'), ctrl.update);
router.put('/:id/owner', validateId('id'), authenticate, authorize('admin'), ctrl.assignOwner);
router.delete('/:id', validateId('id'), authenticate, authorize('admin'), ctrl.remove);

module.exports = router;
