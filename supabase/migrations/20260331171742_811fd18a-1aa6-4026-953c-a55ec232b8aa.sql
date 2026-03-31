
-- Create the missing trigger to auto-create profiles for new auth users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Backfill: create profiles for users that exist in auth.users but not in profiles
INSERT INTO public.profiles (id, full_name, is_active)
SELECT u.id, COALESCE(u.raw_user_meta_data->>'full_name', ''), false
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;
