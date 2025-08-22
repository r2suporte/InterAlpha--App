-- 1. Create custom types (ENUMS) for better data integrity.
CREATE TYPE public.user_role AS ENUM ('admin', 'technician');
CREATE TYPE public.client_type AS ENUM ('INDIVIDUAL', 'COMPANY');
CREATE TYPE public.device_category AS ENUM ('MACBOOK_PRO', 'MACBOOK_AIR', 'MAC_PRO', 'MAC_MINI', 'MAC_STUDIO', 'IPHONE', 'IPAD', 'APPLE_WATCH', 'OTHER');
CREATE TYPE public.order_status AS ENUM ('PENDING_EVALUATION', 'PENDING_APPROVAL', 'REJECTED', 'APPROVED', 'IN_REPAIR', 'COMPLETED', 'DELIVERED');
CREATE TYPE public.warranty_status AS ENUM ('IN_WARRANTY', 'OUT_OF_WARRANTY');

-- 2. Create profiles table to store user-specific data and roles.
-- This table will be linked to Clerk's users.
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    avatar_url TEXT,
    role user_role NOT NULL DEFAULT 'technician'
);

-- Helper function to sync new users from Clerk (auth.users) to our public.profiles table.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url)
    VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically call the function when a new user signs up.
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- 3. Create clients table.
CREATE TABLE public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL CHECK (email ~* '^[A-Za-z0-9._+%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$'),
    phone TEXT,
    client_type client_type NOT NULL,
    document TEXT UNIQUE NOT NULL,
    address_cep TEXT,
    address_street TEXT,
    address_number TEXT,
    address_complement TEXT,
    address_city TEXT,
    address_state TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Create devices table.
CREATE TABLE public.devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    category device_category NOT NULL,
    serial_number TEXT UNIQUE NOT NULL,
    model TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Create service_orders table.
CREATE TABLE public.service_orders (
    id BIGSERIAL PRIMARY KEY, -- User-friendly sequential ID
    device_id UUID NOT NULL REFERENCES public.devices(id),
    assigned_to_id UUID REFERENCES public.profiles(id),
    reported_issue TEXT NOT NULL,
    technician_notes TEXT,
    status order_status NOT NULL DEFAULT 'PENDING_EVALUATION',
    warranty warranty_status NOT NULL,
    quote_value NUMERIC(10, 2),
    final_value NUMERIC(10, 2),
    stripe_checkout_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ
);

-- 6. Create transactions table.
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id BIGINT NOT NULL REFERENCES public.service_orders(id),
    stripe_payment_intent_id TEXT UNIQUE NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'brl',
    status TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Enable Row Level Security (RLS) for all tables.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS Policies.
-- For now, we'll create a simple policy allowing authenticated users (technicians, admins) to see all data.
-- You can refine these policies later for more granular control.

CREATE POLICY "Allow authenticated users to read all profiles"
ON public.profiles FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow users to update their own profile"
ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Allow authenticated users to manage clients"
ON public.clients FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to manage devices"
ON public.devices FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to manage service orders"
ON public.service_orders FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to manage transactions"
ON public.transactions FOR ALL USING (auth.role() = 'authenticated');