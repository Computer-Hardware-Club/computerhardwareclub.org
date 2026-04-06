import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';

const distDir = 'dist';
const siteEntries = ['500.html', 'about', 'images', 'index.html', 'scripts', 'styles'];

const shouldCopyFile = (filePath) => !filePath.endsWith('.ts') && !filePath.endsWith('.tsx');

const copyStatic = (fromPath, toPath) => {
    if (statSync(fromPath).isDirectory()) {
        for (const entry of readdirSync(fromPath, { withFileTypes: true })) {
            copyStatic(join(fromPath, entry.name), join(toPath, entry.name));
        }

        return;
    }

    if (!shouldCopyFile(fromPath)) {
        return;
    }

    mkdirSync(dirname(toPath), { recursive: true });
    cpSync(fromPath, toPath);
};

if (existsSync(distDir)) {
    rmSync(distDir, { recursive: true, force: true });
}

mkdirSync(distDir, { recursive: true });
siteEntries.forEach((entry) => {
    copyStatic(entry, join(distDir, entry));
});
