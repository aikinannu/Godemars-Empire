# Central SaaS Platform Architecture

## Vision
Transform GodemarsEmpire2 into a unified multi-tenant SaaS ecosystem providing cloud infrastructure, CMS, CRM, e-commerce, marketing automation, payments, licensing, analytics, workflow automation, marketplace integrations, job applications, and team collaboration.

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│           Multi-Tenant Frontend Layer (React Vite)          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Tenant Portal  │  Admin Dashboard  │  White-Label UI │ │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│             API Gateway & Service Router (Node.js)          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Auth  │ Routing  │ Rate Limiting  │ CORS │ Logging  │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│           Microservices Layer (Node.js + PHP)               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Tenant Mgmt  │ User Auth  │ CMS  │ CRM  │ Payments │   │
│  │ Analytics    │ Licensing  │ Jobs │ Team │ Workflows│   │
│  └─────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│         Data Layer (PostgreSQL + Redis Cache)               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Tenants  │ Users  │ CMS  │ CRM  │ Orders  │ Analytics│ │
│  │ Sessions │ Cache  │ Queue│ Jobs │ Logs    │ Events  │ │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Multi-Tenant Foundation
- **Tenant Isolation**: Database-level tenant isolation with tenant_id on all tables
- **Tenant Context**: Middleware to extract and validate tenant from JWT token
- **Tenant Provisioning**: Auto-create tenant databases/schemas on signup
- **White-Labeling**: Tenant-specific branding, domains, and configurations

### 2. Authentication & Authorization
- **Single Sign-On (SSO)**: JWT-based auth across all modules
- **Multi-Factor Authentication**: Optional 2FA for enterprise tenants
- **Role-Based Access Control (RBAC)**: Fine-grained permissions per tenant
- **API Key Management**: Service-to-service authentication

### 3. Module Architecture

#### CMS Module
- **Content Management**: Pages, posts, media library, versions
- **Publishing Workflow**: Draft → Review → Publish → Archive
- **Multi-language Support**: Content translation and localization
- **SEO Tools**: Meta tags, sitemaps, schema markup
- **Performance**: Image optimization, CDN integration

#### CRM Module
- **Contact Management**: Customers, leads, accounts, deals
- **Pipeline Management**: Sales funnel with drag-drop pipeline
- **Activity Tracking**: Calls, emails, meetings, tasks
- **Reporting**: Sales reports, forecasts, analytics
- **Integration**: Sync with email, calendar, third-party tools

#### Licensing & Subscriptions
- **License Management**: Generation, validation, tracking
- **Subscription Plans**: Usage-based, tier-based, hybrid pricing
- **Billing Cycles**: Monthly, quarterly, annual with prorations
- **Payment Processing**: Multiple payment gateways (Stripe, PayPal, etc.)
- **Usage Tracking**: Real-time usage metrics and limits

#### Analytics & Real-Time Dashboards
- **Event Tracking**: User behavior, system events, custom events
- **Real-time Metrics**: Live dashboards with WebSocket updates
- **Reports**: Customizable reports with filters, exports
- **Data Visualization**: Charts, graphs, heatmaps
- **Forecasting**: Trend analysis and predictions

#### Additional Modules
- **Team Collaboration**: Workspaces, channels, chat, document sharing
- **E-commerce**: Products, inventory, orders, cart management
- **Payment Systems**: Multi-currency, fraud detection, reconciliation
- **Marketplace**: Vendor management, commission tracking, listings
- **Job Applications**: Job postings, applicant tracking, interviews
- **Workflow Automation**: Triggers, actions, visual builder

### 4. Security Architecture
- **Data Encryption**: At-rest (AES-256) and in-transit (TLS 1.3)
- **Audit Logging**: All actions logged with timestamp, user, changes
- **Rate Limiting**: Per-tenant, per-user, per-IP limits
- **DDoS Protection**: CloudFlare/WAF integration
- **Compliance**: GDPR, CCPA, SOC 2 ready
- **API Security**: OAuth2, API keys, HMAC signing

### 5. Scalability & Performance
- **Horizontal Scaling**: Stateless services, load balancing
- **Caching Strategy**: Redis for sessions, queries, computed data
- **Database Optimization**: Indexing, partitioning by tenant_id
- **Async Processing**: Job queue for long-running operations
- **CDN Integration**: Static assets, media files distributed
- **Monitoring**: Real-time alerts, performance metrics

### 6. Real-Time Features
- **WebSocket Server**: Real-time updates for dashboards
- **Event Broadcasting**: Tenant-scoped event system
- **Live Notifications**: Desktop, email, in-app notifications
- **Collaborative Editing**: Multi-user document/form editing
- **Activity Feeds**: Real-time activity updates

## Technology Stack

### Frontend
- **Framework**: React 19+ with Vite
- **State Management**: Redux Toolkit + Context API
- **Real-time**: Socket.io client
- **Components**: TailwindCSS + Shadcn UI
- **Charts**: Recharts, Chart.js
- **Forms**: React Hook Form + Zod validation

