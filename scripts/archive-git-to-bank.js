import fs from 'fs';
import path from 'path';
import process from 'process';

async function archiveGitData() {
    const ROOT = process.cwd();
    const LOCAL_DATA = path.resolve(ROOT, 'data');
    const BANK_ROOT = path.resolve(ROOT, 'central_bank');

    console.log(`📅 启动收割程序...`);

    // 定义要搬运的业务线
    const targets = [
        // 1. GitHub 代码情报 -> 存入央行 github/tech
        { local: 'tech', bank: 'github/tech' },
        
        // 2. 论文前沿情报 -> 存入央行 papers/global (✅ 新增路线)
        { local: 'papers', bank: 'papers/global' }
    ];

    // 1. 搬运资产，并验证完整性
    let totalCopied = 0;
    let totalFailed = 0;

    targets.forEach(t => {
        const localCategoryPath = path.join(LOCAL_DATA, t.local);
        const bankCategoryPath = path.join(BANK_ROOT, t.bank);

        if (fs.existsSync(localCategoryPath)) {
            const dateFolders = fs.readdirSync(localCategoryPath).filter(f => {
                const fullPath = path.join(localCategoryPath, f);
                return fs.statSync(fullPath).isDirectory();
            });

            dateFolders.forEach(dateFolder => {
                const sourcePath = path.join(localCategoryPath, dateFolder);
                const targetPath = path.join(bankCategoryPath, dateFolder);

                const files = fs.readdirSync(sourcePath).filter(f => f.endsWith('.json'));

                if (files.length > 0) {
                    if (!fs.existsSync(targetPath)) {
                        fs.mkdirSync(targetPath, { recursive: true });
                    }

                    files.forEach(file => {
                        const srcFile = path.join(sourcePath, file);
                        const destFile = path.join(targetPath, file);
                        try {
                            fs.copyFileSync(srcFile, destFile);
                            const srcSize = fs.statSync(srcFile).size;
                            const destSize = fs.statSync(destFile).size;
                            if (srcSize !== destSize) {
                                console.error(`❌ [${t.local}/${dateFolder}] 校验失败: ${file} (src=${srcSize}, dest=${destSize})`);
                                totalFailed++;
                            } else {
                                console.log(`✅ [${t.local}/${dateFolder}] 已搬运: ${file} (${srcSize} bytes)`);
                                totalCopied++;
                            }
                        } catch (err) {
                            console.error(`❌ [${t.local}/${dateFolder}] 搬运失败: ${file} - ${err.message}`);
                            totalFailed++;
                        }
                    });
                }
            });
        }
    });

    // 2. 只有全部搬运成功才清理
    if (totalFailed > 0) {
        console.error(`🛑 检测到 ${totalFailed} 个文件搬运失败，跳过清理以保护数据！`);
        return;
    }

    if (totalCopied === 0) {
        console.log("💤 今日无数据需要搬运，跳过清理。");
        return;
    }

    console.log(`🔥 全部 ${totalCopied} 个文件搬运验证通过，执行本地清理...`);
    if (fs.existsSync(LOCAL_DATA)) {
        const items = fs.readdirSync(LOCAL_DATA);
        items.forEach(item => {
            if (item.startsWith('.git')) return;
            const itemPath = path.join(LOCAL_DATA, item);
            try {
                fs.rmSync(itemPath, { recursive: true, force: true });
                console.log(`🗑️ 已清理: ${item}`);
            } catch (err) {
                console.error(`❌ 清理失败 ${item}: ${err.message}`);
            }
        });
    }
}

archiveGitData().catch(console.error);
