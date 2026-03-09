import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { MagneticButton } from './MagneticButton';

export type Review = {
  name: string;
  city: string;
  text: string;
  rating: number;
  date: string;
};

interface ReviewFormProps {
  onReviewAdded: () => void;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({ onReviewAdded }) => {
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [text, setText] = useState('');
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !text) return;

    const newReview: Review = {
      name,
      city,
      text,
      rating,
      date: new Date().toLocaleDateString('ru-RU'),
    };

    const existingReviews = JSON.parse(localStorage.getItem('user_reviews') || '[]');
    localStorage.setItem('user_reviews', JSON.stringify([newReview, ...existingReviews]));

    setName('');
    setCity('');
    setText('');
    setRating(5);
    onReviewAdded();
  };

  return (
    <div className="bg-white/5 border border-white/10 p-8 md:p-12 rounded-sm">
      <h3 className="text-2xl font-display mb-8">Оставить отзыв</h3>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-[0.2em] opacity-40">Имя</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-transparent border-b border-white/20 py-2 focus:border-white outline-none transition-colors"
              placeholder="Ваше имя"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-[0.2em] opacity-40">Город</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full bg-transparent border-b border-white/20 py-2 focus:border-white outline-none transition-colors"
              placeholder="Москва"
            />
          </div>
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
              >
                <Star
                  size={20}
                  fill={(hoverRating || rating) >= star ? "currentColor" : "none"}
                  className={(hoverRating || rating) >= star ? "text-brand-accent" : "text-white/20"}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-[0.2em] opacity-40">Текст отзыва</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            required
            rows={4}
            className="w-full bg-transparent border border-white/20 p-4 focus:border-white outline-none transition-colors resize-none"
            placeholder="Поделитесь вашим впечатлением о нашей работе..."
          />
        </div>

        <div className="pt-4">
          <MagneticButton>
            <button
              type="submit"
              className="group relative py-4 px-10 bg-white text-brand-dark overflow-hidden font-medium text-[10px] uppercase tracking-[0.2em]"
            >
              <span className="relative z-10">Оставить отзыв</span>
              <div className="absolute inset-0 bg-brand-accent translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"></div>
            </button>
          </MagneticButton>
        </div>
      </form>
    </div>
  );
};
