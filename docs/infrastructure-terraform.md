# Terraform Infrastructure Guide

This guide covers the StellarKraal Terraform modules located in `infrastructure/`. It expands on the Docker Compose resource overview in [`docs/infrastructure.md`](./infrastructure.md).

## Overview

The infrastructure is managed as a single root module that wires together five child modules. All resources are deployed to AWS and are scoped to a Terraform workspace (`staging` or `production`), which drives name-prefixing and environment-specific variable files.

```
infrastructure/
├── main.tf          # Root — wires all modules
├── variables.tf     # All input variables with defaults
├── outputs.tf       # Exported values (ALB DNS, secret ARNs, etc.)
├── providers.tf     # AWS provider + Terraform version constraints
├── backend.tf       # Remote state configuration
├── envs/            # Per-environment .tfvars files
│   ├── staging.tfvars
│   └── production.tfvars
└── modules/
    ├── networking/  # VPC, subnets, NAT, security groups
    ├── alb/         # Application Load Balancer + listeners
    ├── compute/     # EC2 Auto Scaling Group
    ├── database/    # RDS PostgreSQL
    └── redis/       # ElastiCache Redis
```

---

## Prerequisites

| Tool | Minimum version |
|------|----------------|
| Terraform | >= 1.0.0 |
| AWS CLI | >= 2.0 (authenticated) |
| AWS provider | ~> 5.0 |

The AWS provider region defaults to `us-east-1`. Override with `aws_region` in your `.tfvars` file.

---

## Workspaces and Variable Files

Workspaces control the `name_prefix` of every resource (`stellarkraal-staging`, `stellarkraal-production`). CI/CD passes the matching var file at plan/apply time:

```bash
terraform workspace select staging
terraform plan -var-file="envs/staging.tfvars"

terraform workspace select production
terraform apply -var-file="envs/production.tfvars"
```

---

## Module Reference

### networking

**Source:** `./modules/networking`

Creates the network foundation. All other modules depend on its outputs.

**Resources created:**
- VPC with DNS support and hostnames enabled
- Public subnets (one per AZ) — used by ALB and NAT gateways
- Private subnets (one per AZ) — used by compute instances
- Database subnets (one per AZ) — used by RDS and ElastiCache; no internet route
- Internet gateway
- NAT gateways — `nat_gateway_count = 1` for staging (cost-optimised), one per AZ for production (HA)
- Route tables (public → IGW, private → NAT, database → VPC-only)
- Security groups for ALB, app, DB, and Redis tiers with explicit least-privilege rules

**Key security groups:**

| Group | Ingress | Egress |
|-------|---------|--------|
| `sg-alb` | TCP 80/443 from `0.0.0.0/0` | All (to app tier) |
| `sg-app` | App port from ALB SG only | TCP 443 (HTTPS), TCP/UDP 53 (DNS), TCP 5432 (DB SG), TCP 6379 (Redis SG) |
| `sg-db` | TCP 5432 from app SG only | None |
| `sg-redis` | TCP 6379 from app SG only | None |

**Key variables:**

| Variable | Description | Default |
|----------|-------------|---------|
| `vpc_cidr` | VPC CIDR block | — |
| `availability_zones` | AZ list (min 2 for production) | — |
| `public_subnet_cidrs` | One per AZ, order matches AZs | — |
| `private_subnet_cidrs` | One per AZ | — |
| `database_subnet_cidrs` | One per AZ | — |
| `nat_gateway_count` | 1 = staging, `length(AZs)` = production | `1` |

---

### alb

**Source:** `./modules/alb`

Creates an internet-facing Application Load Balancer with TLS termination.

**Resources created:**
- S3 bucket for ALB access logs (public access blocked, policy grants ELB service account write)
- Application Load Balancer in public subnets
- Target group targeting the app port with HTTP health checks
- HTTP listener on port 80 — permanent redirect (301) to HTTPS
- HTTPS listener on port 443 — TLS 1.3 policy (`ELBSecurityPolicy-TLS13-1-2-2021-06`), forwards to target group

**Health check defaults:**

| Setting | Value |
|---------|-------|
| Path | `/health` (configurable via `health_check_path`) |
| Matcher | `200-299` |
| Interval | 30 s |
| Timeout | 5 s |
| Healthy threshold | 2 |
| Unhealthy threshold | 3 |

**Key variables:**

| Variable | Description | Default |
|----------|-------------|---------|
| `app_port` | Port the app listens on | `8080` |
| `health_check_path` | ALB health check path | `/health` |
| `acm_certificate_arn` | ACM TLS certificate ARN | — (required) |

**Outputs:**

| Output | Description |
|--------|-------------|
| `alb_dns_name` | Point your CNAME or Route 53 alias record here |
| `alb_zone_id` | Hosted zone ID for Route 53 alias records |

---

### compute

**Source:** `./modules/compute`

Creates EC2 instances in private subnets behind the ALB via an Auto Scaling Group.

**Resources created:**
- IAM role with `AmazonSSMManagedInstanceCore` and `CloudWatchAgentServerPolicy` attached (enables SSM Session Manager and CloudWatch Agent — no SSH required)
- Launch Template using the latest Amazon Linux 2023 AMI (resolved dynamically); IMDSv2 enforced; root EBS volume encrypted with gp3
- Auto Scaling Group in private subnets with rolling instance refresh (min 50% healthy)
- CPU scale-out policy (alarm at `scale_out_cpu_threshold`, default 70%) — adds 1 instance, 300 s cooldown
- CPU scale-in policy (alarm at `scale_in_cpu_threshold`, default 30%) — removes 1 instance, 300 s cooldown

**Key variables:**

