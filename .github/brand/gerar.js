// Gera os visuais do perfil com a identidade do felip.cloud (Caderno de Bancada).
// Uso: node .github/brand/gerar.js   (GITHUB_TOKEN opcional; PERFIL padrão = 1felip)
// Saídas: assets/banner.svg, assets/botao-*.svg, assets/stack.svg, assets/trajetoria.svg,
//         assets/repos/<repo>-icone.svg, assets/repos/<repo>-card.svg e o bloco de projetos do README.
// Todo texto vira contorno (path), então as SVGs ficam iguais em qualquer navegador.
const fs = require('fs');
const path = require('path');
const opentype = require('opentype.js');

const AQUI = __dirname;
const RAIZ = path.resolve(AQUI, '..', '..');
const ASSETS = path.join(RAIZ, 'assets');
const PERFIL = process.env.PERFIL || '1felip';

const C = {
  garrafa: '#12352B', areia: '#F2E8D5', ambar: '#FFC83D', medio: '#1C4A3D',
  salvia: '#B9C7B4', musgo: '#4A5C52', papel: '#FBF7EE',
};
const fonte = n => opentype.parse(fs.readFileSync(path.join(AQUI, 'fontes', n)).buffer.slice(0));
const F = {
  titulo: fonte('archivo-expanded-800.ttf'),
  corpo: fonte('archivo-400.ttf'),
  semi: fonte('archivo-600.ttf'),
  mono: fonte('jetbrains-mono-500.ttf'),
};
const TRACK = { titulo: -0.015, corpo: 0, semi: 0, mono: 0 };

// ---------- texto em contorno ----------
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const largura = (f, s, t) => F[f].getAdvanceWidth(s, t, { kerning: true, letterSpacing: TRACK[f] });
function texto(f, s, x, y, t, cor, alinhar) {
  if (!s) return '';
  if (alinhar === 'fim') x -= largura(f, s, t);
  if (alinhar === 'meio') x -= largura(f, s, t) / 2;
  const d = F[f].getPath(s, x, y, t, { kerning: true, letterSpacing: TRACK[f] }).toPathData(1);
  return `<path fill="${cor}" d="${d}"/>`;
}
function quebrar(f, s, t, max) {
  const linhas = [];
  let atual = '';
  for (const p of String(s).split(/\s+/).filter(Boolean)) {
    const tent = atual ? `${atual} ${p}` : p;
    if (largura(f, tent, t) <= max || !atual) atual = tent;
    else { linhas.push(atual); atual = p; }
  }
  if (atual) linhas.push(atual);
  return linhas;
}
function limitar(f, linhas, n, t, max) {
  if (linhas.length <= n) return linhas;
  const r = linhas.slice(0, n);
  let u = r[n - 1];
  while (u.length && largura(f, `${u}…`, t) > max) u = u.replace(/\s*\S+$/, '');
  r[n - 1] = `${u.replace(/[,.;:]$/, '')}…`;
  return r;
}
// Maior tamanho (até "t") que cabe numa linha
const caber = (f, s, t, max) => { while (t > 10 && largura(f, s, t) > max) t -= 1; return t; };

// ---------- traço à mão (determinístico) ----------
function semente(s) { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; }
function aleatorio(s) { let a = semente(s); return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const n2 = v => Number(v.toFixed(1));
function traco(pontos, cor, esp, chave) {
  const r = aleatorio(chave);
  let d = `M${n2(pontos[0][0])} ${n2(pontos[0][1])}`;
  for (let i = 1; i < pontos.length; i++) {
    const [x0, y0] = pontos[i - 1], [x1, y1] = pontos[i];
    const cx = (x0 + x1) / 2 + (r() - .5) * 4, cy = (y0 + y1) / 2 + (r() - .5) * 4;
    d += `Q${n2(cx)} ${n2(cy)} ${n2(x1)} ${n2(y1)}`;
  }
  return `<path d="${d}" fill="none" stroke="${cor}" stroke-width="${esp}" stroke-linecap="round" stroke-linejoin="round"/>`;
}
const svg = (w, h, rotulo, corpo) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(rotulo)}">${corpo}</svg>\n`;

