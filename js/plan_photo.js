"use strict";
/* Plans : reconnaissance des murs et des portes sur la photo (ou le scan) d'un croquis, hors connexion.
   detecterMurs(image, sensibilite) → { murs: [{a, b}], portes: [{a, b, alt: [{a, b}, …]}], angle }
   en pixels de l'image d'origine (murs remis d'équerre).
   Méthode :
   1. l'encre : nettement plus sombre que son voisinage, en écart et en proportion (ombres, photo plus sombre d'un côté,
      pli de la feuille, verso qui transparaît) ;
   2. un trait n'est gardé que s'il est clair des deux côtés : le bord de la feuille, de la table ou de la main (sombre
      d'un seul côté) n'est pas un mur ;
   3. redressement selon l'angle qui aligne le mieux les traits ;
   4. traits horizontaux et verticaux, doubles traits d'un mur fusionnés, morceaux d'un même trait tremblé réunis,
      alignements, raccords aux angles ;
   5. portes : battant (trait perpendiculaire au mur) + quart de cercle → porte sur ce mur ; arc seul dans un angle → les
      deux murs sont proposés ;
      ou mur interrompu sur la largeur d'une porte (taille vérifiée ensuite en cm par l'appelant). */

function detecterMurs(img, sensibilite, debug) {
  const sens = Math.max(0, Math.min(2, sensibilite ?? 1));
  const W0 = img.naturalWidth || img.width,
    H0 = img.naturalHeight || img.height;
  const S = Math.min(1, 1100 / Math.max(W0, H0)),
    w = Math.round(W0 * S),
    h = Math.round(H0 * S);
  const dim = Math.max(w, h);
  const gris = (cv, cw, ch) => {
    const px = cv.getContext("2d").getImageData(0, 0, cw, ch).data,
      g = new Float32Array(cw * ch);
    for (let i = 0; i < g.length; i++) g[i] = 0.299 * px[4 * i] + 0.587 * px[4 * i + 1] + 0.114 * px[4 * i + 2];
    return g;
  };
  const integrale = (g, cw, ch) => {
    const t = new Float64Array((cw + 1) * (ch + 1));
    for (let y = 0; y < ch; y++) {
      let s = 0;
      for (let x = 0; x < cw; x++) {
        s += g[y * cw + x];
        t[(y + 1) * (cw + 1) + x + 1] = t[y * (cw + 1) + x + 1] + s;
      }
    }
    return (xa, ya, xb, yb) => t[yb * (cw + 1) + xb] - t[ya * (cw + 1) + xb] - t[yb * (cw + 1) + xa] + t[ya * (cw + 1) + xa];
  };

  // encre : plus sombre que le voisinage (moyenne locale), en écart et en proportion
  const r = Math.max(8, Math.round(dim / 40)),
    C = [26, 16, 10][sens],
    K = [0.6, 0.72, 0.82][sens];
  const seuiller = (g, cw, ch, dans) => {
    const somme = integrale(g, cw, ch),
      out = new Uint8Array(cw * ch);
    const ech = [];
    for (let i = 0; i < g.length; i += 7) if (dans[i]) ech.push(g[i]);
    ech.sort((a, b) => a - b);
    const papier = ech.length ? ech[Math.floor(ech.length * 0.85)] : 220; // (le papier : parmi ce qu'il y a de plus clair)
    seuiller.papier = papier;
    for (let y = 0; y < ch; y++)
      for (let x = 0; x < cw; x++) {
        const i = y * cw + x;
        if (!dans[i]) continue;
        const xa = Math.max(0, x - r),
          xb = Math.min(cw, x + r + 1),
          ya = Math.max(0, y - r),
          yb = Math.min(ch, y + r + 1);
        const moy = somme(xa, ya, xb, yb) / ((xb - xa) * (yb - ya)),
          v = g[i];
        if (v < moy - C && v < moy * K) out[i] = 1; // (relatif au voisinage : la photo peut être plus sombre d'un côté)
      }
    return out;
  };

  // 1. angle de la photo : celui qui aligne le mieux l'encre en lignes (méthode des projections, ±20°)
  const c1 = document.createElement("canvas");
  c1.width = w;
  c1.height = h;
  const x1 = c1.getContext("2d");
  x1.drawImage(img, 0, 0, w, h);
  const tout = new Uint8Array(w * h).fill(1);
  const g1 = gris(c1, w, h),
    e1 = seuiller(g1, w, h, tout),
    px = [],
    py = [];
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if (e1[y * w + x]) {
        px.push(x);
        py.push(y);
      }
  const pasEch = Math.max(1, Math.floor(px.length / 60000));
  const score = deg => {
    const a = (deg * Math.PI) / 180,
      ca = Math.cos(a),
      sa = Math.sin(a),
      n = Math.ceil(w + h) * 2 + 10,
      hy = new Float32Array(n),
      hx = new Float32Array(n);
    for (let k = 0; k < px.length; k += pasEch) {
      const x = px[k],
        y = py[k];
      hy[Math.round(-x * sa + y * ca + w + h)]++;
      hx[Math.round(x * ca + y * sa + w + h)]++;
    }
    let t = 0;
    for (let k = 0; k < n; k++) t += hy[k] * hy[k] + hx[k] * hx[k];
    return t;
  };
  let angle = 0,
    best = -1;
  for (let a = -20; a <= 20; a += 0.5) {
    const sc = score(a);
    if (sc > best) {
      best = sc;
      angle = a;
    }
  }
  for (let a = angle - 0.5; a <= angle + 0.5; a += 0.1) {
    const sc = score(a);
    if (sc > best) {
      best = sc;
      angle = a;
    }
  }
  angle = Math.round(angle * 10) / 10;
  if (Math.abs(angle) < 0.3) angle = 0;
  const th = (angle * Math.PI) / 180;

  // 2. image redressée (sur une toile assez grande pour ne rien couper ; le dehors en gris, pas pris pour la feuille)
  const D = Math.ceil(Math.hypot(w, h)),
    c2 = document.createElement("canvas");
  c2.width = D;
  c2.height = D;
  const x2 = c2.getContext("2d");
  x2.fillStyle = "#555";
  x2.fillRect(0, 0, D, D);
  x2.translate(D / 2, D / 2);
  x2.rotate(-th);
  x2.drawImage(img, -w / 2, -h / 2, w, h);
  const g = gris(c2, D, D);
  // retour aux pixels de l'image d'origine, en gardant les murs droits (si la photo est penchée, le plan est remis d'aplomb)
  const versImage = (px, py) => ({ x: (px - D / 2 + w / 2) / S, y: (py - D / 2 + h / 2) / S });
  // (dans la photo, à 1 % du bord près : le dehors de la photo redressée n'est pas lu)
  const dansFeuille = new Uint8Array(D * D),
    m1 = dim * 0.01,
    co = Math.cos(th),
    si = Math.sin(th);
  for (let y = 0; y < D; y++)
    for (let x = 0; x < D; x++) {
      const u = x - D / 2,
        v = y - D / 2,
        ox = co * u - si * v + w / 2,
        oy = si * u + co * v + h / 2;
      if (ox > m1 && ox < w - m1 && oy > m1 && oy < h - m1) dansFeuille[y * D + x] = 1;
    }
  const encre = seuiller(g, D, D, dansFeuille);

  // 3. traits horizontaux (et verticaux, en lisant l'image en colonnes)
  const Lmin = Math.max(18, dim * 0.045),
    LminRun = Math.max(12, dim * 0.025),
    trou = Math.max(2, Math.round(dim * 0.008)),
    epMax = dim * 0.06;
  // (encre épaissie de quelques pixels en travers : un trait un peu penché, courbé par l'objectif ou tremblé reste d'un seul tenant)
  const DIL = Math.max(2, Math.round(dim * 0.004));
  const epaissir = vertical => {
    const out = new Uint8Array(D * D);
    for (let y = 0; y < D; y++)
      for (let x = 0; x < D; x++)
        if (encre[y * D + x])
          for (let k = -DIL; k <= DIL; k++) {
            const xx = vertical ? x + k : x,
              yy = vertical ? y : y + k;
            if (xx >= 0 && yy >= 0 && xx < D && yy < D) out[yy * D + xx] = 1;
          }
    return out;
  };
  const encreH = epaissir(false),
    encreV = epaissir(true);
  const epaisseurs = [];
  const traits = vertical => {
    const runs = [];
    for (let a = 0; a < D; a++) {
      let deb = -1,
        der = -1;
      for (let b = 0; b <= D; b++) {
        const on = b < D && (vertical ? encreV[b * D + a] : encreH[a * D + b]);
        if (on) {
          if (deb < 0) deb = b;
          der = b;
        } else if (deb >= 0 && b - der > trou) {
          if (der - deb + 1 >= LminRun) runs.push({ c: a, d0: deb, d1: der });
          deb = -1;
        }
      }
    }
    // suites voisines (ligne d'à côté, qui se recouvrent) = un même trait épais (ou un peu penché)
    runs.sort((p, q) => p.c - q.c);
    const segs = [],
      actifs = [];
    for (const ru of runs) {
      let s = null;
      for (const t of actifs)
        if (ru.c - t.cMax <= 2) {
          const rec = Math.min(ru.d1, t.dern.d1) - Math.max(ru.d0, t.dern.d0);
          if (rec > 0.3 * Math.min(ru.d1 - ru.d0, t.dern.d1 - t.dern.d0)) {
            s = t;
            break;
          }
        }
      if (!s) {
        s = { cMin: ru.c, cMax: ru.c, d0: ru.d0, d1: ru.d1, somme: 0, poids: 0, runs: [] };
        segs.push(s);
        actifs.push(s);
      }
      s.cMax = ru.c;
      s.somme += ru.c * (ru.d1 - ru.d0);
      s.poids += ru.d1 - ru.d0;
      s.runs.push(ru);
      s.dern = ru;
      s.d0 = Math.min(s.d0, ru.d0);
      s.d1 = Math.max(s.d1, ru.d1);
      for (let i = actifs.length - 1; i >= 0; i--) if (ru.c - actifs[i].cMax > 2) actifs.splice(i, 1);
    }
    return segs
      .filter(s => s.cMax - s.cMin <= epMax)
      .map(s => {
        const lmax = Math.max(...s.runs.map(x => x.d1 - x.d0)),
          longs = s.runs.filter(x => x.d1 - x.d0 >= lmax * 0.3);
        // (épaisseur du trait : nombre de lignes au milieu du segment)
        const mil = (s.d0 + s.d1) / 2,
          e = s.runs.filter(x => x.d0 <= mil && x.d1 >= mil).length;
        epaisseurs.push(e);
        return {
          c: s.somme / s.poids,
          d0: Math.min(...longs.map(x => x.d0)),
          d1: Math.max(...longs.map(x => x.d1)),
          ep: Math.ceil(e / 2),
          span: s.cMax - s.cMin,
        };
      })
      .filter(s => s.d1 - s.d0 >= Lmin);
  };
  const joint = dim * 0.03;
  let ep0 = 4;
  const fusion = segs => {
    // doubles traits d'un mur (à moins de 3 % de l'image, qui se recouvrent) → un seul mur au milieu ;
    // morceaux d'un même trait tremblé (presque alignés, bout à bout à moins de 3 %) → un seul mur
    const dmax = dim * 0.03,
      tolA = dim * 0.025;
    let change = true;
    while (change) {
      change = false;
      segs.sort((p, q) => p.c - q.c);
      for (let i = 0; i < segs.length && !change; i++)
        for (let j = i + 1; j < segs.length && segs[j].c - segs[i].c <= dmax; j++) {
          const p = segs[i],
            q = segs[j],
            rec = Math.min(p.d1, q.d1) - Math.max(p.d0, q.d0);
          // (double trait : deux traits de longueur voisine ; un battant de porte, court, à côté d'un mur reste à part)
          const lp0 = p.d1 - p.d0,
            lq0 = q.d1 - q.d0,
            voisins = Math.min(lp0, lq0) >= 0.5 * Math.max(lp0, lq0);
          const proche = (voisins && rec > 0.6 * Math.min(lp0, lq0)) || (q.c - p.c <= Math.min(tolA, ep0 * 2 + 2 * DIL) && rec > -joint);
          if (proche) {
            const lp = p.d1 - p.d0,
              lq = q.d1 - q.d0;
            p.c = (p.c * lp + q.c * lq) / (lp + lq);
            p.d0 = Math.min(p.d0, q.d0);
            p.d1 = Math.max(p.d1, q.d1);
            segs.splice(j, 1);
            change = true;
            break;
          }
        }
    }
    return segs;
  };
  // un trait d'encre est clair des deux côtés ; un bord (feuille sur la table, main) ne l'est que d'un côté
  const vraiTrait = vertical => s => {
    let bons = 0,
      n = 0;
    for (let k = 1; k < 16; k++) {
      const a = Math.round(s.d0 + ((s.d1 - s.d0) * k) / 16),
        c = Math.round(s.c);
      const lire = dc => {
        const cc = c + dc;
        if (cc < 0 || cc >= D) return 0;
        return vertical ? g[a * D + cc] : g[cc * D + a];
      };
      // (le trait réel peut être un peu à côté de la droite moyenne : on cherche son point le plus sombre)
      let noir = 255,
        pos = 0;
      const large = Math.ceil((s.span || 0) / 2) + 3;
      for (let dc = -large; dc <= large; dc++) {
        const v = lire(dc);
        if (v < noir) {
          noir = v;
          pos = dc;
        }
      }
      const cote = sg => {
        let t = 0;
        for (let dc = 5; dc <= 10; dc++) t += lire(pos + sg * (dc + (s.ep || 0)));
        return t / 6;
      };
      const c1 = cote(-1),
        c2 = cote(1);
      n++;
      if (Math.min(c1, c2) - noir > C * 1.5 && Math.min(c1, c2) > noir * 1.5) bons++;
    }
    return bons >= n * 0.5;
  };
  const tH = traits(false).filter(vraiTrait(false)),
    tV = traits(true).filter(vraiTrait(true));
  {
    const e = [...epaisseurs].sort((a, b) => a - b);
    ep0 = Math.max(2, Math.min(dim * 0.02, (e.length ? e[Math.floor(e.length / 2)] : 4 + 2 * DIL) - 2 * DIL));
  }
  const H = fusion(tH),
    V = fusion(tV);
  epaisseurs.sort((a, b) => a - b);
  const ep = ep0;

  // 4. alignements : murs presque sur la même ligne → même ligne (moyenne pondérée par la longueur)
  const aligner = segs => {
    const tol = dim * 0.015;
    segs.sort((p, q) => p.c - q.c);
    for (let i = 0; i < segs.length; ) {
      let j = i,
        s = 0,
        n = 0;
      while (j < segs.length && segs[j].c - segs[i].c <= tol) {
        s += segs[j].c * (segs[j].d1 - segs[j].d0);
        n += segs[j].d1 - segs[j].d0;
        j++;
      }
      for (let k = i; k < j; k++) segs[k].c = s / n;
      i = j;
    }
  };
  aligner(H);
  aligner(V);

  // 5. raccords aux angles : un bout de mur proche d'un mur perpendiculaire va jusqu'à lui
  const tolJ = dim * 0.035;
  const raccorder = (A, B) => {
    for (const s of A)
      for (const bout of ["d0", "d1"]) {
        let best = null,
          bd = tolJ;
        for (const t of B) {
          if (s.c < t.d0 - tolJ || s.c > t.d1 + tolJ) continue;
          const dd = Math.abs(t.c - s[bout]);
          if (dd < bd) {
            bd = dd;
            best = t;
          }
        }
        if (best) {
          s[bout] = best.c;
          best.d0 = Math.min(best.d0, s.c);
          best.d1 = Math.max(best.d1, s.c);
        }
      }
  };
  raccorder(H, V);
  raccorder(V, H);

  // 6. portes dessinées en quart de cercle : l'encre qui reste hors des murs, en morceaux de la taille d'une porte,
  //    peu remplis (un arc, pas une tache ni un mot), collés à un ou deux murs
  const bande = ep / 2 + Math.max(3, ep * 0.6),
    reste = new Uint8Array(D * D);
  for (let i = 0; i < reste.length; i++) reste[i] = encre[i];
  const effacer = (vertical, s) => {
    const c0 = Math.max(0, Math.floor(s.c - bande)),
      c1 = Math.min(D - 1, Math.ceil(s.c + bande)),
      a0 = Math.max(0, Math.floor(s.d0 - bande)),
      a1 = Math.min(D - 1, Math.ceil(s.d1 + bande));
    for (let c = c0; c <= c1; c++) for (let a = a0; a <= a1; a++) reste[vertical ? a * D + c : c * D + a] = 0;
  };
  H.forEach(s => effacer(false, s));
  V.forEach(s => effacer(true, s));
  const vu = new Uint8Array(D * D),
    pile = new Int32Array(D * D),
    arcs = [];
  for (let i0 = 0; i0 < reste.length; i0++) {
    if (!reste[i0] || vu[i0]) continue;
    let n = 0,
      sp = 0,
      xa = D,
      xb = 0,
      ya = D,
      yb = 0;
    pile[sp++] = i0;
    vu[i0] = 1;
    while (sp) {
      const i = pile[--sp],
        x = i % D,
        y = (i - x) / D;
      n++;
      if (x < xa) xa = x;
      if (x > xb) xb = x;
      if (y < ya) ya = y;
      if (y > yb) yb = y;
      for (let dy = -2; dy <= 2; dy++)
        for (let dx = -2; dx <= 2; dx++) {
          // (voisinage élargi : arc tracé en pointillé ou coupé par le mur)
          const xx = x + dx,
            yy = y + dy;
          if (xx < 0 || yy < 0 || xx >= D || yy >= D) continue;
          const j = yy * D + xx;
          if (reste[j] && !vu[j]) {
            vu[j] = 1;
            pile[sp++] = j;
          }
        }
    }
    const bw = xb - xa + 1,
      bh = yb - ya + 1,
      t = Math.max(bw, bh);
    if (t < dim * 0.025 || t > dim * 0.16 || Math.min(bw, bh) < t * 0.45) continue;
    if (n / (bw * bh) > 0.4 || n < t * ep * 0.5) continue;
    arcs.push({ xa: xa - bande, xb: xb + bande, ya: ya - bande, yb: yb + bande, t });
  }
  const portes = [];
  // porte dessinée comme il faut : un battant (trait perpendiculaire au mur, partant du mur) + l'arc → le mur est certain
  const battant = ar => {
    const tol = bande * 2 + 3,
      dedans = q => q.c >= Math.min(ar.xa, ar.ya) - 1e9;
    let best = null;
    for (const [L, Lp, vertical] of [
      [V, H, true],
      [H, V, false],
    ])
      for (const sg of L) {
        if (sg.porte || !dedans(sg)) continue;
        const lg = sg.d1 - sg.d0;
        if (lg < ar.t * 0.4 || lg > ar.t * 1.6) continue;
        // le battant est contre l'arc : dans son cadre (élargi)
        const [cx0, cx1, cy0, cy1] = vertical ? [sg.c, sg.c, sg.d0, sg.d1] : [sg.d0, sg.d1, sg.c, sg.c];
        if (cx1 < ar.xa - tol || cx0 > ar.xb + tol || cy1 < ar.ya - tol || cy0 > ar.yb + tol) continue;
        for (const w of Lp) {
          if (w.d1 - w.d0 <= lg * 1.2) continue; // (le mur est plus long que le battant)
          if (sg.c < w.d0 - tol || sg.c > w.d1 + tol) continue;
          const bout = Math.abs(w.c - sg.d0) <= tol ? "d0" : Math.abs(w.c - sg.d1) <= tol ? "d1" : null;
          if (!bout) continue;
          const centre = vertical ? (ar.xa + ar.xb) / 2 : (ar.ya + ar.yb) / 2,
            a0 = centre >= sg.c ? sg.c : sg.c - lg,
            a1 = a0 + lg;
          const seg = vertical
            ? [
                { x: a0, y: w.c },
                { x: a1, y: w.c },
              ]
            : [
                { x: w.c, y: a0 },
                { x: w.c, y: a1 },
              ];
          // charnière (bout du battant sur le mur) et bout libre du battant : sens d'ouverture
          const autre = bout === "d0" ? sg.d1 : sg.d0;
          const charn = vertical ? { x: sg.c, y: w.c } : { x: w.c, y: sg.c },
            libre = vertical ? { x: sg.c, y: autre } : { x: autre, y: sg.c };
          const score = Math.abs(lg - ar.t);
          if (!best || score < best.score) best = { score, sg, seg, charn, libre };
        }
      }
    return best;
  };
  for (const ar of arcs) {
    const bt = battant(ar);
    if (bt) {
      bt.sg.porte = true;
      portes.push(Object.assign([bt.seg], { charn: bt.charn, libre: bt.libre }));
      continue;
    }
    const tol = bande * 2 + 2,
      prop = [];
    for (const s of H) {
      if (s.d1 < ar.xa - tol || s.d0 > ar.xb + tol) continue;
      if (Math.abs(s.c - ar.ya) <= tol || Math.abs(s.c - ar.yb) <= tol)
        prop.push({ a: { x: Math.max(ar.xa + bande, s.d0), y: s.c }, b: { x: Math.min(ar.xb - bande, s.d1), y: s.c }, L: s.d1 - s.d0 });
    }
    for (const s of V) {
      if (s.d1 < ar.ya - tol || s.d0 > ar.yb + tol) continue;
      if (Math.abs(s.c - ar.xa) <= tol || Math.abs(s.c - ar.xb) <= tol)
        prop.push({ a: { x: s.c, y: Math.max(ar.ya + bande, s.d0) }, b: { x: s.c, y: Math.min(ar.yb - bande, s.d1) }, L: s.d1 - s.d0 });
    }
    const bonnes = prop.filter(q => Math.hypot(q.b.x - q.a.x, q.b.y - q.a.y) > ar.t * 0.5);
    if (!bonnes.length) continue;
    // (deux murs possibles — porte dans un angle : on propose d'abord le plus court, souvent la cloison de la pièce)
    bonnes.sort((p, q) => p.L - q.L);
    portes.push(bonnes.slice(0, 2).map(q => [q.a, q.b]));
  }

  // 7. murs, et portes dessinées comme une interruption du mur (sauf si un arc est déjà là)
  const murs = [];
  const ouvertures = (segs, vertical) => {
    const lignes = {};
    segs
      .filter(s => !s.porte)
      .forEach(s => {
        const k = s.c.toFixed(2);
        (lignes[k] = lignes[k] || []).push(s);
      });
    for (const k in lignes) {
      const L = lignes[k].sort((p, q) => p.d0 - q.d0);
      for (let i = 0; i < L.length - 1; i++) {
        const vide = L[i + 1].d0 - L[i].d1;
        if (vide > joint && vide < dim * 0.2) {
          const seg = vertical
            ? [
                { x: L[i].c, y: L[i].d1 },
                { x: L[i].c, y: L[i + 1].d0 },
              ]
            : [
                { x: L[i].d1, y: L[i].c },
                { x: L[i + 1].d0, y: L[i].c },
              ];
          const deja = portes.some(alt =>
            alt.some(
              ([a, b]) =>
                Math.min(Math.max(a.x, b.x), Math.max(seg[0].x, seg[1].x)) - Math.max(Math.min(a.x, b.x), Math.min(seg[0].x, seg[1].x)) >=
                  -bande * 2 &&
                Math.min(Math.max(a.y, b.y), Math.max(seg[0].y, seg[1].y)) - Math.max(Math.min(a.y, b.y), Math.min(seg[0].y, seg[1].y)) >=
                  -bande * 2
            )
          );
          if (deja) murs.push(seg);
          else portes.push(Object.assign([seg], { vide: true })); // (mur interrompu, sans arc : passage)   // (vide sous un arc : c'est du mur, la porte est l'arc)
        }
      }
      for (const s of L)
        if (s.d1 - s.d0 >= Lmin * 0.8)
          murs.push(
            vertical
              ? [
                  { x: s.c, y: s.d0 },
                  { x: s.c, y: s.d1 },
                ]
              : [
                  { x: s.d0, y: s.c },
                  { x: s.d1, y: s.c },
                ]
          );
    }
  };
  ouvertures(H, false);
  ouvertures(V, true);
  const conv = ([a, b]) => ({ a: versImage(a.x, a.y), b: versImage(b.x, b.y) });
  let image = null;
  if (debug) {
    // (mise au point : encre en noir, feuille en blanc, murs en rouge, portes en vert)
    const cv = document.createElement("canvas");
    cv.width = D;
    cv.height = D;
    const cx = cv.getContext("2d"),
      im = cx.createImageData(D, D);
    for (let i = 0; i < D * D; i++) {
      const v = encre[i] ? 0 : dansFeuille[i] ? 255 : 170;
      im.data[4 * i] = im.data[4 * i + 1] = im.data[4 * i + 2] = v;
      im.data[4 * i + 3] = 255;
    }
    cx.putImageData(im, 0, 0);
    cx.lineWidth = 3;
    cx.strokeStyle = "rgba(255,0,0,.6)";
    murs.forEach(([a, b]) => {
      cx.beginPath();
      cx.moveTo(a.x, a.y);
      cx.lineTo(b.x, b.y);
      cx.stroke();
    });
    cx.strokeStyle = "rgba(0,180,0,.8)";
    cx.lineWidth = 6;
    portes.forEach(alt => {
      const [a, b] = alt[0];
      cx.beginPath();
      cx.moveTo(a.x, a.y);
      cx.lineTo(b.x, b.y);
      cx.stroke();
    });
    image = cv.toDataURL();
  }
  return {
    image,
    murs: murs.map(conv),
    portes: portes.map(alt => {
      const c = alt.map(conv);
      return {
        a: c[0].a,
        b: c[0].b,
        alt: c,
        vide: !!alt.vide,
        charn: alt.charn && versImage(alt.charn.x, alt.charn.y),
        libre: alt.libre && versImage(alt.libre.x, alt.libre.y),
      };
    }),
    angle,
  };
}
