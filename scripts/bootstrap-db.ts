import dotenv from 'dotenv';
import { queryDb } from '@/storage/database/local-db';

dotenv.config({ path: '.env.local' });
dotenv.config();

async function bootstrapDb() {
  await queryDb(`
    create extension if not exists pgcrypto;

    create table if not exists crm_users (
      id uuid primary key default gen_random_uuid(),
      email varchar(255) not null unique,
      username varchar(64) not null unique,
      password_hash varchar(255) not null,
      name varchar(128) not null,
      role varchar(20) not null default 'staff',
      is_active boolean not null default true,
      created_at timestamptz not null default now(),
      updated_at timestamptz
    );

    create table if not exists customers (
      id uuid primary key default gen_random_uuid(),
      customer_code varchar(32) not null unique,
      name varchar(128) not null,
      contact varchar(255) not null,
      city varchar(64),
      ai_purpose text,
      owner_id uuid not null references crm_users(id),
      feishu_record_id varchar(64),
      created_at timestamptz not null default now(),
      updated_at timestamptz
    );

    create table if not exists communications (
      id uuid primary key default gen_random_uuid(),
      customer_id uuid not null references customers(id) on delete cascade,
      user_id uuid not null references crm_users(id),
      content text not null,
      ai_summary text,
      ai_next_action text,
      ai_follow_up_at timestamptz,
      ai_intent varchar(32),
      created_at timestamptz not null default now()
    );

    create table if not exists health_check (
      id serial not null,
      updated_at timestamptz default now()
    );

    create table if not exists system_config (
      id serial primary key,
      config_key varchar(64) not null unique,
      config_value text not null,
      description varchar(255),
      created_at timestamptz not null default now(),
      updated_at timestamptz
    );

    alter table communications add column if not exists ai_summary text;
    alter table communications add column if not exists ai_next_action text;
    alter table communications add column if not exists ai_follow_up_at timestamptz;
    alter table communications add column if not exists ai_intent varchar(32);
    alter table customers add column if not exists feishu_record_id varchar(64);
    alter table crm_users add column if not exists username varchar(64);
    update crm_users
    set username = split_part(email, '@', 1)
    where (username is null or username = '');
  `);

  await queryDb(`
    create unique index if not exists crm_users_username_idx on crm_users(username);
    create index if not exists crm_users_email_idx on crm_users(email);
    create index if not exists crm_users_role_idx on crm_users(role);
    create index if not exists customers_customer_code_idx on customers(customer_code);
    create index if not exists customers_owner_id_idx on customers(owner_id);
    create index if not exists customers_name_idx on customers(name);
    create index if not exists customers_city_idx on customers(city);
    create index if not exists customers_created_at_idx on customers(created_at);
    create index if not exists communications_customer_id_idx on communications(customer_id);
    create index if not exists communications_user_id_idx on communications(user_id);
    create index if not exists communications_created_at_idx on communications(created_at);
    create index if not exists system_config_key_idx on system_config(config_key);
  `);

  await queryDb(`
    alter table crm_users alter column username set not null;
  `);

  console.log('数据库结构检查完成');
}

bootstrapDb()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('数据库结构初始化失败:', error);
    process.exit(1);
  });