// ---------- página com orelha (a marca FR) ----------
const PAGINA = 'M4 2H46L60 16V62H4Z', ORELHA = 'M46 2V16H60Z';
function monograma(nome) {
  const partes = nome.replace(/([a-z])([A-Z])/g, '$1 $2').split(/[-_.\s]+/).filter(Boolean);
  if (partes.length >= 2) return (partes[0][0] + partes[1][0]).toUpperCase();
  const p = partes[0] || nome;
  return p[0].toUpperCase() + (p[1] || '').toLowerCase();
}
function simbolo(lang) {
  const l = (lang || '').toLowerCase();
  if (/shell|powershell|batch|dockerfile|makefile/.test(l)) return '>_';
  if (/html|css|astro|vue|svelte|scss/.test(l)) return '</>';
  return '{ }';
}
// Desenho da página no grid 64×64; devolve o miolo
function pagina(mono, simb, corPag, corOrelha, corTexto, corSimb) {
  const t0 = 100, b0 = F.titulo.getPath(mono, 0, 0, t0).getBoundingBox();
  const t = Math.min(t0 * 40 / (b0.x2 - b0.x1), t0 * 24 / (b0.y2 - b0.y1));
  const g = F.titulo.getPath(mono, 0, 0, t, { letterSpacing: TRACK.titulo });
  const b = g.getBoundingBox();
  const tx = 32 - (b.x1 + b.x2) / 2 - 1, ty = 34 - b.y2;
  let s = `<path fill="${corPag}" d="${PAGINA}"/><path fill="${corOrelha}" d="${ORELHA}"/>`;
  s += `<path fill="${corTexto}" transform="translate(${n2(tx)} ${n2(ty)})" d="${g.toPathData(1)}"/>`;
  s += texto('mono', simb, 32, 52, 9, corSimb, 'meio');
  return s;
}
function icone(repo) {
  const r = aleatorio(repo.nome), ang = n2(-2 + r() * 4);
  const miolo = pagina(repo.monograma, simbolo(repo.linguagem), C.areia, C.salvia, C.garrafa, C.musgo);
  return svg(128, 128, `Ícone do repositório ${repo.titulo}`,
    `<rect width="128" height="128" fill="${C.garrafa}"/><g transform="rotate(${ang} 64 64) translate(10.2 9.6) scale(1.7)">${miolo}</g>`);
}

