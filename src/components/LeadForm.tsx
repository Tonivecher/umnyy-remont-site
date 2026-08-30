import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { MagneticButton } from "./MagneticButton";

type PropertyType = "apartment" | "house" | "office";

type FieldErrors = Partial<Record<"name" | "phone" | "propertyType" | "area" | "consent", string>>;

const propertyTypes: { value: PropertyType; label: string }[] = [
  { value: "apartment", label: "Квартира" },
  { value: "house", label: "Дом" },
  { value: "office", label: "Офис" },
];

const budgets = ["до 1 млн ₽", "1–3 млн ₽", "3–6 млн ₽", "более 6 млн ₽", "нужен расчёт"];

const timelines = [
  "как можно скорее",
  "в течение 1–3 месяцев",
  "во втором полугодии",
  "пока планирую",
];

const fieldClass =
  "w-full rounded-full bg-white/[0.04] border border-white/20 px-5 py-3.5 text-base md:text-sm outline-none transition-colors focus:border-white placeholder:text-white/25";

const labelClass = "text-[10px] uppercase tracking-[0.2em] opacity-60";

export const LeadForm: React.FC = () => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [propertyType, setPropertyType] = useState<PropertyType | "">("");
  const [area, setArea] = useState("");
  const [budget, setBudget] = useState(budgets[4]!);
  const [timeline, setTimeline] = useState(timelines[1]!);
  const [comment, setComment] = useState("");
  const [company, setCompany] = useState("");
  const [personalDataConsent, setPersonalDataConsent] = useState(false);

  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");

  const validate = () => {
    const next: FieldErrors = {};
    if (name.trim().length < 2) next.name = "Укажите имя (минимум 2 символа).";
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 15)
      next.phone = "Укажите телефон в формате +7 900 000-00-00.";
    if (!propertyType) next.propertyType = "Выберите тип объекта.";
    if (area && !/^\d{1,5}$/.test(area.trim())) next.area = "Площадь — только числом, в м².";
    if (!personalDataConsent) next.consent = "Нужно подтвердить согласие.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;

    setSubmitError("");
    setSubmitSuccess("");
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/leads/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          propertyType,
          area,
          budget,
          timeline,
          comment,
          company,
          personalDataConsent,
          consentVersion: "2026-08-26",
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error || "Не удалось отправить заявку.");

      setName("");
      setPhone("");
      setPropertyType("");
      setArea("");
      setBudget(budgets[4]!);
      setTimeline(timelines[1]!);
      setComment("");
      setPersonalDataConsent(false);
      setSubmitSuccess(payload?.message || "Спасибо! Заявка принята.");
    } catch (failure) {
      setSubmitError(
        failure instanceof Error
          ? failure.message
          : "Не удалось отправить заявку. Проверьте связь и попробуйте ещё раз.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="lead-form"
      className="mt-24 rounded-[2rem] border border-white/10 bg-[#151515] p-7 md:mt-32 md:p-12"
    >
      <span className="mb-4 block text-[10px] uppercase tracking-[0.3em] opacity-60">
        Заявка на расчёт
      </span>
      <h3 className="mb-4 text-2xl font-display md:text-3xl">Рассчитаем ваш ремонт</h3>
      <p className="mb-9 max-w-2xl text-sm leading-relaxed opacity-55">
        Оставьте контакты и параметры объекта — подготовим предварительную смету и свяжемся, чтобы
        уточнить детали. Без навязчивых звонков.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <label className={labelClass} htmlFor="lead-name">
              Имя
            </label>
            <input
              id="lead-name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              onBlur={() => submitError || validate()}
              maxLength={80}
              required
              autoComplete="name"
              aria-invalid={Boolean(errors.name)}
              className={fieldClass}
              placeholder="Ваше имя"
            />
            {errors.name ? (
              <p role="alert" className="text-xs text-red-200/80">
                {errors.name}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label className={labelClass} htmlFor="lead-phone">
              Телефон
            </label>
            <input
              id="lead-phone"
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              maxLength={24}
              required
              autoComplete="tel"
              aria-invalid={Boolean(errors.phone)}
              className={`${fieldClass} num-tabular`}
              placeholder="+7 900 000-00-00"
            />
            {errors.phone ? (
              <p role="alert" className="text-xs text-red-200/80">
                {errors.phone}
              </p>
            ) : null}
          </div>
        </div>

        <div className="hidden" aria-hidden="true">
          <label htmlFor="lead-company">
            Компания
            <input
              id="lead-company"
              name="company"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={company}
              onChange={(event) => setCompany(event.target.value)}
            />
          </label>
        </div>

        <fieldset className="space-y-3">
          <legend className={labelClass}>Тип объекта</legend>
          <div className="flex flex-wrap gap-3">
            {propertyTypes.map((type) => {
              const isActive = propertyType === type.value;
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setPropertyType(type.value)}
                  aria-pressed={isActive}
                  className={`premium-action min-h-11 rounded-full border px-5 py-3 text-[10px] uppercase tracking-[0.2em] ${
                    isActive
                      ? "border-brand-accent bg-brand-accent text-brand-dark"
                      : "border-white/15 text-white/70 hover:border-white/35 hover:text-white"
                  }`}
                >
                  {type.label}
                </button>
              );
            })}
          </div>
          {errors.propertyType ? (
            <p role="alert" className="text-xs text-red-200/80">
              {errors.propertyType}
            </p>
          ) : null}
        </fieldset>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="space-y-2">
            <label className={labelClass} htmlFor="lead-area">
              Площадь, м²
            </label>
            <input
              id="lead-area"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={area}
              onChange={(event) => setArea(event.target.value.replace(/[^\d]/g, "").slice(0, 5))}
              aria-invalid={Boolean(errors.area)}
              className={`${fieldClass} num-tabular`}
              placeholder="85"
            />
            {errors.area ? (
              <p role="alert" className="text-xs text-red-200/80">
                {errors.area}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label className={labelClass} htmlFor="lead-budget">
              Бюджет
            </label>
            <select
              id="lead-budget"
              value={budget}
              onChange={(event) => setBudget(event.target.value)}
              className={`${fieldClass} appearance-none bg-brand-dark/60`}
            >
              {budgets.map((option) => (
                <option key={option} value={option} className="bg-brand-dark">
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className={labelClass} htmlFor="lead-timeline">
              Сроки
            </label>
            <select
              id="lead-timeline"
              value={timeline}
              onChange={(event) => setTimeline(event.target.value)}
              className={`${fieldClass} appearance-none bg-brand-dark/60`}
            >
              {timelines.map((option) => (
                <option key={option} value={option} className="bg-brand-dark">
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className={labelClass} htmlFor="lead-comment">
            Комментарий
          </label>
          <textarea
            id="lead-comment"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            rows={4}
            maxLength={1200}
            className="w-full resize-none rounded-[1.25rem] border border-white/20 bg-white/[0.04] p-4 text-base outline-none transition-colors focus:border-white md:text-sm placeholder:text-white/25"
            placeholder="Что нужно сделать, какие пожелания по материалам и стилю"
          />
        </div>

        <div className="space-y-2 pt-2">
          <label htmlFor="lead-personal-data-consent" className="flex cursor-pointer items-start gap-3 text-xs leading-relaxed text-white/70">
            <input id="lead-personal-data-consent" type="checkbox" required checked={personalDataConsent} onChange={(event) => { setPersonalDataConsent(event.target.checked); setErrors((current) => ({ ...current, consent: undefined })); }} aria-invalid={errors.consent ? true : undefined} aria-describedby="lead-personal-data-consent-help lead-personal-data-consent-error" className="mt-1 h-5 w-5 shrink-0 accent-brand-accent" />
            <span>Даю отдельное согласие на обработку персональных данных.</span>
          </label>
          <p id="lead-personal-data-consent-help" className="text-xs leading-relaxed text-white/50">Текст согласия: <a className="underline underline-offset-4" href="/personal-data-consent/" target="_blank" rel="noreferrer">обработка персональных данных</a>. Подробнее: <a className="underline underline-offset-4" href="/privacy-policy/" target="_blank" rel="noreferrer">политика конфиденциальности</a>.</p>
          <p id="lead-personal-data-consent-error" role="alert" className="text-xs text-red-200/80">{errors.consent || ""}</p>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <MagneticButton className="w-full sm:w-auto">
            <button
              type="submit"
              disabled={isSubmitting}
              className="premium-action btn-glass btn-glass-gold relative w-full px-9 py-4 text-[10px] font-semibold uppercase disabled:opacity-60 sm:w-auto sm:px-11"
            >
              <span className="mobile-action-text relative z-10 inline-flex items-center gap-2 md:tracking-[0.2em]">
                {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : null}
                {isSubmitting ? "Отправляем..." : "Отправить заявку"}
              </span>
            </button>
          </MagneticButton>

        </div>

        {submitSuccess ? (
          <p role="status" className="text-sm text-brand-accent">
            {submitSuccess}
          </p>
        ) : null}

        {submitError ? (
          <div role="alert" className="flex flex-wrap items-center gap-4 text-sm text-red-200/80">
            <span>{submitError}</span>
            <button
              type="submit"
              className="premium-action min-h-11 rounded-full border border-white/20 px-5 py-2 text-[10px] uppercase tracking-[0.2em] text-white/80 hover:text-white"
            >
              Повторить
            </button>
          </div>
        ) : null}
      </form>
    </div>
  );
};
