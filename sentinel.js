import { Octokit } from "@octokit/rest";
import fs from 'fs';
import path from 'path';
import { withRetry } from './shared/retry.js';

const CONFIG = {
    owner: process.env.REPO_OWNER,
    repo: process.env.REPO_NAME,
    token: process.env.GITHUB_TOKEN,
    FORCE_KEEP_STARS: 200 
};

const octokit = new Octokit({ auth: CONFIG.token });

// --- 核心保留与趋势策略  ---
const KEEP_STRATEGIES = {
    ANDREESSEN: (text, repo) => (text.match(/agi|infra|llm|cuda|compiler|quantization|tensor|gpu|vision|ocr|vlm|multimodal|transformer|inference|rag|weights|model/i)) ? 'TECH_ACCELERATOR' : null,
    TORVALDS: (text, repo) => (['Rust', 'C', 'C++', 'Zig', 'Assembly'].includes(repo.language) && text.match(/kernel|driver|runtime|engine|embedded|performance|os|virtualization/i)) ? 'CORE_PRAGMATISM' : null,
    NAVAL: (text, repo) => (text.match(/protocol|sdk|api-first|autonomous|agent|permissionless|defi|workflow|browser|scrape/i) && repo.forks > 10) ? 'CODE_LEVERAGE' : null,
    GRAHAM: (text, repo) => (text.match(/reimagining|alternative to|solving the problem of|new way|vs code/i)) ? 'PARADIGM_SHIFT' : null
};

const STAT_ONLY_STRATEGIES = {
    SKILLS: (text) => (text.match(/skills|roadmap|path|learning|guide|101|tutorial|course/i)) ? 'TALENT_GROWTH' : null,
    INTERVIEW: (text) => (text.match(/interview|questions|leetcode|offer/i)) ? 'CAREER_MOVES' : null,
    RESOURCE: (text) => (text.match(/awesome|collection|list|curated|resources|template|dataset|json/i)) ? 'KNOWLEDGE_BASE' : null
};

async function run() {
    // ✨ 时间戳处理逻辑
    const now = new Date();
    // 转换为北京时间 (UTC+8)
    const bjTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    const hour = bjTime.getUTCHours();
    const ampm = hour < 12 ? 'AM' : 'PM';
    const timeLabel = `${ampm}-${hour}h`;
    const dateStr = `${bjTime.getUTCFullYear()}-${String(bjTime.getUTCMonth() + 1).padStart(2, '0')}-${String(bjTime.getUTCDate()).padStart(2, '0')}`;

    console.log(`🚀 Sentinel [${timeLabel}] 启动侦察...`);

    try {
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const query = `stars:>40 created:>=${yesterday}`;

        const { data } = await withRetry(
            () => octokit.search.repos({
                q: query, sort: 'stars', order: 'desc', per_page: 50
            }),
            { label: 'GitHub Search API' }
        );

        const stats = {}; 
        const eliteItems = [];

        data.items.forEach(repo => {
            const text = (repo.name + " " + (repo.description || "")).toLowerCase();
            let isKeeper = false;
            let forceKeep = false;
            const tags = [];

            for (const [name, logic] of Object.entries(KEEP_STRATEGIES)) {
                const tag = logic(text, repo);
                if (tag) { tags.push(tag); isKeeper = true; }
            }
            for (const [name, logic] of Object.entries(STAT_ONLY_STRATEGIES)) {
                const tag = logic(text);
                if (tag) tags.push(tag);
            }

            if (!isKeeper && repo.stargazers_count >= CONFIG.FORCE_KEEP_STARS) {
                isKeeper = true;
                forceKeep = true;
                tags.push('VIRAL_GIANT');
            }

            if (tags.length === 0) tags.push('VIRAL_UNCATEGORIZED');
            tags.forEach(t => { stats[t] = (stats[t] || 0) + 1; });

            if (isKeeper) {
                eliteItems.push({
                    name: repo.full_name,
                    stars: repo.stargazers_count,
                    tags: tags,
                    reason: forceKeep ? "FORCE_KEEP" : "STRATEGY",
                    url: repo.html_url
                });
            }
        });

        // 💾 本地写入逻辑 (替代原有的 API 提交逻辑)
        if (eliteItems.length > 0) {
            const filePath = `data/tech/${dateStr}/sentinel-${timeLabel}.json`;
            const dir = path.dirname(filePath);

            // 确保目录存在
            if (!fs.existsSync(dir)){
                fs.mkdirSync(dir, { recursive: true });
            }

            const fileContent = {
                meta: {
                    scanned_at_bj: bjTime.toISOString(),
                    session: ampm,
                    trend_summary: stats
                },
                items: eliteItems
            };

            fs.writeFileSync(filePath, JSON.stringify(fileContent, null, 2));
            console.log(`✅ [Write Success] Report saved to: ${filePath}`);
            console.log(`📊 Stats: ${Object.entries(stats).map(([k, v]) => `${k}:${v}`).join(', ')}`);
        } else {
            console.log("⚠️ No items found worthy of the vault today.");
        }

    } catch (error) {
        console.error(`❌ Sentinel Scan Failed: ${error.message}`);
        process.exit(1);
    }
}

run();