// ---------- card de projeto (recorte de papel) ----------
function card(repo) {
  const W = 640, H = 400, M = 22, PW = W - 2 * M, PH = H - 2 * M, X = 40;
  const r = aleatorio(`${repo.nome}-card`), ang = n2(-0.6 + r() * 1.8);
  const max = PW - 2 * X;
  let s = `<rect width="${W}" height="${H}" fill="${C.garrafa}"/>`;
  s += `<g transform="rotate(${ang} ${W / 2} ${H / 2}) translate(${M} ${M})">`;
  s += `<path fill="${C.areia}" d="M0 0H${PW - 52}L${PW} 52V${PH}H0Z"/><path fill="${C.salvia}" d="M${PW - 52} 0V52H${PW}Z"/>`;
  // ícone invertido + rótulo
  s += `<g transform="translate(${X} 30) scale(0.72)">${pagina(repo.monograma, simbolo(repo.linguagem), C.garrafa, C.musgo, C.areia, C.salvia)}</g>`;
  let lx = X + 58;
  if (repo.status) {
    const w = largura('mono', repo.status, 12) + 16;
    s += `<rect x="${lx}" y="38" width="${n2(w)}" height="22" fill="${C.garrafa}"/>` + texto('mono', repo.status, lx + 8, 53.5, 12, C.ambar);
    lx += w + 10;
  }
  const tr = caber('mono', repo.rotulo || '', 12.5, PW - lx - 70);
  s += texto('mono', limitar('mono', quebrar('mono', repo.rotulo, tr, PW - lx - 70), 1, tr, PW - lx - 70)[0], lx, 54, tr, C.musgo);
  // título
  const tt = caber('titulo', repo.titulo, 30, max);
  s += texto('titulo', repo.titulo, X, 126, tt, C.garrafa);
  // descrição
  limitar('corpo', quebrar('corpo', repo.descricao, 18, max), 3, 18, max)
    .forEach((l, i) => { s += texto('corpo', l, X, 166 + i * 26, 18, C.garrafa); });
  // stack
  limitar('mono', quebrar('mono', repo.stack, 12.5, max), 2, 12.5, max)
    .forEach((l, i) => { s += texto('mono', l, X, 262 + i * 19, 12.5, C.musgo); });
  // linha pontilhada + link
  s += `<line x1="${X}" y1="${PH - 64}" x2="${PW - X}" y2="${PH - 64}" stroke="${C.musgo}" stroke-width="1" stroke-dasharray="2 4" opacity=".7"/>`;
  const link = 'Código no GitHub';
  s += texto('semi', link, X, PH - 30, 16, C.garrafa);
  s += `<rect x="${X}" y="${PH - 24}" width="${n2(largura('semi', link, 16))}" height="2" fill="${C.garrafa}"/>`;
  if (repo.estrelas > 0) s += texto('mono', `★ ${repo.estrelas}`, PW - X, PH - 30, 13, C.musgo, 'fim');
  s += '</g>';
  return svg(W, H, `${repo.titulo}: ${repo.descricao}`, s);
}

// ---------- banner (abertura do site) ----------
function banner() {
  const W = 1280, H = 460, X = 64;
  let s = `<rect width="${W}" height="${H}" fill="${C.garrafa}"/>`;
  const logo = fs.readFileSync(path.join(AQUI, 'logo-site.svg'), 'utf8').match(/<path[^>]*\/>/g).join('');
  s += `<g transform="translate(${X} 44) scale(0.118)">${logo}</g>`;
  s += texto('mono', 'felip.cloud', W - X, 66, 15, C.salvia, 'fim');
  // título
  const T = 56, L = 58;
  s += texto('titulo', 'Transformo processos', X, 156, T, C.areia);
  s += texto('titulo', 'manuais em fluxos que', X, 156 + L, T, C.areia);
  const a = 'rodam ', b = 'sozinhos', y3 = 156 + 2 * L;
  const xa = X + largura('titulo', a, T), wb = largura('titulo', b, T);
  s += texto('titulo', a, X, y3, T, C.areia) + texto('titulo', b, xa, y3, T, C.ambar) + texto('titulo', '.', xa + wb, y3, T, C.areia);
  s += traco([[xa - 2, y3 + 14], [xa + wb * .5, y3 + 10], [xa + wb + 6, y3 + 13]], C.ambar, 3, 'sublinhado');
  // apoio
  quebrar('corpo', 'Antes de programar fluxos, eu vendia. Por isso olho para cada automação pelo lado de quem usa: qual tarefa sai das mãos de alguém e quanto tempo isso devolve.', 19, 720)
    .forEach((l, i) => { s += texto('corpo', l, X, 342 + i * 28, 19, C.salvia); });
  s += texto('mono', 'Uberlândia, MG. Aberto a estágio em IA e automação.', X, 420, 14, C.salvia);
  // recorte "fluxo: novo lead"
  const px = 880, py = 96, pw = 330, ph = 300;
  s += `<g transform="rotate(4 ${px + pw / 2} ${py + ph / 2})">`;
  s += `<path fill="${C.areia}" d="M${px} ${py}H${px + pw - 40}L${px + pw} ${py + 40}V${py + ph}H${px}Z"/><path fill="${C.salvia}" d="M${px + pw - 40} ${py}V${py + 40}H${px + pw}Z"/>`;
  s += texto('mono', 'fluxo: novo lead', px + 26, py + 42, 15, C.garrafa);
  ['formulário recebe o contato', 'n8n valida e completa os dados', 'CRM cria a oportunidade', 'time recebe o aviso'].forEach((t, i) => {
    const by = py + 70 + i * 54;
    s += `<rect x="${px + 26}" y="${by}" width="${pw - 62}" height="32" fill="none" stroke="${C.garrafa}" stroke-width="1.6"/>`;
    s += texto('mono', t, px + 38, by + 21, 12, C.garrafa);
    if (i < 3) s += `<line x1="${px + 50}" y1="${by + 32}" x2="${px + 50}" y2="${by + 54}" stroke="${C.musgo}" stroke-width="1.6"/>`;
  });
  s += '</g>';
  // seta âmbar apontando para o título
  s += traco([[868, 236], [830, 252], [790, 256]], C.ambar, 3, 'seta');
  s += traco([[804, 244], [790, 256], [805, 266]], C.ambar, 3, 'ponta');
  return svg(W, H, 'Felipe Reis: transformo processos manuais em fluxos que rodam sozinhos.', s);
}

