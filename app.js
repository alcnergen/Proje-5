/* Kelime Bahçesi — İngilizce kelime, cümle tamamlama ve phrasal verb antrenörü.
   Tek dosyalık, framework'süz PWA. Veri: data/words.js (window.WORDS), data/phrasal.js (window.PHRASAL). */
(function () {
  'use strict';

  // ---------- sabitler ----------
  const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  const STUDY_LEVELS = LEVELS;
  const SESSION_SIZE = 50;
  const STORE_KEY = 'kelimebahcesi.v1';
  const DAY = 86400000;
  const BOX_DAYS = [0, 1, 3, 7, 16, 35]; // Leitner kutuları
  // Basit çizgi ikonlar (tek işlevsel ikon dili; emoji yerine)
  const svg = d => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
  const ICON = {
    book: svg('<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/><path d="M8 7h8"/>'),
    pen: svg('<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>'),
    link: svg('<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>'),
    tree: svg('<path d="M12 21v-6"/><path d="M12 15c-4 0-7-2.6-7-6a7 7 0 0 1 14 0c0 3.4-3 6-7 6z"/><path d="M9 21h6"/>'),
    repeat: svg('<path d="M4 12a8 8 0 0 1 13.7-5.6L20 9"/><path d="M20 4v5h-5"/><path d="M20 12a8 8 0 0 1-13.7 5.6L4 15"/><path d="M4 20v-5h5"/>'),
    compass: svg('<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>'),
    target: svg('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2"/>'),
    gear: svg('<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>'),
    back: svg('<path d="M15 5l-7 7 7 7"/>'),
    close: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
    chevron: svg('<path d="M9 5l7 7-7 7"/>'),
    sound: svg('<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/><path d="M19 6a8.5 8.5 0 0 1 0 12"/>'),
    flame: svg('<path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2.5 1.5-4 2.5-5 .2 1.6 1 2.6 2 3 0-3-.5-5.5.5-8z"/>'),
    sprout: svg('<path d="M12 21v-9"/><path d="M12 12c0-4-3-6-7-6 0 4 3 6 7 6z"/><path d="M12 10c0-3.5 2.5-5.5 7-5.5 0 3.5-2.5 5.5-7 5.5z"/>')
  };
  const MODES = {
    word: { name: 'Kelime Testi', short: 'Kelime', emoji: ICON.book, desc: 'EN ⇄ TR ve İngilizce tanım soruları' },
    sentence: { name: 'Cümle Tamamlama', short: 'Cümle', emoji: ICON.pen, desc: 'Boşluğa uygun kelimeyi bul' },
    phrasal: { name: 'Phrasal Verbs', short: 'Phrasal', emoji: ICON.link, desc: 'Anlam, edat ve bağlam soruları' }
  };
  const POS_TR = {
    noun: 'isim', verb: 'fiil', adjective: 'sıfat', adverb: 'zarf', preposition: 'edat', conjunction: 'bağlaç',
    pronoun: 'zamir', determiner: 'belirleyici', number: 'sayı', interjection: 'ünlem', 'modal auxiliary': 'yardımcı fiil',
    'be-verb': 'fiil', 'do-verb': 'fiil', 'have-verb': 'fiil', 'phrasal verb': 'phrasal verb'
  };
  const QTYPE_TR = {
    en_tr: 'İngilizce → Türkçe', tr_en: 'Türkçe → İngilizce', en_def: 'İngilizce tanım',
    gap: 'Cümle tamamlama', pv_tr: 'Phrasal → Türkçe', tr_pv: 'Türkçe → Phrasal', pv_gap: 'Bağlamda phrasal', pv_particle: 'Doğru edat'
  };
  const TREE_STAGES = [
    [0, 'Tohum'], [0.01, 'Filiz'], [0.1, 'Fidan'], [0.35, 'Genç ağaç'], [0.7, 'Ulu ağaç'], [1, 'Meyve veren ağaç']
  ];
  const PARTICLES = ['up', 'down', 'out', 'off', 'on', 'in', 'over', 'away', 'back', 'through', 'around', 'into', 'across', 'after', 'for', 'with', 'by', 'along', 'apart', 'about', 'forward', 'ahead', 'aside', 'behind'];

  // Türkler için sahte eş anlamlılar (false friends) — soru sırasında ipucu olarak gösterilir.
  const FALSE_FRIENDS = {
    sympathetic: ['sempatik', 'anlayışlı, halden anlayan', 'sevimli = likeable / pleasant'],
    actual: ['aktüel', 'gerçek, asıl', 'güncel = current / topical'],
    actually: ['aktüel olarak', 'aslında, gerçekte', 'şu an = currently'],
    eventually: ['eventüel / muhtemelen', 'sonunda, en nihayetinde', 'muhtemelen = possibly'],
    sensible: ['sensitif / hassas', 'mantıklı, akla yatkın', 'hassas = sensitive'],
    sensitive: ['', 'hassas, duyarlı', 'mantıklı = sensible'],
    nervous: ['sinirli', 'gergin, tedirgin', 'sinirli = angry / irritable'],
    eventual: ['eventüel', 'nihai, en sonunda olan', 'olası = possible'],
    library: ['', 'kütüphane', 'kitapçı = bookshop'],
    fabric: ['fabrika', 'kumaş', 'fabrika = factory'],
    lecture: ['lektür / okuma', 'ders, konferans', 'okuma = reading'],
    agenda: ['ajanda (defter)', 'gündem', 'ajanda defteri = diary / planner'],
    affair: ['afera', 'mesele, iş; ilişki', ''],
    camp: ['', 'kamp', ''],
    pension: ['pansiyon', 'emekli maaşı', 'pansiyon = guesthouse'],
    sentence: ['', 'cümle; ceza (mahkeme)', ''],
    novel: ['', 'roman (isim); yeni, alışılmamış (sıfat)', 'nouvelle ≠ novel'],
    roman: ['roman', 'Romalı', 'roman = novel'],
    simultaneous: ['', 'eş zamanlı', ''],
    pathetic: ['patetik', 'acınası, berbat', ''],
    ordinary: ['ordinaryüs', 'sıradan', ''],
    terrific: ['terör/korkunç', 'harika, muhteşem', 'korkunç = terrible'],
    terrible: ['', 'korkunç, berbat', 'harika = terrific'],
    preservative: ['prezervatif', 'koruyucu katkı maddesi', 'prezervatif = condom'],
    sympathy: ['sempati', 'acıma, başsağlığı, anlayış', 'sempati = liking / affection'],
    tutor: ['', 'özel öğretmen', 'vasi = guardian'],
    miss: ['', 'özlemek; kaçırmak', ''],
    control: ['kontrol etmek (denetlemek)', 'yönetmek, hâkim olmak', 'denetlemek = check'],
    realize: ['realize etmek (gerçekleştirmek)', 'farkına varmak', 'gerçekleştirmek = carry out / achieve'],
    assist: ['asist (izlemek)', 'yardım etmek', 'hazır bulunmak = attend'],
    attend: ['', 'katılmak, devam etmek', 'beklemek = wait'],
    confident: ['konfidan (sırdaş)', 'kendinden emin', 'sırdaş = confidant'],
    deception: ['dekepsiyon/hayal kırıklığı', 'aldatma, hile', 'hayal kırıklığı = disappointment'],
    motor: ['motor (motosiklet)', 'motor (makine)', 'motosiklet = motorbike'],
    formation: ['formasyon (eğitim)', 'oluşum, biçimlenme', 'eğitim = training'],
    ingenuous: ['ingenious (zekice)', 'saf, toy', 'zekice = ingenious'],
    sanitary: ['sanat', 'sağlıkla ilgili, hijyenik', ''],
    trivial: ['', 'önemsiz, sıradan', ''],
    efficient: ['', 'verimli (az kaynakla çok iş)', 'etkili = effective'],
    effective: ['', 'etkili (istenen sonucu veren)', 'verimli = efficient'],
    economic: ['ekonomik (ucuz)', 'ekonomiyle ilgili', 'ucuz/tasarruflu = economical'],
    economical: ['', 'tasarruflu, ucuz', 'ekonomiyle ilgili = economic'],
    historic: ['', 'tarihî öneme sahip', 'tarihle ilgili = historical'],
    historical: ['', 'tarihle ilgili, tarihsel', 'çığır açan = historic'],
    possibly: ['', 'muhtemelen, belki', ''],
    camping: ['kamping (kamp yeri)', 'kamp yapma', 'kamp yeri = campsite'],
    parking: ['parking (otopark)', 'park etme', 'otopark = car park / parking lot'],
    smoking: ['smokin', 'sigara içme', 'smokin = dinner jacket / tuxedo']
  };

  // ---------- yardımcılar ----------
  const $ = (s, r = document) => r.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const lvIdx = l => LEVELS.indexOf(l);
  const today = () => new Date().toISOString().slice(0, 10);
  const glosses = tr => tr.split(/[;,]/).map(s => s.trim().toLocaleLowerCase('tr')).filter(Boolean);

  // ---------- veri ----------
  const WORDS = (window.WORDS || []).map(r => ({ w: r[0], pos: r[1], lvl: r[2], tr: r[3], def: r[4], ex: r[5], key: r[0] + '|' + r[1] }))
    .filter(x => x.tr);
  const PV = (window.PHRASAL || []).map(r => ({ w: r[0], pos: 'phrasal verb', lvl: r[1], tr: r[2], def: r[3], ex: r[4], key: 'pv|' + r[0] }));
  const byLevel = { word: {}, sentence: {}, phrasal: {} };
  // Havuzlar başlangıçta (yardımcı fonksiyonlar tanımlandıktan sonra) doldurulur.
  function buildPools() {
    const gapOk = x => { const p = parseEx(x.ex); return !!(p && formKind(x.w, p.form, x.pos)); };
    for (const l of LEVELS) {
      byLevel.word[l] = WORDS.filter(x => x.lvl === l);
      byLevel.sentence[l] = WORDS.filter(x => x.lvl === l && gapOk(x));
      byLevel.phrasal[l] = PV.filter(x => x.lvl === l);
    }
  }
  const byPos = {};
  for (const x of WORDS) (byPos[x.pos] = byPos[x.pos] || []).push(x);

  // ---------- durum ----------
  const defaultState = () => ({
    v: 1, level: null, placedAt: null, srs: { word: {}, sentence: {}, phrasal: {} },
    stats: { answered: 0, correct: 0, sessions: 0, streak: 0, lastDay: null },
    history: [], settings: { images: true, imgTemplate: '', speech: true, theme: 'auto', showExampleFirst: true }
  });
  let S;
  function load() {
    try { S = Object.assign(defaultState(), JSON.parse(localStorage.getItem(STORE_KEY) || '{}')); } catch (e) { S = defaultState(); }
    S.srs = Object.assign({ word: {}, sentence: {}, phrasal: {} }, S.srs);
    S.settings = Object.assign(defaultState().settings, S.settings);
  }
  function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch (e) { toast('Kayıt yapılamadı (depolama dolu olabilir).'); } }
  function applyTheme() {
    const t = S.settings.theme;
    if (t === 'auto') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', t);
  }

  // Seviye aralığı: kullanıcının seviyesi + 2 seviye üstü (C2 ile sınırlı)
  function range() {
    const i = Math.max(lvIdx(S.level || 'B1'), 0);
    return LEVELS.slice(i, Math.min(i + 3, LEVELS.length));
  }

  // ---------- aralıklı tekrar (Leitner) ----------
  function rec(mode, key) { return S.srs[mode][key]; }
  function grade(mode, item, ok) {
    const r = S.srs[mode][item.key] || { b: 0, d: 0, n: 0, c: 0 };
    r.n++;
    if (ok) { r.c++; r.b = Math.min(r.b + 1, BOX_DAYS.length - 1); r.d = Date.now() + BOX_DAYS[r.b] * DAY; r.l = 1; }
    else { r.b = 0; r.d = Date.now(); r.l = 0; }
    S.srs[mode][item.key] = r;
    S.stats.answered++; if (ok) S.stats.correct++;
  }
  const learned = r => r && r.l === 1 && r.b >= 1;
  // Kullanıcının seviyesinin altındaki ağaçlar seviye testiyle geçilmiş sayılır (o seviyelerden soru gelmez).
  const passedBelow = lvl => S.level && lvIdx(lvl) < lvIdx(S.level);
  function treeProgress(mode, lvl) {
    const pool = byLevel[mode][lvl];
    if (passedBelow(lvl)) return { done: pool.length, total: pool.length, p: 1, passed: true };
    if (!pool.length) return { done: 0, total: 0, p: 0 };
    let done = 0; for (const x of pool) if (learned(S.srs[mode][x.key])) done++;
    return { done, total: pool.length, p: done / pool.length };
  }

  // Oturum seçimi: önce vadesi gelen tekrarlar (en fazla %40), sonra yeni kelimeler; seviyeler kolaydan zora sıralanır.
  function buildSession(mode, size = SESSION_SIZE) {
    const lvls = range();
    const weights = lvls.length === 3 ? [0.45, 0.35, 0.2] : lvls.length === 2 ? [0.6, 0.4] : [1];
    const now = Date.now();
    const chosen = new Set(); const out = [];
    const all = lvls.flatMap(l => byLevel[mode][l]);
    const due = shuffle(all.filter(x => { const r = rec(mode, x.key); return r && !learned(r) || (r && r.d <= now && r.b < BOX_DAYS.length - 1); }));
    for (const x of due) { if (out.length >= Math.round(size * 0.4)) break; out.push(x); chosen.add(x.key); }
    lvls.forEach((l, i) => {
      const want = Math.round((size - out.length) * weights[i] / weights.slice(i).reduce((a, b) => a + b, 0));
      const fresh = shuffle(byLevel[mode][l].filter(x => !chosen.has(x.key) && !rec(mode, x.key)));
      for (const x of fresh.slice(0, want)) { out.push(x); chosen.add(x.key); }
    });
    if (out.length < size) { // havuz tükendiyse en eski tekrarlarla doldur
      const rest = shuffle(all.filter(x => !chosen.has(x.key)));
      rest.sort((a, b) => (rec(mode, a.key) || { d: 0 }).d - (rec(mode, b.key) || { d: 0 }).d);
      for (const x of rest) { if (out.length >= size) break; out.push(x); chosen.add(x.key); }
    }
    out.sort((a, b) => lvIdx(a.lvl) - lvIdx(b.lvl));
    return out.slice(0, size).map(item => makeQuestion(mode, item)).filter(Boolean);
  }

  // ---------- çeldirici (distractor) seçimi ----------
  function distractors(item, n, pool, conflict) {
    const g = new Set(glosses(item.tr));
    const near = pool.filter(x => x.key !== item.key && x.w.toLowerCase() !== item.w.toLowerCase());
    const sameLv = shuffle(near.filter(x => x.lvl === item.lvl));
    const other = shuffle(near.filter(x => Math.abs(lvIdx(x.lvl) - lvIdx(item.lvl)) <= 1 && x.lvl !== item.lvl));
    const out = []; const used = new Set([item.w.toLowerCase()]);
    for (const x of sameLv.concat(other, shuffle(near.slice()))) {
      if (out.length >= n) break;
      if (used.has(x.w.toLowerCase())) continue;
      if (glosses(x.tr).some(t => g.has(t))) continue; // eş anlamlıları ele
      if (conflict && conflict(x)) continue;
      out.push(x); used.add(x.w.toLowerCase());
    }
    return out;
  }

  // ---------- çekim (cümle tamamlama çeldiricilerini aynı biçime sokmak için) ----------
  const IRR = 'arise arose arisen|awake awoke awoken|be was been|bear bore borne|beat beat beaten|become became become|begin began begun|bend bent bent|bet bet bet|bind bound bound|bite bit bitten|bleed bled bled|blow blew blown|break broke broken|breed bred bred|bring brought brought|broadcast broadcast broadcast|build built built|burn burnt burnt|burst burst burst|buy bought bought|cast cast cast|catch caught caught|choose chose chosen|cling clung clung|come came come|cost cost cost|creep crept crept|cut cut cut|deal dealt dealt|dig dug dug|do did done|draw drew drawn|dream dreamt dreamt|drink drank drunk|drive drove driven|eat ate eaten|fall fell fallen|feed fed fed|feel felt felt|fight fought fought|find found found|flee fled fled|fly flew flown|forbid forbade forbidden|forget forgot forgotten|forgive forgave forgiven|freeze froze frozen|get got got|give gave given|go went gone|grind ground ground|grow grew grown|hang hung hung|have had had|hear heard heard|hide hid hidden|hit hit hit|hold held held|hurt hurt hurt|keep kept kept|kneel knelt knelt|know knew known|lay laid laid|lead led led|lean leant leant|leap leapt leapt|learn learnt learnt|leave left left|lend lent lent|let let let|lie lay lain|light lit lit|lose lost lost|make made made|mean meant meant|meet met met|pay paid paid|put put put|quit quit quit|read read read|ride rode ridden|ring rang rung|rise rose risen|run ran run|say said said|see saw seen|seek sought sought|sell sold sold|send sent sent|set set set|sew sewed sewn|shake shook shaken|shed shed shed|shine shone shone|shoot shot shot|show showed shown|shrink shrank shrunk|shut shut shut|sing sang sung|sink sank sunk|sit sat sat|sleep slept slept|slide slid slid|sling slung slung|slit slit slit|speak spoke spoken|speed sped sped|spend spent spent|spin spun spun|spit spat spat|split split split|spread spread spread|spring sprang sprung|stand stood stood|steal stole stolen|stick stuck stuck|sting stung stung|stink stank stunk|stride strode stridden|strike struck struck|string strung strung|strive strove striven|swear swore sworn|sweep swept swept|swell swelled swollen|swim swam swum|swing swung swung|take took taken|teach taught taught|tear tore torn|tell told told|think thought thought|throw threw thrown|thrust thrust thrust|tread trod trodden|understand understood understood|undertake undertook undertaken|upset upset upset|wake woke woken|wear wore worn|weave wove woven|weep wept wept|win won won|wind wound wound|withdraw withdrew withdrawn|withstand withstood withstood|wring wrung wrung|write wrote written|overcome overcame overcome|undergo underwent undergone|foresee foresaw foreseen|forecast forecast forecast|mislead misled misled|outgrow outgrew outgrown|override overrode overridden|overthrow overthrew overthrown|oversee oversaw overseen|overtake overtook overtaken|uphold upheld upheld'
    .split('|').reduce((m, s) => { const [a, b, c] = s.split(' '); m[a] = [b, c]; return m; }, {});
  const IRR_REV = {}; for (const k in IRR) { IRR_REV[IRR[k][0]] = [k, 'past']; if (!IRR_REV[IRR[k][1]]) IRR_REV[IRR[k][1]] = [k, 'pp']; }
  const IRR_PL = { child: 'children', man: 'men', woman: 'women', person: 'people', foot: 'feet', tooth: 'teeth', mouse: 'mice', goose: 'geese', crisis: 'crises', analysis: 'analyses', thesis: 'theses', phenomenon: 'phenomena', criterion: 'criteria', datum: 'data', life: 'lives', wife: 'wives', knife: 'knives', leaf: 'leaves', half: 'halves', shelf: 'shelves', thief: 'thieves', wolf: 'wolves' };
  const isV = c => 'aeiou'.includes(c);
  function dbl(w) { // stop → stopp
    const n = w.length; if (n < 3) return w;
    const a = w[n - 3], b = w[n - 2], c = w[n - 1];
    if (!isV(a) && isV(b) && !isV(c) && !'wxy'.includes(c) && w.replace(/[^aeiou]/g, '').length === 1) return w + c;
    return w;
  }
  function inflectOne(w, kind) {
    switch (kind) {
      case 's':
        if (IRR_PL[w] && kind === 's') return IRR_PL[w];
        if (/(s|x|z|ch|sh)$/.test(w)) return w + 'es';
        if (/[^aeiou]y$/.test(w)) return w.slice(0, -1) + 'ies';
        return w + 's';
      case 'ing':
        if (/ie$/.test(w)) return w.slice(0, -2) + 'ying';
        if (/[^e]e$/.test(w)) return w.slice(0, -1) + 'ing';
        return dbl(w) + 'ing';
      case 'past': case 'pp':
        if (IRR[w]) return IRR[w][kind === 'past' ? 0 : 1];
        if (/e$/.test(w)) return w + 'd';
        if (/[^aeiou]y$/.test(w)) return w.slice(0, -1) + 'ied';
        return dbl(w) + 'ed';
      case 'er': if (/e$/.test(w)) return w + 'r'; if (/[^aeiou]y$/.test(w)) return w.slice(0, -1) + 'ier'; return dbl(w) + 'er';
      case 'est': if (/e$/.test(w)) return w + 'st'; if (/[^aeiou]y$/.test(w)) return w.slice(0, -1) + 'iest'; return dbl(w) + 'est';
      default: return w;
    }
  }
  // Çok kelimelikse: fiilde ilk kelime, isimde son kelime çekimlenir
  function inflect(w, kind, pos) {
    if (kind === 'base') return w;
    const parts = w.split(' ');
    if (parts.length === 1) return inflectOne(w, kind);
    const idx = pos === 'noun' ? parts.length - 1 : 0;
    parts[idx] = inflectOne(parts[idx], kind);
    return parts.join(' ');
  }
  function formKind(base, form, pos) {
    const b = base.toLowerCase(), f = form.toLowerCase();
    if (b === f) return 'base';
    const fb = f.split(' ')[0];
    if (IRR_REV[fb] && IRR_REV[fb][0] === b.split(' ')[0]) return IRR_REV[fb][1];
    for (const k of (pos === 'adjective' || pos === 'adverb') ? ['er', 'est'] : pos === 'noun' ? ['s'] : ['ing', 'past', 's']) {
      if (inflect(b, k, pos) === f) return k;
    }
    // tahmin: yalnızca kelime türüne uygun çekimler (isim -ing almaz vb.)
    const verbish = pos === 'verb' || pos === 'phrasal verb';
    if (verbish && /ing$/.test(fb)) return 'ing';
    if (verbish && /ed$/.test(fb)) return 'past';
    if ((verbish || pos === 'noun') && /s$/.test(f) && !/s$/.test(b)) return 's';
    return null;
  }
  const matchCase = (src, w) => (src[0] && src[0] === src[0].toUpperCase() && src[0] !== src[0].toLowerCase()) ? w[0].toUpperCase() + w.slice(1) : w;

  // Örnek cümledeki {hedef} kısmını çöz
  function parseEx(ex) {
    const m = /\{([^}]+)\}/.exec(ex || '');
    if (!m) return null;
    return { before: ex.slice(0, m.index).replace(/[{}]/g, ''), form: m[1], after: ex.slice(m.index + m[0].length).replace(/[{}]/g, '') };
  }
  const exHtml = ex => esc((ex || '').replace(/[{}]/g, m => m === '{' ? '\u0001' : '\u0002')).replace(/\u0001/g, '<mark>').replace(/\u0002/g, '</mark>');
  const exPlain = ex => (ex || '').replace(/[{}]/g, '');

  // ---------- soru üretimi ----------
  function makeQuestion(mode, item) {
    if (mode === 'word') {
      const types = ['en_tr', 'tr_en']; if (item.def) types.push('en_def');
      const t = pick(types);
      const pool = byPos[item.pos] && byPos[item.pos].length > 20 ? byPos[item.pos] : WORDS;
      const conflict = t === 'en_def' ? (x => !x.def || x.def === item.def) : null;
      const ds = distractors(item, 3, t === 'en_def' ? pool.filter(x => x.def) : pool, conflict);
      if (ds.length < 3) return null;
      const label = x => t === 'en_tr' ? x.tr : t === 'tr_en' ? x.w : x.def;
      return finalize({ mode, type: t, item, correct: label(item), wrong: ds.map(label) });
    }
    if (mode === 'sentence') {
      const p = parseEx(item.ex); if (!p) return null;
      const kind = formKind(item.w, p.form, item.pos);
      if (!kind) return null; // çeldiricileri aynı biçime sokamıyorsak bu cümleyi sorma
      const pool = byPos[item.pos] && byPos[item.pos].length > 20 ? byPos[item.pos] : WORDS;
      const ds = distractors(item, 3, pool.filter(x => x.w.split(' ').length === item.w.split(' ').length || x.w.split(' ').length === 1));
      if (ds.length < 3) return null;
      return finalize({ mode, type: 'gap', item, parts: p, correct: p.form, wrong: ds.map(x => matchCase(p.form, inflect(x.w, kind, x.pos))) });
    }
    if (mode === 'phrasal') {
      const p = parseEx(item.ex);
      const types = ['pv_tr', 'tr_pv']; if (p) types.push('pv_gap', 'pv_particle', 'pv_particle');
      const t = pick(types);
      if (t === 'pv_particle') {
        const toks = p.form.split(' ');
        const verb = item.w.split(' ')[0];
        const parts = item.w.split(' ').slice(1).join(' ');
        // phrasal formu "fiil + edat(lar)" ise edatı boşluğa çevir
        const fp = toks.slice(1).join(' ');
        if (fp.toLowerCase() === parts.toLowerCase() && toks.length > 1) {
          const n = toks.length - 1;
          const cands = shuffle(n === 1 ? PARTICLES.filter(x => x !== parts) :
            [...new Set(PV.map(x => x.w.split(' ').slice(1).join(' ')).filter(x => x.split(' ').length === n && x !== parts))]);
          // aynı fiille geçerli başka phrasal'ı (ör. give up / give in) çeldirici yapma
          const ok = cands.filter(c => !PV.some(x => x.w === verb + ' ' + c));
          if (ok.length >= 3) {
            return finalize({ mode, type: t, item, parts: { before: p.before + toks[0] + ' ', form: parts, after: p.after }, correct: parts, wrong: ok.slice(0, 3) });
          }
        }
        return makeQuestion(mode, item); // uygun değilse başka tip seç
      }
      // bağlam sorusunda aynı fiilli phrasal'lar (get on / get off) cümleye uyabilir; onları çeldirici yapma
      const verb0 = item.w.split(' ')[0];
      const ds = distractors(item, 3, PV, t === 'pv_gap' ? (x => x.w.split(' ')[0] === verb0) : null);
      if (ds.length < 3) return null;
      if (t === 'pv_gap') {
        const kind = formKind(item.w, p.form, 'verb') || 'base';
        return finalize({ mode, type: t, item, parts: p, correct: p.form, wrong: ds.map(x => matchCase(p.form, inflect(x.w, kind, 'verb'))) });
      }
      const label = x => t === 'pv_tr' ? x.tr : x.w;
      return finalize({ mode, type: t, item, correct: label(item), wrong: ds.map(label) });
    }
  }
  function finalize(q) {
    const opts = shuffle([{ text: q.correct, ok: true }].concat(q.wrong.map(text => ({ text, ok: false }))));
    // aynı metinli seçenek olmasın
    const seen = new Set(); q.options = opts.filter(o => { const k = o.text.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; });
    return q.options.length === 4 ? q : null;
  }

  // ---------- görsel (yapay zekâ ile üretim) ----------
  const DEFAULT_IMG = 'https://image.pollinations.ai/prompt/{prompt}?width=640&height=400&nologo=true&seed={seed}';
  function imgUrl(item) {
    const tpl = (S.settings.imgTemplate || '').trim() || DEFAULT_IMG;
    const meaning = item.def ? item.def.split(';')[0] : '';
    const prompt = `minimal flat vector illustration that clearly depicts the English ${item.pos} "${item.w}"${meaning ? ' meaning ' + meaning : ''}, single clear concept, soft pastel colors, white background, no text, no letters, no words`;
    return tpl.replace('{prompt}', encodeURIComponent(prompt)).replace('{seed}', hash(item.key) % 100000).replace('{word}', encodeURIComponent(item.w));
  }
  const prefetched = new Set();
  function prefetch(item) {
    if (!S.settings.images || !item || prefetched.has(item.key)) return;
    prefetched.add(item.key); const i = new Image(); i.referrerPolicy = 'no-referrer'; i.src = imgUrl(item);
  }
  function imgBlock(item) {
    if (!S.settings.images) return '';
    return `<div class="q-img"><div class="ph"><div><span class="big">${esc(item.w[0].toUpperCase())}</span>Görsel üretiliyor…</div></div>
      <img alt="“${esc(item.w)}” için yapay zekâ görseli" referrerpolicy="no-referrer" src="${esc(imgUrl(item))}"
        onload="this.classList.add('ok');this.previousElementSibling.style.display='none'"
        onerror="this.remove()"><span class="ai-tag">AI görsel</span></div>`;
  }

  // ---------- konuşma ----------
  function speak(text) {
    if (!S.settings.speech || !('speechSynthesis' in window)) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text); u.lang = 'en-GB'; u.rate = 0.9;
      const v = speechSynthesis.getVoices().find(v => /^en(-|_)GB/i.test(v.lang)) || speechSynthesis.getVoices().find(v => /^en/i.test(v.lang));
      if (v) u.voice = v;
      speechSynthesis.speak(u);
    } catch (e) { /* yoksay */ }
  }

  // ---------- arayüz ----------
  const app = $('#app');
  let current = null; // aktif oturum
  function toast(msg) {
    const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.appendChild(t);
    setTimeout(() => t.remove(), 2600);
  }
  const lvChip = l => `<span class="level-chip lv-${l}">${l}</span>`;
  const posChip = p => `<span class="pos-chip">${esc(POS_TR[p] || p)}</span>`;
  function topbar(title, back = 'home') {
    return `<div class="topbar"><button class="icon-btn" data-go="${back}" aria-label="Geri">${ICON.back}</button><div class="title">${esc(title)}</div></div>`;
  }
  function bumpStreak() {
    const d = today(); if (S.stats.lastDay === d) return;
    const y = new Date(Date.now() - DAY).toISOString().slice(0, 10);
    S.stats.streak = S.stats.lastDay === y ? S.stats.streak + 1 : 1; S.stats.lastDay = d;
  }

  function render(view, arg) {
    window.scrollTo(0, 0); app.classList.remove('has-next');
    ({ home, welcome, placement, quiz, result, garden, method, settings, levelPick, review }[view] || home)(arg);
  }
  app.addEventListener('click', e => {
    const g = e.target.closest('[data-go]'); if (g) { if (current && g.dataset.go !== 'quiz' && current.view === 'quiz' && !confirm('Oturumdan çıkılsın mı? İlerlemen kaydedildi.')) return; render(g.dataset.go, g.dataset.arg); }
  });

  function home() {
    if (!S.level) return welcome();
    current = null;
    const r = range();
    const acc = S.stats.answered ? Math.round(100 * S.stats.correct / S.stats.answered) : 0;
    const dueCount = m => r.flatMap(l => byLevel[m][l]).filter(x => { const q = rec(m, x.key); return q && (!learned(q) || q.d <= Date.now()); }).length;
    const overall = r.reduce((a, l) => a + treeProgress('word', l).p, 0) / r.length;
    app.innerHTML = `
      <div class="hero">
        <div class="hero-tree">${treeSvg(Math.max(overall, 0.45), 'B1', true)}</div>
        <div class="row between" style="position:relative"><h1>Kelime<br>Bahçesi</h1><button class="icon-btn" data-go="settings" aria-label="Ayarlar">${ICON.gear}</button></div>
        <div class="hero-body">
          <p class="muted lvline" style="margin-top:10px">Seviyen ${lvChip(S.level)}</p>
          <p class="muted lvline">Çalışma aralığı ${r.map(lvChip).join('')}</p>
        </div>
        <div class="stats">
          <div class="stat"><b>${ICON.flame}${S.stats.streak}</b><span>gün seri</span></div>
          <div class="stat"><b>${S.stats.answered}</b><span>cevap</span></div>
          <div class="stat"><b>%${acc}</b><span>başarı</span></div>
        </div>
      </div>
      <div class="menu">
        ${Object.entries(MODES).map(([k, m], i) => `
          <button class="menu-item${i === 0 ? ' featured' : ''}" data-start="${k}" style="--i:${i}">
            <span class="emoji">${m.emoji}</span>
            <span class="grow"><span class="t">${m.name}</span><span class="d">${m.desc} · ${k === 'phrasal' ? Math.min(SESSION_SIZE, r.flatMap(l => byLevel.phrasal[l]).length) : SESSION_SIZE} soru${dueCount(k) ? ` · ${dueCount(k)} tekrar` : ''}</span></span>
            <span class="go">${ICON.chevron}</span>
          </button>`).join('')}
        <div class="menu-grid" style="--i:3">
          <button class="menu-item" data-go="garden"><span class="emoji">${ICON.tree}</span><span><span class="t">Bahçem</span><span class="d">Seviye ağaçların</span></span></button>
          <button class="menu-item" data-go="review"><span class="emoji">${ICON.repeat}</span><span><span class="t">Hatalarım</span><span class="d">Tekrar listesi</span></span></button>
          <button class="menu-item" data-go="method"><span class="emoji">${ICON.compass}</span><span><span class="t">Yöntem</span><span class="d">Nasıl çalışmalı?</span></span></button>
          <button class="menu-item" data-go="placement"><span class="emoji">${ICON.target}</span><span><span class="t">Seviye testi</span><span class="d">Yeniden ölç</span></span></button>
        </div>
      </div>
      <p class="muted small footnote">${(WORDS.length + PV.length).toLocaleString('tr')} öğelik havuz · ${WORDS.length.toLocaleString('tr')} kelime + ${PV.length} phrasal verb</p>`;
    app.querySelectorAll('[data-start]').forEach(b => b.onclick = () => startSession(b.dataset.start));
  }

  function welcome() {
    app.innerHTML = `
      <div class="hero welcome">
        <div class="hero-tree">${treeSvg(0.8, 'B1', true)}</div>
        <div class="hero-body">
          <h1>Kelime<br>Bahçesi</h1>
          <p class="lead">Her gün 50 soruyla kelime ek, cümleyle sula, ağacını büyüt.</p>
        </div>
      </div>
      <div class="card stack" style="margin-top:14px">
        <p>Kelime, cümle tamamlama ve phrasal verb çalışacaksın. Öğrendikçe her CEFR seviyesi için bir ağaç yeşerecek.</p>
        <p class="muted">Önce kısa bir seviye testi (çoğu kişi için 10 soru, ~2 dk). Test B1'den başlar; bildikçe zorlaşır, basit seviyeler yalnızca gerekirse sorulur. Sonra seviyenden 2 seviye yukarısına kadar soru gelir; altındaki seviyelerin ağaçları baştan yeşerir.</p>
      </div>
      <div class="stack" style="margin-top:16px">
        <button class="btn primary" data-go="placement">${ICON.target} Seviye testine başla</button>
        <button class="btn" data-go="levelPick">Seviyemi biliyorum, kendim seçeceğim</button>
        <button class="btn ghost" data-go="method">Önce yöntemi okuyayım</button>
      </div>`;
  }

  function levelPick() {
    app.innerHTML = topbar('Seviyeni seç', S.level ? 'settings' : 'welcome') + `
      <div class="card stack">
        <p class="muted">Seçtiğin seviye ve 2 üstüne kadar soru gelir (ör. B1 → B1, B2, C1).</p>
        <div class="level-pick">${STUDY_LEVELS.map(l => `<button data-l="${l}" class="${S.level === l ? 'on' : ''}">${l}</button>`).join('')}</div>
      </div>`;
    app.querySelectorAll('[data-l]').forEach(b => b.onclick = () => { S.level = b.dataset.l; save(); toast(`Seviye ${S.level} olarak ayarlandı`); render('home'); });
  }

  // ---------- seviye testi ----------
  // Uyarlamalı seviye testi: B1'den başlar. Geçilen seviyede (5'te 4) bir üste çıkar, geçilemezse durur.
  // B1 geçilemezse A2 ve gerekirse A1 sorulur; böylece B1+ kullanıcıya basit kelime sorulmaz.
  const PLACE_N = 5, PLACE_PASS = 4, PLACE_START = 'B1';
  function placementBlock(lvl) {
    const out = []; let n = 0;
    for (const item of shuffle(byLevel.word[lvl].slice())) {
      if (n >= PLACE_N) break;
      const sp = n % 2 === 1 && byLevel.sentence[lvl].includes(item);
      const q = sp ? makeQuestion('sentence', item) : makeQuestion('word', item);
      if (q) { q.placement = true; out.push(q); n++; }
    }
    return out;
  }
  function placement() {
    const qs = placementBlock(PLACE_START);
    if (!qs.length) { app.innerHTML = topbar('Seviye testi') + '<div class="card">Kelime verisi yüklenemedi.</div>'; return; }
    current = { view: 'quiz', mode: 'placement', qs, i: 0, answers: [], lvl: PLACE_START, dir: 0, sc: {}, placed: null };
    quiz();
  }
  // Bir seviye bloğu bittiğinde çağrılır; sıradaki bloğu ekler ya da sonucu belirler.
  function placementStep() {
    const c = current, l = c.lvl;
    const ans = c.answers.slice(-PLACE_N);
    const ok = ans.filter(a => a.ok).length;
    c.sc[l] = { c: ok, n: ans.length };
    const pass = ok >= PLACE_PASS, i = lvIdx(l);
    let nextLvl = null;
    if (c.dir >= 0 && pass) { if (i < LEVELS.length - 1) { nextLvl = LEVELS[i + 1]; c.dir = 1; } else c.placed = l; }
    else if (c.dir > 0 && !pass) c.placed = LEVELS[i - 1];
    else if (!pass) { if (i > 0) { nextLvl = LEVELS[i - 1]; c.dir = -1; } else c.placed = l; }
    else c.placed = l; // aşağı inerken geçilen ilk seviye
    if (nextLvl) { c.lvl = nextLvl; c.qs.push(...placementBlock(nextLvl)); c.i++; window.scrollTo(0, 0); quiz(); return; }
    placementResult();
  }
  function placementResult() {
    app.classList.remove('has-next');
    const c = current, placed = c.placed, sc = c.sc;
    S.level = placed; S.placedAt = Date.now(); save();
    const r = range();
    const below = LEVELS.slice(0, lvIdx(placed));
    app.innerHTML = `
      <div class="hero welcome">
        <div class="hero-tree">${treeSvg(0.25 + 0.13 * lvIdx(placed), placed, true)}</div>
        <div class="hero-body">
          <p class="muted">Seviyen</p>
          <h1 style="font-size:64px">${placed}</h1>
          <p class="lead">Çalışma aralığın ${r.map(lvChip).join(' ')}</p>
          <p class="muted small">${c.qs.length} soruda belirlendi.</p>
        </div>
      </div>
      <div class="card stack" style="margin-top:12px">
        <h3>Seviyelere göre sonuç</h3>
        <div class="level-bars">${LEVELS.filter(l => sc[l]).map(l => `<div class="row">${lvChip(l)}<div class="bar grow"><i style="width:${100 * sc[l].c / sc[l].n}%"></i></div><span>${sc[l].c}/${sc[l].n}</span></div>`).join('')}</div>
        ${below.length ? `<p>${below.map(lvChip).join(' ')} ağaçların seviye testiyle tamamlandı; bu seviyelerden soru gelmeyecek.</p>` : ''}
        <p class="muted small">Bir seviyede 5 sorudan en az 4'ünü bilirsen o seviye “geçildi” sayılır. Seviyeni istediğin zaman Ayarlar’dan değiştirebilirsin.</p>
      </div>
      <div class="stack" style="margin-top:16px"><button class="btn primary" data-go="home">Bahçeme git</button></div>`;
    current = null;
  }

  // ---------- oturum ----------
  function startSession(mode) {
    const qs = buildSession(mode);
    if (!qs.length) { toast('Bu aralıkta soru bulunamadı.'); return; }
    const before = {}; for (const l of range()) before[l] = treeProgress(mode, l).p;
    current = { view: 'quiz', mode, qs, i: 0, answers: [], before };
    quiz();
  }

  function quiz() {
    const c = current; const q = c.qs[c.i]; const item = q.item;
    c.view = 'quiz'; c.answered = false; app.classList.remove('has-next');
    prefetch(c.qs[c.i + 1] && c.qs[c.i + 1].item);
    const isGap = q.type === 'gap' || q.type === 'pv_gap' || q.type === 'pv_particle';
    const showWord = q.type === 'en_tr' || q.type === 'en_def' || q.type === 'pv_tr';
    let prompt, ask;
    if (isGap) {
      prompt = `<p class="prompt sentence">${esc(q.parts.before)}<span class="blank">&nbsp;?&nbsp;</span>${esc(q.parts.after)}</p>`;
      ask = q.type === 'pv_particle' ? 'Boşluğa hangi edat (particle) gelir?' : 'Boşluğa en uygun ifade hangisi?';
    } else if (showWord) {
      prompt = `<div class="row"><p class="prompt grow">${esc(item.w)}</p><button class="speak" data-say="${esc(item.w)}" aria-label="Dinle">${ICON.sound}</button></div>`;
      ask = q.type === 'en_def' ? 'Bu kelimenin İngilizce tanımı hangisi?' : 'Bu kelimenin Türkçe anlamı hangisi?';
    } else {
      prompt = `<p class="prompt tr">${esc(item.tr)}</p>`;
      ask = 'Bu anlamı veren İngilizce kelime hangisi?';
    }
    const exBefore = S.settings.showExampleFirst && showWord && item.ex;
    const total = c.qs.length, isPl = c.mode === 'placement';
    const prog = isPl ? 100 * (c.i % PLACE_N) / PLACE_N : 100 * c.i / total;
    app.innerHTML = `
      <div class="topbar"><button class="icon-btn" data-go="home" aria-label="Çık">${ICON.close}</button><div class="progress"><i style="width:${prog}%"></i></div><span class="small muted">${isPl ? `${item.lvl} · ${c.i % PLACE_N + 1}/${PLACE_N}` : `${c.i + 1}/${total}`}</span></div>
      <div class="card">
        <div class="q-meta">${lvChip(item.lvl)}${posChip(item.pos)}<span class="q-type">${c.mode === 'placement' ? 'Seviye testi' : QTYPE_TR[q.type]}</span></div>
        ${imgBlock(item)}
        ${prompt}
        <p class="ask">${ask}</p>
        ${exBefore ? `<div class="example">${exHtml(item.ex)}</div>` : ''}
        <div class="options">${q.options.map((o, i) => `<button class="opt" data-i="${i}" style="--i:${i}"><span class="k">${'ABCD'[i]}</span><span>${esc(o.text)}</span></button>`).join('')}</div>
        <button class="idk">Bilmiyorum</button>
        <div id="fb"></div>
      </div>`;
    app.querySelectorAll('.opt').forEach(b => b.onclick = () => answer(+b.dataset.i));
    $('.idk', app).onclick = () => answer(-1);
    app.querySelectorAll('[data-say]').forEach(b => b.onclick = () => speak(b.dataset.say));
  }

  function answer(i) {
    const c = current; if (c.answered) return; c.answered = true;
    const q = c.qs[c.i]; const item = q.item;
    const ok = i >= 0 && q.options[i].ok;
    c.answers.push({ ok, choice: i >= 0 ? q.options[i].text : null });
    app.querySelectorAll('.opt').forEach((b, j) => {
      b.disabled = true;
      if (q.options[j].ok) b.classList.add('correct'); else if (j === i) b.classList.add('wrong'); else b.classList.add('dim');
    });
    $('.idk', app).remove();
    if (c.mode !== 'placement') { grade(c.mode, item, ok); save(); }
    if (ok && navigator.vibrate) try { navigator.vibrate(15); } catch (e) { }
    const ff = FALSE_FRIENDS[item.w.toLowerCase()];
    const last = c.i === c.qs.length - 1;
    $('#fb').innerHTML = `
      <div class="feedback ${ok ? 'good' : 'bad'}">
        <div class="row between"><div class="headline">${ok ? '✓ Doğru!' : i < 0 ? 'Sorun değil, öğreniyoruz' : '✗ Yanlış'}</div>
          <button class="speak" data-say="${esc(item.ex ? exPlain(item.ex) : item.w)}" aria-label="Cümleyi dinle">${ICON.sound}</button></div>
        <dl class="kv">
          <dt>Kelime</dt><dd><b>${esc(item.w)}</b></dd>
          <dt>Türkçe</dt><dd>${esc(item.tr)}</dd>
          <dt>Tür</dt><dd>${esc(POS_TR[item.pos] || item.pos)}</dd>
          <dt>Seviye</dt><dd>${lvChip(item.lvl)}</dd>
          ${item.def ? `<dt>Tanım</dt><dd>${esc(item.def)}</dd>` : ''}
        </dl>
        ${item.ex ? `<div class="example">${exHtml(item.ex)}</div>` : ''}
        ${ff ? `<div class="tip"><b>⚠️ Yanlış arkadaş (false friend):</b> ${ff[0] ? `“${esc(item.w)}” ≠ ${esc(ff[0])}. ` : ''}Anlamı: ${esc(ff[1])}.${ff[2] ? ` (${esc(ff[2])})` : ''}</div>` : ''}
      </div>
      <div class="sticky-next"><button class="btn primary" id="next">${last ? 'Sonuçları gör' : 'Devam →'}</button></div>`;
    $('#fb').querySelectorAll('[data-say]').forEach(b => b.onclick = () => speak(b.dataset.say));
    $('#next').onclick = next;
    app.classList.add('has-next');
    $('#fb').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' });
  }
  function next() {
    const c = current;
    if (c.i < c.qs.length - 1) { c.i++; window.scrollTo(0, 0); quiz(); return; }
    if (c.mode === 'placement') return placementStep();
    S.stats.sessions++; bumpStreak();
    const correct = c.answers.filter(a => a.ok).length;
    S.history.push({ t: Date.now(), mode: c.mode, n: c.qs.length, c: correct });
    if (S.history.length > 200) S.history = S.history.slice(-200);
    save();
    render('result');
  }

  // ---------- sonuç ----------
  function result() {
    app.classList.remove('has-next');
    const c = current; if (!c) return home();
    c.view = 'result';
    const n = c.qs.length, ok = c.answers.filter(a => a.ok).length, pct = Math.round(100 * ok / n);
    const byL = {}; c.qs.forEach((q, i) => { const l = q.item.lvl; byL[l] = byL[l] || { c: 0, n: 0 }; byL[l].n++; if (c.answers[i].ok) byL[l].c++; });
    const mistakes = c.qs.map((q, i) => ({ q, a: c.answers[i] })).filter(x => !x.a.ok);
    const R = 64, C = 2 * Math.PI * R;
    const lvls = range();
    app.innerHTML = topbar(MODES[c.mode].name + ' · Sonuç') + `
      <div class="card" style="text-align:center">
        <svg class="score-ring" viewBox="0 0 150 150"><circle cx="75" cy="75" r="${R}" fill="none" stroke="var(--surface-2)" stroke-width="12"/>
          <circle cx="75" cy="75" r="${R}" fill="none" stroke="var(--primary)" stroke-width="12" stroke-linecap="round" stroke-dasharray="${C * pct / 100} ${C}" transform="rotate(-90 75 75)"/>
          <text x="75" y="72" text-anchor="middle" font-size="30" font-weight="800" fill="var(--text)">${ok}/${n}</text>
          <text x="75" y="96" text-anchor="middle" font-size="14" fill="var(--muted)">%${pct}</text></svg>
        <h2>${pct >= 85 ? 'Bahçen çiçek açıyor' : pct >= 65 ? 'Güzel gidiyor' : 'Her yanlış yeni bir tohum'}</h2>
      </div>
      <div class="card stack">
        <h3>Seviyelere göre</h3>
        <div class="level-bars">${Object.keys(byL).sort((a, b) => lvIdx(a) - lvIdx(b)).map(l => `<div class="row">${lvChip(l)}<div class="bar grow"><i style="width:${100 * byL[l].c / byL[l].n}%"></i></div><span>${byL[l].c}/${byL[l].n}</span></div>`).join('')}</div>
      </div>
      <div class="card">
        <h3 style="margin-bottom:10px">Ağaçların büyüdü</h3>
        <div class="garden">${lvls.map(l => { const p = treeProgress(c.mode, l); const d = p.p - (c.before[l] || 0); return `<div class="tree-card">${treeSvg(p.p, l)}<div>${lvChip(l)} <span class="pct">%${(100 * p.p).toFixed(1)}</span></div><div class="small muted">${d > 0 ? '+' + (100 * d).toFixed(2) + ' puan' : 'değişmedi'}</div></div>`; }).join('')}</div>
      </div>
      ${mistakes.length ? `<div class="card"><h3 style="margin-bottom:6px">Hatalar (tekrar listene eklendi)</h3>${mistakes.map(({ q, a }) => `<div class="mistake"><b>${esc(q.item.w)}</b> ${lvChip(q.item.lvl)} — ${esc(q.item.tr)}${a.choice ? `<div class="small muted">Senin cevabın: ${esc(a.choice)}</div>` : ''}</div>`).join('')}</div>` : ''}
      <div class="stack" style="margin-top:16px">
        <button class="btn primary" id="again">Yeni 50 soru</button>
        <button class="btn" data-go="home">Ana sayfa</button>
      </div>`;
    const mode = c.mode;
    $('#again').onclick = () => startSession(mode);
    current = null;
  }

  // ---------- ağaç ----------
  // Ağaç çizimi. Yapraklar "grow" hareketiyle sırayla açar (bkz. styles.css). hero=true: koyu zemin için.
  function treeSvg(p, lvl, hero) {
    p = Math.max(0, Math.min(1, p));
    const seed = hash(lvl);
    const rnd = (i) => { const x = Math.sin(seed + i * 12.9898) * 43758.5453; return x - Math.floor(x); };
    const ground = hero ? '' : `<ellipse cx="60" cy="128" rx="46" ry="7" style="fill:var(--soil)" opacity=".55"/>`;
    if (p === 0) return `<svg viewBox="0 0 120 140" role="img" aria-label="Tohum">${ground}<ellipse cx="60" cy="124" rx="6" ry="4" style="fill:var(--trunk)"/><path d="M60 121c0-6-4-9-9-9 0 5 4 9 9 9z" style="fill:var(--leaf-3)" class="leaf"/></svg>`;
    const h = 18 + 72 * Math.sqrt(p);
    const top = 126 - h;
    const trunkW = 3 + 7 * p;
    const lv = `var(--${lvl})`;
    const shades = hero ? ['#7fbf86', '#5aa36a', '#a8d38f'] : [lv, 'var(--leaf-1)', 'var(--leaf-2)', 'var(--leaf-3)'];
    let leaves = '';
    const crownR = 10 + 34 * Math.sqrt(p);
    const nLeaves = Math.max(3, Math.round(70 * p));
    for (let i = 0; i < nLeaves; i++) {
      const a = rnd(i) * Math.PI * 2, r = Math.sqrt(rnd(i + 100)) * crownR;
      const x = 60 + Math.cos(a) * r * 1.1, y = top + 4 + Math.sin(a) * r * 0.8;
      const sz = 4 + rnd(i + 200) * 5 * (0.5 + p);
      const shade = shades[Math.floor(rnd(i + 300) * shades.length)];
      leaves += `<circle class="leaf" style="fill:${shade};--d:${Math.round(i * (360 / nLeaves))}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${sz.toFixed(1)}" opacity="${(0.75 + rnd(i + 400) * 0.25).toFixed(2)}"/>`;
    }
    let fruits = '';
    if (p >= 0.7) {
      const nf = p >= 1 ? 9 : Math.round((p - 0.7) * 20);
      for (let i = 0; i < nf; i++) {
        const a = rnd(i + 500) * Math.PI * 2, r = Math.sqrt(rnd(i + 600)) * crownR * 0.85;
        fruits += `<circle class="leaf" style="fill:${p >= 1 ? 'var(--fruit)' : 'var(--bad)'};--d:${400 + i * 40}" cx="${(60 + Math.cos(a) * r).toFixed(1)}" cy="${(top + 4 + Math.sin(a) * r * 0.8).toFixed(1)}" r="3.4"/>`;
      }
    }
    const trunk = hero ? '#d8c3a0' : 'var(--trunk)';
    const branches = p > 0.1 ? `<path d="M60 ${top + h * 0.45} q -12 -8 -20 -18 M60 ${top + h * 0.35} q 12 -8 20 -16" style="stroke:${trunk}" stroke-width="${(trunkW * 0.5).toFixed(1)}" fill="none" stroke-linecap="round"/>` : '';
    const stage = TREE_STAGES.filter(s => p >= s[0]).pop()[1];
    return `<svg viewBox="0 0 120 140" role="img" aria-label="${stage}">${ground}
      <path d="M${60 - trunkW / 2} 126 L${60 - trunkW / 4} ${top + 6} L${60 + trunkW / 4} ${top + 6} L${60 + trunkW / 2} 126 Z" style="fill:${trunk}"/>
      ${branches}${leaves}${fruits}</svg>`;
  }

  function garden(mode) {
    mode = mode || 'word';
    const r = range();
    app.innerHTML = topbar('Bahçem') + `
      <div class="tabs">${Object.entries(MODES).map(([k, m]) => `<button data-tab="${k}" class="${k === mode ? 'on' : ''}">${m.emoji} ${m.short}</button>`).join('')}</div>
      <p class="muted small" style="margin-bottom:12px">Bir kelimeyi doğru bildiğinde yaprak açar; yanlış yaptığında tekrar listesine düşer. Seviyedeki tüm kelimeleri öğrendiğinde ağaç meyve verir.</p>
      <div class="garden">${STUDY_LEVELS.map(l => {
        const p = treeProgress(mode, l); const stage = TREE_STAGES.filter(s => p.p >= s[0]).pop()[1];
        const cls = p.passed ? 'passed' : r.includes(l) ? 'active' : (lvIdx(l) > lvIdx(r[r.length - 1]) ? 'locked' : '');
        return `<div class="tree-card ${cls}">${treeSvg(p.p, l)}
          <div class="row between">${lvChip(l)}<span class="pct">%${(100 * p.p).toFixed(1)}</span></div>
          <div class="bar"><i style="width:${100 * p.p}%"></i></div>
          <div class="small muted">${p.passed ? 'Seviye testiyle geçildi' : `${stage} · ${p.done}/${p.total}${cls === 'locked' ? ' · kilitli' : ''}`}</div></div>`;
      }).join('')}</div>`;
    app.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => garden(b.dataset.tab));
  }

  function review() {
    const rows = [];
    for (const m of Object.keys(MODES)) {
      const src = m === 'phrasal' ? PV : WORDS;
      for (const x of src) { const r = rec(m, x.key); if (r && r.l === 0) rows.push({ m, x, r }); }
    }
    rows.sort((a, b) => b.r.n - b.r.c - (a.r.n - a.r.c));
    app.innerHTML = topbar('Hatalarım') + `
      <div class="card">${rows.length ? `<p class="muted small" style="margin-bottom:8px">${rows.length} öğe tekrar bekliyor. Bunlar sonraki oturumlarına öncelikli olarak eklenir.</p>` +
        rows.slice(0, 300).map(({ m, x, r }) => `<div class="mistake"><div class="row between"><span><b>${esc(x.w)}</b> ${lvChip(x.lvl)} <span class="small muted">${MODES[m].short}</span></span><span class="small muted">${r.c}/${r.n}</span></div>
          <div>${esc(x.tr)}</div>${x.ex ? `<div class="small muted">${exHtml(x.ex)}</div>` : ''}</div>`).join('')
        : '<p>Henüz yanlış yaptığın kelime yok. 🎉</p>'}</div>`;
  }

  function method() {
    app.innerHTML = topbar('Yöntem', S.level ? 'home' : 'welcome') + `
      <div class="card prose">
        <h2>Türkler için kelime öğrenme yöntemi</h2>
        <p class="muted small" style="margin-top:6px">Uygulama aşağıdaki araştırma temelli ilkelere göre tasarlandı.</p>
        <h3>1. Aralıklı tekrar (Spaced Repetition)</h3>
        <p>Her kelime Leitner kutularında ilerler: doğru bildiğin kelime 1, 3, 7, 16 ve 35 gün sonra yeniden sorulur; yanlış yaptığın kelime ilk kutuya döner ve sonraki oturumunda öncelikli gelir. Unutma eğrisini kırmanın en etkili yolu budur.</p>
        <h3>2. Çift yönlü hatırlama</h3>
        <ul><li><b>İngilizce → Türkçe</b>: tanıma (receptive) bilgisi.</li>
          <li><b>Türkçe → İngilizce</b>: üretme (productive) bilgisi — konuşurken ve yazarken ihtiyacın olan budur.</li>
          <li><b>İngilizce → İngilizce tanım</b>: Türkçe çeviriye bağımlılığı azaltır, kelimeyi İngilizce düşünmeni sağlar.</li></ul>
        <h3>3. Bağlam içinde öğrenme</h3>
        <p>Cümle tamamlama modu, kelimeyi tek başına değil <i>collocation</i> (birlikte kullanıldığı kelimeler) ve dilbilgisi biçimiyle birlikte öğretir. Türkçede olmayan yapılar (article, preposition, phrasal verb) en iyi bağlam içinde yerleşir.</p>
        <h3>4. “Bilmiyorum” demek kazançtır</h3>
        <p>Tahmin edip şans eseri doğru bilmek, kelimeyi öğrenilmiş gibi gösterir. Emin değilsen “Bilmiyorum”a bas; kelime tekrar listene girer.</p>
        <h3>5. i+1 ilkesi (Krashen)</h3>
        <p>Seviyenin biraz üstündeki girdi en hızlı ilerlemeyi sağlar. Bu yüzden oturumlar seviyenden başlar ve 2 seviye yukarıya kadar çıkar (%45 kendi seviyen, %35 bir üstü, %20 iki üstü); sorular kolaydan zora sıralanır.</p>
        <h3>6. Türklerin sık yaptığı hatalar</h3>
        <ul><li><b>Phrasal verbs</b>: Türkçede karşılığı yok; fiil + edat birlikte tek anlam taşır (give up = vazgeçmek). Ayrı test grubunda edat odaklı sorular var.</li>
          <li><b>Yanlış arkadaşlar</b>: Türkçeye benzeyen ama farklı anlama gelen kelimeler. Soru sırasında ⚠️ uyarısı çıkar.</li>
          <li><b>Kelime türü</b>: İngilizcede aynı kök isim/fiil/sıfat olarak değişir (decide, decision, decisive). Her soruda kelime türü gösterilir.</li>
          <li><b>Telaffuz</b>: hoparlör düğmesiyle kelimeyi ve örnek cümleyi dinle, sesli tekrar et.</li></ul>
        <h3>Sık karşılaşılan yanlış arkadaşlar</h3>
        <div class="ff">${['sympathetic', 'actually', 'eventually', 'sensible', 'nervous', 'fabric', 'lecture', 'agenda', 'pension', 'terrific', 'realize', 'confident', 'economic', 'smoking'].map(k => `<div>${k}</div><div>${esc(FALSE_FRIENDS[k][1])}</div>`).join('')}</div>
        <h3>Önerilen günlük rutin</h3>
        <ul><li>1 × Kelime Testi (50 soru, ~10 dk)</li><li>1 × Cümle Tamamlama (50 soru, ~12 dk)</li><li>Haftada 3 × Phrasal Verbs</li><li>Hatalarım listesine göz at, örnek cümleleri sesli oku.</li></ul>
      </div>`;
  }

  function settings() {
    const st = S.settings;
    app.innerHTML = topbar('Ayarlar') + `
      <div class="card">
        <div class="switch"><span>Seviyem: ${lvChip(S.level || '-')}</span><button class="btn small" data-go="levelPick">Değiştir</button></div>
        <div class="switch"><span>Seviye testini yeniden yap</span><button class="btn small" data-go="placement">Başlat</button></div>
        <label class="switch"><span>AI görselleri göster</span><input type="checkbox" id="s-img" ${st.images ? 'checked' : ''}></label>
        <label class="switch"><span>Sesli telaffuz</span><input type="checkbox" id="s-sp" ${st.speech ? 'checked' : ''}></label>
        <label class="switch"><span>Örnek cümleyi cevaptan önce göster (EN→TR sorularında)</span><input type="checkbox" id="s-ex" ${st.showExampleFirst ? 'checked' : ''}></label>
        <div class="switch"><span>Tema</span><select id="s-th" style="width:auto"><option value="auto">Sistem</option><option value="light">Açık</option><option value="dark">Koyu</option></select></div>
      </div>
      <div class="card stack">
        <div class="field"><label for="s-tpl">Görsel üretim adresi (gelişmiş)</label>
          <input type="text" id="s-tpl" placeholder="${esc(DEFAULT_IMG)}" value="${esc(st.imgTemplate)}">
          <p class="muted small">Boş bırakılırsa ücretsiz Pollinations.ai görsel üreticisi kullanılır. Kendi servisini kullanmak için {prompt}, {word} ve {seed} yer tutucularını içeren bir adres gir.</p></div>
      </div>
      <div class="card stack">
        <h3>Veri</h3>
        <p class="muted small">İlerlemen yalnızca bu cihazda saklanır.</p>
        <button class="btn" id="exp">İlerlemeyi dışa aktar</button>
        <button class="btn" id="imp">İçe aktar</button>
        <button class="btn" id="rst" style="color:var(--bad)">Tüm ilerlemeyi sıfırla</button>
      </div>
      <p class="muted small" style="margin:12px 4px">Kelime listeleri: CEFR-J Vocabulary Profile 1.5 (A1–B2, © Tono Lab, TUFS) ve Octanove Vocabulary Profile C1/C2 (CC BY-SA 4.0). İngilizce tanımlar: Princeton WordNet 3.0. Türkçe anlamlar, örnek cümleler ve phrasal verb listesi uygulamaya özel hazırlandı.</p>`;
    $('#s-th').value = st.theme;
    $('#s-img').onchange = e => { st.images = e.target.checked; save(); };
    $('#s-sp').onchange = e => { st.speech = e.target.checked; save(); };
    $('#s-ex').onchange = e => { st.showExampleFirst = e.target.checked; save(); };
    $('#s-th').onchange = e => { st.theme = e.target.value; save(); applyTheme(); };
    $('#s-tpl').onchange = e => { st.imgTemplate = e.target.value.trim(); save(); toast('Kaydedildi'); };
    $('#exp').onclick = () => {
      const blob = new Blob([JSON.stringify(S)], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `kelime-bahcesi-${today()}.json`; a.click();
    };
    $('#imp').onclick = () => {
      const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'application/json';
      inp.onchange = () => { const f = inp.files[0]; if (!f) return; f.text().then(t => { try { const d = JSON.parse(t); if (!d.srs) throw 0; localStorage.setItem(STORE_KEY, t); load(); applyTheme(); toast('İçe aktarıldı'); render('home'); } catch (e) { toast('Geçersiz dosya'); } }); };
      inp.click();
    };
    $('#rst').onclick = () => { if (confirm('Tüm ilerleme silinsin mi? Bu geri alınamaz.')) { localStorage.removeItem(STORE_KEY); load(); render('welcome'); } };
  }

  // ---------- başlat ----------
  buildPools(); load(); applyTheme();
  if ('speechSynthesis' in window) speechSynthesis.getVoices();
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => { });
  window.__kb = { buildSession, makeQuestion, inflect, formKind, WORDS, PV, range, state: () => S, current: () => current }; // test için
  render('home');
})();
