import { json, methodNotAllowed, readJson, saveReview, validateReviewPayload } from './_reviews.js';

export default async (request) => {
  if (request.method !== 'POST') {
    return methodNotAllowed(['POST']);
  }

  const payload = await readJson(request);
  const parsedReview = validateReviewPayload(payload);

  if (parsedReview.spam) {
    return json({ success: true, message: 'Спасибо. Отзыв отправлен на модерацию.' }, 202);
  }

  if (parsedReview.error) {
    return json({ success: false, error: parsedReview.error }, 400);
  }

  await saveReview(parsedReview.value);

  return json(
    {
      success: true,
      message: 'Спасибо. Отзыв отправлен на модерацию и появится на сайте после проверки.',
    },
    201,
  );
};

export const config = {
  path: '/api/reviews/submit',
};