// ---------- botões ----------
function botao(rotulo, principal) {
  const t = 16, w = Math.ceil(largura('semi', rotulo, t) + 44), h = 46;
  const fundo = principal
    ? `<rect width="${w}" height="${h}" rx="5.6" fill="${C.ambar}"/>`
    : `<rect x=".8" y=".8" width="${w - 1.6}" height="${h - 1.6}" rx="5.6" fill="${C.garrafa}" stroke="${C.areia}" stroke-width="1.6"/>`;
  return svg(w, h, rotulo, fundo + texto('semi', rotulo, 22, 28.5, t, principal ? C.garrafa : C.areia));
}

// ---------- stack (painel do "Sobre") ----------
function stack() {
  const W = 1280, X = 56;
  const cols = [
    ['IA e automação', ['n8n', 'Claude e Claude Code', 'Agentes com LLMs', 'Integração de APIs', 'Playwright', 'LinkedIn API']],
    ['Dados e código', ['Python', 'SQL (MySQL e Postgres)', 'TypeScript e JavaScript', 'Node.js', 'HTML e CSS', 'Git e GitHub Actions']],
    ['Negócios', ['Funil de vendas e CRM (Ploomes)', 'Pesquisa de mercado', 'Gestão de projetos', 'Capacitação de time', 'Microsoft Office']],
  ];
  const H = 96 + 6 * 34 + 40, cw = (W - 2 * X) / 3;
  let s = `<rect width="${W}" height="${H}" fill="${C.medio}"/>`;
  cols.forEach(([tit, itens], i) => {
    const x = X + i * cw;
    s += texto('mono', tit, x, 64, 14, C.salvia);
    s += traco([[x, 80], [x + 120, 79]], C.ambar, 2.5, `stack-${i}`);
    itens.forEach((it, j) => { s += texto('corpo', it, x, 122 + j * 34, 19, C.areia); });
  });
  return svg(W, H, 'Ferramentas: n8n, Claude Code, Python, SQL, TypeScript, Playwright, CRM e gestão de projetos', s);
}

