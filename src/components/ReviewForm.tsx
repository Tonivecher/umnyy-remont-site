import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { MagneticButton } from './MagneticButton';

interface ReviewFormProps {
  onReviewSubmitted?: () => Promise<void> | void;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({ onReviewSubmitted }) => {
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [text, setText] = useState('');
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [company, setCompany] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name || !text || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError('');
    setSubmitSuccess('');

    try {
      const response = await fetch('/api/reviews/submit', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          name,
          city,
          text,
          rating,
          company,
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || 'Не удалось отправить отзыв.');
      }

      setName('');
      setCity('');
      setText('');
      setRating(5);
      setCompany('');
      setSubmitSuccess(payload?.message || 'Спасибо. Отзыв отправлен на модерацию.');
      await onReviewSubmitted?.();
    } catch (submitFailure) {
      setSubmitError(
        submitFailure instanceof Error
          ? submitFailure.message
          : 'Не удалось отправить отзыв. Попробуйте позже.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 p-8 md:p-12 rounded-sm">
      <h3 className="text-2xl font-display mb-4">Оставить отзыв</h3>
      <p className="text-sm opacity-55 leading-relaxed mb-8 max-w-2xl">
        Отзыв не публикуется сразу. Сначала он попадает в очередь на модерацию, и только после одобрения появляется на сайте.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-[0.2em] opacity-40">Имя</label>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              maxLength={80}
              className="w-full bg-transparent border-b border-white/20 py-2 focus:border-white outline-none transition-colors"
              placeholder="Ваше имя"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-[0.2em] opacity-40">Город</label>
            <input
              type="text"
              value={city}
              onChange={(event) => setCity(event.target.value)}
              maxLength={80}
              className="w-full bg-transparent border-b border-white/20 py-2 focus:border-white outline-none transition-colors"
              placeholder="Москва"
            />
          </div>
        </div>

        <div className="hidden" aria-hidden="true">
          <label>
            Компания
            <input
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={company}
              onChange={(event) => setCompany(event.target.value)}
            />
          </label>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-[0.2em] opacity-40">Оценка</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="transition-transform hover:scale-110"
                aria-label={`Поставить оценку ${star}`}
              >
                <Star
                  size={20}
                  fill={(hoverRating || rating) >= star ? 'currentColor' : 'none'}
                  className={(hoverRating || rating) >= star ? 'text-brand-accent' : 'text-white/20'}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-[0.2em] opacity-40">Текст отзыва</label>
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            required
            rows={4}
            maxLength={1200}
            className="w-full bg-transparent border border-white/20 p-4 focus:border-white outline-none transition-colors resize-none"
            placeholder="Поделитесь вашим впечатлением о нашей работе..."
          />
        </div>

        <div className="pt-4">
          <MagneticButton>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative py-4 px-10 bg-white text-brand-dark overflow-hidden font-medium text-[10px] uppercase tracking-[0.2em] disabled:opacity-60"
            >
              <span className="relative z-10">
                {isSubmitting ? 'Отправка...' : 'Отправить на модерацию'}
              </span>
              <div className="absolute inset-0 bg-brand-accent translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"></div>
            </button>
          </MagneticButton>
        </div>

        {submitSuccess ? (
          <p className="text-sm text-brand-accent">{submitSuccess}</p>
        ) : null}

        {submitError ? (
          <p className="text-sm text-red-200/80">{submitError}</p>
        ) : null}
      </form>
    </div>
  );
};
