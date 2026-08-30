import React from "react";

export const Quote: React.FC = () => {
  return (
    <section className="py-32 md:py-64 px-8 md:px-24 flex items-center justify-center text-center bg-brand-light text-brand-dark">
      <h2
        data-split-heading
        className="text-4xl md:text-7xl font-display italic leading-tight max-w-5xl"
      >
        "Архитектура — это мастерская, правильная и великолепная игра форм, объединенных светом."
      </h2>
    </section>
  );
};
