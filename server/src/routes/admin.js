const router = require('express').Router();
const admin = require('../controllers/admin');
const reviews = require('../controllers/reviews');
const { authenticate, authorize, validateId } = require('../middleware/auth');

router.use(authenticate, authorize('admin'));

router.get('/stats', admin.stats);
router.get('/users', admin.listUsers);
router.post('/users', admin.createUser);
router.put('/users/:id', validateId('id'), admin.updateUser);
router.delete('/users/:id', validateId('id'), admin.deleteUser);
router.get('/reviews', reviews.adminList);

module.exports = router;
