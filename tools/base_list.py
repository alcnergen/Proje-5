"""Step 1: merge CEFR-J (A1-B2) + Octanove (C1-C2) lists and attach WordNet
definitions/examples. Writes tools/base.json used by build_data.py."""
import csv, json, re, sys, os
import nltk
HERE = os.path.dirname(os.path.abspath(__file__))
nltk.data.path.insert(0, os.environ.get('NLTK_DATA', ''))
from nltk.corpus import wordnet as wn

PM = {'noun': 'n', 'verb': 'v', 'adjective': 'as', 'adverb': 'r'}
LV = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

def forms(w):
    # crude inflection matcher for examples
    b = re.escape(w)
    return re.compile(r'\b(' + b + r'|' + b + r'(s|es|ed|d|ing|er|est|ly)|' + re.escape(w[:-1]) + r'(ied|ies|ing|ed|er|est|ily)|' + re.escape(w[:-1]) + r'(ing|ed|er))\b', re.I)

rows = []
for f in ('cefrj-vocabulary-profile-1.5.csv', 'octanove-vocabulary-profile-c1c2-1.0.csv'):
    rows += list(csv.DictReader(open(os.path.join(HERE, f), encoding='utf-8')))

seen = {}
for r in rows:
    if r['CEFR'] not in LV or not r['pos']:
        continue
    w = r['headword'].split('/')[0].strip()
    pos = r['pos'].replace('vern', 'verb')
    k = (w.lower(), pos)
    if k in seen and LV.index(seen[k]['level']) <= LV.index(r['CEFR']):
        continue
    seen[k] = {'w': w, 'pos': pos, 'level': r['CEFR']}

out = []
for e in seen.values():
    p = PM.get(e['pos'])
    ss = [s for s in wn.synsets(e['w'].replace(' ', '_')) if s.pos() in p] if p else []
    e['def'] = ss[0].definition() if ss else ''
    rx = forms(e['w'])
    ex = ''
    for s in ss:
        for x in s.examples():
            if rx.search(x) and len(x.split()) >= 5:
                ex = x; break
        if ex: break
    e['ex'] = ex
    out.append(e)
json.dump(out, open(os.path.join(HERE, 'base.json'), 'w'), ensure_ascii=False, indent=0)
from collections import Counter
print(len(out), Counter(e['level'] for e in out))
print('no def', sum(1 for e in out if not e['def']), 'no ex', sum(1 for e in out if not e['ex'] and e['level'] != 'A1'))
