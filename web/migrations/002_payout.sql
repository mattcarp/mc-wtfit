-- Where to send the money: shown to the seller after a sale. WTF This never handles funds itself.
alter table settings add column beneficiary_iban text;
alter table settings add column beneficiary_bic text;
alter table settings add column beneficiary_revolut text;
alter table settings add column beneficiary_wise text;
alter table items add column proceeds_sent_at timestamptz;
-- Where the user sells things.
alter table settings add column marketplace text not null default 'ebay.co.uk';