// ---------- trajetória (seção papel) ----------
function trajetoria() {
  const W = 1280, X = 64, LX = 600;
  const etapas = [
    { data: 'out 2021 – jul 2022', tit: 'Royal Opções', cargo: 'Fundador e gestor', local: 'São Sebastião do Paraíso, MG',
      itens: ['Montei o modelo operacional e a loja de um e-commerce em dropshipping.', 'Cuidei do tráfego pago, das métricas de conversão e da pesquisa de tendências.'] },
    { data: '2022 – 2027', tit: 'UFU', cargo: 'Engenharia Eletrônica e de Telecomunicações', local: 'Uberlândia, MG',
      itens: ['Base em programação orientada a objetos, sinais e sistemas.'] },
    { data: 'mar 2024 – jul 2025', tit: 'CONSELT', cargo: 'Coordenador de Negócios', local: 'Empresa júnior de consultoria em Engenharia Elétrica',
      itens: ['Coordenei o time de vendas e estruturei o funil no CRM Ploomes.', 'Liderei uma pesquisa de mercado que reajustou portfólio e preços.', 'Na minha gestão, triplicamos as vendas de novos contratos.'] },
    { data: 'agora', tit: 'IA e automação', cargo: 'Construindo agentes e fluxos em público', local: 'n8n, Python, LLMs e Claude Code',
      itens: ['Agentes de IA que trabalham com aprovação humana antes de qualquer ação.', 'Procurando estágio em IA, automação de dados, inovação ou gestão de projetos.'], agora: true },
  ];
  let s = '', y = 96;
  const max = W - X - (LX + 44);
  etapas.forEach((e, i) => {
    const y0 = y;
    s += `<circle cx="${LX}" cy="${y - 5}" r="7" fill="${C.papel}" stroke="${C.garrafa}" stroke-width="3"/>`;
    const tx = LX + 44;
    if (e.agora) {
      const w = largura('mono', e.data, 13) + 16;
      s += `<rect x="${tx}" y="${y - 16}" width="${n2(w)}" height="22" fill="${C.ambar}"/>` + texto('mono', e.data, tx + 8, y, 13, C.garrafa);
    } else s += texto('mono', e.data, tx, y, 13, C.musgo);
    y += 40; s += texto('titulo', e.tit, tx, y, 26, C.garrafa);
    y += 30; s += texto('semi', e.cargo, tx, y, 17, C.garrafa);
    y += 24; s += texto('mono', e.local, tx, y, 12.5, C.musgo);
    y += 14;
    e.itens.forEach(it => {
      quebrar('corpo', it, 16, max - 22).forEach((l, k) => {
        y += 25;
        if (k === 0) s += `<rect x="${tx}" y="${y - 6}" width="8" height="2" fill="${C.musgo}"/>`;
        s += texto('corpo', l, tx + 22, y, 16, C.garrafa);
      });
    });
    y += 64;
    if (i === etapas.length - 1) y -= 20;
    void y0;
  });
  const H = y + 20;
  let fundo = `<rect width="${W}" height="${H}" fill="${C.papel}"/>`;
  fundo += `<line x1="${LX}" y1="80" x2="${LX}" y2="${H - 48}" stroke="${C.garrafa}" stroke-width="3"/>`;
  fundo += traco([[LX - 8, H - 58], [LX, H - 48], [LX + 8, H - 58]], C.garrafa, 3, 'fim-linha');
  ['Do balcão', 'de vendas', 'ao fluxo que', 'roda sozinho'].forEach((l, i) => { fundo += texto('titulo', l, X, 130 + i * 50, 46, C.garrafa); });
  quebrar('corpo', 'Fundei um e-commerce, coordenei um time de vendas e hoje construo agentes de IA. A ordem importa: aprendi primeiro o lado de quem usa.', 18, 440)
    .forEach((l, i) => { fundo += texto('corpo', l, X, 360 + i * 27, 18, C.musgo); });
  return svg(W, H, 'Trajetória: Royal Opções, UFU, CONSELT e agora IA e automação', fundo + s);
}

// ---------- repositórios ----------
async function buscarRepos() {
  const h = { 'User-Agent': 'perfil-marca', Accept: 'application/vnd.github+json' };
  if (process.env.GITHUB_TOKEN) h.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const r = await fetch(`https://api.github.com/users/${PERFIL}/repos?type=owner&per_page=100&sort=created`, { headers: h });
  if (!r.ok) throw new Error(`GitHub API ${r.status}: ${await r.text()}`);
  return r.json();
}
const humanizar = n => n.split(/[-_]+/).filter(Boolean).map(p => p[0].toUpperCase() + p.slice(1)).join(' ');