| Variable | Description | Default |
|----------|-------------|---------|
| `instance_type` | EC2 instance type | — (required) |
| `root_volume_size_gb` | Root EBS volume size | `20` |
| `asg_min_size` | Minimum ASG capacity | `1` |
| `asg_max_size` | Maximum ASG capacity | `4` |
| `asg_desired_capacity` | Initial desired capacity | `2` |
| `scale_out_cpu_threshold` | CPU % to scale out | `70` |
| `scale_in_cpu_threshold` | CPU % to scale in | `30` |

**Outputs:**

| Output | Description |
|--------|-------------|
| `asg_name` | Auto Scaling Group name |

---

### database

**Source:** `./modules/database`

Creates an RDS PostgreSQL instance with encryption, automated backups, and CloudWatch alarms.

**Resources created:**
- KMS key for RDS encryption at rest (30-day deletion window, automatic key rotation)
- Random 32-character master password (never stored in Terraform state as plaintext)
- AWS Secrets Manager secret (`<name_prefix>/db/master-credentials`) containing host, port, username, password, and database name — encrypted with the RDS KMS key
- DB subnet group across database subnets
- RDS parameter group (PostgreSQL 15) with connection logging enabled
- RDS PostgreSQL instance — private, encrypted, Multi-AZ optional, automated backups on schedule `03:00-04:00 UTC`, maintenance window Monday `04:00-05:00 UTC`
- CloudWatch alarms: CPU > 80%, free storage < 5 GB, connections > threshold

**Key variables:**

| Variable | Description | Default |
|----------|-------------|---------|
| `db_instance_class` | RDS instance class | — (required) |
| `db_name` | Database name | `stellarkraal` |
| `db_username` | Master username | `skadmin` |
| `db_allocated_storage_gb` | Initial storage (GB) | `20` |
| `db_max_allocated_storage_gb` | Storage autoscaling ceiling (GB) | `100` |
| `db_multi_az` | Multi-AZ deployment | `false` — set `true` for production |
| `db_backup_retention_days` | Backup retention | `7` |
| `db_deletion_protection` | Deletion protection | `false` — set `true` for production |
| `db_enable_performance_insights` | Performance Insights | `false` |
| `db_max_connections_alarm_threshold` | Connection alarm threshold | `100` |

**Outputs:**

| Output | Description |
|--------|-------------|
| `db_endpoint` | RDS connection endpoint (host:port) |
| `db_credentials_secret_arn` | Secrets Manager ARN for DB credentials |

> The application retrieves credentials from Secrets Manager at startup — the password is never passed via environment variables.

---

### redis

**Source:** `./modules/redis`

Creates an ElastiCache Redis replication group with encryption and optional Multi-AZ failover.

**Resources created:**
- KMS key for ElastiCache encryption at rest (30-day deletion window, automatic rotation)
- Random 64-character AUTH token (no special characters, as required by ElastiCache) stored in Secrets Manager (`<name_prefix>/redis/auth-token`)
- ElastiCache subnet group across database subnets
- Parameter group (Redis 7) with `maxmemory-policy = allkeys-lru` and keyspace notifications disabled
- ElastiCache replication group — encryption at rest and in transit, AUTH token required, optional Multi-AZ and automatic failover
- CloudWatch alarms: CPU > 70%, memory usage > 80%

**Key variables:**

| Variable | Description | Default |
|----------|-------------|---------|
| `redis_node_type` | ElastiCache node type | — (required) |
| `redis_num_cache_nodes` | Number of nodes (1 = staging, 2+ = production) | `1` |
| `redis_automatic_failover_enabled` | Automatic failover (requires nodes >= 2) | `false` |
| `redis_multi_az_enabled` | Multi-AZ | `false` |
| `redis_snapshot_retention_days` | Snapshot retention | `1` |

**Outputs:**

| Output | Description |
|--------|-------------|
| `redis_primary_endpoint` | Primary Redis endpoint address |
| `redis_auth_token_secret_arn` | Secrets Manager ARN for Redis AUTH token |

---

## Staging vs Production Differences

| Concern | Staging | Production |
|---------|---------|------------|
| NAT Gateways | 1 (shared across AZs) | One per AZ |
| RDS Multi-AZ | `false` | `true` |
| RDS deletion protection | `false` | `true` |
| RDS Performance Insights | `false` | `true` |
| Redis failover | Disabled | Enabled (nodes >= 2) |
| Redis Multi-AZ | `false` | `true` |

---

## Remote State

State is stored remotely (see `backend.tf`). Before running `terraform init` for the first time, ensure the S3 bucket and DynamoDB lock table referenced in `backend.tf` exist. The `infrastructure/bootstrap/` directory contains a one-time setup to create them.

---

## Root Outputs

After `terraform apply`, the root module exposes:

| Output | Description |
|--------|-------------|
| `vpc_id` | VPC ID |
| `public_subnet_ids` | Public subnet IDs |
| `private_subnet_ids` | Private (app) subnet IDs |
| `database_subnet_ids` | Database subnet IDs |
| `alb_dns_name` | ALB DNS name — set your CNAME here |
| `alb_zone_id` | ALB hosted zone ID for Route 53 alias |
| `asg_name` | Auto Scaling Group name |
| `db_endpoint` | RDS endpoint |
| `db_credentials_secret_arn` | Secrets Manager ARN (sensitive) |
| `redis_primary_endpoint` | Redis primary endpoint |
| `redis_auth_token_secret_arn` | Secrets Manager ARN (sensitive) |

---

## Related Docs

- [`docs/infrastructure.md`](./infrastructure.md) — Docker Compose resource limits and local environment
- [`docs/deployment/`](./deployment/) — CI/CD deployment runbooks
- [`infrastructure/modules/`](../infrastructure/modules/) — Module source files
