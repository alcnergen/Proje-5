"""Step 1c: pick, for every word, the WordNet sense that matches the Turkish
meaning written in tools/authored/*.txt, so the English definition and the
WordNet example sentence describe the same meaning as the Turkish gloss.

Sense matching uses the Turkish WordNet KeNet (interlingual links, CILI) and the
CILI -> PWN 3.0 map:
  KeNet synset (Turkish lemmas, ili=iNNN) -> PWN 3.0 offset -> NLTK synset
A sense matches when one of its Turkish lemmas equals one of our Turkish glosses
(or the gloss without its "etmek/olmak/yapmak" light verb, and vice versa).

When no sense matches we keep a definition only from the sense with the
highest SemCor frequency and drop WordNet's example (an authored example is
used instead when one exists). Senses picked by hand in tools/sense_picks.txt
(written by review_senses.py apply) override the automatic choice; "-" there
means no WordNet sense fits the Turkish meaning, so no definition is kept.
Rewrites def/ex in tools/base.json and writes a
report to tools/align_report.txt.

usage: NLTK_DATA=... python3 tools/align_senses.py KENET_XML ILI_MAP_TAB
"""
import glob, json, os, re, sys
from collections import defaultdict
import nltk
HERE = os.path.dirname(os.path.abspath(__file__))
nltk.data.path.insert(0, os.environ.get('NLTK_DATA', ''))
from nltk.corpus import wordnet as wn

KENET, ILIMAP = sys.argv[1], sys.argv[2]
PM = {'noun': 'n', 'verb': 'v', 'adjective': 'as', 'adverb': 'r'}
AB = {'n': 'noun', 'v': 'verb', 'adj': 'adjective', 'adv': 'adverb'}
LIGHT = re.compile(r'\s+(etmek|olmak|yapmak|vermek|kılmak|eylemek)$')


def norm(s):
    s = s.lower().replace('i̇', 'i')
    s = re.sub(r'\([^)]*\)', '', s)
    s = re.sub(r'[^a-zçğıöşüâîû\s-]', ' ', s)
    return re.sub(r'\s+', ' ', s).strip()


def variants(s):
    s = norm(s)
    out = {s} if s else set()
    m = LIGHT.search(s)
    if m:
        out.add(s[:m.start()])
    return {x for x in out if len(x) >= 2}


# --- KeNet: Turkish lemmas per ILI -------------------------------------------
entry_lemma = {}
synset_members = {}
ili_of = {}
for line in open(KENET, encoding='utf-8'):
    if '<LexicalEntry ' in line:
        cur = re.search(r'id="([^"]+)"', line).group(1)
    elif '<Lemma ' in line:
        m = re.search(r'writtenForm=(["\'])(.*?)\1', line)
        if m:
            entry_lemma[cur] = m.group(2)
    elif '<Synset ' in line:
        sid = re.search(r' id="([^"]+)"', line).group(1)
        ili = re.search(r'ili="([^"]*)"', line).group(1)
        mem = re.search(r'members="([^"]*)"', line)
        if ili and mem:
            ili_of[sid] = ili
            synset_members[sid] = mem.group(1).split()
tr_by_ili = defaultdict(set)
for sid, ili in ili_of.items():
    for m in synset_members[sid]:
        if m in entry_lemma:
            tr_by_ili[ili] |= variants(entry_lemma[m])
pwn_by_ili = dict(l.split()[:2] for l in open(ILIMAP) if l.strip())
tr_by_offset = defaultdict(set)
for ili, lemmas in tr_by_ili.items():
    if ili in pwn_by_ili:
        off, p = pwn_by_ili[ili].split('-')
        tr_by_offset[(int(off), 'a' if p == 's' else p)] |= lemmas

# --- our Turkish glosses --------------------------------------------------------
tr = {}
for f in sorted(glob.glob(os.path.join(HERE, 'authored', '*.txt'))):
    for line in open(f, encoding='utf-8'):
        p = line.rstrip('\n').split('|')
        if len(p) >= 3 and not line.startswith('#'):
            tr[(p[0].strip().lower(), AB.get(p[1].strip(), p[1].strip()))] = p[2].strip()


def forms_rx(w):
    b, stem = re.escape(w), re.escape(w[:-1])
    return re.compile(r'\b(' + b + r'(?:s|es|ed|d|ing|er|est)?|' + stem + r'(?:ied|ies|ing|ed|ier|iest)|' + b + r'[a-z](?:ed|ing|er|est))\b', re.I)


picks = {}
pf = os.path.join(HERE, 'sense_picks.txt')
if os.path.exists(pf):
    for line in open(pf, encoding='utf-8'):
        p3 = line.rstrip('\n').split('|')
        if len(p3) == 3:
            picks[(p3[0].lower(), p3[1])] = p3[2]

base = json.load(open(os.path.join(HERE, 'base.json'), encoding='utf-8'))
stats = defaultdict(int)
report = []
for e in base:
    p = PM.get(e['pos'])
    if not p:
        continue
    lemma = e['w'].replace(' ', '_')
    ss = [s for s in wn.synsets(lemma) if s.pos() in p and any(l.name().lower() == lemma.lower() for l in s.lemmas())] \
        or [s for s in wn.synsets(lemma) if s.pos() in p]
    if not ss:
        continue
    gl = set()
    for g in re.split(r'[;,/]', tr.get((e['w'].lower(), e['pos']), '')):
        gl |= variants(g)
    match = None
    pick = picks.get((e['w'].lower(), e['pos']))
    if pick == '-':
        stats['picked_none'] += 1
        e['def'], e['ex'], e['sense_ok'] = '', '', False
        continue
    if pick:
        match = wn.synset(pick)
        stats['picked'] += 1
    for s in ([] if match else ss):
        key = (s.offset(), 'a' if s.pos() in 'as' else s.pos())
        if gl & tr_by_offset.get(key, set()):
            match = s
            break
    if match:
        chosen, keep_ex = match, True
        stats['matched'] += 1
    else:
        counts = [sum(l.count() for l in s.lemmas() if l.name().lower() == lemma.lower()) for s in ss]
        chosen = ss[counts.index(max(counts))] if max(counts) > 0 else ss[0]
        keep_ex = False
        stats['unmatched'] += 1
        report.append(f"{e['w']}|{e['pos']}|{tr.get((e['w'].lower(), e['pos']), '')}|{chosen.definition()}")
    old = e.get('def')
    e['def'] = chosen.definition()
    if old != e['def']:
        stats['def_changed'] += 1
    ex = ''
    if keep_ex:
        rx = forms_rx(e['w'])
        ex = next((x for x in chosen.examples() if rx.search(x) and len(x.split()) >= 5), '')
    if e.get('ex') and not ex:
        stats['wn_example_dropped'] += 1
    e['ex'] = ex
    e['sense_ok'] = bool(match)

json.dump(base, open(os.path.join(HERE, 'base.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
open(os.path.join(HERE, 'align_report.txt'), 'w', encoding='utf-8').write('\n'.join(report) + '\n')
print(dict(stats))
