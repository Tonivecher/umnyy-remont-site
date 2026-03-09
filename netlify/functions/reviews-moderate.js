import {
  authorizeAdmin,
  countStatuses,
  deleteReviewById,
  getReviewById,
  json,
  listReviews,
  methodNotAllowed,
  readJson,
  updateReviewStatus,
} from './_reviews.js';

const actionToStatus = {
  approve: 'approved',
  reject: 'rejected',
  pending: 'pending',
};

export default async (request) => {
  if (request.method !== 'POST') {
    return methodNotAllowed(['POST']);
  }

  const authorizationError = authorizeAdmin(request);
  if (authorizationError) return authorizationError;

  const payload = await readJson(request);
  const reviewId = String(payload?.id || '').trim();
  const action = String(payload?.action || '').trim();

  if (!reviewId || !action) {
    return json({ success: false, error: 'Нужны id отзыва и действие.' }, 400);
  }

  const review = await getReviewById(reviewId);
  if (!review) {
    return json({ success: false, error: 'Отзыв не найден.' }, 404);
  }

  if (action === 'delete') {
    await deleteReviewById(reviewId);
    const reviews = await listReviews();

    return json({
      success: true,
      deleted: true,
      counts: countStatuses(reviews),
    });
  }

  const nextStatus = actionToStatus[action];
  if (!nextStatus) {
    return json({ success: false, error: 'Некорректное действие модерации.' }, 400);
  }

  const updatedReview = await updateReviewStatus(reviewId, nextStatus);
  const reviews = await listReviews();

  return json({
    success: true,
    review: updatedReview,
    counts: countStatuses(reviews),
  });
};

export const config = {
  path: '/api/reviews/moderate',
};
