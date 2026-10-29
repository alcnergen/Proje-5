"""Step 1b: pick frequent English words that are missing from the CEFR-J /
Octanove lists (wordfreq frequency + WordNet lemma check) so the pool reaches
~11,500 items. CEFR level is *estimated* from frequency (Zipf):
>= 4.3 -> B2, >= 3.6 -> C1, else C2. Appends to tools/base.json (src: 'freq').

usage: NLTK_DATA=... python3 tools/extra_list.py [count]
(needs the WordNet and names corpora under $NLTK_DATA/corpora)"""
import json, os, re, sys
import nltk
from wordfreq import top_n_list, zipf_frequency
HERE = os.path.dirname(os.path.abspath(__file__))
NLTK_DATA = os.environ.get('NLTK_DATA', '')
nltk.data.path.insert(0, NLTK_DATA)
from nltk.corpus import wordnet as wn

N = int(sys.argv[1]) if len(sys.argv) > 1 else 1520
PN = {'n': 'noun', 'v': 'verb', 'a': 'adjective', 's': 'adjective', 'r': 'adverb'}
NAMES = {l.strip().lower() for f in ('male.txt', 'female.txt')
         for l in open(os.path.join(NLTK_DATA, 'corpora', 'names', f), encoding='latin-1')}
# profanity, slurs, sexual terms, abbreviations and chat words that make poor quiz items
BLOCK = set("""shit fuck ass bitch dick bullshit crap porn damn piss slut whore fag cunt cock pussy tits boob boobs
sexy horny dildo hell bastard wanker twat bloody asshole fucker orgasm butt babe nazi sexually penis cum shitty
vagina anal sperm semen erotic nude naked rape lesbian gay queer stripper hooker nipple
non sub iii mid min info sec dec sept mar feb nov jan oct aug apr gen rep corp prof rev pic inc http www usa
yea tho kinda okay wow cant don cam mac ken wont cos anyways mph ion par inter thou yeah lol omg""".split())

base = json.load(open(os.path.join(HERE, 'base.json'), encoding='utf-8'))
base = [e for e in base if e.get('src') != 'freq']
known = {e['w'].lower() for e in base}


def forms_rx(w):
    return re.compile(r'\b' + re.escape(w) + r'(s|es|ed|d|ing)?\b', re.I)


def derived_from_known(w):
    # British spellings of words we already have (colour, centre, organisation...)
    variants = {w.replace('our', 'or'), re.sub('re$', 'er', w), w.replace('ise', 'ize'), w.replace('isation', 'ization'),
                w.replace('ence', 'ense'), w.replace('ogue', 'og'), w.replace('mme', 'm'), w.replace('yse', 'yze'),
                w.replace('ll', 'l')}
    if (variants - {w}) & known:
        return True
    # plurals / comparatives / past forms (years, higher, fewer, followers)
    if w.endswith('s') and (w[:-1] in known or w[:-2] in known or w[:-3] + 'y' in known):
        return True
    if re.search('(er|est|ed|ing)$', w):
        for k in (2, 3):
            if w[:-k] in known or w[:-k] + 'e' in known or (len(w) > k + 1 and w[:-k - 1] in known):
                return True
    return any(f != w and f in known for p in 'vna' for f in wn._morphy(w, p))


out = []
for w in top_n_list('en', 80000):
    if len(out) >= N:
        break
    if not re.fullmatch(r'[a-z]{3,}', w) or w in known or w in BLOCK or w in NAMES:
        continue
    # must be a lowercase WordNet lemma (drops proper nouns like London, China)
    ss = [s for s in wn.synsets(w) if any(l.name() == w for l in s.lemmas())]
    if not ss or derived_from_known(w):
        continue
    best = max(ss, key=lambda s: sum(l.count() for l in s.lemmas() if l.name() == w))
    pos = PN[best.pos()]
    same = [s for s in ss if PN[s.pos()] == pos]
    z = zipf_frequency(w, 'en')
    lvl = 'B2' if z >= 4.3 else 'C1' if z >= 3.6 else 'C2'
    ex = ''
    for s in same:
        for x in s.examples():
            if forms_rx(w).search(x) and len(x.split()) >= 5:
                ex = x
                break
        if ex:
            break
    out.append({'w': w, 'pos': pos, 'level': lvl, 'def': same[0].definition(), 'ex': ex, 'src': 'freq'})
    known.add(w)

json.dump(base + out, open(os.path.join(HERE, 'base.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
from collections import Counter
print(len(out), Counter(e['level'] for e in out), 'no example', sum(1 for e in out if not e['ex']))
