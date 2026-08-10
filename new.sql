create table public.bookings (
  id uuid not null default gen_random_uuid (),
  user_id uuid null,
  offer_id uuid null,
  status text null default 'pending'::text,
  created_at timestamp with time zone null default now(),
  check_in date null,
  check_out date null,
  guests integer null,
  booking_ref text null,
  checked_in_at timestamp with time zone null,
  deposit_paid boolean null default false,
  booking_type text null,
  deposit_amount integer null,
  deposit_paid_at timestamp with time zone null,
  checkout_id text null,
  payment_provider text null,
  payment_reference text null,
  final_paid_at timestamp with time zone null,
  updated_at timestamp with time zone null default now(),
  partner_search_active boolean null default false,
  constraint bookings_pkey primary key (id),
  constraint bookings_offer_id_fkey foreign KEY (offer_id) references offers (id),
  constraint bookings_user_id_fkey foreign KEY (user_id) references profiles (id),
  constraint bookings_status_check check (
    (
      status = any (
        array[
          'pending'::text,
          'confirmed'::text,
          'paid'::text,
          'cancelled'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create unique INDEX IF not exists bookings_checkout_unique on public.bookings using btree (checkout_id) TABLESPACE pg_default
where
  (checkout_id is not null);

create index IF not exists bookings_user_index on public.bookings using btree (user_id) TABLESPACE pg_default;

create index IF not exists bookings_offer_index on public.bookings using btree (offer_id) TABLESPACE pg_default;

create index IF not exists bookings_status_index on public.bookings using btree (status) TABLESPACE pg_default;

create trigger set_booking_ref BEFORE INSERT on bookings for EACH row
execute FUNCTION generate_booking_ref ();

create trigger trg_auto_set_deposit_paid_at BEFORE
update on bookings for EACH row
execute FUNCTION auto_set_deposit_paid_at ();

create trigger update_bookings_updated_at_trigger BEFORE
update on bookings for EACH row
execute FUNCTION update_bookings_updated_at ();

create table public.conversation_participants (
  id uuid not null default gen_random_uuid (),
  conversation_id uuid null,
  user_id uuid null,
  role text null,
  last_seen_at timestamp with time zone null,
  constraint conversation_participants_pkey primary key (id),
  constraint conversation_participants_conversation_id_fkey foreign KEY (conversation_id) references conversations (id) on delete CASCADE
) TABLESPACE pg_default;

create table public.conversations (
  id uuid not null default gen_random_uuid (),
  type text null,
  created_at timestamp with time zone null default now(),
  unique_key text null,
  constraint conversations_pkey primary key (id),
  constraint conversations_unique_key_key unique (unique_key)
) TABLESPACE pg_default;

create table public.messages (
  id uuid not null default gen_random_uuid (),
  conversation_id uuid null,
  sender_id uuid null,
  sender_role text null,
  message text null,
  created_at timestamp with time zone null default now(),
  message_type text null default 'text'::text,
  read_at timestamp with time zone null,
  constraint messages_pkey primary key (id),
  constraint messages_conversation_id_fkey foreign KEY (conversation_id) references conversations (id) on delete CASCADE
) TABLESPACE pg_default;

create table public.offers (
  id uuid not null default gen_random_uuid (),
  room_id uuid null,
  price_per_night numeric not null,
  discount_price numeric null,
  available_from date null,
  available_to date null,
  status text null default 'pending'::text,
  created_at timestamp with time zone null default now(),
  title text null,
  is_fixed_price boolean null default false,
  constraint offers_pkey primary key (id),
  constraint offers_room_id_fkey foreign KEY (room_id) references rooms (id) on delete CASCADE
) TABLESPACE pg_default;

create table public.payments (
  id uuid not null default gen_random_uuid (),
  booking_id uuid null,
  amount integer not null,
  status text null default 'pending'::text,
  created_at timestamp with time zone null default now(),
  chargily_checkout_id text null,
  payment_method text null,
  user_id uuid null,
  provider text null,
  provider_id text null,
  type text null,
  currency text null default 'dzd'::text,
  updated_at timestamp with time zone null default now(),
  payment_type text null,
  constraint payments_pkey primary key (id),
  constraint payments_booking_id_fkey foreign KEY (booking_id) references bookings (id) on delete CASCADE,
  constraint payments_user_id_fkey foreign KEY (user_id) references auth.users (id) on update CASCADE on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists payments_booking_index on public.payments using btree (booking_id) TABLESPACE pg_default;

create index IF not exists payments_user_index on public.payments using btree (user_id) TABLESPACE pg_default;

create unique INDEX IF not exists payments_unique_deposit on public.payments using btree (booking_id, type) TABLESPACE pg_default
where
  (type = 'deposit'::text);

create unique INDEX IF not exists payments_provider_unique on public.payments using btree (provider, provider_id) TABLESPACE pg_default;

create trigger trg_auto_confirm_booking
after
update on payments for EACH row
execute FUNCTION auto_confirm_booking_after_payment ();

create trigger trg_booking_payment_success
after INSERT
or
update OF status on payments for EACH row
execute FUNCTION update_booking_on_payment ();

create trigger update_payments_updated_at BEFORE
update on payments for EACH row
execute FUNCTION update_updated_at_column ();

create table public.profiles (
  id uuid not null,
  full_name text null,
  email text null,
  phone text null,
  role text null default 'pilgrim'::text,
  avatar_url text null,
  city text null,
  state text null,
  bio_tags text[] null,
  chargily_customer_id text null,
  created_at timestamp without time zone null default now(),
  privacy_settings jsonb null default '{"hideName": false, "hidePhoto": false}'::jsonb,
  gender text null,
  phone_number text null,
  constraint profiles_pkey primary key (id),
  constraint profiles_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create table public.rooms (
  id uuid not null default gen_random_uuid (),
  hotel_id uuid null,
  title text null,
  room_type text null,
  total_beds integer null,
  created_at timestamp with time zone null default now(),
  description text null,
  capacity integer null,
  bed_type text null,
  has_view boolean null default false,
  bathroom_type text null,
  images text[] null,
  amenities text[] null,
  constraint rooms_pkey primary key (id),
  constraint rooms_hotel_id_fkey foreign KEY (hotel_id) references hotels (id) on delete CASCADE
) TABLESPACE pg_default;

create table public.room_prices (
  id uuid not null default gen_random_uuid (),
  room_id uuid not null,
  start_date date not null,
  end_date date not null,
  price numeric not null,
  created_at timestamp with time zone null default now(),
  constraint room_prices_pkey primary key (id),
  constraint room_prices_room_id_fkey foreign KEY (room_id) references rooms (id) on delete CASCADE,
  constraint room_prices_no_overlap EXCLUDE using gist (
    room_id
    with
      =,
      daterange (start_date, end_date, '[]'::text)
    with
      &&
  )
) TABLESPACE pg_default;

create table public.hotels (
  id uuid not null default gen_random_uuid (),
  owner_id uuid null,
  name text null,
  city text null,
  address text null,
  distance_to_haram_meters integer null,
  latitude numeric null,
  longitude numeric null,
  verification_status text null default 'unverified'::text,
  commission_percent numeric null default 10,
  is_active boolean null default true,
  created_at timestamp without time zone null default now(),
  stop_sell boolean null default false,
  description text null,
  walking_time_minutes integer null,
  images text[] null,
  rating numeric null,
  neighborhood text null,
  postal_code text null,
  constraint hotels_pkey primary key (id),
  constraint hotels_owner_id_fkey foreign KEY (owner_id) references profiles (id)
) TABLESPACE pg_default;