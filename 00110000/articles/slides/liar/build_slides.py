# Builds slide01.html ... slide12.html from deck.css, chrome.html and the content below.
# Render each file at 1600x900 (see render.sh) to produce the JPG slides used by liarparadox.html.
import html, os
here=os.path.dirname(os.path.abspath(__file__))
css=open(os.path.join(here,'deck.css'),encoding='utf-8').read()
chrome=open(os.path.join(here,'chrome.html'),encoding='utf-8').read()

def page(title, body, sub=None, footer=None, small=False):
    h=f'<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>{html.escape(title)}</title><style>{css}</style></head><body>{chrome}'
    h+=f'<h1{" class=small" if small else ""}>{title}</h1>'
    if sub: h+=f'<div class="sub">{sub}</div>'
    h+='<div class="divider"></div>'
    h+=f'<div class="body">{body}</div>'
    if footer: h+=f'<div class="footer">{footer}</div>'
    h+='</body></html>'
    return h

S=[]
S.append(dict(title='The Lie of the Liar', sub='Resolving the liar paradox with subjective numbers',
 footer='Pointer roles, target roles, the evaluating perspective, and the licensing of identifications', body='''
<div style="position:absolute;left:0;right:0;top:0;text-align:center;font-size:32px;font-style:italic;color:#24365a">Two positions, one sentence, and the identification that the sentence forbids</div>
<div style="position:absolute;left:0;right:0;top:120px;height:420px">
  <div class="node blue" style="position:absolute;left:230px;top:70px;width:240px;height:240px;font-size:25px"><div>Pointer<br><span style="font-weight:400">the sentence<br>as evaluator</span></div></div>
  <div class="node orange" style="position:absolute;right:230px;top:70px;width:240px;height:240px;font-size:25px"><div>Target<br><span style="font-weight:400">the sentence<br>as evaluated</span></div></div>
  <div style="position:absolute;left:520px;right:520px;top:100px;text-align:center;font-size:30px" class="math">v<sub>Ptr</sub>(L) = ¬v<sub>Tgt</sub>(L)</div>
  <div style="position:absolute;left:480px;right:480px;top:155px;text-align:center"><span class="arrow" style="width:340px"></span></div>
  <div style="position:absolute;left:480px;right:480px;top:235px;text-align:center"><span class="arrow orange back" style="width:340px"></span></div>
  <div style="position:absolute;left:520px;right:520px;top:280px;text-align:center;font-size:30px" class="math">v<sub>Tgt</sub>(L) = ¬v<sub>Ptr</sub>(L)</div>
</div>'''))
S.append(dict(title='The Classical Derivation', sub='Four stated principles and one unstated premise',
 footer='The Universality Assumption: one value for the expression across both of its positions', body='''
<div class="cols">
 <div class="col">
  <h3>What it says it uses</h3>
  <ul>
   <li><b>Bivalence.</b> Every statement is true or false.</li>
   <li><b>Truth schema.</b> "X is true" is true exactly when X is true.</li>
   <li><b>Self-reference.</b> Statements may refer to themselves.</li>
   <li><b>Classical logic.</b> Excluded middle, non-contradiction, ordinary inference.</li>
  </ul>
 </div>
 <div class="col">
  <h3>What it also uses</h3>
  <div class="box accent">
   <p><b>Occurrence identity.</b> The sentence that evaluates and the sentence that is evaluated carry one value at one position.</p>
   <p class="math" style="text-align:center;font-size:36px">τ(L) = ¬τ(L)</p>
   <p>The equation has one argument, the expression, and it is written only after the two occurrences have been identified.</p>
  </div>
  <p class="small" style="margin-top:18px">The truth schema bundles two principles: <span class="blue">disquotation</span>, which is kept, and <span class="orange">occurrence identity</span>, which the liar's own content refutes.</p>
 </div>
</div>'''))
S.append(dict(title='Two Positions of One Sentence', sub='The content of the liar is a pair of directed edges',
 footer='Proposition 3.1: no valuation that respects the content assigns the same value to both positions', body='''
<div class="cols">
 <div class="col" style="flex:1.1">
  <div style="display:flex;align-items:center;justify-content:space-between;padding:0 10px">
   <div class="node blue">Pointer<br>Ptr</div>
   <div style="text-align:center"><div class="math" style="font-size:30px;margin-bottom:8px">x(Ptr) ⊑<sub>e</sub> ¬x(Tgt)</div><span class="arrow" style="width:200px"></span><br><span class="arrow orange back" style="width:200px;margin-top:22px"></span><div class="math" style="font-size:30px;margin-top:8px">x(Tgt) ⊑<sub>e</sub> ¬x(Ptr)</div></div>
   <div class="node orange">Target<br>Tgt</div>
  </div>
  <p style="margin-top:26px">The demonstrative fixes the target; the predicate "is false" evaluates it from the position of the whole sentence. One sentence, two positions of one dependency.</p>
 </div>
 <div class="col" style="flex:0.9">
  <h3>Coherent valuations</h3>
  <table>
   <tr><th class="math">v(Ptr)</th><th class="math">v(Tgt)</th><th>Respects the content</th></tr>
   <tr><td>true</td><td>false</td><td class="blue">yes</td></tr>
   <tr><td>false</td><td>true</td><td class="blue">yes</td></tr>
   <tr><td>true</td><td>true</td><td class="orange">no</td></tr>
   <tr><td>false</td><td>false</td><td class="orange">no</td></tr>
  </table>
  <p class="small" style="margin-top:16px">Exactly two readings, mirror images of each other. Every coherent reading gives the two positions different values.</p>
 </div>
</div>'''))
S.append(dict(title='The Evaluating Perspective', sub='Collapse is a judgment of an evaluator, held in its kernel',
 footer='The contradiction is a property of the evaluating perspective, determined by its kernel and its guards', body='''
<div class="cols">
 <div class="col">
  <h3>Three indices in one judgment</h3>
  <p class="math center" style="font-size:40px">a(s) ⊑<sub>e</sub> b(t)</p>
  <ul>
   <li><span class="blue">s, t</span>: the positions that hold the values</li>
   <li><span class="orange">e</span>: the standpoint that judges the relation</li>
  </ul>
  <p>The kernel of <span class="math">e</span> holds the liar edges. An identity edge <span class="math">x(Ptr) ⊑<sub>e</sub> x(Tgt)</span> is a further entry that <span class="math">e</span> may hold, adopt, or refuse.</p>
 </div>
 <div class="col">
  <h3>Observer Theorem</h3>
  <div class="box accent">
   <p>The closure of <span class="math">e</span> contains a contradiction, a judgment <span class="math">x(r) ⊑<sub>e</sub> ¬x(r)</span>, <b>if and only if</b> it contains an identity edge between the roles.</p>
  </div>
  <ul style="margin-top:14px">
   <li>No identity edge: two coherent valuations remain.</li>
   <li>Full collapse: <span class="math">x(Ptr) → x(Tgt) → ¬x(Ptr)</span>, no valuation survives.</li>
   <li>The liar edges alone never yield a contradiction at any evaluator.</li>
  </ul>
 </div>
</div>'''))
S.append(dict(title='Provenance', sub='Every contradiction has an address and a chain of custody',
 footer='A hierarchy forbids the identification; this account permits it, records it, and exhibits it as the sole cause', body='''
<div class="cols">
 <div class="col">
  <h3>Derivations are proof terms</h3>
  <p class="math center" style="font-size:30px">base<sub>p</sub>(s,t,a,b) | refl<sub>p</sub>(x) | trans(π,ρ) | cpa<sub>p,q,u</sub>(π,ρ)</p>
  <p>The functor <span class="math">H<sub>e</sub></span> sends a derivation to its history: every kernel entry used, every adoption event, and the perspective adopted from.</p>
  <div class="box accent" style="margin-top:14px"><p><b>Provenance Theorem.</b> Every derivation of a contradiction at <span class="math">e</span> contains an identity entry between the roles, in the kernel of <span class="math">e</span> or inside an adopted subterm, and the history records it with every perspective it passed through.</p></div>
 </div>
 <div class="col">
  <h3>Reading a history</h3>
  <p class="math" style="font-size:26px;line-height:1.6">⟨base, e, Tgt, Ptr, x, ¬x⟩<br>⟨adopt, e, q, Tgt⟩<br>⟨base, q, Ptr, Tgt, ¬x, ¬x⟩</p>
  <p>The second line says that <span class="math">e</span> took a judgment from <span class="math">q</span>; the third names the identity entry that <span class="math">q</span> supplied. The contradiction at <span class="math">e</span> was inherited, and the record says from whom.</p>
 </div>
</div>'''))
S.append(dict(title='Transmission and Immunity', sub='Paradox travels along permissions, and only along them',
 footer="Permission at either role transmits the full contradiction, because the liar's own edges connect the roles", body='''
<div class="cols">
 <div class="col">
  <h3>The guard</h3>
  <p class="math center" style="font-size:34px">CPA<sub>e</sub>(q, u) = 1</p>
  <p><span class="math">e</span> takes on every judgment of <span class="math">q</span> that lands at position <span class="math">u</span>. The guard selects by where a judgment lands, and it is directional.</p>
  <div class="box accent"><p><b>Transmission Theorem.</b> A perspective holding only the liar edges inherits the contradiction from a collapsed perspective exactly when its guard is open at <span class="math">Ptr</span> or at <span class="math">Tgt</span>. Refusing at both roles confers immunity.</p></div>
 </div>
 <div class="col">
  <h3>Three evaluators, one sentence</h3>
  <table>
   <tr><th>Perspective</th><th>Holds</th><th>Result</th></tr>
   <tr><td class="math">q</td><td>liar edges and the collapse</td><td class="orange">incoherent</td></tr>
   <tr><td class="math">o</td><td>liar edges, adopts from <span class="math">q</span> at <span class="math">Ptr</span></td><td class="orange">incoherent, inherited</td></tr>
   <tr><td class="math">e</td><td>liar edges, adopts nothing</td><td class="blue">two coherent valuations</td></tr>
  </table>
  <p class="small" style="margin-top:14px">The same dependency at all three. The difference lies entirely in what each has validated or adopted.</p>
 </div>
</div>'''))
S.append(dict(title='The Unfolding and Parity', sub='Why there are two roles and not three or thirty',
 footer='The Universality Assumption is the passage from two classes to one', body='''
<div style="text-align:center;font-size:34px" class="math">r<sub>0</sub> → r<sub>1</sub> → r<sub>2</sub> → r<sub>3</sub> → r<sub>4</sub> → …   each link: v(r<sub>n</sub>) = ¬v(r<sub>n+1</sub>)</div>
<p class="center small">Following the reference of the sentence gives a ray of positions. The ray is coherent: the two alternating valuations respect every link.</p>
<div class="cols" style="height:auto;margin-top:16px">
 <div class="col">
  <h3>Quotients</h3>
  <ul>
   <li>A quotient gathers positions into classes and adds identity edges inside each class.</li>
   <li>Period <span class="math">k</span>: identify <span class="math">r<sub>n</sub></span> with <span class="math">r<sub>n+k</sub></span>. Coherent <b>iff</b> <span class="math">k</span> is even.</li>
   <li>A quotient is coherent <b>iff</b> every class keeps one parity.</li>
  </ul>
 </div>
 <div class="col">
  <h3>Two classes and one class</h3>
  <ul>
   <li><span class="blue">Period 2</span>: even positions = Pointer, odd = Target. The coarsest coherent quotient; every coherent quotient refines it.</li>
   <li><span class="orange">Period 1</span>: one class, one self-loop, <span class="math">x(r) ⊑ ¬x(r)</span>. The classical liar.</li>
   <li>A cycle with <span class="math">m</span> negating links is coherent iff <span class="math">m</span> is even: the odd-cycle criterion.</li>
   <li>The liar unit <span class="math">σ</span>: <span class="math">σ<sup>2</sup> = 1</span>, reads true at even and false at odd positions, descends only to even quotients.</li>
  </ul>
 </div>
</div>'''))
S.append(dict(title='Collapse and Fixed Points', sub='Self-reference is never the source; the transformation and the identification are',
 footer='The fixed-point test tells an evaluator whether its collapse is coherent, and licensing tells it whether it was allowed', body='''
<div class="cols">
 <div class="col">
  <h3>A family of constructions</h3>
  <p>A reflexive sentence carries a transformation <span class="math">F</span> across the reference:</p>
  <p class="math center" style="font-size:32px">x(Tgt) ⊑<sub>e</sub> F(x)(Ptr),   x(Ptr) ⊑<sub>e</sub> F(x)(Tgt)</p>
  <div class="box accent"><p><b>Collapse Criterion.</b> With the collapse added, <span class="math">e</span> is coherent <b>iff</b> <span class="math">F</span> has a fixed point, and the coherent valuations are the constants <span class="math">c = F(c)</span>.</p></div>
 </div>
 <div class="col">
  <h3>Two cases</h3>
  <table>
   <tr><th>Sentence</th><th class="math">F</th><th>Fixed points</th><th>Collapsed evaluator</th></tr>
   <tr><td>Liar</td><td class="math">¬</td><td>none</td><td class="orange">incoherent</td></tr>
   <tr><td>Truth-teller</td><td>identity</td><td>both values</td><td class="blue">coherent, undetermined</td></tr>
  </table>
  <p class="small" style="margin-top:16px">On the collapsed object this is Kripke's criterion. What is added is the step before it: whether the evaluator was entitled to collapse.</p>
 </div>
</div>'''))
S.append(dict(title='Licensing', sub='When may an evaluator identify two positions?',
 footer='The classical error: taking as an axiom what the content proves, leaves open, or refutes', body='''
<div class="cols">
 <div class="col" style="flex:0.9">
  <h3>Three statuses</h3>
  <p><span class="tag lic">licensed</span> every coherent valuation already agrees on the two positions</p>
  <p><span class="tag forb">forbidden</span> no coherent valuation agrees</p>
  <p><span class="tag open">open</span> some agree and some do not</p>
  <div class="box accent" style="margin-top:12px"><p><b>Licensing Theorem.</b> Identifying two positions keeps exactly the coherent valuations that agree on them. Licensed changes nothing; forbidden leaves none; open leaves a choice.</p></div>
 </div>
 <div class="col" style="flex:1.1">
  <h3>Classification</h3>
  <table>
   <tr><th>Construction</th><th>Identification</th></tr>
   <tr><td>Liar</td><td><span class="orange">forbidden</span></td></tr>
   <tr><td>Truth-teller</td><td><span class="blue">licensed</span>, not determining</td></tr>
   <tr><td>Grounded sentence</td><td><span class="blue">licensed</span>, determining</td></tr>
   <tr><td>Open pair</td><td>open, not determining</td></tr>
   <tr><td>Odd cycles, Yablo</td><td>each open; <span class="orange">all together forbidden</span></td></tr>
  </table>
 </div>
</div>'''))
S.append(dict(title='The Identification Schema', sub='The same criterion decides the classical paradoxes of self-reference', small=True,
 footer='Schema Theorem: the contradiction is located at the identification, traceable to it, and travels only along guards', body='''
<p class="center" style="margin-top:0">One form: a <span class="blue">coherent dependency</span>, an <span class="navy">evaluator with a kernel</span>, and an <span class="orange">identification</span> whose status the dependency fixes in advance. A paradox is a forbidden identification held as an axiom.</p>
<table style="margin-top:10px">
 <tr><th>Construction</th><th>Positions</th><th>Content</th><th>Verdict</th></tr>
 <tr><td>Grelling</td><td class="math">H<sup>Ptr</sup>, H<sup>Tgt</sup></td><td class="math">v(H<sup>Ptr</sup>) = ¬v(H<sup>Tgt</sup>)</td><td class="orange">forbidden</td></tr>
 <tr><td>Curry</td><td class="math">K<sup>Ptr</sup>, K<sup>Tgt</sup>, C</td><td class="math">v(K<sup>Ptr</sup>) = (v(K<sup>Tgt</sup>) → v(C))</td><td>open; determines <span class="math">C</span> true; forbidden if <span class="math">C</span> is false</td></tr>
 <tr><td>Russell</td><td class="math">m<sup>Ptr</sup>, m<sup>Tgt</sup></td><td class="math">v(m<sup>Ptr</sup>) = ¬v(m<sup>Tgt</sup>)</td><td class="orange">forbidden</td></tr>
 <tr><td>Berry</td><td class="math">N<sup>Ptr</sup>, N<sup>Tgt</sup></td><td>two stocks of names</td><td class="orange">forbidden</td></tr>
 <tr><td>Yablo</td><td class="math">Y<sub>n</sub><sup>Ptr</sup>, Y<sub>n</sub><sup>Tgt</sup></td><td>each true iff all later targets false</td><td>each open; <span class="orange">all together forbidden</span></td></tr>
 <tr><td>Revenge</td><td class="math">R<sup>Ptr</sup>(e), R<sup>Tgt</sup>(q)</td><td>true iff all accessible targets false</td><td>joint self-identification <span class="orange">forbidden</span></td></tr>
</table>'''))
S.append(dict(title='Revenge', sub="Self-access is the liar's identity edge at the level of the guard",
 footer='Revenge is decided by the same criterion as the liar, alongside the odd cycles and Yablo', body='''
<div class="cols">
 <div class="col">
  <h3>The sentence</h3>
  <p>"This sentence is not true at any perspective."</p>
  <p class="math center" style="font-size:28px">v(R<sup>Ptr</sup>(e)) = true  iff  every accessible R<sup>Tgt</sup>(q) is false</p>
  <p>The accessible targets are fixed by the guard. The content contributes no identity edge.</p>
 </div>
 <div class="col">
  <h3>Revenge Theorem</h3>
  <ul>
   <li>The dependency is coherent for every domain and guard.</li>
   <li>Self-identification at <span class="math">e</span>: <span class="orange">forbidden</span> when the only accessible target is its own, open otherwise.</li>
   <li>Joint self-identification across every perspective with self-access: <span class="orange">forbidden</span>.</li>
  </ul>
  <div class="box accent"><p>The revenge argument identifies <span class="math">R<sup>Ptr</sup>(q)</span> with <span class="math">R<sup>Tgt</sup>(q)</span> at every perspective at once. That is the joint identification, and it is forbidden.</p></div>
 </div>
</div>'''))
S.append(dict(title='In Plain Terms', sub='The resolution without the notation',
 footer='The paradox has an address: the kernel of whoever makes the identification', body='''
<div class="cols">
 <div class="col">
  <ul style="font-size:29px">
   <li>The sentence does two jobs at once: it says something, and it is the thing talked about. Two positions.</li>
   <li>Read that way, it is in order: whatever the thing talked about is, the thing saying it is the opposite. Two readings, mirror images.</li>
   <li>The contradiction appears when a reader insists the two positions share one value. The sentence forbids that.</li>
  </ul>
 </div>
 <div class="col">
  <ul style="font-size:29px">
   <li>Readers do it because for ordinary sentences the habit is harmless and correct. The liar is the case where it fails.</li>
   <li>The machinery says who did it and how: the identification is an entry on the reader's list, checked before it is added, recorded when it is.</li>
   <li>The liar has no single classical value, and it is not defective. Made into a number it is <span class="math">σ</span> with <span class="math">σ<sup>2</sup> = 1</span>, true from one position and false from the other, as <span class="math">√−1</span> is a number the reals lack.</li>
  </ul>
 </div>
</div>'''))
for i,s in enumerate(S,1):
    open(os.path.join(here,f'slide{i:02d}.html'),'w',encoding='utf-8').write(page(**s))
print('written',len(S))
