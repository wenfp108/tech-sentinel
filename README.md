# Tech Sentinel

> 科技情报双轨采集系统 — GitHub 代码情报 + 学术论文前沿侦察

## 架构

```
┌──────────────────┐    ┌───────────────────┐
│  sentinel.js     │    │ paper_sentinel.js  │
│  (GitHub 代码)    │    │  (学术论文)         │
│  Octokit API     │    │  OpenAlex API      │
└────────┬─────────┘    └────────┬──────────┘
         │                       │
         └───────────┬───────────┘
                     ↓
            data/tech/ + data/papers/
                     ↓
            Harvest → Central-Bank → 清理本地
```

## 双轨设计

| | sentinel.js | paper_sentinel.js |
|---|---|---|
| **数据源** | GitHub Search API | OpenAlex API |
| **目标** | 24h 内 >40 星的新仓库 | 7 天内高引论文 + 顶刊 |
| **输出** | `data/tech/{date}/` | `data/papers/{date}/` |
| **频率** | 每 6 小时 | 每 6 小时（并行） |

## 策略引擎

### GitHub 代码策略 (sentinel.js)

| 大师 | 策略 | 触发条件 |
|------|------|---------|
| **Andreessen** | TECH_ACCELERATOR | AI/LLM/GPU/编译器等关键词 |
| **Torvalds** | CORE_PRAGMATISM | Rust/C/C++/Zig + 系统底层关键词 |
| **Naval** | CODE_LEVERAGE | 协议/SDK/Agent 等 + forks > 10 |
| **Graham** | PARADIGM_SHIFT | "reimagining" / "alternative to" 等 |

保底策略：>200 星自动入选 `VIRAL_GIANT`。

### 论文策略 (paper_sentinel.js)

| 大师 | 策略 | 覆盖领域 |
|------|------|---------|
| **Andreessen** | AI_CORE | LLM/Transformer/Agent |
| **Darwin** | BIO_REVOLUTION | CRISPR/mRNA/合成生物学 |
| **Von Braun** | SPACE_DEFENSE | 航天/高超音速/电子战 |
| **Oppenheimer** | STRATEGIC_ENERGY | 核聚变/等离子体/氢能 |
| **Curie** | ADVANCED_MATERIALS | 固态电池/钙钛矿/超导 |
| **Turing** | NEXT_COMPUTING | 量子/半导体/光子计算 |
| **Graham** | PARADIGM_SHIFT | "rethinking" / "survey" 等 |

双轨筛选：
- **名门网**：Nature/Science/Cell/PNAS，直接入选
- **热度网**：有引用 + 命中大师策略

## 自动化流程

```
每 6 小时 → sentinel.js + paper_sentinel.js 并行采集
    → 提交到本仓库 data/
    → 自动触发 Bank Transport
    → 复制到 Central-Bank → 校验 → 清理本地
```

## 关联仓库

| 仓库 | 用途 |
|------|------|
| [tech-sentinel](https://github.com/wenfp108/tech-sentinel) | 本仓库。代码 + 论文采集 |
| [Central-Bank](https://github.com/wenfp108/Central-Bank) | 数据存储 |
| [Refinery-Engine](https://github.com/wenfp108/refinery-erngine) | 数据清洗 + AI 审计 |

## 环境变量

| 变量 | 用途 |
|------|------|
| `GITHUB_TOKEN` | GitHub API（自动提供） |
| `MY_PAT` | GitHub PAT（访问 Central-Bank） |
| `CONTACT_EMAIL` | OpenAlex API 要求的联系邮箱 |

## 环境

- **Runner**: GitHub Actions (`ubuntu-latest`)
- **Engine**: Node.js 20 (ES Modules)
- **调度**: 每 6 小时
