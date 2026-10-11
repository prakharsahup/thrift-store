import { business, formatAddress, grievanceOfficer } from "@/lib/config/legal";

type Props = {
  /** Also list the grievance officer (contact page, policies). */
  withGrievanceOfficer?: boolean;
};

// The seller's legal details (E-Commerce Rules 2020 r. 4(2)): legal name, address, registrations
// and customer-care contacts. Shown on the contact page and inside the policies.
export function BusinessDetails({ withGrievanceOfficer = false }: Props) {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <dl className="space-y-3 text-sm">
        <div>
          <dt className="text-muted">Seller</dt>
          <dd className="font-semibold">
            {business.legalName}
            <span className="block font-normal text-muted">
              trading as {business.tradeName} · {business.entityType}
            </span>
          </dd>
        </div>
        <div>
          <dt className="text-muted">Registered address</dt>
          <dd>
            <address className="not-italic">
              {formatAddress().map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </address>
          </dd>
        </div>
        {business.gstin ? (
          <div>
            <dt className="text-muted">GSTIN</dt>
            <dd>{business.gstin}</dd>
          </div>
        ) : null}
        {business.cin ? (
          <div>
            <dt className="text-muted">CIN / LLPIN</dt>
            <dd>{business.cin}</dd>
          </div>
        ) : null}
      </dl>

      <dl className="space-y-3 text-sm">
        <div>
          <dt className="text-muted">Customer care</dt>
          <dd>
            <a href={`mailto:${business.email}`} className="font-semibold underline">
              {business.email}
            </a>
            <span className="block">{business.phone}</span>
            <span className="block text-muted">{business.hours}</span>
          </dd>
        </div>
        {withGrievanceOfficer ? (
          <div id="grievance-officer" className="scroll-mt-28">
            <dt className="text-muted">Grievance officer</dt>
            <dd>
              <span className="block font-semibold">
                {grievanceOfficer.name}, {grievanceOfficer.designation}
              </span>
              <a href={`mailto:${grievanceOfficer.email}`} className="underline">
                {grievanceOfficer.email}
              </a>
              <span className="block">{grievanceOfficer.phone}</span>
              <span className="block text-muted">
                Acknowledged within {grievanceOfficer.acknowledgeWithinHours} hours, resolved within{" "}
                {grievanceOfficer.resolveWithinDays} days.
              </span>
            </dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}
