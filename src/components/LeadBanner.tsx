import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { MagneticButton } from "./MagneticButton";

type PropertyType = "apartment" | "house" | "office";

type FieldErrors = Partial<Record<"name" | "phone" | "propertyType", string>>;

const propertyTypes: { value: PropertyType; label: string }[] = [
  { value: "apartment", label: "Квартира" },
  { value: "house", label: "Дом" },
  { value: "office", label: "Офис" },
];

const fieldClass =
  "w-full rounded-full bg-white/[0.04] border border-white/20 px-5 py-3.5 text-base md:text-sm outline-none transition-colors focus:border-white placeholder:text-white/25";

const labelClass = "text-[10px] uppercase tracking-[0.2em] opacity-40";

export const LeadBanner: React.FC = () => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [propertyType, setPropertyType] = useState<PropertyType | "">("");
  const [company, setCompany] = useState("");

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
          area: "",
          budget: "нужен расчёт",
          timeline: "в течение 1–3 месяцев",
          comment: "Заявка с главной страницы",
          company,
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error || "Не удалось отправить заявку.");

      setName("");
      setPhone("");
      setPropertyType("");
      setSubmitSuccess(payload?.message || "Спасибо! Заявка принята — мы скоро свяжемся.");
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
    <section id="lead-banner" className="relative z-10 px-5 py-16 md:py-24">
      <div className="mx-auto max-w-5xl rounded-[2rem] border border-white/10 bg-white/5 p-7 backdrop-blur-xl md:p-12">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="mb-3 block text-[10px] uppercase tracking-[0.3em] opacity-40">
              Быстрая заявка
            </span>
            <h2 className="text-2xl font-display md:text-3xl">Рассчитаем стоимость ремонта</h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed opacity-55">
              Оставьте имя, телефон и тип объекта — перезвоним и обсудим смету. Без похода в
              портфолио.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <label className={labelClass} htmlFor="lead-banner-name">
                Имя
              </label>
              <input
                id="lead-banner-name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={80}
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
              <label className={labelClass} htmlFor="lead-banner-phone">
                Телефон
              </label>
              <input
                id="lead-banner-phone"
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                maxLength={24}
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

            <div className="space-y-2">
              <label className={labelClass} htmlFor="lead-banner-type">
                Тип объекта
              </label>
              <select
                id="lead-banner-type"
                value={propertyType}
                onChange={(event) => setPropertyType(event.target.value as PropertyType | "")}
                aria-invalid={Boolean(errors.propertyType)}
                className={`${fieldClass} appearance-none bg-brand-dark/60`}
              >
                <option value="" className="bg-brand-dark">
                  Выберите
                </option>
                {propertyTypes.map((type) => (
                  <option key={type.value} value={type.value} className="bg-brand-dark">
                    {type.label}
                  </option>
                ))}
              </select>
              {errors.propertyType ? (
                <p role="alert" className="text-xs text-red-200/80">
                  {errors.propertyType}
                </p>
              ) : null}
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

          <div className="flex flex-col items-start gap-4 pt-2 sm:flex-row sm:items-center">
            <MagneticButton>
              <button
                type="submit"
                disabled={isSubmitting}
                className="premium-action btn-glass btn-glass-gold relative inline-flex items-center justify-center px-9 py-4 text-[10px] font-semibold uppercase disabled:opacity-60 md:px-11"
              >
                <span className="mobile-action-text relative z-10 inline-flex items-center gap-2 md:tracking-[0.2em]">
                  {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : null}
                  {isSubmitting ? "Отправляем..." : "Отправить заявку"}
                </span>
              </button>
            </MagneticButton>

            <p className="text-xs leading-relaxed opacity-40 sm:max-w-xs">
              Нажимая кнопку, вы соглашаетесь на обработку персональных данных.
            </p>
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
    </section>
  );
};
