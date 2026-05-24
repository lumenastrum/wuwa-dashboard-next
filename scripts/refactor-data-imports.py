"""
One-shot refactor: convert all theme components from static `@/lib/data` imports
to the new `@/lib/data-context` hooks. Idempotent — safe to re-run.
Run from the wuwa-dashboard-next/ project root.
"""
import pathlib
import re
import sys

FILES = [
    "src/components/themes/atelier/cycles.tsx",
    "src/components/themes/atelier/roster.tsx",
    "src/components/themes/atelier/resonator.tsx",
    "src/components/themes/atelier/teams.tsx",
    "src/components/themes/obsidian/cycles.tsx",
    "src/components/themes/obsidian/roster.tsx",
    "src/components/themes/obsidian/resonator.tsx",
    "src/components/themes/obsidian/teams.tsx",
    "src/components/themes/console/cycles.tsx",
    "src/components/themes/console/roster.tsx",
    "src/components/themes/console/resonator.tsx",
    "src/components/themes/console/teams.tsx",
]

def transform(content: str) -> str:
    # Skip if already migrated.
    if "@/lib/data-context" in content:
        return content

    # 1. Drop the old @/lib/data import.
    content = re.sub(
        r'import\s*\{[^}]+\}\s*from\s*["\']@/lib/data["\'];\s*\n',
        "",
        content,
        count=1,
    )

    # 2. Update selector callsites BEFORE renaming RAW/ROSTER identifiers
    #    (selectors took just `name`; new ones take roster/raw too).
    content = re.sub(
        r"\bgetResonatorOrFirst\s*\(\s*([^)]+?)\s*\)",
        r"getResonatorOrFirstOf(rosterByName, roster, \1)",
        content,
    )
    content = re.sub(
        r"\brosterIndex\s*\(\s*([^)]+?)\s*\)",
        r"rosterIndexOf(roster, \1)",
        content,
    )
    content = re.sub(
        r"\brosterNeighbors\s*\(\s*([^)]+?)\s*\)",
        r"rosterNeighborsOf(roster, \1)",
        content,
    )
    content = re.sub(
        r"\bteamsFeaturing\s*\(\s*([^)]+?)\s*\)",
        r"teamsFeaturingOf(raw, \1)",
        content,
    )
    content = re.sub(
        r"\bcycleAppearances\s*\(\s*([^)]+?)\s*\)",
        r"cycleAppearancesOf(raw, \1)",
        content,
    )

    # 3. Insert `const { raw, roster, rosterByName } = useData();` at the start
    #    of every function body that references RAW/ROSTER/ROSTER_BY_NAME.
    out = []
    i = 0
    fn_pattern = re.compile(r"function\s+\w+\s*\([^)]*\)\s*\{")
    while i < len(content):
        m = fn_pattern.match(content, i)
        if m:
            body_start = m.end()
            depth = 1
            j = body_start
            while j < len(content) and depth > 0:
                ch = content[j]
                if ch == "{":
                    depth += 1
                elif ch == "}":
                    depth -= 1
                j += 1
            body = content[body_start : j - 1]
            uses_data = bool(re.search(r"\b(RAW|ROSTER|ROSTER_BY_NAME)\b", body))
            out.append(content[i:body_start])
            if uses_data:
                out.append(
                    "\n  const { raw, roster, rosterByName } = useData();\n"
                )
            out.append(body)
            out.append("}")
            i = j
        else:
            out.append(content[i])
            i += 1
    content = "".join(out)

    # 4. Identifier renames now that function-body scan is done.
    content = re.sub(r"\bROSTER_BY_NAME\b", "rosterByName", content)
    content = re.sub(r"\bROSTER\b", "roster", content)
    content = re.sub(r"\bRAW\b", "raw", content)

    # 5. Determine which selectors are still referenced and add a single
    #    `from "@/lib/data-context"` import.
    needs = ["useData"]
    if "rosterIndexOf(" in content:
        needs.append("rosterIndexOf")
    if "rosterNeighborsOf(" in content:
        needs.append("rosterNeighborsOf")
    if "teamsFeaturingOf(" in content:
        needs.append("teamsFeaturingOf")
    if "cycleAppearancesOf(" in content:
        needs.append("cycleAppearancesOf")
    if "getResonatorOrFirstOf(" in content:
        needs.append("getResonatorOrFirstOf")
    if re.search(r"\broleAccent\(", content):
        needs.append("roleAccent")

    new_import = (
        'import { ' + ", ".join(needs) + ' } from "@/lib/data-context";\n'
    )
    # Insert after the first existing import.
    content = re.sub(
        r'(import[^;]+;\s*\n)',
        r"\1" + new_import,
        content,
        count=1,
    )
    return content


def main(root: pathlib.Path) -> int:
    changed = 0
    for f in FILES:
        p = root / f
        if not p.exists():
            print(f"missing: {f}", file=sys.stderr)
            continue
        old = p.read_text(encoding="utf-8")
        new = transform(old)
        if new != old:
            p.write_text(new, encoding="utf-8")
            changed += 1
            print(f"updated: {f}")
        else:
            print(f"unchanged: {f}")
    print(f"\n{changed} files updated.")
    return 0


if __name__ == "__main__":
    main(pathlib.Path(__file__).resolve().parent.parent)
