-- 1. Fix Reviews RLS
alter table reviews enable row level security;
alter table offers add column is_fixed_price boolean default false;
alter table bookings add column booking_type text check (booking_type in ('room', 'bed', 'full')); -- 'full' for legacy or alias

create policy "Reviews are viewable by everyone"
  on reviews for select
  using ( true );

create policy "Users can create reviews"
  on reviews for insert
  with check ( auth.uid() = user_id );

-- 2. Fix Hotel Notification Function
create or replace function notify_hotel_new_booking()
returns trigger
language plpgsql
security definer
as $$
declare
  v_hotel_id uuid;
  v_hotel_name text;
begin
  -- Get hotel details
  select h.id, h.name into v_hotel_id, v_hotel_name
  from offers o
  join rooms r on o.room_id = r.id
  join hotels h on r.hotel_id = h.id
  where o.id = new.offer_id;

  if v_hotel_id is not null then
    -- Insert notification for the hotel
    insert into notifications (
      receiver_id,
      receiver_role,
      type,
      title,
      body,
      data
    ) values (
      v_hotel_id,
      'hotel',
      'booking',
      'New Booking Received',
      'New booking for ' || v_hotel_name,
      jsonb_build_object('booking_id', new.id, 'hotel_id', v_hotel_id)
    );
  end if;

  return new;
end;
$$;
