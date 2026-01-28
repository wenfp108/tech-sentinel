const { Octokit } = require("@octokit/rest");

const CONFIG = {
    owner: process.env.REPO_OWNER,
    repo: process.env.REPO_NAME,
    token: process.env.GITHUB_TOKEN
};

const octokit = new Octokit({ auth: CONFIG.token });

async function run() {
    console.log("🚀 [Sentinel] 启动侦察任务...");
    try {
        // 🛠️ 调试 1：放宽门槛，抓取过去 48 小时内 Star > 10 的项目（确保一定能抓到东西）
        const dateLimit = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString().split('T')[0];
        const query = `stars:>10 created:>=${dateLimit}`;
        console.log(`📡 [Sentinel] 搜索指令: ${query}`);

        const { data } = await octokit.search.repos({
            q: query,
            sort: 'stars',
            order: 'desc',
            per_page: 20
        });

        console.log(`📦 [Sentinel] 发现候选项目: ${data.items.length} 个`);

        // 简单的打标逻辑，用于测试
        const signals = data.items.map(repo => ({
            name: repo.full_name,
            stars: repo.stargazers_count,
            url: repo.html_url
        }));

        if (signals.length > 0) {
            console.log(`✨ [Sentinel] 准备写入数据，包含 ${signals.length} 条记录...`);
            
            // 🛠️ 调试 2：确保路径正确，存放在 data 文件夹下
            const fileName = `test-signal-${Date.now()}.json`;
            const path = `data/${fileName}`;
            
            const response = await octokit.repos.createOrUpdateFileContents({
                owner: CONFIG.owner,
                repo: CONFIG.repo,
                path: path,
                message: "🤖 Sentinel Discovery (Debug Run)",
                content: Buffer.from(JSON.stringify(signals, null, 2)).toString('base64'),
                branch: "main" // 确保写入 main 分支
            });
            
            console.log(`✅ [Sentinel] 文件写入成功: ${response.data.content.path}`);
        } else {
            console.log("⚠️ [Sentinel] 本次搜索未发现符合条件的项目。");
        }
    } catch (e) {
        console.error("❌ [Sentinel] 运行崩溃:");
        console.error(e.message);
        if (e.status === 403) console.error("💡 提示：可能是 GITHUB_TOKEN 权限不足，请检查仓库 Settings -> Actions -> General -> Workflow permissions。");
        process.exit(1);
    }
}

run();
