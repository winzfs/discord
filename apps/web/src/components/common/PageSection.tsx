import type { PropsWithChildren } from "react";

type PageSectionProps = PropsWithChildren<{
  title: string;
  description?: string;
}>;

export function PageSection({ title, description, children }: PageSectionProps) {
  return (
    <section className="page-section">
      <div className="section-heading">
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
