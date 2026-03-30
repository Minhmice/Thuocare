-- Read phone from common user_metadata keys when creating profiles (email sign-up).

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_slug text;
  meta_phone text;
BEGIN
  base_slug := 'u' || replace(new.id::text, '-', '');
  meta_phone := nullif(
    trim(
      coalesce(
        new.raw_user_meta_data->>'phone',
        new.raw_user_meta_data->>'phone_number'
      )
    ),
    ''
  );
  INSERT INTO public.profiles (user_id, profile_slug, full_name, email, phone, timezone, onboarding_completed)
  VALUES (
    new.id,
    base_slug,
    coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'), ''), 'Thuocare user'),
    coalesce(nullif(trim(new.email), ''), ''),
    meta_phone,
    coalesce(nullif(trim(new.raw_user_meta_data->>'timezone'), ''), 'Asia/Ho_Chi_Minh'),
    false
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN new;
END;
$$;
