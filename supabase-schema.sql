-- ============================================
-- TASKDAY — Schema Supabase
-- Execute no SQL Editor do Supabase Dashboard
-- ============================================

-- Habilitar UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles (extende auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  cargo TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'collaborator' CHECK (role IN ('admin', 'collaborator')),
  pontos INTEGER NOT NULL DEFAULT 0,
  streak INTEGER NOT NULL DEFAULT 0,
  recorde_streak INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tasks
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  titulo TEXT NOT NULL,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'em_andamento' CHECK (status IN ('em_andamento', 'concluida', 'cancelada', 'postergada')),
  origem_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  concluida_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Impedimentos
CREATE TABLE IF NOT EXISTS impedimentos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  descricao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, data)
);

-- Badges
CREATE TABLE IF NOT EXISTS badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  tipo TEXT NOT NULL,
  desbloqueado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, tipo)
);

-- Badge Types (Custom Badges)
CREATE TABLE IF NOT EXISTS badge_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  emoji TEXT NOT NULL,
  descricao TEXT NOT NULL,
  is_custom BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pontos histórico
CREATE TABLE IF NOT EXISTS pontos_historico (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  pontos INTEGER NOT NULL,
  motivo TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Daily config
CREATE TABLE IF NOT EXISTS daily_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dia_semana INTEGER NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),
  horario TIME NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE(dia_semana)
);

-- Config padrão: Seg-Sex 08:00, Sáb 09:00
INSERT INTO daily_config (dia_semana, horario) VALUES
  (1, '08:00'), -- Segunda
  (2, '08:00'), -- Terça
  (3, '08:00'), -- Quarta
  (4, '08:00'), -- Quinta
  (5, '08:00'), -- Sexta
  (6, '09:00')  -- Sábado
ON CONFLICT (dia_semana) DO NOTHING;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE impedimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE badge_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE pontos_historico ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_config ENABLE ROW LEVEL SECURITY;

-- Limpeza de políticas existentes para evitar erros de duplicidade
DO $$ 
BEGIN
    -- Profiles
    DROP POLICY IF EXISTS "profiles_select" ON profiles;
    DROP POLICY IF EXISTS "profiles_insert" ON profiles;
    DROP POLICY IF EXISTS "profiles_update" ON profiles;
    -- Tasks
    DROP POLICY IF EXISTS "tasks_select" ON tasks;
    DROP POLICY IF EXISTS "tasks_insert" ON tasks;
    DROP POLICY IF EXISTS "tasks_update" ON tasks;
    DROP POLICY IF EXISTS "tasks_delete" ON tasks;
    -- Impedimentos
    DROP POLICY IF EXISTS "impedimentos_select" ON impedimentos;
    DROP POLICY IF EXISTS "impedimentos_insert" ON impedimentos;
    DROP POLICY IF EXISTS "impedimentos_update" ON impedimentos;
    -- Badges
    DROP POLICY IF EXISTS "badges_select" ON badges;
    DROP POLICY IF EXISTS "badges_insert" ON badges;
    -- Badge Types
    DROP POLICY IF EXISTS "badge_types_select" ON badge_types;
    DROP POLICY IF EXISTS "badge_types_all" ON badge_types;
    -- Pontos histórico
    DROP POLICY IF EXISTS "pontos_select" ON pontos_historico;
    DROP POLICY IF EXISTS "pontos_insert" ON pontos_historico;
    -- Daily config
    DROP POLICY IF EXISTS "daily_config_select" ON daily_config;
    DROP POLICY IF EXISTS "daily_config_update" ON daily_config;
END $$;

-- Profiles: todos podem ver, só o próprio usuário edita (admin pode tudo)
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (
  auth.uid() = id OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Tasks: todos veem, owner edita, admin edita qualquer
CREATE POLICY "tasks_select" ON tasks FOR SELECT USING (true);
CREATE POLICY "tasks_insert" ON tasks FOR INSERT WITH CHECK (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "tasks_update" ON tasks FOR UPDATE USING (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "tasks_delete" ON tasks FOR DELETE USING (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Impedimentos: todos veem, owner edita, admin edita qualquer
CREATE POLICY "impedimentos_select" ON impedimentos FOR SELECT USING (true);
CREATE POLICY "impedimentos_insert" ON impedimentos FOR INSERT WITH CHECK (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "impedimentos_update" ON impedimentos FOR UPDATE USING (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Badges: todos veem, só sistema insere (via service role ou admin)
CREATE POLICY "badges_select" ON badges FOR SELECT USING (true);
CREATE POLICY "badges_insert" ON badges FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Badge Types: todos veem, só admin edita
CREATE POLICY "badge_types_select" ON badge_types FOR SELECT USING (true);
CREATE POLICY "badge_types_all" ON badge_types FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Pontos histórico: owner vê os próprios, admin vê todos
CREATE POLICY "pontos_select" ON pontos_historico FOR SELECT USING (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "pontos_insert" ON pontos_historico FOR INSERT WITH CHECK (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Daily config: todos veem, só admin edita
CREATE POLICY "daily_config_select" ON daily_config FOR SELECT USING (true);
CREATE POLICY "daily_config_update" ON daily_config FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================
-- FUNÇÃO: criar profile ao criar usuário
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, name, cargo, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'cargo',
    COALESCE(NEW.raw_user_meta_data->>'role', 'collaborator')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- FUNÇÃO: incrementar pontos do usuário
-- ============================================
CREATE OR REPLACE FUNCTION increment_pontos(uid UUID, amount INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles SET pontos = pontos + amount WHERE id = uid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- REALTIME: habilitar para daily ao vivo
-- ============================================
DO $$
BEGIN
  -- Tenta adicionar as tabelas à publicação se elas ainda não existirem lá
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'tasks'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'impedimentos'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE impedimentos;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
  END IF;
END $$;
