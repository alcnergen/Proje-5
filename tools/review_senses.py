"""Manual sense review helper.

export: writes review batches (to OUTDIR) for words whose WordNet sense could not
        be matched automatically (several senses) and/or that have no example.
        Line: word|pos|turkish|EX?|1) def ; 2) def ; ...
apply:  reads answers (word|pos|N|example) from tools/senses/*.txt and writes
        tools/sense_picks.txt (word|pos|synset or -) and
        tools/authored/40_examples.txt (word|pos|turkish|example).

usage: NLTK_DATA=... python3 tools/review_senses.py export OUTDIR
       NLTK_DATA=... python3 tools/review_senses.py apply
"""
import glob, json, os, re, sys
import nltk
HERE = os.path.dirname(os.path.abspath(__file__))
nltk.data.path.insert(0, os.environ.get('NLTK_DATA', ''))
from nltk.corpus import wordnet as wn
PM = {'noun': 'n', 'verb': 'v', 'adjective': 'as', 'adverb': 'r'}
AB = {'n': 'noun', 'v': 'verb', 'adj': 'adjective', 'adv': 'adverb'}


def senses(w, pos):
    p = PM.get(pos)
    if not p:
        return []
    lemma = w.replace(' ', '_')
    ss = [s for s in wn.synsets(lemma) if s.pos() in p and any(l.name().lower() == lemma.lower() for l in s.lemmas())] \
        or [s for s in wn.synsets(lemma) if s.pos() in p]
    return ss[:8]


def authored():
    tr, ex = {}, set()
    for f in sorted(glob.glob(os.path.join(HERE, 'authored', '*.txt'))):
        for line in open(f, encoding='utf-8'):
            p = line.rstrip('\n').split('|')
            if len(p) >= 3 and not line.startswith('#'):
                k = (p[0].strip().lower(), AB.get(p[1].strip(), p[1].strip()))
                tr[k] = p[2].strip()
                if len(p) >= 4 and '{' in p[3]:
                    ex.add(k)
    return tr, ex


if sys.argv[1] == 'export':
    out = sys.argv[2]
    os.makedirs(out, exist_ok=True)
    base = json.load(open(os.path.join(HERE, 'base.json'), encoding='utf-8'))
    tr, ex = authored()
    rows = []
    for e in base:
        k = (e['w'].lower(), e['pos'])
        t = tr.get(k)
        if not t or t == '-':
            continue
        ss = senses(e['w'], e['pos'])
        need_sense = e.get('sense_ok') is False and len(ss) > 1
        need_ex = not e.get('ex') and k not in ex
        if not (need_sense or need_ex):
            continue
        defs = ' ; '.join(f'{i + 1}) {s.definition()[:44]}' for i, s in enumerate(ss[:6])) if need_sense else ''
        rows.append(f"{e['w']}|{e['pos'][:3]}|{t}|{'EX' if need_ex else ''}|{defs}")
    for i in range(0, len(rows), 150):
        open(os.path.join(out, f'r_{i // 150:02d}.txt'), 'w', encoding='utf-8').write('\n'.join(rows[i:i + 150]) + '\n')
    print(len(rows), 'rows,', (len(rows) + 149) // 150, 'batches')
else:
    tr, _ = authored()
    picks, exs = [], []
    for f in sorted(glob.glob(os.path.join(HERE, 'senses', '*.txt'))):
        for n, line in enumerate(open(f, encoding='utf-8'), 1):
            p = line.rstrip('\n').split('|')
            if len(p) < 3 or line.startswith('#'):
                continue
            w, pos, idx = p[0].strip(), AB.get(p[1].strip(), {'nou': 'noun', 'ver': 'verb'}.get(p[1].strip(), p[1].strip())), p[2].strip()
            example = '|'.join(p[3:]).strip()
            if idx.isdigit():
                ss = senses(w, pos)
                i = int(idx)
                if i == 0:
                    picks.append(f'{w}|{pos}|-')
                elif 1 <= i <= len(ss):
                    picks.append(f'{w}|{pos}|{ss[i - 1].name()}')
                else:
                    print('bad index', f, n, line.strip())
            if example:
                if '{' not in example:
                    print('no marker', f, n, line.strip())
                    continue
                exs.append(f"{w}|{pos}|{tr.get((w.lower(), pos), '')}|{example}")
    open(os.path.join(HERE, 'sense_picks.txt'), 'w', encoding='utf-8').write('\n'.join(picks) + '\n')
    open(os.path.join(HERE, 'authored', '40_examples.txt'), 'w', encoding='utf-8').write(
        '# Örnek cümleler (anlam incelemesinde eklendi)\n' + '\n'.join(exs) + '\n')
    print(len(picks), 'picks,', len(exs), 'examples')
