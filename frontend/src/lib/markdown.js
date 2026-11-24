// Mini convertisseur Markdown → HTML pour les pages (titres, gras, italique, listes, liens).
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function inline(s) {
    return esc(s)
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]*)\)/g, '<a href="$2" class="underline">$1</a>');
}

export function markdown(src = '') {
    const out = [];
    let list = null;
    let para = [];
    const flush = () => {
        if (para.length) { out.push(`<p>${inline(para.join(' '))}</p>`); para = []; }
        if (list) { out.push(`<ul>${list.map((li) => `<li>${inline(li)}</li>`).join('')}</ul>`); list = null; }
    };
    for (const raw of src.split(/\r?\n/)) {
        const line = raw.trim();
        if (!line) { flush(); continue; }
        const h = line.match(/^(#{2,4})\s+(.*)$/);
        if (h) { flush(); out.push(`<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`); continue; }
        const li = line.match(/^[-*]\s+(.*)$/);
        if (li) { if (para.length) { out.push(`<p>${inline(para.join(' '))}</p>`); para = []; } (list ||= []).push(li[1]); continue; }
        if (list) flush();
        para.push(line);
    }
    flush();
    return out.join('\n');
}
