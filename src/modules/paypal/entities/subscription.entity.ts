import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('subscription')
export class Subscription {
  @PrimaryColumn()
  id: string;

  @Column()
  plan_id: string;

  @Column()
  status: string;

  @Column({ type: 'timestamptz' })
  status_update_time: Date;

  @Column({ type: 'timestamptz' })
  start_time: Date;

  @Column()
  subscriber_given_name: string;

  @Column()
  subscriber_surname: string;

  @Column()
  subscriber_email_address: string;

  // @Column()
  // payer_id: string;

  @Column({ type: 'timestamptz' })
  create_time: Date;

  @Column('jsonb')
  subscriptio_links: Record<string, any>[];
}

// Self Link:

// href: "https://api-m.paypal.com/v1/billing/plans/P-5ML4271244454362WXNWU5NQ"
// rel: "self"
// method: "GET"
// Purpose: This link is used to retrieve the current details of the billing plan. It's a direct link to view the plan's information.
// Edit Link:

// href: "https://api-m.paypal.com/v1/billing/plans/P-5ML4271244454362WXNWU5NQ"
// rel: "edit"
// method: "PATCH"
// Purpose: This link is used to update or modify the billing plan's details. The PATCH method allows partial updates to the plan.
// Deactivate Link:

// href: "https://api-m.paypal.com/v1/billing/plans/P-5ML4271244454362WXNWU5NQ/deactivate"
// rel: "deactivate"
// method: "POST"
// Purpose: This link is used to deactivate the billing plan. Deactivation prevents new subscribers from enrolling in the plan, but existing subscriptions may continue.
// Update Pricing Schemes Link:

// href: "https://api-m.paypal.com/v1/billing/plans/P-5ML4271244454362WXNWU5NQ/update-pricing-schemes"
// rel: "edit"
// method: "POST"
// Purpose: This link is used to update the pricing schemes of the billing plan. It allows you to change the pricing details, such as the amount or currency, associated with the plan.