### Backend - Node.js
- **Framework**: Express.js or Fastify
- **Database ORM**: Prisma
- **Validation**: Zod
- **Auth**: JWT + Passport.js
- **Real-time**: Socket.io
- **Job Queue**: Bull (Redis-backed)
- **Caching**: Redis
- **API Documentation**: Swagger/OpenAPI

### Backend - PHP (Legacy Services)
- **Framework**: Custom or Laravel
- **Compatibility**: Existing license server
- **Integration**: Via REST API with Node.js gateway

### Infrastructure
- **Database**: PostgreSQL 15+
- **Cache**: Redis 7+
- **Message Queue**: Redis or RabbitMQ
- **File Storage**: AWS S3 or MinIO
- **Containerization**: Docker + Docker Compose
- **Orchestration**: Kubernetes (optional, production)

## Database Schema Overview

```sql
-- Core tenant isolation
CREATE TABLE tenants (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE,
  domain VARCHAR(255),
  status ENUM('active', 'suspended', 'deleted'),
  plan VARCHAR(50),
  stripe_customer_id VARCHAR(255),
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  metadata JSONB
);

-- All tables have tenant_id for isolation
ALTER TABLE users ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE cms_pages ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE crm_contacts ADD COLUMN tenant_id UUID REFERENCES tenants(id);
-- ... etc

-- Role-Based Access Control
CREATE TABLE roles (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  name VARCHAR(100),
  permissions TEXT[] -- Array of permission strings
);

-- Audit logging
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100),
  resource_type VARCHAR(100),
  resource_id VARCHAR(255),
  changes JSONB,
  created_at TIMESTAMP
);
```

## API Endpoint Structure

```
# Authentication
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
POST   /api/v1/auth/refresh
GET    /api/v1/auth/me

# Tenants (Admin)
POST   /api/v1/tenants
GET    /api/v1/tenants/:id
PUT    /api/v1/tenants/:id
DELETE /api/v1/tenants/:id

# Users (Tenant-scoped)
GET    /api/v1/tenants/:tenantId/users
POST   /api/v1/tenants/:tenantId/users
PUT    /api/v1/tenants/:tenantId/users/:userId

# CMS
GET    /api/v1/tenants/:tenantId/cms/pages
POST   /api/v1/tenants/:tenantId/cms/pages
PUT    /api/v1/tenants/:tenantId/cms/pages/:pageId

# CRM
GET    /api/v1/tenants/:tenantId/crm/contacts
POST   /api/v1/tenants/:tenantId/crm/contacts
PUT    /api/v1/tenants/:tenantId/crm/contacts/:contactId

# Analytics
GET    /api/v1/tenants/:tenantId/analytics/dashboard
GET    /api/v1/tenants/:tenantId/analytics/events
GET    /api/v1/tenants/:tenantId/analytics/reports

# Licensing
POST   /api/v1/licenses/validate
POST   /api/v1/licenses/activate
GET    /api/v1/licenses/:licenseId
```

## Deployment Architecture

### Development
- Docker Compose with all services
- Hot reload for Node.js and React
- Local PostgreSQL and Redis

### Staging
- Kubernetes cluster (optional)
- AWS RDS for PostgreSQL
- Redis ElastiCache
- S3 for file storage
- CloudFront CDN

### Production
- Kubernetes + Auto-scaling
- RDS PostgreSQL with replicas
- Redis cluster (Sentinel for HA)
- AWS S3 + CloudFront
- CloudFlare for DDoS protection
- Monitoring: DataDog / New Relic

## Security Considerations

1. **Tenant Isolation**
   - Verify tenant_id in JWT matches requested resource
   - Query filtering by tenant_id at database level
   - Separate database schemas per tenant (optional)

2. **Authentication**
   - JWT with RS256 signing
   - Refresh token rotation
   - Session management with Redis

3. **Authorization**
   - Permission checks on every endpoint
   - Resource ownership validation
   - Audit logging of all actions

4. **Data Protection**
   - Encryption at rest (database)
   - TLS 1.3 for all communications
   - Field-level encryption for PII
   - Automatic backups with encryption

## Roadmap

### Phase 1: MVP (Week 1-2)
- [x] User authentication with multi-tenant support
- [ ] Tenant management & provisioning
- [ ] Admin dashboard foundation
- [ ] Basic CMS module
- [ ] Basic CRM module
- [ ] Licensing integration

### Phase 2: Core Features (Week 3-4)
- [ ] Advanced CMS (versioning, publishing workflow)
- [ ] Advanced CRM (pipelines, activities)
- [ ] Analytics & dashboards
- [ ] Real-time notifications
- [ ] Role-based access control

### Phase 3: Advanced Features (Week 5-6)
- [ ] Team collaboration
- [ ] Workflow automation
- [ ] E-commerce module
- [ ] Payment systems integration
- [ ] Marketplace

### Phase 4: Enterprise (Week 7-8)
- [ ] White-label deployment
- [ ] Advanced security & compliance
- [ ] Performance optimization
- [ ] Kubernetes deployment
- [ ] Multi-region setup

## Development Environment Setup

See `SETUP.md` for detailed setup instructions.
