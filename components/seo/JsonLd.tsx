type Props = { data: object };

/**
 * Renders a JSON-LD <script> tag. Escapes "</" so admin-entered text (titles, descriptions) can
 * never prematurely close the script element.
 */
export function JsonLd({ data }: Props) {
  const json = JSON.stringify(data).replace(/<\//g, "<\\/");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
