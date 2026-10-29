const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../..");
const skillsDir = path.join(root, "hermes-core", "skills");
const pluginsDir = path.join(root, "hermes-core", "plugin-catalog");
const targetDir = path.join(__dirname, "../src/lib/hermes");

const catalog = [];

// 1. Scan official skills
if (fs.existsSync(skillsDir)) {
  function scan(dir, catName = "general") {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === "index-cache" || entry.name.startsWith(".")) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const skillMd = path.join(full, "SKILL.md");
        if (fs.existsSync(skillMd)) {
          const content = fs.readFileSync(skillMd, "utf-8");
          const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
          let name = entry.name;
          let description = "";
          let author = "Nous Research / Hermes Agent";
          if (fmMatch) {
            const fm = fmMatch[1];
            const nameM = fm.match(/name:\s*(.+)/);
            const descM = fm.match(/description:\s*["'`]?([^"'`\n]+)/);
            const authM = fm.match(/author:\s*(.+)/);
            if (nameM) name = nameM[1].trim();
            if (descM) description = descM[1].trim();
            if (authM) author = authM[1].trim();
          }
          catalog.push({
            name,
            title: name.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
            description: description || `Official Hermes skill for ${name}`,
            category: catName,
            type: "skill",
            author,
            provenance: "official",
            enabled: true,
            filePath: path.relative(root, skillMd)
          });
        } else {
          scan(full, entry.name);
        }
      }
    }
  }
  scan(skillsDir);
}

// 2. Scan official plugins
if (fs.existsSync(pluginsDir)) {
  const pluginFiles = fs.readdirSync(pluginsDir).filter(f => f.endsWith(".yaml") || f.endsWith(".yml"));
  for (const pf of pluginFiles) {
    const full = path.join(pluginsDir, pf);
    const content = fs.readFileSync(full, "utf-8");
    const nameM = content.match(/^name:\s*(.+)/m);
    const titleM = content.match(/^title:\s*(.+)/m);
    const descM = content.match(/^description:\s*["']?([^"'\n]+)/m);
    const catM = content.match(/^category:\s*(.+)/m);
    const tierM = content.match(/^tier:\s*(.+)/m);
    const maintM = content.match(/^maintainer:\s*(.+)/m);
    const repoM = content.match(/^repo:\s*(.+)/m);

    const name = nameM ? nameM[1].trim() : pf.replace(/\.ya?ml$/, "");
    const title = titleM ? titleM[1].trim() : name;
    const description = descM ? descM[1].trim() : `Hermes plugin ${name}`;
    const category = catM ? catM[1].trim() : "tools";

    catalog.push({
      name,
      title,
      description,
      category,
      type: "plugin",
      author: maintM ? maintM[1].trim() : "Nous Community",
      tier: tierM ? tierM[1].trim() : "official",
      repo: repoM ? repoM[1].trim() : "",
      provenance: "official",
      enabled: ["artifacts", "hermes-workbench", "qdrant", "quota", "tripwire", "chronicle"].includes(name),
      filePath: path.relative(root, full)
    });
  }
}

console.log("Total catalog entries:", catalog.length);
fs.writeFileSync(path.join(targetDir, "official-skills-catalog.json"), JSON.stringify(catalog, null, 2));
