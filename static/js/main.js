(function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const fmt = (n) => n.toLocaleString("en-US");

  /* ---------- Theme toggle ---------- */
  const root = document.documentElement;
  const themeBtn = $("#themeBtn");
  try { const t = localStorage.getItem("pbmc-theme"); if (t) root.setAttribute("data-theme", t); } catch (e) {}
  const isDark = () => root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  const syncIcon = () => { themeBtn.innerHTML = `<svg><use href="#${isDark() ? "i-sun" : "i-moon"}"/></svg>`; };
  syncIcon();
  themeBtn.addEventListener("click", () => {
    const next = isDark() ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("pbmc-theme", next); } catch (e) {}
    syncIcon();
  });

  /* ---------- Data (from the camera-ready paper and results/deseq2_v2) ---------- */
  const contrasts = [
    { l1: "T24h vs. CTRL", l2: "acute" },
    { l1: "D7 vs. CTRL", l2: "subacute" },
    { l1: "T24h vs. D7", l2: "acute vs. subacute" }
  ];
  const methods = [
    { k: "def", name: "Default", full: "Default (median-of-ratios)", v: [[9219, 5212, 4007], [92, 65, 27], [5851, 3186, 2665]] },
    { k: "ruv", name: "RUVg (k = 2)", full: "RUVg (k = 2)", v: [[28, 12, 16], [63, 16, 47], [64, 25, 39]] },
    { k: "strict", name: "Strict filter", full: "Strict filter (≥ 20 in ≥ 8)", v: [[6912, 3579, 3333], [86, 60, 26], [4472, 2239, 2233]] },
    { k: "neu", name: "+ Granulocyte", full: "~neutrophil-score + condition", v: [[9420, 5378, 4042], [19, 14, 5], [5881, 3176, 2705]] }
  ];
  const samples = [
    { s: "CTRL_6", srr: "SRR8207876", g: "CTRL", lib: 46.6, dup: 74.6, asg: 42.6, pc1: -30.7, gran: 5.33 },
    { s: "CTRL_5", srr: "SRR8207877", g: "CTRL", lib: 42.3, dup: 78.3, asg: 45.5, pc1: -63.8, gran: 4.27 },
    { s: "CTRL_4", srr: "SRR8207878", g: "CTRL", lib: 42.5, dup: 63.7, asg: 47.2, pc1: -37.2, gran: 3.44 },
    { s: "CTRL_3", srr: "SRR8207879", g: "CTRL", lib: 41.1, dup: 64.3, asg: 43.4, pc1: -30.0, gran: 4.36 },
    { s: "CTRL_1", srr: "SRR8207880", g: "CTRL", lib: 46.5, dup: 79.4, asg: 45.8, pc1: -15.0, gran: 3.69 },
    { s: "T24h_5", srr: "SRR8207886", g: "T24h", lib: 43.9, dup: 43.5, asg: 37.8, pc1: 63.2, gran: 4.34 },
    { s: "T24h_4", srr: "SRR8207887", g: "T24h", lib: 44.1, dup: 43.9, asg: 34.2, pc1: 60.6, gran: 4.05 },
    { s: "T24h_3", srr: "SRR8207888", g: "T24h", lib: 42.1, dup: 42.7, asg: 34.8, pc1: 45.8, gran: 3.83 },
    { s: "T24h_2", srr: "SRR8207889", g: "T24h", lib: 41.7, dup: 38.1, asg: 32.9, pc1: 36.2, gran: 4.30 },
    { s: "T24h_1", srr: "SRR8207890", g: "T24h", lib: 44.8, dup: 42.5, asg: 33.5, pc1: 55.0, gran: 3.46 },
    { s: "D7_6", srr: "SRR8207881", g: "D7", lib: 43.4, dup: 55.9, asg: 41.1, pc1: -9.7, gran: 5.10 },
    { s: "D7_4", srr: "SRR8207882", g: "D7", lib: 50.7, dup: 83.0, asg: 46.0, pc1: -71.7, gran: 4.22 },
    { s: "D7_3", srr: "SRR8207883", g: "D7", lib: 41.5, dup: 73.1, asg: 43.7, pc1: -14.7, gran: 5.79 },
    { s: "D7_2", srr: "SRR8207884", g: "D7", lib: 43.6, dup: 59.3, asg: 45.6, pc1: -5.3, gran: 3.97 },
    { s: "D7_1", srr: "SRR8207885", g: "D7", lib: 45.2, dup: 55.0, asg: 43.9, pc1: 17.3, gran: 5.08 }
  ];

  /* ---------- Hero chart: DEGs default vs RUVg (log scale) ---------- */
  (function drawDeg() {
    const svg = $("#degchart"); if (!svg) return;
    const x0 = 112, x1 = 404, lo = 1, hi = 4, sx = (v) => x0 + ((Math.log10(Math.max(v, 10)) - lo) / (hi - lo)) * (x1 - x0);
    let h = "";
    [10, 100, 1000, 10000].forEach((v) => {
      h += `<line class="grid" x1="${sx(v)}" x2="${sx(v)}" y1="10" y2="206"/><text class="tick" x="${sx(v)}" y="224" text-anchor="middle">${fmt(v)}</text>`;
    });
    contrasts.forEach((c, i) => {
      const y = 30 + i * 66;
      h += `<text class="lbl" x="0" y="${y + 6}">${c.l1}</text><text x="0" y="${y + 22}">${c.l2}</text>`;
      [["def", methods[0].v[i][0], y - 6], ["ruv", methods[1].v[i][0], y + 16]].forEach(([k, v, yy]) => {
        const w = sx(v) - x0;
        h += `<rect class="b-${k}" x="${x0}" y="${yy - 8}" width="${w}" height="15" rx="3"/>`;
        h += `<text class="v v-${k}" x="${x0 + w + 6}" y="${yy + 4}">${fmt(v)}</text>`;
      });
    });
    svg.innerHTML = h;
  })();

  /* ---------- Sample table (sortable) ---------- */
  const tbody = $("#sampleTbl tbody");
  const cols = ["srr", "s", "g", "dup", "asg", "pc1", "gran"];
  let rows = samples.slice();
  const renderSamples = () => {
    tbody.innerHTML = rows.map((r) => `<tr><td><a href="https://www.ncbi.nlm.nih.gov/sra/${r.srr}" target="_blank" rel="noopener"><code>${r.srr}</code></a></td><td>${r.s}</td><td><span class="gdot ${r.g}"></span>${r.g}</td><td class="r">${r.dup.toFixed(1)}</td><td class="r">${r.asg.toFixed(1)}</td><td class="r">${r.pc1.toFixed(1)}</td><td class="r">${r.gran.toFixed(2)}</td></tr>`).join("");
  };
  renderSamples();
  $$("#sampleTbl th.sortable").forEach((th, idx) => {
    th.tabIndex = 0;
    const go = () => {
      const k = cols[idx], num = th.dataset.t === "n";
      const dir = th.getAttribute("aria-sort") === "ascending" ? -1 : 1;
      $$("#sampleTbl th.sortable").forEach((x) => x.removeAttribute("aria-sort"));
      th.setAttribute("aria-sort", dir === 1 ? "ascending" : "descending");
      rows.sort((a, b) => (num ? a[k] - b[k] : String(a[k]).localeCompare(String(b[k]))) * dir);
      renderSamples();
    };
    th.addEventListener("click", go);
    th.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
  });

  /* ---------- Scatter: PC1 vs QC metric ---------- */
  const metrics = {
    dup: { lab: "FastQC duplication (%)", r: "r = −0.905 · p < 10⁻⁴", sig: true },
    asg: { lab: "Read pairs assigned to genes (%)", r: "r = −0.848 · p = 0.0001", sig: true },
    lib: { lab: "Library size (M read pairs)", r: "r = −0.261 · p = 0.35", sig: false }
  };
  function drawScatter(m) {
    const svg = $("#scatter"); if (!svg) return;
    const X0 = 52, X1 = 425, Y0 = 18, Y1 = 250;
    const xs = samples.map((d) => d.pc1), ys = samples.map((d) => d[m]);
    const ymin = Math.floor(Math.min(...ys) - 2), ymax = Math.ceil(Math.max(...ys) + 2);
    const sx = (v) => X0 + ((v + 80) / 160) * (X1 - X0), sy = (v) => Y1 - ((v - ymin) / (ymax - ymin)) * (Y1 - Y0);
    let h = "";
    [-75, -50, -25, 0, 25, 50, 75].forEach((v) => { h += `<line class="grid" x1="${sx(v)}" x2="${sx(v)}" y1="${Y0}" y2="${Y1}"/><text x="${sx(v)}" y="${Y1 + 16}" text-anchor="middle">${v}</text>`; });
    const step = (ymax - ymin) > 20 ? 10 : 2;
    for (let v = Math.ceil(ymin / step) * step; v <= ymax; v += step) h += `<line class="grid" x1="${X0}" x2="${X1}" y1="${sy(v)}" y2="${sy(v)}"/><text x="${X0 - 6}" y="${sy(v) + 3.5}" text-anchor="end">${v}</text>`;
    const n = xs.length, mx = xs.reduce((a, b) => a + b) / n, my = ys.reduce((a, b) => a + b) / n;
    const b = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0) / xs.reduce((s, x) => s + (x - mx) ** 2, 0), a = my - b * mx;
    h += `<line class="fit" x1="${sx(-78)}" y1="${sy(a + b * -78)}" x2="${sx(78)}" y2="${sy(a + b * 78)}"/>`;
    samples.forEach((d) => { h += `<circle class="pt-${d.g}" cx="${sx(d.pc1)}" cy="${sy(d[m])}" r="6.5"><title>${d.s} · PC1 ${d.pc1} · ${d[m]}</title></circle>`; });
    h += `<text class="axt" x="${(X0 + X1) / 2}" y="${Y1 + 36}" text-anchor="middle">PC1 (48.1% of variance)</text>`;
    h += `<text class="axt" transform="translate(12 ${(Y0 + Y1) / 2}) rotate(-90)" text-anchor="middle">${metrics[m].lab}</text>`;
    svg.innerHTML = h;
    const badge = $("#rBadge"); badge.textContent = metrics[m].r; badge.classList.toggle("ns", !metrics[m].sig);
  }
  $$("#metricSeg button").forEach((b) => b.addEventListener("click", () => {
    $$("#metricSeg button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    drawScatter(b.dataset.m);
  }));
  drawScatter("dup");

  /* ---------- Sensitivity bars ---------- */
  const seg = $("#methodSeg"), sens = $("#sens");
  seg.innerHTML = methods.map((m, k) => `<button type="button" data-k="${k}" aria-pressed="${k === 0}">${m.name}</button>`).join("");
  const lw = (v) => (v <= 0 ? 0 : (Math.log10(v + 1) / Math.log10(10001)) * 100);
  function showMethod(k) {
    const m = methods[k];
    $$("button", seg).forEach((b, j) => b.setAttribute("aria-pressed", String(j === k)));
    sens.innerHTML = contrasts.map((c, i) => {
      const [tot, up, dn] = m.v[i], w = lw(tot);
      const def = methods[0].v[i][0], delta = k === 0 ? "" : ` · ${tot >= def ? "+" : "−"}${Math.abs(Math.round((1 - tot / def) * 1000) / 10)}% vs. default`;
      return `<div class="sens-row"><span class="nm">${c.l1}</span><span class="track" title="${fmt(up)} up, ${fmt(dn)} down"><i class="up" style="width:${(w * up) / tot}%"></i><i class="dn" style="width:${(w * dn) / tot}%"></i></span><span class="v">${fmt(tot)}</span></div><div class="small muted" style="margin:-.55rem 0 0 132px">${fmt(up)} up · ${fmt(dn)} down${delta}</div>`;
    }).join("");
  }
  seg.addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) showMethod(+b.dataset.k); });
  showMethod(0);

  /* ---------- Pipeline stepper ---------- */
  const stages = [
    { id: "1", cls: "m1", t: "Data acquisition", d: "Retrieves raw paired-end FASTQ files from the NCBI Sequence Read Archive with the SRA Toolkit (prefetch, fasterq-dump --split-3), giving a reproducible starting point traceable to a public accession.", i: "SRR8207876–SRR8207890", o: "30 FASTQ files (~98 GB)" },
    { id: "2", cls: "m2", t: "Quality control", d: "Per-sample read-quality inspection with FastQC on all 30 files, aggregated into one MultiQC dashboard so duplication, GC content and adapter contamination can be compared across samples before alignment.", i: "30 FASTQ files", o: "MultiQC report" },
    { id: "3", cls: "m3", t: "Genome alignment", d: "Aligns reads to GRCh38 with HISAT2 in splice-aware mode (--dta) to handle exon–exon junction reads; BAMs are coordinate-sorted and indexed with SAMtools (sort -m 512M -@ 2) to keep memory low.", i: "FASTQ + GRCh38 index", o: "sorted, indexed BAM" },
    { id: "4", cls: "m4", t: "Quantification", d: "Counts read pairs that map unambiguously to GENCODE v44 gene models with featureCounts (-s 0 -p -B -C). Strandedness was tested empirically: -s 2 assigned only 34% of read pairs, so -s 0 was kept. Pre-filter: ≥ 10 counts in ≥ 5 of 15 samples.", i: "BAM + GENCODE v44 GTF", o: "23,995 × 15 count matrix" },
    { id: "5", cls: "m5", t: "RUVg correction", hl: "key step", d: "Builds a log-CPM matrix restricted to 21 canonical housekeeping genes and takes its top k = 2 right singular vectors (W1, W2) as surrogates for technical variation. These enter the DESeq2 design as covariates.", i: "count matrix, 21 housekeeping genes", o: "latent factors W1, W2" },
    { id: "6", cls: "m1", t: "Differential expression", d: "Fits pydeseq2 in parallel under the default (~condition) and RUVg-adjusted (~W1 + W2 + condition) designs, with apeglm shrinkage and Benjamini–Hochberg FDR applied uniformly so DEG counts compare across normalizations.", i: "counts + W1, W2", o: "DEG lists for 3 contrasts × 2 designs" },
    { id: "7", cls: "m3", t: "Functional enrichment", d: "KEGG and GO Biological-Process over-representation and pre-ranked GSEA through the Enrichr web service (gseapy client), with ranking r = sign(log2FC) · (−log10 p).", i: "DEG lists, ranked genes", o: "enriched pathways and GO terms" }
  ];
  const stepsEl = $("#steps"), panel = $("#stepPanel");
  stepsEl.innerHTML = stages.map((m, k) => `<button class="step-btn" type="button" role="tab" aria-selected="${k === 0}" data-k="${k}"><span class="m ${m.cls}">${m.id}</span><span class="t">${m.t}</span><span class="h">${m.hl || ""}</span></button>`).join("");
  function showStep(k) {
    const m = stages[k];
    $$(".step-btn", stepsEl).forEach((b, j) => b.setAttribute("aria-selected", String(j === k)));
    panel.innerHTML = `<h4>Stage ${m.id} · ${m.t}</h4>${m.hl ? `<span class="hitl-flag">● Distinguishes this pipeline from a default DESeq2 workflow</span>` : ""}<p style="color:var(--ink-2)">${m.d}</p><div class="io"><div class="in"><b>Input</b>${m.i}</div><div class="out"><b>Output</b>${m.o}</div></div>`;
  }
  stepsEl.addEventListener("click", (e) => { const b = e.target.closest(".step-btn"); if (b) showStep(+b.dataset.k); });
  stepsEl.addEventListener("keydown", (e) => {
    if (!["ArrowDown", "ArrowUp"].includes(e.key)) return;
    e.preventDefault();
    const cur = $$(".step-btn", stepsEl).findIndex((b) => b.getAttribute("aria-selected") === "true");
    const n = (cur + (e.key === "ArrowDown" ? 1 : -1) + stages.length) % stages.length;
    showStep(n); $$(".step-btn", stepsEl)[n].focus();
  });
  showStep(0);

  /* ---------- Citation copy ---------- */
  $("#copyBtn").addEventListener("click", (e) => {
    const btn = e.currentTarget, bib = $("#bibtex");
    const done = (msg) => { btn.textContent = msg; setTimeout(() => (btn.textContent = "Copy"), 1600); };
    const fallback = () => { const r = document.createRange(); r.selectNodeContents(bib); const s = getSelection(); s.removeAllRanges(); s.addRange(r); done("Selected, press Ctrl+C"); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(bib.textContent).then(() => done("Copied"), fallback);
    else fallback();
  });

  /* ---------- Lightbox ---------- */
  const lb = $("#lightbox");
  document.addEventListener("click", (e) => {
    const p = e.target.closest("[data-zoom]");
    if (!p || !lb || !lb.showModal) return;
    $("#lbImg").src = p.dataset.zoom;
    $("#lbImg").alt = p.dataset.cap || "";
    $("#lbCap").textContent = p.dataset.cap || "";
    lb.showModal();
  });
  $("#lbClose").addEventListener("click", () => lb.close());
  lb.addEventListener("click", (e) => { if (e.target === lb) lb.close(); });

  /* ---------- Active nav link ---------- */
  const links = $$(".nav-links a");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        links.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + en.target.id));
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    ["abstract", "dataset", "pipeline", "qc", "de", "sensitivity", "enrichment", "discussion", "citation"].forEach((id) => { const el = document.getElementById(id); if (el) io.observe(el); });
  }
})();
