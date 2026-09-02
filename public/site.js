/* Oddversity client runtime.
   Four small features, no dependencies, no backend:
     1. ⌘K search over a static JSON index (fetched on first open)
     2. Copy buttons on code blocks
     3. Local progress: completion, bookmarks, recent history, "resume", and the /saved page
     4. Sidebar filter for long track contents
   Everything degrades to plain HTML if JS is off or storage is blocked. */
(function () {
  'use strict';

  /* ---------------------------------------------------------------- storage */
  var PKEY = 'fg-progress';
  var LKEY = 'fg-last';
  function read(key, fallback) {
    try { var v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
    catch (e) { return fallback; }
  }
  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
  }

  /* ----------------------------------------------------------------- search */
  var dialog = document.querySelector('[data-search-dialog]');
  var input = document.querySelector('[data-search-input]');
  var results = document.querySelector('[data-search-results]');
  var countEl = document.querySelector('[data-search-count]');
  var index = null;
  var loading = false;
  var active = -1;

  function loadIndex() {
    if (index || loading) return Promise.resolve(index);
    loading = true;
    return fetch('/search-index.json')
      .then(function (r) { return r.json(); })
      .then(function (data) { index = data; loading = false; return index; })
      .catch(function () { loading = false; return null; });
  }

  function score(row, terms) {
    var title = row.t.toLowerCase();
    var body = (row.s + ' ' + row.c).toLowerCase();
    var total = 0;
    var matched = 0;
    for (var i = 0; i < terms.length; i++) {
      var term = terms[i];
      var inTitle = title.indexOf(term);
      var inBody = body.indexOf(term);
      if (inTitle === -1 && inBody === -1) continue;
      matched++;
      if (inTitle === 0) total += 14;
      else if (inTitle > 0) total += title.charAt(inTitle - 1) === ' ' ? 9 : 5;
      if (inBody !== -1) total += 2;
    }
    if (matched === 0) return 0;
    // Every term matching is worth far more than one term matching well, but a
    // partial match still ranks — an exact-AND search over short records
    // silently hides the page people were looking for.
    if (matched === terms.length && terms.length > 1) total += 30;
    else total = total * (matched / terms.length);
    if (row.k === 'Guide') total += 6;
    if (row.k === 'Track') total += 4;
    return total;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function render(rows, query) {
    if (!results) return;
    if (!query) {
      results.innerHTML =
        '<p class="sempty">Try <b>chunking</b>, <b>tool calling</b>, <b>eval</b>, <b>MCP transport</b>, or a role like <b>designer</b>.</p>';
      if (countEl) countEl.textContent = index ? index.length + ' pages' : '';
      return;
    }
    if (!rows.length) {
      results.innerHTML = '<p class="sempty">No match for “' + escapeHtml(query) + '”.</p>';
      if (countEl) countEl.textContent = '0 results';
      return;
    }
    var html = '';
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      html +=
        '<a class="sresult" role="option" href="' + r.u + '">' +
        '<span class="skind mono">' + escapeHtml(r.k) + '</span>' +
        '<span class="sbody"><span class="stitle">' + escapeHtml(r.t) + '</span>' +
        '<span class="ssum">' + escapeHtml(r.s) + '</span></span>' +
        '<span class="strack mono">' + escapeHtml(r.c) + '</span></a>';
    }
    results.innerHTML = html;
    if (countEl) countEl.textContent = rows.length + (rows.length === 1 ? ' result' : ' results');
    active = -1;
  }

  function runQuery() {
    if (!input) return;
    var q = input.value.trim().toLowerCase();
    if (!q) return render([], '');
    if (!index) return;
    var terms = q.split(/\s+/).filter(Boolean);
    var scored = [];
    for (var i = 0; i < index.length; i++) {
      var s = score(index[i], terms);
      if (s > 0) scored.push([s, index[i]]);
    }
    scored.sort(function (a, b) { return b[0] - a[0]; });
    render(scored.slice(0, 30).map(function (p) { return p[1]; }), q);
  }

  function openSearch() {
    if (!dialog) return;
    dialog.hidden = false;
    document.body.style.overflow = 'hidden';
    loadIndex().then(function () { runQuery(); });
    render([], '');
    if (input) { input.value = ''; input.focus(); }
  }

  function closeSearch() {
    if (!dialog) return;
    dialog.hidden = true;
    document.body.style.overflow = '';
  }

  function moveActive(delta) {
    var items = results ? results.querySelectorAll('.sresult') : [];
    if (!items.length) return;
    if (active >= 0 && items[active]) items[active].classList.remove('is-active');
    active = (active + delta + items.length) % items.length;
    items[active].classList.add('is-active');
    items[active].scrollIntoView({ block: 'nearest' });
  }

  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-search-open]')) { e.preventDefault(); openSearch(); }
    if (e.target.closest('[data-search-close]')) closeSearch();
  });

  document.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openSearch(); return; }
    if (dialog && !dialog.hidden) {
      if (e.key === 'Escape') { closeSearch(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); moveActive(1); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); moveActive(-1); return; }
      if (e.key === 'Enter') {
        var items = results ? results.querySelectorAll('.sresult') : [];
        var target = active >= 0 ? items[active] : items[0];
        if (target) { e.preventDefault(); window.location.href = target.getAttribute('href'); }
      }
    }
    if (e.key === '/' && document.activeElement === document.body) { e.preventDefault(); openSearch(); }
  });

  if (input) {
    var timer = null;
    input.addEventListener('input', function () {
      clearTimeout(timer);
      timer = setTimeout(function () { loadIndex().then(runQuery); }, 90);
    });
  }

  /* ------------------------------------------------------------ code copy */
  var blocks = document.querySelectorAll('.prose pre');
  for (var b = 0; b < blocks.length; b++) {
    (function (pre) {
      var wrap = document.createElement('div');
      wrap.className = 'code-wrap';
      pre.parentNode.insertBefore(wrap, pre);
      wrap.appendChild(pre);
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'copy-btn mono';
      btn.textContent = 'Copy';
      btn.setAttribute('aria-label', 'Copy code to clipboard');
      btn.addEventListener('click', function () {
        var text = pre.innerText;
        var done = function () {
          btn.textContent = 'Copied';
          btn.classList.add('is-done');
          setTimeout(function () { btn.textContent = 'Copy'; btn.classList.remove('is-done'); }, 1600);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done, function () {});
        } else {
          var ta = document.createElement('textarea');
          ta.value = text; document.body.appendChild(ta); ta.select();
          try { document.execCommand('copy'); done(); } catch (e) {}
          document.body.removeChild(ta);
        }
      });
      wrap.appendChild(btn);
    })(blocks[b]);
  }

  /* -------------------------------------------------------------- progress
     Four records, all in localStorage, none ever sent anywhere:
       fg-progress   { lessonId: timestamp }        marked complete
       fg-last       { id, url, title, track }      the last lesson opened
       fg-recent     [ { id, url, title, track, ts } ]  last 15 opened, newest first
       fg-bookmarks  { lessonId: { url, title, track, ts } }
     /saved renders all four and can export/import them as one JSON blob so a
     reader can carry their place to another browser without an account. */
  var RKEY = 'fg-recent';
  var BKEY = 'fg-bookmarks';
  var progress = read(PKEY, {});
  var bookmarks = read(BKEY, {});
  var article = document.querySelector('[data-lesson]');

  function entryFor(el) {
    return {
      id: el.getAttribute('data-lesson'),
      url: window.location.pathname,
      title: el.getAttribute('data-title') || document.title,
      track: el.getAttribute('data-track-name') || el.getAttribute('data-track') || '',
      ts: Date.now()
    };
  }

  if (article) {
    var lessonId = article.getAttribute('data-lesson');
    var here = entryFor(article);
    write(LKEY, here);
    var recent = read(RKEY, []).filter(function (r) { return r && r.id !== here.id; });
    recent.unshift(here);
    write(RKEY, recent.slice(0, 15));

    var toggle = document.querySelector('[data-complete-toggle]');
    var setDone = function (done) {
      if (done) progress[lessonId] = Date.now(); else delete progress[lessonId];
      write(PKEY, progress);
      if (toggle) {
        toggle.setAttribute('aria-pressed', String(done));
        toggle.querySelector('[data-complete-label]').textContent = done ? 'Completed' : 'Mark complete';
        toggle.classList.toggle('is-done', done);
      }
    };
    if (toggle) {
      setDone(!!progress[lessonId]);
      toggle.addEventListener('click', function () { setDone(!progress[lessonId]); });
    }

    var bm = document.querySelector('[data-bookmark-toggle]');
    var setSaved = function (saved) {
      if (saved) bookmarks[lessonId] = entryFor(article); else delete bookmarks[lessonId];
      write(BKEY, bookmarks);
      if (bm) {
        bm.setAttribute('aria-pressed', String(saved));
        bm.querySelector('[data-bookmark-label]').textContent = saved ? 'Saved' : 'Save for later';
        bm.classList.toggle('is-done', saved);
      }
      updateSavedCount();
    };
    if (bm) {
      setSaved(!!bookmarks[lessonId]);
      bm.addEventListener('click', function () { setSaved(!bookmarks[lessonId]); });
    }
  }

  // Bookmark count in the top bar.
  function updateSavedCount() {
    // Read fresh: the /saved page rewrites the record before calling this.
    bookmarks = read(BKEY, {});
    var n = Object.keys(bookmarks).length;
    var badges = document.querySelectorAll('[data-saved-count]');
    for (var b = 0; b < badges.length; b++) {
      badges[b].textContent = n ? String(n) : '';
      badges[b].hidden = !n;
    }
  }
  updateSavedCount();

  // Track completion meters, wherever they appear.
  var meters = document.querySelectorAll('[data-track-progress]');
  for (var m = 0; m < meters.length; m++) {
    (function (el) {
      var id = el.getAttribute('data-track-progress');
      var total = parseInt(el.getAttribute('data-track-total') || '0', 10);
      var done = 0;
      for (var key in progress) if (progress.hasOwnProperty(key) && key.indexOf(id + '/') === 0) done++;
      if (!done || !total) return;
      var pct = Math.min(100, Math.round((done / total) * 100));
      el.hidden = false;
      var bar = el.querySelector('[data-bar]');
      var label = el.querySelector('[data-label]');
      if (bar) bar.style.width = pct + '%';
      if (label) label.textContent = done + ' / ' + total + ' done';
    })(meters[m]);
  }

  // Tick the lessons already read in a track's contents list.
  var links = document.querySelectorAll('[data-lesson-link]');
  for (var l = 0; l < links.length; l++) {
    if (progress[links[l].getAttribute('data-lesson-link')]) links[l].classList.add('is-read');
  }

  // "Pick up where you left off". A block may carry data-resume-scope="fde/"
  // to resume the newest lesson inside that part of the site only.
  var resumes = document.querySelectorAll('[data-resume]');
  for (var rs = 0; rs < resumes.length; rs++) {
    (function (box) {
      var scope = box.getAttribute('data-resume-scope');
      var last = null;
      if (scope) {
        var list = read(RKEY, []);
        for (var i = 0; i < list.length; i++) {
          if (list[i] && list[i].id && list[i].id.indexOf(scope) === 0) { last = list[i]; break; }
        }
      } else {
        last = read(LKEY, null);
      }
      if (!last || !last.url) return;
      box.hidden = false;
      var a = box.querySelector('a');
      if (a) { a.href = last.url; }
      var t = box.querySelector('[data-resume-title]');
      if (t) t.textContent = last.title;
      var tr = box.querySelector('[data-resume-track]');
      if (tr && last.track) tr.textContent = last.track;
    })(resumes[rs]);
  }

  /* ------------------------------------------------------------- /saved page */
  var savedRoot = document.querySelector('[data-saved-page]');
  if (savedRoot) {
    var tracksEl = document.querySelector('[data-saved-tracks]');
    var trackMeta = {};
    try { trackMeta = JSON.parse(tracksEl ? tracksEl.textContent : '{}'); } catch (e) {}

    function el(tag, cls, text) {
      var node = document.createElement(tag);
      if (cls) node.className = cls;
      if (text != null) node.textContent = text;
      return node;
    }
    function when(ts) {
      if (!ts) return '';
      var d = new Date(ts);
      return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
    }
    function row(entry, extra) {
      var li = el('li', 'saved-row');
      var a = el('a', 'saved-title', entry.title || entry.url);
      a.href = entry.url;
      var meta = el('span', 'saved-meta mono', (entry.track ? entry.track + ' · ' : '') + when(entry.ts));
      var body = el('span', 'saved-body');
      body.appendChild(a); body.appendChild(meta);
      li.appendChild(body);
      if (extra) li.appendChild(extra);
      return li;
    }
    function fill(container, items, emptyText, extraFor) {
      container.innerHTML = '';
      if (!items.length) { container.appendChild(el('p', 'saved-empty', emptyText)); return; }
      var ul = el('ul', 'saved-list');
      for (var i = 0; i < items.length; i++) ul.appendChild(row(items[i], extraFor ? extraFor(items[i]) : null));
      container.appendChild(ul);
    }

    function render() {
      progress = read(PKEY, {});
      bookmarks = read(BKEY, {});
      var recent = read(RKEY, []);
      var last = read(LKEY, null);

      var cont = savedRoot.querySelector('[data-saved-continue]');
      if (cont) {
        cont.innerHTML = '';
        if (last && last.url) {
          var a = el('a', 'btn btn-primary', 'Continue: ' + (last.title || last.url) + ' →');
          a.href = last.url;
          cont.appendChild(a);
          if (last.track) cont.appendChild(el('span', 'saved-meta mono', last.track));
        } else {
          cont.appendChild(el('p', 'saved-empty', 'Open any lesson and it will be waiting here.'));
        }
      }

      var bmBox = savedRoot.querySelector('[data-saved-bookmarks]');
      if (bmBox) {
        var list = [];
        for (var k in bookmarks) if (bookmarks.hasOwnProperty(k)) list.push(bookmarks[k]);
        list.sort(function (x, y) { return (y.ts || 0) - (x.ts || 0); });
        fill(bmBox, list, 'Nothing saved yet. Every lesson has a "Save for later" button under it.', function (entry) {
          var btn = el('button', 'saved-remove mono', 'Remove');
          btn.type = 'button';
          btn.addEventListener('click', function () {
            for (var id in bookmarks) if (bookmarks[id] && bookmarks[id].url === entry.url) delete bookmarks[id];
            write(BKEY, bookmarks); updateSavedCount(); render();
          });
          return btn;
        });
      }

      var rcBox = savedRoot.querySelector('[data-saved-recent]');
      if (rcBox) fill(rcBox, recent.filter(Boolean), 'No lessons opened in this browser yet.');

      var prBox = savedRoot.querySelector('[data-saved-progress]');
      if (prBox) {
        prBox.innerHTML = '';
        var counts = {};
        for (var key in progress) {
          if (!progress.hasOwnProperty(key)) continue;
          for (var tid in trackMeta) {
            if (key.indexOf(tid + '/') === 0) { counts[tid] = (counts[tid] || 0) + 1; }
          }
        }
        var ids = Object.keys(counts).sort(function (x, y) { return counts[y] - counts[x]; });
        if (!ids.length) { prBox.appendChild(el('p', 'saved-empty', 'Mark a lesson complete and its track shows up here with a meter.')); }
        else {
          var ul = el('ul', 'saved-list');
          for (var i = 0; i < ids.length; i++) {
            var meta = trackMeta[ids[i]];
            var li = el('li', 'saved-row');
            var body = el('span', 'saved-body');
            var a2 = el('a', 'saved-title', meta.name); a2.href = meta.url;
            var pct = Math.min(100, Math.round((counts[ids[i]] / meta.total) * 100));
            var meter = el('span', 'meter');
            var rail = el('span', 'meter-rail'); var fillBar = el('span', 'meter-fill'); fillBar.style.width = pct + '%';
            rail.appendChild(fillBar); meter.appendChild(rail);
            meter.appendChild(el('span', 'meter-label', counts[ids[i]] + ' / ' + meta.total + ' done'));
            body.appendChild(a2); body.appendChild(meter);
            li.appendChild(body); ul.appendChild(li);
          }
          prBox.appendChild(ul);
        }
      }

      var ex = savedRoot.querySelector('[data-saved-export]');
      if (ex) ex.value = JSON.stringify({ 'fg-progress': progress, 'fg-bookmarks': bookmarks, 'fg-recent': recent, 'fg-last': last }, null, 0);
    }

    var copyBtn = savedRoot.querySelector('[data-saved-copy]');
    var ex2 = savedRoot.querySelector('[data-saved-export]');
    if (copyBtn && ex2) copyBtn.addEventListener('click', function () {
      var done = function () { copyBtn.textContent = 'Copied'; setTimeout(function () { copyBtn.textContent = 'Copy'; }, 1500); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(ex2.value).then(done, function () { ex2.select(); });
      else { ex2.select(); try { document.execCommand('copy'); done(); } catch (e) {} }
    });

    var importBtn = savedRoot.querySelector('[data-saved-import]');
    var importBox = savedRoot.querySelector('[data-saved-import-box]');
    var importMsg = savedRoot.querySelector('[data-saved-import-msg]');
    if (importBtn && importBox) importBtn.addEventListener('click', function () {
      var data;
      try { data = JSON.parse(importBox.value); } catch (e) { if (importMsg) importMsg.textContent = 'That is not valid JSON.'; return; }
      if (!data || typeof data !== 'object') { if (importMsg) importMsg.textContent = 'Nothing usable in that text.'; return; }
      var merged = 0;
      if (data['fg-progress'] && typeof data['fg-progress'] === 'object') {
        var cur = read(PKEY, {});
        for (var k in data['fg-progress']) if (typeof data['fg-progress'][k] === 'number') { cur[k] = data['fg-progress'][k]; merged++; }
        write(PKEY, cur);
      }
      if (data['fg-bookmarks'] && typeof data['fg-bookmarks'] === 'object') {
        var curB = read(BKEY, {});
        for (var kb in data['fg-bookmarks']) { var v = data['fg-bookmarks'][kb]; if (v && typeof v.url === 'string' && v.url.charAt(0) === '/') { curB[kb] = v; merged++; } }
        write(BKEY, curB);
      }
      if (Array.isArray(data['fg-recent'])) {
        var curR = read(RKEY, []);
        var seen = {};
        var out = [];
        var all = data['fg-recent'].concat(curR).filter(function (r) { return r && typeof r.url === 'string' && r.url.charAt(0) === '/'; });
        all.sort(function (x, y) { return (y.ts || 0) - (x.ts || 0); });
        for (var i = 0; i < all.length; i++) { if (!seen[all[i].id]) { seen[all[i].id] = 1; out.push(all[i]); } }
        write(RKEY, out.slice(0, 15));
      }
      if (data['fg-last'] && data['fg-last'].url && typeof data['fg-last'].url === 'string' && data['fg-last'].url.charAt(0) === '/' && !read(LKEY, null)) write(LKEY, data['fg-last']);
      if (importMsg) importMsg.textContent = 'Imported ' + merged + ' record' + (merged === 1 ? '' : 's') + '. Existing ones were kept.';
      importBox.value = '';
      updateSavedCount();
      render();
    });

    var clearBtn = savedRoot.querySelector('[data-saved-clear]');
    if (clearBtn) {
      var armed = false;
      clearBtn.addEventListener('click', function () {
        if (!armed) { armed = true; clearBtn.textContent = 'Click again to erase everything'; setTimeout(function () { armed = false; clearBtn.textContent = 'Clear all saved data'; }, 4000); return; }
        try { localStorage.removeItem(PKEY); localStorage.removeItem(LKEY); localStorage.removeItem(RKEY); localStorage.removeItem(BKEY); } catch (e) {}
        armed = false; clearBtn.textContent = 'Clear all saved data';
        updateSavedCount(); render();
      });
    }

    render();
  }

  /* -------------------------------------------------------- sidebar filter */
  var filter = document.querySelector('[data-side-filter]');
  if (filter) {
    // Remember which modules the reader had open, so clearing the filter puts
    // the sidebar back the way they left it rather than fully expanded.
    var openedByFilter = [];
    filter.addEventListener('input', function () {
      var q = filter.value.trim().toLowerCase();
      var details = document.querySelectorAll('details[data-side-group]');
      var d;
      if (q) {
        for (d = 0; d < details.length; d++) {
          if (!details[d].open) {
            details[d].open = true;
            if (openedByFilter.indexOf(details[d]) === -1) openedByFilter.push(details[d]);
          }
        }
      } else {
        for (d = 0; d < openedByFilter.length; d++) openedByFilter[d].open = false;
        openedByFilter = [];
      }
      var items = document.querySelectorAll('[data-side-item]');
      var shown = 0;
      for (var i = 0; i < items.length; i++) {
        var match = !q || items[i].textContent.toLowerCase().indexOf(q) !== -1;
        items[i].hidden = !match;
        if (match) shown++;
      }
      var groups = document.querySelectorAll('[data-side-group]');
      for (var g = 0; g < groups.length; g++) {
        var visible = groups[g].querySelectorAll('[data-side-item]:not([hidden])').length;
        groups[g].hidden = visible === 0;
      }
      var empty = document.querySelector('[data-side-empty]');
      if (empty) empty.hidden = shown !== 0;
    });
  }

  /* --------------------------------------------- catalog filter + facets
     Text filter and facet chips run through one apply(), and the selection is
     mirrored into the URL hash so a filtered catalog can be linked and shared. */
  var catalog = document.querySelector('[data-catalog-filter]');
  var facetRoot = document.querySelector('[data-facets]');

  if (catalog || facetRoot) {
    var chips = facetRoot ? facetRoot.querySelectorAll('.facet[data-facet]') : [];
    var clearBtn = document.querySelector('[data-facet-clear]');
    var statusEl = document.querySelector('[data-facet-status]');

    var selected = function () {
      var out = { level: [], group: [], flag: [] };
      for (var i = 0; i < chips.length; i++) {
        if (chips[i].getAttribute('aria-pressed') === 'true') {
          out[chips[i].getAttribute('data-facet')].push(chips[i].getAttribute('data-value'));
        }
      }
      return out;
    };

    var matchesFacets = function (card, sel) {
      if (sel.level.length && sel.level.indexOf(card.getAttribute('data-level')) === -1) return false;
      if (sel.group.length && sel.group.indexOf(card.getAttribute('data-group')) === -1) return false;
      if (sel.flag.length) {
        var flags = (card.getAttribute('data-flags') || '').split(' ');
        for (var i = 0; i < sel.flag.length; i++) {
          if (flags.indexOf(sel.flag[i]) === -1) return false;
        }
      }
      return true;
    };

    var writeHash = function (q, sel) {
      var parts = [];
      if (q) parts.push('q=' + encodeURIComponent(q));
      ['level', 'group', 'flag'].forEach(function (key) {
        if (sel[key].length) parts.push(key + '=' + sel[key].join(','));
      });
      var hash = parts.length ? '#' + parts.join('&') : ' ';
      if (history.replaceState) history.replaceState(null, '', hash === ' ' ? location.pathname : hash);
    };

    var apply = function (updateHash) {
      var q = catalog ? catalog.value.trim().toLowerCase() : '';
      var sel = selected();
      var cards = document.querySelectorAll('[data-catalog-card]');
      var shown = 0;
      for (var i = 0; i < cards.length; i++) {
        var hay = cards[i].getAttribute('data-search') || cards[i].textContent;
        var match = (!q || hay.toLowerCase().indexOf(q) !== -1) && matchesFacets(cards[i], sel);
        cards[i].hidden = !match;
        if (match) shown++;
      }
      var sections = document.querySelectorAll('[data-catalog-group]');
      for (var s = 0; s < sections.length; s++) {
        sections[s].hidden = sections[s].querySelectorAll('[data-catalog-card]:not([hidden])').length === 0;
      }
      var none = document.querySelector('[data-catalog-empty]');
      if (none) none.hidden = shown !== 0;

      var active = sel.level.length + sel.group.length + sel.flag.length + (q ? 1 : 0);
      if (clearBtn) clearBtn.hidden = active === 0;
      if (statusEl) {
        statusEl.hidden = active === 0;
        statusEl.textContent = shown + (shown === 1 ? ' track' : ' tracks') + ' of ' + cards.length;
      }
      if (updateHash !== false) writeHash(q, sel);
    };

    for (var c = 0; c < chips.length; c++) {
      chips[c].addEventListener('click', function () {
        this.setAttribute('aria-pressed', this.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
        apply();
      });
    }
    if (clearBtn) clearBtn.addEventListener('click', function () {
      for (var i = 0; i < chips.length; i++) chips[i].setAttribute('aria-pressed', 'false');
      if (catalog) catalog.value = '';
      apply();
    });
    if (catalog) catalog.addEventListener('input', function () { apply(); });

    // Restore a linked filter state.
    if (location.hash.length > 1) {
      var params = location.hash.slice(1).split('&');
      for (var h = 0; h < params.length; h++) {
        var pair = params[h].split('=');
        if (pair[0] === 'q' && catalog) catalog.value = decodeURIComponent(pair[1] || '');
        else if (['level', 'group', 'flag'].indexOf(pair[0]) !== -1) {
          var values = (pair[1] || '').split(',');
          for (var k = 0; k < chips.length; k++) {
            if (chips[k].getAttribute('data-facet') === pair[0] && values.indexOf(chips[k].getAttribute('data-value')) !== -1) {
              chips[k].setAttribute('aria-pressed', 'true');
            }
          }
        }
      }
      apply(false);
    }
  }
})();
