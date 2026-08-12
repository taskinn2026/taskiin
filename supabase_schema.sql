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

create table public.banners (
  id uuid not null default gen_random_uuid (),
  type text null,
  title text null,
  subtitle text null,
  image_url text null,
  action_url text null,
  is_active boolean null default true,
  created_at timestamp with time zone null default now(),
  position integer null default 0,
  constraint banners_pkey primary key (id),
  constraint banners_type_check check (
    (type = any (array['season'::text, 'promo'::text]))
  )
) TABLESPACE pg_default;

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

-- Removed old triggers that call undefined notify_* functions

create trigger update_bookings_updated_at_trigger BEFORE
update on bookings for EACH row
execute FUNCTION update_bookings_updated_at ();

create table public.payout_requests (
  id uuid not null default gen_random_uuid (),
  hotel_id uuid null,
  amount numeric not null,
  status text null default 'pending'::text,
  created_at timestamp with time zone null default now(),
  constraint payout_requests_pkey primary key (id),
  constraint payout_requests_hotel_id_fkey foreign KEY (hotel_id) references hotels (id),
  constraint payout_requests_status_check check (
    (
      status = any (
        array[
          'pending'::text,
          'approved'::text,
          'rejected'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create table public.broadcasts (
  id uuid not null default gen_random_uuid (),
  sender_id uuid null,
  sender_role text null,
  title text null,
  message text null,
  target_city text null,
  status text null default 'pending'::text,
  created_at timestamp with time zone null default now(),
  constraint broadcasts_pkey primary key (id),
  constraint broadcasts_sender_id_fkey foreign KEY (sender_id) references profiles (id),
  constraint broadcasts_sender_role_check check (
    (
      sender_role = any (array['admin'::text, 'hotel'::text])
    )
  ),
  constraint broadcasts_status_check check (
    (
      status = any (
        array['pending'::text, 'approved'::text, 'sent'::text]
      )
    )
  )
) TABLESPACE pg_default;

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

create table public.favorites (
  user_id uuid not null,
  offer_id uuid not null,
  created_at timestamp without time zone null default now(),
  constraint favorites_pkey primary key (user_id, offer_id),
  constraint favorites_offer_id_fkey foreign KEY (offer_id) references offers (id),
  constraint favorites_user_id_fkey foreign KEY (user_id) references profiles (id)
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
  constraint hotels_pkey primary key (id),
  constraint hotels_owner_id_fkey foreign KEY (owner_id) references profiles (id),
  constraint hotels_city_check check (
    (city = any (array['مكة'::text, 'المدينة'::text]))
  ),
  constraint hotels_verification_status_check check (
    (
      verification_status = any (
        array['unverified'::text, 'blue'::text, 'gold'::text]
      )
    )
  )
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

-- Removed trg_chat_message which called old undefined notify_chat_message

create table public.notifications (
  id uuid not null default gen_random_uuid (),
  receiver_id uuid null,
  receiver_role text null,
  title text null,
  body text null,
  data jsonb null,
  is_read boolean null default false,
  created_at timestamp with time zone null default now(),
  sender_id uuid null,
  metadata jsonb null,
  booking_id uuid null,
  updated_at timestamp with time zone null default now(),
  constraint notifications_pkey primary key (id),
  constraint notifications_booking_id_fkey foreign KEY (booking_id) references bookings (id) on delete CASCADE,
  constraint notifications_sender_id_fkey foreign KEY (sender_id) references profiles (id)
) TABLESPACE pg_default;

create index IF not exists notifications_unread_index on public.notifications using btree (receiver_id, is_read) TABLESPACE pg_default
where
  (is_read = false);

create index IF not exists notifications_receiver_index on public.notifications using btree (receiver_id) TABLESPACE pg_default;

create index IF not exists notifications_read_index on public.notifications using btree (is_read) TABLESPACE pg_default;

create index IF not exists notifications_booking_index on public.notifications using btree (booking_id) TABLESPACE pg_default;

create trigger update_notifications_updated_at_trigger BEFORE
update on notifications for EACH row
execute FUNCTION update_notifications_updated_at ();

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
  amount numeric not null,
  status text null default 'pending'::text,
  created_at timestamp with time zone null default now(),
  chargily_checkout_id text null,
  payment_method text null,
  constraint payments_pkey primary key (id),
  constraint payments_booking_id_fkey foreign KEY (booking_id) references bookings (id) on delete CASCADE,
  constraint payments_status_check check (
    (
      status = any (
        array['pending'::text, 'paid'::text, 'failed'::text]
      )
    )
  )
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

create table public.saved_searches (
  id uuid not null default gen_random_uuid (),
  user_id uuid null,
  city text not null,
  check_in date null,
  check_out date null,
  budget_min numeric null,
  budget_max numeric null,
  guests integer null,
  is_active boolean null default true,
  last_notified_at timestamp without time zone null,
  created_at timestamp with time zone null default now(),
  booking_type text null,
  constraint saved_searches_pkey primary key (id),
  constraint saved_searches_user_id_fkey foreign KEY (user_id) references profiles (id) on delete CASCADE,
  constraint saved_searches_booking_type_check check (
    (
      booking_type = any (array['bed'::text, 'room'::text])
    )
  )
) TABLESPACE pg_default;

create table public.user_devices (
  id uuid not null default gen_random_uuid (),
  user_id uuid null,
  fcm_token text not null,
  platform text null,
  last_seen_at timestamp with time zone null default now(),
  constraint user_devices_pkey primary key (id),
  constraint user_devices_fcm_token_key unique (fcm_token),
  constraint user_devices_user_id_fkey foreign KEY (user_id) references profiles (id) on delete CASCADE
) TABLESPACE pg_default;

---triggers and functions
-------دوال التنبيهات (Edge-trigger helpers داخل PostgreSQL)

هذه الدوال لا ترسل Push، بل تكتب في جدول notifications
والـ Edge Functions هي التي تتكفل بالإرسال لاحقًا.

--1-notification general
--this is the base functions; all triggers will use it
create or replace function create_notification(
  p_receiver_id uuid,
  p_receiver_role text,
  p_title text,
  p_body text,
  p_data jsonb default '{}'::jsonb
)
returns void
language plpgsql
as $$
begin
  insert into notifications (
    receiver_id,
    receiver_role,
    title,
    body,
    data
  )
  values (
    p_receiver_id,
    p_receiver_role,
    p_title,
    p_body,
    p_data
  );
end;
$$;

--عند إضافة عرض جديد → تنبيه الباحثين (Search Match)

--هذا التريغر فقط يستدعي Edge Function
--لأن منطق المطابقة ثقيل ولا نضعه في SQL.

create or replace function trigger_search_match_notifier()
returns trigger
language plpgsql
as $$
begin
  perform
    net.http_post(
      url := 'https://mfwovozywkmsdyebmpav.supabase.co/functions/v1/search-match-notifier',
      headers := jsonb_build_object(
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object(
        'offer_id', new.id
      )
    );
  return new;
end;
$$;

create trigger after_offer_approved
after insert or update of status
on offers
for each row
when (new.status = 'approved')
execute function trigger_search_match_notifier();

--2.2 عند إنشاء حجز → تنبيه الفندق

create or replace function trigger_booking_created()
returns trigger
language plpgsql
as $$
declare
  v_hotel_owner uuid;
begin
  select h.owner_id
  into v_hotel_owner
  from hotels h
  join rooms r on r.hotel_id = h.id
  join offers o on o.room_id = r.id
  where o.id = new.offer_id;

  perform create_notification(
    v_hotel_owner,
    'hotel',
    'حجز جديد',
    'لديك طلب حجز جديد بانتظار التأكيد',
    jsonb_build_object('booking_id', new.id)
  );

  return new;
end;
$$;

create trigger after_booking_insert
after insert
on bookings
for each row
execute function trigger_booking_created();

--2.3 عند تأكيد الحجز → تنبيه المعتمر + تفعيل الدفع
create or replace function trigger_booking_confirmed()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'confirmed' then
    perform create_notification(
      new.user_id,
      'pilgrim',
      'تم تأكيد الحجز',
      'الفندق أكد الحجز، يمكنك الآن إتمام الدفع',
      jsonb_build_object('booking_id', new.id)
    );
  end if;

  return new;
end;
$$;

create trigger after_booking_confirmed
after update of status
on bookings
for each row
when (new.status = 'confirmed')
execute function trigger_booking_confirmed();

--2.4 رسائل الشات → تنبيه الطرف الآخر
create or replace function trigger_chat_message()
returns trigger
language plpgsql
as $$
declare
  v_receiver uuid;
  v_role text;
begin
  select cp.user_id, cp.role
  into v_receiver, v_role
  from conversation_participants cp
  where cp.conversation_id = new.conversation_id
  and cp.user_id <> new.sender_id
  limit 1;

  perform create_notification(
    v_receiver,
    v_role,
    'رسالة جديدة',
    new.message,
    jsonb_build_object('conversation_id', new.conversation_id)
  );

  return new;
end;
$$;

create trigger after_message_insert
after insert
on messages
for each row
execute function trigger_chat_message();

--2.5 طلب سحب أموال → تنبيه الأدمن
create or replace function trigger_payout_request()
returns trigger
language plpgsql
as $$
begin
  perform create_notification(
    null,
    'admin',
    'طلب سحب أموال',
    'هناك طلب سحب أموال جديد من أحد الفنادق',
    jsonb_build_object('payout_id', new.id)
  );
  return new;
end;
$$;

create trigger after_payout_request
after insert
on payout_requests
for each row
execute function trigger_payout_request();

--Cron Jobs (كما اتفقنا: إعدادات فقط)
--3.1 تنبيه العروض المشابهة (يومي)

--Cron SQL:
select
  net.http_post(
    url := 'https://mfwovozywkmsdyebmpav.supabase.co/functions/v1/search-match-notifier'
  );
--مرة يوميًا (مثلاً 09:00)

--3.2 تنظيف التنبيهات المقروءة (أسبوعي)
create or replace function cleanup_old_notifications()
returns void
language sql
as $$
  delete from notifications
  where is_read = true
  and created_at < now() - interval '90 days';
$$;

select cron.schedule(
  'cleanup-notifications',
  '0 3 * * 0',
  $$ select cleanup_old_notifications(); $$
);

