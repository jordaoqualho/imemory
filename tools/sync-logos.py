#!/usr/bin/env python3
"""Copia a logo de cada projeto do iMemory para web-ui/logos/.

O portal é estático e não enxerga as pastas dos projetos, então este script
procura um ícone em cada repositório (repo_path do banco, o nome atual, o
legacy_name, ~/Workspaces/<nome> ou ~/<nome>) e grava uma cópia local mais um
manifest.json que o portal lê.

Uso:  python3 ~/Workspaces/iMemory/tools/sync-logos.py
Para forçar uma logo, coloque o arquivo em web-ui/logos/overrides/<projeto>.(svg|png|jpg|ico).
"""
import json
import os
import re
import shutil
import sqlite3
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent
WEB_UI = DATA_DIR / 'web-ui'
LOGOS = WEB_UI / 'logos'
OVERRIDES = LOGOS / 'overrides'
WORKSPACES = Path.home() / 'Workspaces'
IMAGE_EXT = {'.svg', '.png', '.jpg', '.jpeg', '.webp', '.ico'}
SKIP_DIRS = {'node_modules', '.git', '.next', 'dist', 'build', 'out', 'target', '.venv', 'venv', 'coverage', '.turbo', 'backups', 'vendor'}
MAX_DEPTH = 5

# Ícones quadrados primeiro; logos (que costumam ser horizontais) depois; .ico por último.
RULES = [
    (re.compile(r'^apple-touch-icon.*\.png$'), 100),
    (re.compile(r'^icon\.svg$'), 95),
    (re.compile(r'^favicon.*\.svg$'), 90),
    (re.compile(r'^(icon|app-icon)(-\d+.*)?\.(png|webp)$'), 85),
    (re.compile(r'^logo.*\.svg$'), 70),
    (re.compile(r'^logo.*\.(png|webp|jpe?g)$'), 65),
    (re.compile(r'^favicon.*\.(png|webp)$'), 60),
    (re.compile(r'^favicon.*\.ico$'), 50),
]

IMEMORY_SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" rx="10" fill="#1d1d1f"/><path d="M10 28V12h5l5 9 5-9h5v16h-5V20l-5 8-5-8v8" fill="#fff"/></svg>"""


def score(path: Path) -> int:
    name = path.name.lower()
    for pattern, points in RULES:
        if pattern.match(name):
            # Variantes brancas somem sobre fundo claro.
            if 'white' in name or 'dark' in name:
                points -= 30
            # Tamanhos maiores ganham um leve bônus.
            size = re.search(r'(\d{2,4})', name)
            if size:
                points += min(int(size.group(1)), 512) // 128
            return points
    return 0


def candidates(root: Path):
    for dirpath, dirnames, filenames in os.walk(root):
        depth = len(Path(dirpath).relative_to(root).parts)
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS and not d.startswith('.')] if depth < MAX_DEPTH else []
        for f in filenames:
            p = Path(dirpath) / f
            if p.suffix.lower() in IMAGE_EXT and p.stat().st_size < 2_000_000:
                s = score(p)
                if s:
                    yield s, -len(p.relative_to(root).parts), p


def projects():
    db = sqlite3.connect(f"file:{DATA_DIR / 'db' / 'memory.sqlite'}?mode=ro", uri=True)
    try:
        return db.execute(
            'SELECT w.name, p.name, p.repo_path, p.legacy_name FROM projects p JOIN workspaces w ON w.id = p.workspace_id'
        ).fetchall()
    finally:
        db.close()


def find_folder(name, legacy, repo_path):
    if repo_path and Path(repo_path).is_dir():
        return Path(repo_path)
    names = []
    for candidate_name in (legacy, name):
        if candidate_name and candidate_name not in names and not candidate_name.startswith('_'):
            names.append(candidate_name)
    roots = (WORKSPACES, Path.home())
    for candidate_name in names:
        for root in roots:
            candidate = root / candidate_name
            if candidate.is_dir():
                return candidate
    wanted = {candidate_name.lower() for candidate_name in names}
    for root in roots:
        if not root.is_dir() or not wanted:
            continue
        for child in root.iterdir():
            if child.is_dir() and child.name.lower() in wanted:
                return child
    return None


def override_for(*names):
    if not OVERRIDES.exists():
        return None
    for name in names:
        if not name:
            continue
        hit = next((p for p in OVERRIDES.glob(name + '.*') if p.suffix.lower() in IMAGE_EXT), None)
        if hit:
            return hit
    return None


def choose(found):
    if not found:
        return None
    best = found[0][2]
    # apple-touch-icon costuma ser um wordmark largo. No chip de 32px, o favicon SVG lê melhor.
    if best.name.lower().startswith('apple-touch-icon'):
        for _, _, path in found:
            if path.suffix.lower() == '.svg' and re.match(r'^(favicon|icon)\.', path.name.lower()):
                return path
    return best


def slug(name: str) -> str:
    return re.sub(r'[^A-Za-z0-9._-]+', '-', name).strip('-') or 'projeto'


def main():
    LOGOS.mkdir(exist_ok=True)
    manifest, report = {}, []
    for workspace, name, repo_path, legacy in sorted(projects(), key=lambda r: r[1].lower()):
        key = f'{workspace}/{name}'
        target_base = LOGOS / slug(f'{workspace}-{name}')
        source = override_for(name, legacy)
        if not source and name == 'iMemory':
            target = target_base.with_suffix('.svg')
            target.write_text(IMEMORY_SVG)
            manifest[key] = f'logos/{target.name}?v={int(target.stat().st_mtime)}'
            report.append((key, 'logo do iMemory'))
            continue
        if not source:
            folder = find_folder(name, legacy, repo_path)
            if folder is not None:
                source = choose(sorted(candidates(folder), reverse=True))
        if not source:
            report.append((key, 'sem logo (monograma)'))
            continue
        for old in LOGOS.glob(target_base.name + '.*'):
            old.unlink()
        target = target_base.with_suffix(source.suffix.lower())
        shutil.copyfile(source, target)
        manifest[key] = f'logos/{target.name}?v={int(target.stat().st_mtime)}'
        report.append((key, str(source).replace(str(Path.home()), '~')))
    (LOGOS / 'manifest.json').write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + '\n')
    kept = {Path(url.split('?', 1)[0]).name for url in manifest.values()}
    for old in LOGOS.iterdir():
        if old.is_file() and old.name != 'manifest.json' and old.name not in kept:
            old.unlink()
    width = max(len(k) for k, _ in report) if report else 0
    for key, what in report:
        print(f'{key.ljust(width)}  {what}')
    print(f'\n{len(manifest)} logos em {LOGOS}')


if __name__ == '__main__':
    main()
