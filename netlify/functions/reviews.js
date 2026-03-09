import {
  authorizeAdmin,
  countStatuses,
  json,
  listReviews,
  methodNotAllowed,
  parseStatusFilter,
  toPublicReview,
} from './_reviews.js';

export default async (request) => {
  if (request.method !== 'GET') {
    return methodNotAllowed(['GET']);
  }

  const url = new URL(request.url);
  const scope = url.searchParams.get('scope');
  const statusFilter = parseStatusFilter(url.searchParams.get('status'));
  const reviews = await listReviews();

  if (scope === 'admin') {
    const authorizationError = authorizeAdmin(request);
    if (authorizationError) return authorizationError;

    const filteredReviews = statusFilter
      ? reviews.filter((review) => review.status === statusFilter)
      : reviews;

    return json({
      success: true,
      reviews: filteredReviews,
      counts: countStatuses(reviews),
    });
  }

  const publicReviews = reviews
    .filter((review) => review.status === 'approved')
    .map(toPublicReview);

  return json({
    success: true,
    reviews: publicReviews,
    counts: countStatuses(reviews),
  });
};

export const config = {
  path: '/api/reviews',
};
