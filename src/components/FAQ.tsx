import React from "react";

const requestDetails = [
  "тип объекта: квартира, дом или офис",
  "примерная площадь и желаемые сроки",
  "ориентир по бюджету и важные пожелания",
];

export const FAQ: React.FC = () => (
  <section id="questions" className="bg-brand-light px-6 py-28 text-brand-dark md:px-24 md:py-48">
    <div className="mx-auto max-w-6xl">
      <span className="mb-6 block text-[10px] uppercase tracking-[0.3em] opacity-60">
        Коротко о работе
      </span>
      <h2 className="max-w-4xl text-4xl font-display leading-[1.05] md:text-7xl">
        Как начать ремонт квартиры под ключ?
      </h2>
      <p className="mt-10 max-w-4xl text-base leading-relaxed opacity-80 md:text-lg">
        Начните с исходных данных об объекте и ожидаемом результате. Укажите, что нужно
        отремонтировать, примерную площадь, удобные сроки и бюджетный ориентир. Если точных цифр
        пока нет, выберите вариант «нужен расчёт» и опишите задачу своими словами. После отправки
        заявки администратор сайта получает контакт и параметры объекта, чтобы связаться с вами и
        уточнить детали. Предварительный разговор помогает сверить объём работ, особенности
        планировки и пожелания по материалам до подготовки расчёта. Команда работает с квартирами,
        домами и офисами в Москве и Московской области. К заявке можно добавить комментарий о
        текущем состоянии помещения, инженерных работах, хранении, освещении или отделке. Чем
        понятнее исходная информация, тем предметнее будет первое обсуждение. Перед отправкой
        требуется отдельное согласие на обработку персональных данных; его текст и политика
        конфиденциальности доступны рядом с формой. Также можно начать разговор по телефону или в
        удобном мессенджере, указанном в контактах сайта.
      </p>

      <div className="mt-16 grid gap-6 md:grid-cols-2">
        <article className="rounded-[1.75rem] border border-brand-dark/10 bg-white/45 p-7 md:p-10">
          <h3 className="text-2xl font-display">Что указать в заявке?</h3>
          <p className="mt-4 text-sm leading-relaxed opacity-70">
            Для первого обсуждения достаточно основных параметров:
          </p>
          <ul className="mt-5 space-y-3 text-sm leading-relaxed opacity-80">
            {requestDetails.map((detail) => (
              <li key={detail} className="flex gap-3">
                <span aria-hidden="true">—</span>
                <span>{detail}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-[1.75rem] border border-brand-dark/10 bg-white/45 p-7 md:p-10">
          <h3 className="text-2xl font-display">Где работает команда?</h3>
          <p className="mt-4 text-sm leading-relaxed opacity-70">
            Основной регион работы — Москва и Московская область. Тип объекта и его расположение
            можно указать в комментарии к заявке.
          </p>
        </article>

        <article className="rounded-[1.75rem] border border-brand-dark/10 bg-white/45 p-7 md:p-10">
          <h3 className="text-2xl font-display">Что происходит после отправки?</h3>
          <p className="mt-4 text-sm leading-relaxed opacity-70">
            Заявка сохраняется для обратной связи. Администратор получает имя, телефон и параметры
            объекта, после чего уточняет детали будущего ремонта.
          </p>
        </article>

        <article className="rounded-[1.75rem] border border-brand-dark/10 bg-white/45 p-7 md:p-10">
          <h3 className="text-2xl font-display">Как публикуются отзывы?</h3>
          <p className="mt-4 text-sm leading-relaxed opacity-70">
            Отзыв попадает в очередь на модерацию и появляется на сайте только после проверки. Для
            обработки и публикации требуется отдельное согласие автора.
          </p>
        </article>
      </div>
    </div>
  </section>
);
