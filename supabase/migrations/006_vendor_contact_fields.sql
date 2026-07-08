-- ═══════════════════════════════════════════════════════════════════════════
-- 006_vendor_contact_fields.sql
--
-- PURPOSE: Add an optional point of contact to a vendor so the "Copy Request
-- for Vendor" action on the vendor detail page can pre-fill a recipient and a
-- personalized greeting. This is UI convenience only — nothing in the app
-- sends email. There is no email service, and this migration does not add one.
--
-- Both statements use ADD COLUMN IF NOT EXISTS. Running this against the live
-- database is purely additive: zero existing rows are touched, both new
-- columns are NULL-able with no default, and every current vendor keeps
-- working unchanged (the fields simply read as NULL until a user fills them
-- in on the vendor page). Writes to these columns are scoped by clerk_user_id
-- in the app, exactly like every other vendor write.
--
-- Scope is deliberately capped at these two fields. No address, phone, tax ID,
-- or notes — that would turn the vendors table into a CRM, which is out of
-- scope here and belongs in its own separate, reviewed decision.
--
-- Please review before running. Nothing in this file has been executed.
-- ═══════════════════════════════════════════════════════════════════════════

alter table vendors
  -- Vendor's contact email. Optional. Used only to pre-fill the "To:" line of
  -- the copy-to-clipboard request message on the vendor detail page.
  add column if not exists vendor_email text,

  -- Vendor's contact person. Optional. Used only for the greeting in that same
  -- copied message ("Hi <contact name>,"), falling back to the vendor name.
  add column if not exists vendor_contact_name text;
