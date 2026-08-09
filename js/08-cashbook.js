        function pageCashbook() {
            // Auto-archive on first Monday
            autoArchive();

            // Compute balances from all entries (including archived)
            const bal = computeCashBalances();
            const generalCash = bal.generalCash,
                pettyCash = bal.pettyCash,
                bankBal = bal.bankBal,
                cardBal = bal.cardBal,
                companyBal = bal.companyBal;

            let h =
                ``;

            // Conditionally build the cards: General, Petty, Total Cash, and Bank/Card/Company (admin only)
            let cardsHtml = `
                <div class="grid-3" style="margin-bottom:20px;">
                    <div class="card">
                        <div class="card-label">General Cash</div>
                        <div class="card-value teal-t">${PKR(generalCash)}</div>
                        <div class="card-sub">Physical cash on hand</div>
                    </div>
                    <div class="card">
                        <div class="card-label">Petty Cash</div>
                        <div class="card-value teal-t">${PKR(pettyCash)}</div>
                        <div class="card-sub">Small expenses fund</div>
                    </div>
            `;
            if (adminUnlocked) {
                cardsHtml += `
                    <div class="card">
                        <div class="card-label">Bank Balance</div>
                        <div class="card-value">${PKR(bankBal)}</div>
                        <div class="card-sub">In bank account</div>
                    </div>
                    <div class="card">
                        <div class="card-label">Credit Card</div>
                        <div class="card-value">${PKR(cardBal)}</div>
                        <div class="card-sub">Pending card settlements</div>
                    </div>
                    <div class="card">
                        <div class="card-label">Company Accounts</div>
                        <div class="card-value">${PKR(companyBal)}</div>
                        <div class="card-sub">Owed by corporate accounts</div>
                    </div>
                `;
            }
            const totalCash = generalCash + pettyCash;
            cardsHtml += `
                    <div class="card">
                        <div class="card-label">Total Cash on Hand</div>
                        <div class="card-value gold-t">${PKR(totalCash)}</div>
                        <div class="card-sub">General + Petty</div>
                    </div>
                </div>
            `;
            h += cardsHtml;

            // Action bar: Add Cash Entry + Replenish + Transfer + Verify (admin only)
            h +=
                `<div class="flex flex-between gap-12" style="margin-bottom:12px;flex-wrap:wrap;"><input style="max-width:300px;" id="cb-search" placeholder="Search entries by note or category..." value="${esc(cbSearch)}" oninput="onCbSearch(this.value)"><button class="btn btn-gold" onclick="openCashEntry()"><ion-icon name="add"></ion-icon> Add Cash Book Entry</button>`;
            if (adminUnlocked) {
                h +=
                    `<button class="btn btn-primary" onclick="openExpenseReport()" style="background:var(--coral);border-color:var(--coral);color:#fff;"><ion-icon name="reader"></ion-icon> Expense Report (CSV)</button>`;
                h +=
                    `<button class="btn btn-primary" onclick="openReplenishPettyCash()" style="background:var(--purple);border-color:var(--purple);color:#fff;"><ion-icon name="sync-circle"></ion-icon> Replenish Petty Cash</button>`;
                h +=
                    `<button class="btn btn-primary" onclick="openTransferToBank()" style="background:var(--teal);border-color:var(--teal);color:#fff;"><ion-icon name="business"></ion-icon> Transfer to Bank</button>`;
                h +=
                    `<button class="btn btn-primary" onclick="openReconcileCash()" style="background:var(--gold-dark);border-color:var(--gold-dark);color:#fff;"><ion-icon name="cash"></ion-icon> Reconcile Cash</button>`;
                h +=
                    `<button class="btn btn-primary" onclick="openPreviousMonthsModal()" style="background:var(--gold);border-color:var(--gold-dark);color:var(--navy);"><ion-icon name="document-attach"></ion-icon> Access Previous Months</button>`;
                h +=
                    `<button class="btn btn-primary" onclick="openManageSubcategories()" style="background:var(--navy);border-color:var(--navy);color:#fff;"><ion-icon name="create"></ion-icon> Edit Subcategories</button>`;
            }
            h += `</div>`;

            // Filter row
            const filterCats = getCashCategories();
            let catFilterOpts = '<option value="">All categories</option>' +
                filterCats.map(c => `<option value="${esc(c.label)}" ${cbFilterCat===c.label?'selected':''}>${esc(c.label)}</option>`).join('');
            let methodFilterOpts = '<option value="">All accounts</option>' +
                PAYMENT_METHOD_OPTIONS.map(m => `<option value="${m.value}" ${cbFilterMethod===m.value?'selected':''}>${m.label}</option>`).join('');
            h +=
                `<div class="flex gap-12" style="margin-bottom:16px;flex-wrap:wrap;align-items:center;">` +
                `<select style="max-width:220px;" onchange="setCbFilterCat(this.value)">${catFilterOpts}</select>` +
                `<select style="max-width:180px;" onchange="setCbFilterMethod(this.value)">${methodFilterOpts}</select>` +
                `<select style="max-width:150px;" onchange="setCbFilterDir(this.value)"><option value="">In &amp; Out</option><option value="in" ${cbFilterDir==='in'?'selected':''}>Money In</option><option value="out" ${cbFilterDir==='out'?'selected':''}>Money Out</option></select>` +
                (cbSearch || cbFilterCat || cbFilterMethod || cbFilterDir ? `<button class="btn btn-sm" onclick="clearCbFilters()"><ion-icon name="close"></ion-icon> Clear filters</button>` : '') +
                `</div>`;

            // Current month entries
            const currentMonth = getCurrentMonth();
            const currentEntries = getCurrentMonthEntries();
            const archivedMonths = getArchivedMonths();

            // Compute opening balance from archived entries (all entries before current month)
            let openingBalance = 0;
            cashbook.forEach(e => {
                const em = getMonthFromDate(e.date);
                if (e.archived || (em !== currentMonth && !e.archived)) {
                    openingBalance += e.dir === 'in' ? e.amount : -e.amount;
                }
            });

            // Show current month entries with running balance
            const anyFilterActive = !!(cbSearch || cbFilterCat || cbFilterMethod || cbFilterDir);
            function matchesCbFilters(e) {
                if (cbFilterCat && e.catLabel !== cbFilterCat) return false;
                if (cbFilterMethod && e.method !== cbFilterMethod) return false;
                if (cbFilterDir && e.dir !== cbFilterDir) return false;
                if (cbSearch) {
                    const q = cbSearch.toLowerCase();
                    const hay = ((e.desc || '') + ' ' + (e.catLabel || '')).toLowerCase();
                    if (hay.indexOf(q) < 0) return false;
                }
                return true;
            }
            if (currentEntries.length === 0 && archivedMonths.length === 0 && cashbook.length === 0) {
                h += `<div class="panel"><div class="panel-body">${emptyState('<ion-icon name="wallet"></ion-icon>','Your cash book is empty','Click "+ Add Cash Book Entry" to record your first money in or out.')}</div></div>`;
            } else {
                // Current month table
                if (currentEntries.length > 0) {
                    const matchCount = currentEntries.filter(matchesCbFilters).length;
                    h +=
                        `<div class="panel panel-0" style="margin-bottom:16px;"><div class="panel-head"><div class="sec-title" style="margin-bottom:0;"><span class="ic"><ion-icon name="calendar"></ion-icon></span>Current Month (${currentMonth})${anyFilterActive?` <span class="text-muted" style="font-size:12px;font-weight:400;">— showing ${matchCount} of ${currentEntries.length}</span>`:''}</div></div>`;
                    h += `<div class="tbl-wrap"><table><thead><tr><th>Date</th><th>Ref</th><th>Note</th><th>Category</th><th>Money In</th><th>Money Out</th><th>Balance</th><th style="min-width:100px;">Actions</th></tr></thead><tbody>`;
                    let run = openingBalance;
                    // Sort by date then seq
                    const sortedCurrent = currentEntries.slice().sort((a, b) => {
                        if (a.date !== b.date) return a.date < b.date ? -1 : 1;
                        return a.seq - b.seq;
                    });
                    let anyRowRendered = false;
                    sortedCurrent.forEach(e => {
                        run += e.dir === 'in' ? e.amount : -e.amount;
                        if (!matchesCbFilters(e)) return; // still counted toward true running balance above, just hidden
                        anyRowRendered = true;
                        const isOld = isOlderThanWeek(e.date);
                        const canEdit = adminUnlocked || !isOld;
                        const editDisabled = !canEdit ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : '';
                        const deleteDisabled = !canEdit ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : '';
                        const accountLabel = methodLabel(e.method, e.cashType);
                        const isReplenish = e.catLabel === 'Transfer to Petty Cash' || e.catLabel ===
                            'Transfer from General Cash';
                        const isTransfer = e.catLabel === 'Transfer to Bank' || e.catLabel === 'Transfer from Bank';
                        let badge = '';
                        if (isReplenish) badge = `<span class="replenish-badge"><ion-icon name="reload"></ion-icon> transfer</span>`;
                        if (isTransfer) badge = `<span class="transfer-badge"><ion-icon name="business"></ion-icon> bank</span>`;
                        h +=
                            `<tr><td class="text-secondary">${esc(e.date)}</td><td class="mono text-muted" style="font-size:11px;">${esc(e.ref)}</td><td>${esc(e.desc||'-')} ${badge}</td><td><span style="background:var(--surface-2);padding:2px 10px;border-radius:4px;font-size:12px;">${esc(e.catLabel)}</span> <span class="text-muted" style="font-size:10px;">${accountLabel}</span></td><td class="teal-t" style="font-weight:600;">${e.dir==='in'?PKR(e.amount):''}</td><td class="coral-t" style="font-weight:600;">${e.dir==='out'?PKR(e.amount):''}</td><td style="font-weight:600;">${PKR(run)}</td>
                            <td><div class="flex gap-8"><button class="btn btn-sm btn-teal" onclick="openEditCashEntry('${e.id}')" ${editDisabled}><ion-icon name="create"></ion-icon></button><button class="btn btn-sm btn-danger" onclick="deleteCashEntry('${e.id}')" ${deleteDisabled}><ion-icon name="close"></ion-icon></button></div></td></tr>`;
                    });
                    if (!anyRowRendered) {
                        h += `<tr><td colspan="8" class="text-muted" style="text-align:center;padding:20px;">No entries match your filters.</td></tr>`;
                    }
                    h += `</tbody></table></div></div>`;
                } else {
                    h +=
                        `<div class="panel" style="margin-bottom:16px;"><div class="panel-body"><div class="text-secondary" style="font-size:13px;">No entries for current month (${currentMonth}).</div></div></div>`;
                }

                // Archived months table
                if (archivedMonths.length > 0) {
                    h +=
                        `<div class="panel panel-0"><div class="panel-head"><div class="sec-title" style="margin-bottom:0;"><span class="ic"><ion-icon name="calendar"></ion-icon></span>Archived Months</div></div>`;
                    h += `<div class="tbl-wrap"><table><thead><tr><th>Month</th><th>Verified</th><th>Verified By</th></tr></thead><tbody>`;
                    archivedMonths.forEach(month => {
                        const info = archivedCashbooks[month] || { verified: false, verifiedBy: '' };
                        const verifiedBadge = info.verified ?
                            `<span class="verified-badge"><ion-icon name="checkmark-circle"></ion-icon> Verified</span>` :
                            `<span class="unverified-badge"><ion-icon name="hourglass"></ion-icon> Pending</span>`;
                        const verifiedBy = info.verified ? (info.verifiedBy || '—') : '—';
                        h +=
                            `<tr><td style="font-weight:600;">${esc(month)}</td><td>${verifiedBadge}</td><td>${esc(verifiedBy)}</td></tr>`;
                    });
                    h += `</tbody></table></div></div>`;
                }
            }

            h +=
                ``;
            return h;
        }

        // ─── PREVIOUS MONTHS (view + verify) ───────────────────
        function monthSortKey(mk) {
            const parts = String(mk).split('/');
            return (parseInt(parts[1], 10) || 0) * 100 + (parseInt(parts[0], 10) || 0);
        }

        function getPreviousMonthsList() {
            const current = getCurrentMonth();
            const seen = {};
            cashbook.forEach(e => {
                const mk = getMonthFromDate(e.date);
                if (mk !== current) seen[mk] = true;
            });
            return Object.keys(seen).sort((a, b) => monthSortKey(b) - monthSortKey(a));
        }

        function openPreviousMonthsModal() {
            if (!adminUnlocked) {
                alert('Admin mode required to access previous months.');
                return;
            }
            const months = getPreviousMonthsList();
            if (months.length === 0) {
                alert('No previous months yet. Past months appear here once you have entries dated before the current month.');
                return;
            }
            const monthOpts = months.map(m => `<option value="${esc(m)}">${esc(m)}</option>`).join('');
            const b =
                `<div class="alert alert-info">View the cash book for a past month. Once you've reconciled a month, you can verify it below.</div>` +
                `<div class="form-group"><label>Select Month</label><select id="pm-month">${monthOpts}</select></div>` +
                `<div id="pm-body"></div>`;
            const ov = modal('<ion-icon name="reader"></ion-icon> Access Previous Months', b, function() { return true; }, 'Close');
            const sel = ov.querySelector('#pm-month');
            const body = ov.querySelector('#pm-body');

            function renderMonth() {
                const month = sel.value;
                const key = monthSortKey(month);
                const entries = cashbook.filter(e => getMonthFromDate(e.date) === month)
                    .sort((a, b) => a.date !== b.date ? (a.date < b.date ? -1 : 1) : ((a.seq || 0) - (b.seq || 0)));
                let opening = 0;
                cashbook.forEach(e => {
                    if (monthSortKey(getMonthFromDate(e.date)) < key) opening += e.dir === 'in' ? e.amount : -e.amount;
                });
                let totalIn = 0, totalOut = 0, run = opening, rows = '';
                entries.forEach(e => {
                    run += e.dir === 'in' ? e.amount : -e.amount;
                    if (e.dir === 'in') totalIn += e.amount; else totalOut += e.amount;
                    const accountLabel = methodLabel(e.method, e.cashType);
                    rows +=
                        `<tr><td class="text-secondary">${esc(e.date)}</td><td class="mono text-muted" style="font-size:11px;">${esc(e.ref)}</td><td>${esc(e.desc || '-')}</td><td><span style="background:var(--surface-2);padding:2px 8px;border-radius:4px;font-size:11px;">${esc(e.catLabel)}</span> <span class="text-muted" style="font-size:10px;">${accountLabel}</span></td><td class="teal-t" style="font-weight:600;">${e.dir === 'in' ? PKR(e.amount) : ''}</td><td class="coral-t" style="font-weight:600;">${e.dir === 'out' ? PKR(e.amount) : ''}</td><td style="font-weight:600;">${PKR(run)}</td></tr>`;
                });
                const info = archivedCashbooks[month] || { verified: false, verifiedBy: '' };
                const statusHtml = info.verified ?
                    `<span class="verified-badge"><ion-icon name="checkmark-circle"></ion-icon> Verified by ${esc(info.verifiedBy || '—')}</span>` :
                    `<span class="unverified-badge"><ion-icon name="hourglass"></ion-icon> Not verified</span>`;
                const verifierOpts = verifiers.map(v => `<option value="${esc(v)}">${esc(v)}</option>`).join('');
                let html = '';
                if (!entries.length) {
                    html += `<div class="text-secondary" style="font-size:13px;padding:8px 0;">No entries for ${esc(month)}.</div>`;
                } else {
                    html += `<div class="flex-between" style="margin:6px 0 10px;flex-wrap:wrap;gap:8px;"><div class="text-secondary" style="font-size:12px;">Opening ${PKR(opening)} · In ${PKR(totalIn)} · Out ${PKR(totalOut)} · Closing ${PKR(run)}</div>${statusHtml}</div>`;
                    html += `<div class="tbl-wrap" style="max-height:280px;overflow:auto;"><table><thead><tr><th>Date</th><th>Ref</th><th>Note</th><th>Category</th><th>In</th><th>Out</th><th>Balance</th></tr></thead><tbody>${rows}</tbody></table></div>`;
                }
                if (info.verified) {
                    html += `<div style="margin-top:14px;padding:10px 12px;background:var(--teal-light);border-radius:var(--radius-sm);color:var(--teal);font-size:13px;font-weight:600;"><ion-icon name="checkmark-circle"></ion-icon> ${esc(month)} has been verified by ${esc(info.verifiedBy || '—')}.</div>`;
                } else {
                    html += `<div style="margin-top:14px;padding:12px;background:var(--surface-2);border-radius:var(--radius-sm);"><div class="sec-title" style="font-size:13px;margin-bottom:8px;"><span class="ic"><ion-icon name="checkmark-circle"></ion-icon></span>Verify this month</div><div class="flex gap-8" style="align-items:flex-end;flex-wrap:wrap;"><div class="form-group" style="margin:0;"><label>Verified by</label><select id="pm-verifier">${verifierOpts}</select></div><button class="btn btn-gold" id="pm-verify-btn">Verify ${esc(month)}</button></div></div>`;
                }
                body.innerHTML = html;
                const vbtn = body.querySelector('#pm-verify-btn');
                if (vbtn) {
                    vbtn.onclick = function() {
                        const verifier = body.querySelector('#pm-verifier').value;
                        if (!verifier) { alert('Please choose a verifier.'); return; }
                        if (!archivedCashbooks[month]) archivedCashbooks[month] = { verified: false, verifiedBy: '' };
                        verifyMonth(month, verifier);
                        renderMonth();
                    };
                }
            }
            sel.onchange = renderMonth;
            renderMonth();
        }

        // ─── ACCOUNTING LEDGER ──────────────────────────────────
