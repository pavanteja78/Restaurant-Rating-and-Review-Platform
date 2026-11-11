const mongoose = require('mongoose');
const Review = require('../models/Review');

const oid = (id) => new mongoose.Types.ObjectId(String(id));

/**
 * Rating distribution using a MongoDB aggregation pipeline.
 * Returns [{ stars: 5, count }, ... { stars: 1, count }] with zeros filled in.
 * `match` must already contain ObjectIds (aggregate does not cast).
 */
async function getDistribution(match = {}) {
  const rows = await Review.aggregate([
    { $match: match },
    { $group: { _id: '$rating', count: { $sum: 1 } } },
  ]);
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  rows.forEach((r) => { counts[r._id] = r.count; });
  const distribution = [5, 4, 3, 2, 1].map((stars) => ({ stars, count: counts[stars] }));
  const total = distribution.reduce((sum, d) => sum + d.count, 0);
  return { distribution, total };
}

/**
 * Pipeline that attaches reviewCount, averageRating (1 decimal, null if no reviews)
 * and myRating (the signed-in customer's rating, null if none) to restaurants.
 */
function restaurantPipeline(match, userId) {
  const meId = userId ? oid(userId) : null;
  return [
    { $match: match },
    {
      $lookup: {
        from: 'reviews',
        let: { rid: '$_id' },
        pipeline: [
          { $match: { $expr: { $eq: ['$restaurant', '$$rid'] } } },
          { $project: { rating: 1, customer: 1 } },
        ],
        as: 'reviewDocs',
      },
    },
    {
      $addFields: {
        reviewCount: { $size: '$reviewDocs' },
        averageRating: {
          $cond: [
            { $gt: [{ $size: '$reviewDocs' }, 0] },
            { $round: [{ $avg: '$reviewDocs.rating' }, 1] },
            null,
          ],
        },
        myRating: meId
          ? {
              $ifNull: [
                {
                  $arrayElemAt: [
                    {
                      $map: {
                        input: {
                          $filter: {
                            input: '$reviewDocs',
                            as: 'r',
                            cond: { $eq: ['$$r.customer', meId] },
                          },
                        },
                        as: 'm',
                        in: '$$m.rating',
                      },
                    },
                    0,
                  ],
                },
                null,
              ],
            }
          : null,
      },
    },
    { $project: { reviewDocs: 0 } },
  ];
}

module.exports = { oid, getDistribution, restaurantPipeline };
