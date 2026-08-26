import React, { useState } from "react";
import { Star } from "lucide-react";
import { MagneticButton } from "./MagneticButton";

interface ReviewFormProps {
  onReviewSubmitted?: () => Promise<void> | void;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({ onReviewSubmitted }) => {
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [text, setText] = useState("");
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [company, setCompany] = useState("");
  const [publicationConsent, setPublicationConsent] = useState(false);
  const [consentError, setConsentError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name || !text || !publicationConsent || isSubmitting) {
      if (!publicationConsent) setConsentError("Подтвердите согласие на публикацию отзыва.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");
    setConsentError("");
    setSubmitSuccess("");

    try {
      const response = await fetch("/api/reviews/submit", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          name,
          city,
          text,
          rating,
          company,
          publicationConsent,
          consentVersion: "2026-08-26",
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || "Не удалось отправить отзыв.");
      }

      setName("");
      setCity("");
      setText("");
      setRating(5);
      setCompany("");
      setPublicationConsent(false);
      setSubmitSuccess(payload?.message || "Спасибо. Отзыв отправлен на модерацию.");
      await onReviewSubmitted?.();
    } catch (submitFailure) {
      setSubmitError(
        submitFailure instanceof Error
          ? submitFailure.message
          : "Не удалось отправить отзыв. Попробуйте позже.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 p-8 md:p-12 rounded-[2rem] backdrop-blur-xl">
      <h3 className="text-2xl font-display mb-4">Оставить отзыв</h3>
      <p className="text-sm opacity-55 leading-relaxed mb-8 max-w-2xl">
        Отзыв не публикуется сразу. Сначала он попадает в очередь на модерацию, и только после
        одобрения появляется на сайте.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="review-name" className="text-[10px] uppercase tracking-[0.2em] opacity-40">Имя</label>
            <input
              id="review-name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              maxLength={80}
              className="w-full bg-transparent border-b border-white/20 py-3 text-base md:text-sm focus:border-white outline-none transition-colors"
              placeholder="Ваше имя"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="review-city" className="text-[10px] uppercase tracking-[0.2em] opacity-40">Город</label>
            <input
              id="review-city"
              type="text"
              value={city}
              onChange={(event) => setCity(event.target.value)}
              maxLength={80}
              className="w-full bg-transparent border-b border-white/20 py-3 text-base md:text-sm focus:border-white outline-none transition-colors"
              placeholder="Москва"
            />
          </div>
        </div>

        <div className="hidden" aria-hidden="true">
          <label htmlFor="review-company">
            Компания
            <input
              id="review-company"
              name="company"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={company}
              onChange={(event) => setCompany(event.target.value)}
            />
          </label>
        </div>

        <div className="space-y-2">
          <p id="review-rating-label" className="text-[10px] uppercase tracking-[0.2em] opacity-40">Оценка</p>
          <div className="flex gap-1" role="group" aria-labelledby="review-rating-label">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="premium-action flex h-11 w-11 min-h-11 items-center justify-center rounded-full transition-transform"
                aria-label={`Поставить оценку ${star}`}
              >
                <Star
                  size={22}
                  fill={(hoverRating || rating) >= star ? "currentColor" : "none"}
                  className={
                    (hoverRating || rating) >= star ? "text-brand-accent" : "text-white/20"
                  }
                />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="review-text" className="text-[10px] uppercase tracking-[0.2em] opacity-40">Текст отзыва</label>
          <textarea
            id="review-text"
            value={text}
            onChange={(event) => setText(event.target.value)}
            required
            rows={4}
            maxLength={1200}
            className="w-full rounded-[1.25rem] bg-white/[0.04] border border-white/20 p-4 text-base md:text-sm focus:border-white outline-none transition-colors resize-none"
            placeholder="Поделитесь вашим впечатлением о нашей работе..."
          />
        </div>

        <label htmlFor="review-publication-consent" className="flex cursor-pointer items-start gap-3 text-xs leading-relaxed text-white/70">
          <input id="review-publication-consent" type="checkbox" required checked={publicationConsent} onChange={(event) => { setPublicationConsent(event.target.checked); setConsentError(""); }} aria-invalid={consentError ? true : undefined} aria-describedby="review-publication-consent-help review-publication-consent-error" className="mt-1 h-5 w-5 shrink-0 accent-brand-accent" />
          <span>Даю отдельное согласие на обработку и публикацию отзыва.</span>
        </label>
        <p id="review-publication-consent-help" className="text-xs leading-relaxed text-white/50">Текст согласия: <a className="underline underline-offset-4" href="/review-publication-consent/" target="_blank" rel="noreferrer">обработка и публикация отзыва</a>. Подробнее: <a className="underline underline-offset-4" href="/privacy-policy/" target="_blank" rel="noreferrer">политика конфиденциальности</a>.</p>
        <p id="review-publication-consent-error" role="alert" className="text-xs text-red-200/80">{consentError}</p>
        <div className="pt-1">
          <MagneticButton className="w-full sm:w-auto">
            <button
              type="submit"
              disabled={isSubmitting}
              className="premium-action btn-glass btn-glass-light relative w-full px-9 py-4 text-[10px] font-medium uppercase disabled:opacity-60 sm:w-auto sm:px-11"
            >
              <span className="mobile-action-text relative z-10 md:tracking-[0.2em]">
                {isSubmitting ? "Отправка..." : "Отправить на модерацию"}
              </span>
            </button>
          </MagneticButton>
        </div>

        {submitSuccess ? <p className="text-sm text-brand-accent">{submitSuccess}</p> : null}

        {submitError ? <p className="text-sm text-red-200/80">{submitError}</p> : null}
      </form>
    </div>
  );
};
