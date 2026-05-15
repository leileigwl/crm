# 项目上下文

## 项目简介

这是一个培训机构 CRM 客户关系管理系统，支持：
- 客户信息管理（姓名、联系方式、城市、AI需求）
- 智能文本识别（粘贴文字自动提取字段）
- 多账号权限管理（管理员/员工自注册）
- 客户沟通记录追踪
- 飞书多维表格自动同步

### 版本技术栈

- **Framework**: Next.js 16 (App Router)
- **Core**: React 19
- **Language**: TypeScript 5
- **UI 组件**: shadcn/ui (基于 Radix UI)
- **Styling**: Tailwind CSS 4
- **Database**: Supabase (PostgreSQL)
- **AI**: coze-coding-dev-sdk (LLM)
- **飞书集成**: 飞书开放平台 API

## 目录结构

```
├── public/                     # 静态资源
├── scripts/                    # 构建与启动脚本
│   ├── build.sh                # 构建脚本
│   ├── dev.sh                  # 开发环境启动脚本
│   ├── init-admin.ts           # 初始化管理员账号
│   ├── prepare.sh              # 预处理脚本
│   └── start.sh                # 生产环境启动脚本
├── src/
│   ├── app/                    # 页面路由与布局
│   │   ├── api/                # API 路由
│   │   │   ├── auth/           # 认证相关 API
│   │   │   │   ├── login/      # 登录
│   │   │   │   ├── logout/     # 登出
│   │   │   │   ├── me/         # 获取当前用户
│   │   │   │   └── register/   # 注册（员工可自注册）
│   │   │   ├── customers/      # 客户管理 API
│   │   │   │   ├── [id]/       # 客户详情/更新/删除
│   │   │   │   │   └── communications/ # 沟通记录
│   │   │   │   └── route.ts    # 客户列表/创建
│   │   │   ├── users/          # 用户管理 API（仅管理员）
│   │   │   ├── ai/             # AI 字段提取 API
│   │   │   └── feishu/         # 飞书集成 API
│   │   │       ├── config/     # 飞书配置管理
│   │   │       └── init/       # 初始化多维表格
│   │   ├── dashboard/          # 主页面（需登录）
│   │   │   ├── customers/[id]/ # 客户详情页
│   │   │   ├── layout.tsx      # 主布局（侧边栏）
│   │   │   └── page.tsx        # 客户列表页
│   │   ├── users/              # 用户管理页（仅管理员）
│   │   ├── communications/     # 沟通记录页
│   │   ├── feishu-settings/    # 飞书设置页（仅管理员）
│   │   └── page.tsx            # 登录/注册页
│   ├── components/ui/          # Shadcn UI 组件库
│   ├── lib/                    # 工具库
│   │   ├── auth.ts             # 认证工具函数
│   │   ├── feishu.ts           # 飞书 API 客户端
│   │   ├── feishu-sync.ts      # 飞书同步逻辑
│   │   └── utils.ts            # 通用工具函数
│   ├── storage/                # 数据存储
│   │   └── database/           # 数据库相关
│   │       ├── shared/         # 共享模型
│   │       │   └── schema.ts   # 数据库表结构定义
│   │       └── supabase-client.ts # Supabase 客户端
│   └── server.ts               # 自定义服务端入口
├── next.config.ts              # Next.js 配置
├── package.json                # 项目依赖管理
└── tsconfig.json               # TypeScript 配置
```

## 数据库表结构

### crm_users (用户表)
- id: UUID 主键
- email: 邮箱（唯一）
- password_hash: 密码哈希
- name: 用户名
- role: 角色 (admin/staff)
- is_active: 是否激活
- created_at, updated_at: 时间戳

### customers (客户表)
- id: UUID 主键
- customer_code: 客户唯一编码 (如 CRM-20240101-0001)
- name: 姓名
- contact: 联系方式
- city: 城市
- ai_purpose: 想用AI做什么
- owner_id: 跟进人ID（外键）
- feishu_record_id: 飞书记录ID（用于同步）
- created_at, updated_at: 时间戳

### communications (沟通记录表)
- id: UUID 主键
- customer_id: 客户ID（外键，级联删除）
- user_id: 沟通人ID（外键）
- content: 沟通内容
- created_at: 时间戳

### feishu_config (飞书配置表)
- id: UUID 主键
- key: 配置键
- value: 配置值
- updated_at: 更新时间

## 包管理规范

**仅允许使用 pnpm** 作为包管理器，**严禁使用 npm 或 yarn**。

## 开发规范

### 编码规范

- 默认按 TypeScript `strict` 心智写代码
- 禁止隐式 `any` 和 `as any`
- 函数参数、返回值应有明确类型

### Hydration 问题防范

1. 严禁在 JSX 渲染逻辑中直接使用 typeof window、Date.now()、Math.random() 等动态数据
2. 必须使用 'use client' 并配合 useEffect + useState 确保动态内容仅在客户端挂载后渲染

## UI 设计与组件规范

- 项目预装 shadcn/ui 组件库，位于 `src/components/ui/` 目录下
- 默认采用 shadcn/ui 组件、风格和规范

## 功能说明

### 认证系统
- 登录：`POST /api/auth/login`
- 登出：`POST /api/auth/logout`
- 获取当前用户：`GET /api/auth/me`
- 注册：`POST /api/auth/register`（员工可自注册，自动成为员工角色）

### 权限控制
- **管理员**：可以查看所有客户、管理所有用户、配置飞书
- **员工**：只能查看和管理自己跟进的客户，可自行注册账号

### 智能识别功能
1. 用户使用手机语音输入法说出客户信息
2. 复制粘贴到系统输入框
3. 点击"一键识别"按钮
4. AI 自动提取姓名、联系方式、城市、AI需求等字段
5. 自动填充到表单，可手动修改后保存

### 飞书多维表格同步
- 管理员可在「飞书设置」页面配置
- 支持自动创建多维表格
- 客户信息自动同步到飞书
- 同步字段：客户编号、姓名、联系方式、城市、AI需求、跟进人、创建时间

## 管理员初始化

- 首次初始化管理员需设置 `INIT_ADMIN_EMAIL`
- 首次初始化管理员需设置 `INIT_ADMIN_PASSWORD`
- 可选设置 `INIT_ADMIN_NAME`

系统不再提供默认管理员凭据。

## 员工使用流程

1. 访问系统首页，点击「员工注册」标签
2. 填写姓名、邮箱、密码完成注册
3. 使用注册的账号登录
4. 登录后只能看到自己跟进的客户
5. 新增客户时自动成为该客户的跟进人