async function main() {
  const cfg = JSON.parse(fs.readFileSync(path.join(AQUI, 'repos.json'), 'utf8'));
  const brutos = (await buscarRepos()).filter(r => !r.fork && !r.private && !r.archived && !(cfg.ignorar || []).includes(r.name));
  const repos = brutos.map(r => {
    const o = (cfg.repos || {})[r.name] || {};
    return {
      nome: r.name, url: r.html_url, criado: r.created_at, estrelas: r.stargazers_count,
      linguagem: r.language,
      titulo: o.titulo || humanizar(r.name),
      descricao: o.descricao || r.description || 'Repositório novo, com a descrição a caminho.',
      stack: o.stack || [r.language, ...(r.topics || [])].filter(Boolean).join(', ') || 'código aberto',
      rotulo: o.rotulo || (o.ordem ? '' : `repositório público, criado em ${r.created_at.slice(0, 10).split('-').reverse().join('/')}`),
      status: o.status || '',
      monograma: o.monograma || monograma(r.name),
      ordem: o.ordem ?? 1e9, ocultar: !!o.ocultar,
    };
  }).filter(r => !r.ocultar)
    .sort((a, b) => a.ordem - b.ordem || b.criado.localeCompare(a.criado));

  const dir = path.join(ASSETS, 'repos');
  fs.mkdirSync(dir, { recursive: true });
  const grava = (f, c) => fs.writeFileSync(path.join(ASSETS, f), c);
  grava('banner.svg', banner());
  grava('stack.svg', stack());
  grava('trajetoria.svg', trajetoria());
  grava('botao-site.svg', botao('Ver o site felip.cloud', true));
  grava('botao-linkedin.svg', botao('LinkedIn'));
  grava('botao-email.svg', botao('E-mail'));
  grava('botao-whatsapp.svg', botao('WhatsApp'));
  const novos = [];
  for (const r of repos) {
    const fi = path.join(dir, `${r.nome}-icone.svg`);
    if (!fs.existsSync(fi)) novos.push(r.nome);
    fs.writeFileSync(fi, icone(r));
    fs.writeFileSync(path.join(dir, `${r.nome}-card.svg`), card(r));
  }

  // Bloco de projetos do README
  const linhas = [];
  for (let i = 0; i < repos.length; i += 2) {
    const par = repos.slice(i, i + 2).map(r =>
      `  <a href="${r.url}"><img src="./assets/repos/${r.nome}-card.svg" width="49%" alt="${esc(r.titulo)}: ${esc(r.descricao)}"/></a>`);
    linhas.push(`<p align="center">\n${par.join('\n')}\n</p>`);
  }
  const lista = repos.map(r => `| <img src="./assets/repos/${r.nome}-icone.svg" width="40" alt=""/> | **[${r.titulo}](${r.url})** | ${r.descricao.replace(/\|/g, '\\|')} |`);
  const bloco = `<!-- projetos:inicio (gerado por .github/brand/gerar.js, não edite à mão) -->\n${linhas.join('\n\n')}\n\n| | Repositório | O que faz |\n| :-: | :-- | :-- |\n${lista.join('\n')}\n<!-- projetos:fim -->`;
  const readme = path.join(RAIZ, 'README.md');
  const atual = fs.readFileSync(readme, 'utf8');
  const novo = atual.replace(/<!-- projetos:inicio[\s\S]*?<!-- projetos:fim -->/, bloco);
  if (novo !== atual) fs.writeFileSync(readme, novo);
  console.log(`${repos.length} repositórios: ${repos.map(r => r.nome).join(', ')}`);
  console.log(novos.length ? `Ícones novos: ${novos.join(', ')}` : 'Nenhum repositório novo.');
}
main().catch(e => { console.error(e); process.exit(1); });
