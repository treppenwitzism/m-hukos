const Review = require('../models/review.model');
const Menu = require('../models/menu.model');
const httpError = require('../utils/httpError');

function parseRating(value) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > 5) {
    throw httpError(400, 'rating must be a whole number from 1 to 5.');
  }
  return n;
}

function parseComment(value) {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  if (text.length > 500) throw httpError(400, 'comment must be 500 characters or fewer.');
  return text || null;
}

async function requireItem(menuItemId) {
  const item = await Menu.findItemById(menuItemId);
  if (!item) throw httpError(404, 'Menu item not found.');
  return item;
}

async function requireReview(reviewId) {
  const review = await Review.findById(reviewId);
  if (!review) throw httpError(404, 'Review not found.');
  return review;
}

async function listForItem(menuItemId) {
  await requireItem(menuItemId);
  const [summary, reviews] = await Promise.all([
    Review.summaryForItem(menuItemId),
    Review.listForItem(menuItemId),
  ]);
  return { summary, reviews };
}

async function myStatus(userId, menuItemId) {
  await requireItem(menuItemId);
  const [collected, review] = await Promise.all([
    Review.hasCollected(userId, menuItemId),
    Review.findByUserAndItem(userId, menuItemId),
  ]);
  return { can_review: collected && !review, review: review || null };
}

async function create(userId, menuItemId, body) {
  await requireItem(menuItemId);
  const rating = parseRating(body.rating);
  const comment = parseComment(body.comment);

  if (!(await Review.hasCollected(userId, menuItemId))) {
    throw httpError(403, 'You can review an item after you have picked it up.');
  }

  let id;
  try {
    id = await Review.create({ user_id: userId, menu_item_id: menuItemId, rating, comment });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      throw httpError(409, 'You already reviewed this item. Edit your review instead.');
    }
    throw err;
  }
  return Review.findById(id);
}

async function update(user, reviewId, body) {
  const review = await requireReview(reviewId);
  if (review.user_id !== user.id) throw httpError(403, 'You can only edit your own review.');

  if (body.rating === undefined && body.comment === undefined) {
    throw httpError(400, 'Send a rating and/or a comment to change.');
  }
  const rating = body.rating === undefined ? review.rating : parseRating(body.rating);
  const comment = body.comment === undefined ? review.comment : parseComment(body.comment);

  await Review.update(reviewId, { rating, comment });
  return Review.findById(reviewId);
}

async function remove(user, reviewId) {
  const review = await requireReview(reviewId);
  if (review.user_id !== user.id) {
    throw httpError(403, 'You can only delete your own review.');
  }
  await Review.remove(reviewId);
}

async function setStatus(reviewId, status) {
  if (!['visible', 'hidden'].includes(status)) {
    throw httpError(400, "status must be 'visible' or 'hidden'.");
  }
  await requireReview(reviewId);
  await Review.setStatus(reviewId, status);
  return Review.findById(reviewId);
}

async function listAll() {
  return Review.listAll();
}

module.exports = { listForItem, myStatus, create, update, remove, listAll, setStatus };