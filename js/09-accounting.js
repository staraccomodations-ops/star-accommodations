        function pageAccounting() {
            let totDr = 0,
                totCr = 0;
            journal.forEach(j => { totDr += j.dr;
                totCr += j.cr; });
            let h =
                ``;
            h += `<div class="tab-bar">`;
            [
                ['overview', '<ion-icon name="home"></ion-icon> Overview'],
                ['income', '<ion-icon name="analytics"></ion-icon> Profit & Loss'],
                ['balance', '<ion-icon name="business"></ion-icon> Balance Sheet'],
                ['receivables', '<ion-icon name="wallet"></ion-icon> Who Owes Me'],
                ['journal', '<ion-icon name="receipt"></ion-icon> Transactions'],
                ['ledger', '<ion-icon name="reader"></ion-icon> General Ledger'],
                ['trial', '<ion-icon name="barbell"></ion-icon> Trial Balance'],
                ['summary', '<ion-icon name="bar-chart"></ion-icon> Account Summary']
            ].forEach(x => {
                h +=
                    `<div class="tab${accTab===x[0]?' active':''}" onclick="setAccTab('${x[0]}')">${x[1]}</div>`;
            });
            h += `</div>`;

            const period = getPeriodRange();
            const allTime = acctPeriod === 'all';

            if (accTab === 'overview') {
                const rev = sectionTotalRange('Revenue', 'credit', period.from, period.to, allTime);
                const cogs = sectionTotalRange('Cost of Sales', 'debit', period.from, period.to, allTime);
                const opex = sectionTotalRange('Operating Expenses', 'debit', period.from, period.to, allTime);
                const net = rev - cogs - opex;
                const bal = computeCashBalances();
                const cashOnHand = bal.generalCash + bal.pettyCash;
                const receivables = getReceivables();
                const totalOwed = receivables.reduce((s, r) => s + r.total, 0);

                h += periodBarHtml();
                h += `<div class="grid-3" style="margin-bottom:16px;">
                    <div class="card"><div class="card-label">Revenue · ${esc(period.label)}</div><div class="card-value teal-t">${PKR(rev)}</div><div class="card-sub">Money earned</div></div>
                    <div class="card"><div class="card-label">Expenses · ${esc(period.label)}</div><div class="card-value coral-t">${PKR(cogs+opex)}</div><div class="card-sub">Cost of sales + operating</div></div>
                    <div class="card"><div class="card-label">Net ${net>=0?'Profit':'Loss'} · ${esc(period.label)}</div><div class="card-value" style="color:${net>=0?'var(--teal)':'var(--coral)'};">${PKR(Math.abs(net))}</div><div class="card-sub">${net>=0?'You made money':'You spent more than you earned'}</div></div>
                    <div class="card"><div class="card-label">Cash on Hand</div><div class="card-value gold-t">${PKR(cashOnHand)}</div><div class="card-sub">General + Petty, right now</div></div>
                    <div class="card"><div class="card-label">Bank Balance</div><div class="card-value">${PKR(bal.bankBal)}</div><div class="card-sub">Right now</div></div>
                    <div class="card" style="cursor:pointer;" onclick="setAccTab('receivables')"><div class="card-label">Money Owed to You</div><div class="card-value" style="color:${totalOwed>0?'var(--coral)':'var(--teal)'};">${PKR(totalOwed)}</div><div class="card-sub">${receivables.length} ${receivables.length===1?'customer':'customers'} · tap to view</div></div>
                </div>`;

                h += `<div class="panel" style="margin-bottom:16px;"><div class="panel-body"><div class="sec-title"><span class="ic"><ion-icon name="flash"></ion-icon> </span>Quick Actions</div>
                    <div class="flex gap-8" style="flex-wrap:wrap;">
                        <button class="btn btn-gold" onclick="openCashEntry()"><ion-icon name="add"></ion-icon> Add Cash Book Entry</button>
                        <button class="btn" onclick="openCapitalInjection()"><ion-icon name="cash"></ion-icon> Add Cash (Owner's Capital)</button>
                        <button class="btn" onclick="openOwnerWithdrawal()"><ion-icon name="archive"></ion-icon> Withdraw (Owner's Drawings)</button>
                        <button class="btn" onclick="openAddJE()"><ion-icon name="document-text"></ion-icon> Manual Journal Entry</button>
                        <button class="btn" onclick="setAccTab('income')"><ion-icon name="analytics"></ion-icon> View Profit &amp; Loss</button>
                    </div></div></div>`;

                // Where the money went — top expenses this period
                const expenseRows = [];
                ['Cost of Sales', 'Operating Expenses'].forEach(sec => {
                    if (!coa[sec]) return;
                    coa[sec].accts.forEach(a => {
                        const v = accountNetRange(a, 'debit', period.from, period.to, allTime);
                        if (v > 0) expenseRows.push({ name: a.name, v });
                    });
                });
                expenseRows.sort((a, b) => b.v - a.v);
                const topExpenses = expenseRows.slice(0, 6);
                const maxExp = topExpenses.length ? topExpenses[0].v : 0;
                h += `<div class="panel" style="margin-bottom:16px;"><div class="panel-body"><div class="sec-title"><span class="ic"><ion-icon name="archive"></ion-icon></span>Where the Money Went · ${esc(period.label)}</div>`;
                if (!topExpenses.length) {
                    h += `<div class="text-muted" style="font-size:13px;">No expenses recorded in this period.</div>`;
                } else {
                    topExpenses.forEach(e => {
                        const pct = maxExp > 0 ? Math.round((e.v / maxExp) * 100) : 0;
                        h += `<div style="margin-bottom:10px;cursor:pointer;" onclick="drillTo('${esc(e.name)}')">
                            <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:3px;"><span>${esc(e.name)}</span><span style="font-weight:600;">${PKR(e.v)}</span></div>
                            <div class="prog-wrap"><div class="prog-bar" style="width:${pct}%;background:var(--coral);"></div></div>
                        </div>`;
                    });
                }
                h += `</div></div>`;

                // Recent transactions
                h += `<div class="panel panel-0"><div class="panel-head"><div class="sec-title" style="margin-bottom:0;"><span class="ic"><ion-icon name="time"></ion-icon> </span>Recent Transactions</div></div>`;
                const recent = journal.slice(0, 8);
                if (!recent.length) {
                    h += `<div class="panel-body">${emptyState('<ion-icon name="document-text"></ion-icon>','Nothing recorded yet','Add a Cash Book entry to get started.')}</div>`;
                } else {
                    h += `<div class="tbl-wrap"><table><thead><tr><th>Date</th><th>Ref</th><th>Account</th><th>Description</th><th>Debit</th><th>Credit</th></tr></thead><tbody>`;
                    recent.forEach(j => {
                        h += `<tr style="cursor:pointer;" onclick="drillTo('${esc(j.account)}')"><td class="text-secondary">${esc(j.date)}</td><td class="mono text-muted" style="font-size:11px;">${esc(j.ref||'-')}</td><td style="font-weight:600;">${esc(j.account)}</td><td class="text-secondary" style="font-size:12px;">${esc(j.desc)}</td><td class="debit-val">${j.dr>0?PKR(j.dr):''}</td><td class="credit-val">${j.cr>0?PKR(j.cr):''}</td></tr>`;
                    });
                    h += `</tbody></table></div>`;
                }
                h += `</div>`;
                return h;
            }

            if (accTab === 'receivables') {
                const receivables = getReceivables();
                const totalOwed = receivables.reduce((s, r) => s + r.total, 0);
                const tCur = receivables.reduce((s, r) => s + r.current, 0);
                const t30 = receivables.reduce((s, r) => s + r.d30, 0);
                const t60 = receivables.reduce((s, r) => s + r.d60, 0);
                const t90 = receivables.reduce((s, r) => s + r.d90, 0);
                h += ``;
                if (!receivables.length) {
                    h += `<div class="panel"><div class="panel-body">${emptyState('<ion-icon name="checkmark-circle"></ion-icon>','Nobody owes you anything','Every booking is fully paid. Nice.')}</div></div>`;
                    return h;
                }
                h += `<div class="flex gap-8" style="margin-bottom:12px;flex-wrap:wrap;"><button class="btn btn-sm" onclick="exportReceivablesCSV()"><ion-icon name="download"></ion-icon> Export CSV</button><button class="btn btn-sm" onclick="printReport('receivables')"><ion-icon name="print"></ion-icon> Print</button></div>`;
                h += `<div class="grid-3" style="margin-bottom:16px;">
                    <div class="card"><div class="card-label">Total Owed</div><div class="card-value coral-t">${PKR(totalOwed)}</div><div class="card-sub">${receivables.length} customers</div></div>
                    <div class="card"><div class="card-label">Current (0–30 days)</div><div class="card-value">${PKR(tCur)}</div><div class="card-sub">Recent, normal</div></div>
                    <div class="card"><div class="card-label">Over 60 days</div><div class="card-value coral-t">${PKR(t60+t90)}</div><div class="card-sub">Needs chasing</div></div>
                </div>`;
                h += `<div class="panel panel-0"><div class="tbl-wrap"><table><thead><tr><th>Customer</th><th>Type</th><th>Current</th><th>31–60 days</th><th>61–90 days</th><th>90+ days</th><th>Total Owed</th></tr></thead><tbody>`;
                receivables.forEach(r => {
                    h += `<tr><td style="font-weight:600;">${esc(r.name)}</td><td class="text-muted" style="font-size:12px;">${esc(r.kind)}</td><td>${r.current>0?PKR(r.current):''}</td><td>${r.d30>0?PKR(r.d30):''}</td><td style="color:var(--coral);">${r.d60>0?PKR(r.d60):''}</td><td style="color:var(--coral);font-weight:600;">${r.d90>0?PKR(r.d90):''}</td><td style="font-weight:700;">${PKR(r.total)}</td></tr>`;
                });
                h += `</tbody><tfoot><tr><td colspan="2" style="text-align:right;color:rgba(255,255,255,.7);">Totals</td><td>${PKR(tCur)}</td><td>${PKR(t30)}</td><td>${PKR(t60)}</td><td>${PKR(t90)}</td><td style="color:var(--gold);">${PKR(totalOwed)}</td></tr></tfoot></table></div></div>`;
                return h;
            }

            if (accTab === 'journal') {
                h +=
                    `<div class="flex-between" style="margin-bottom:14px;flex-wrap:wrap;gap:10px;"><div class="text-secondary">${journal.length} lines</div><div class="flex gap-8"><button class="btn" onclick="openCapitalInjection()"><ion-icon name="cash"></ion-icon> Add Cash (Owner's Capital)</button><button class="btn" onclick="openOwnerWithdrawal()"><ion-icon name="archive"></ion-icon> Withdraw Cash (Owner's Drawings)</button><button class="btn btn-gold" onclick="openAddJE()"><ion-icon name="add"></ion-icon> Manual Journal Entry</button></div></div>`;
                if (!journal.length) {
                    h +=
                        `<div class="panel"><div class="panel-body">${emptyState('<ion-icon name="document-text"></ion-icon>','No journal entries yet','Add entries in the Cash Book (recommended) or click "+ Manual Journal Entry".')}</div></div>`;
                    return h;
                }
                h +=
                    `<div class="flex flex-between gap-12" style="margin-bottom:14px;flex-wrap:wrap;"><input style="max-width:320px;" id="je-search" placeholder="Search by account, description, or ref..." value="${esc(jeSearch)}" oninput="onJeSearch(this.value)"><button class="btn btn-sm" onclick="exportJournalCSV()"><ion-icon name="download"></ion-icon> Export CSV</button></div>`;
                const q = jeSearch.trim().toLowerCase();
                const filtered = q ? journal.filter(j =>
                    (j.account || '').toLowerCase().indexOf(q) >= 0 ||
                    (j.desc || '').toLowerCase().indexOf(q) >= 0 ||
                    (j.ref || '').toLowerCase().indexOf(q) >= 0
                ) : journal;
                let fDr = 0,
                    fCr = 0;
                filtered.forEach(j => { fDr += j.dr;
                    fCr += j.cr; });
                if (!filtered.length) {
                    h +=
                        `<div class="panel"><div class="panel-body">${emptyState('<ion-icon name="search"></ion-icon>','No matching entries','Try a different search term.')}</div></div>`;
                    return h;
                }
                h += `<div class="panel panel-0"><div class="tbl-wrap"><table><thead><tr><th>Date</th><th>Ref</th><th>Account</th><th>Description</th><th>Debit (Rs.)</th><th>Credit (Rs.)</th><th style="min-width:70px;">Actions</th></tr></thead><tbody>`;
                filtered.forEach(j => {
                    const cb = j.source === 'cashbook';
                    h +=
                        `<tr><td class="text-secondary">${esc(j.date)}</td><td><span class="mono" style="font-size:12px;background:${cb?'var(--teal-light)':'var(--surface-2)'};color:${cb?'var(--teal)':'inherit'};padding:2px 8px;border-radius:4px;">${esc(j.ref||'-')}</span></td><td style="font-weight:600;">${esc(j.account)}</td><td class="text-secondary" style="font-size:12px;">${esc(j.desc)}</td><td class="debit-val">${j.dr>0?PKR(j.dr):'-'}</td><td class="credit-val">${j.cr>0?PKR(j.cr):'-'}</td><td>${cb ? `<span class="text-muted" style="font-size:11px;" title="Linked to a Cash Book entry — delete it there instead"><ion-icon name="lock-closed"></ion-icon> Cash Book</span>` : `<button class="btn btn-sm btn-danger" onclick="deleteJournalEntry('${j.id}')"><ion-icon name="close"></ion-icon></button>`}</td></tr>`;
                });
                h +=
                    `</tbody><tfoot><tr><td colspan="4" style="text-align:right;color:rgba(255,255,255,.7);">Totals${q?' (filtered)':''}</td><td style="color:#9FE1CB;">${PKR(fDr)}</td><td style="color:#F5C4B3;">${PKR(fCr)}</td><td></td></tr></tfoot></table></div></div>`;
            } else if (accTab === 'ledger') {
                // ── Regular General Ledger: pick an account, see its running balance ──
                const allAccounts = [];
                for (const sec in coa) {
                    coa[sec].accts.forEach(a => {
                        if (journal.some(j => j.account === a.name) || (a.opening || 0) !== 0) allAccounts.push({ name: a.name, code: a.code, section: sec });
                    });
                }
                if (!allAccounts.length) {
                    h +=
                        `<div class="panel"><div class="panel-body">${emptyState('<ion-icon name="document"></ion-icon>','General ledger is empty','Once you record Cash Book or journal entries — or set an account\'s opening balance — its ledger appears here.')}</div></div>`;
                    return h;
                }
                if (!glAccount || !allAccounts.some(a => a.name === glAccount)) {
                    glAccount = allAccounts.length ? allAccounts[0].name : null;
                }
                let acctOpts = '';
                for (const sec in coa) {
                    const inSec = allAccounts.filter(a => a.section === sec);
                    if (!inSec.length) continue;
                    acctOpts += `<optgroup label="${esc(sec)}">`;
                    inSec.forEach(a => {
                        acctOpts += `<option value="${esc(a.name)}" ${glAccount===a.name?'selected':''}>[${a.code}] ${esc(a.name)}</option>`;
                    });
                    acctOpts += `</optgroup>`;
                }
                h += `<div class="form-row" style="max-width:680px;"><div class="form-group"><label>Account</label><select onchange="setGLAccount(this.value)">${acctOpts}</select></div><div class="form-group"><label>From</label><input type="date" value="${esc(glFrom)}" onchange="setGLFrom(this.value)"></div><div class="form-group"><label>To</label><input type="date" value="${esc(glTo)}" onchange="setGLTo(this.value)"></div></div>`;
                if (glFrom || glTo) h += `<button class="btn btn-sm" onclick="clearGLDateFilter()" style="margin-bottom:10px;"><ion-icon name="close"></ion-icon> Clear date filter</button>`;

                if (glAccount) {
                    const meta = findAccountMeta(glAccount);
                    const allLines = journal.slice().reverse()
                        .filter(j => j.account === glAccount)
                        .sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : 0);

                    let broughtForward = meta.opening;
                    const displayLines = [];
                    allLines.forEach(j => {
                        const beforeRange = glFrom && j.date < glFrom;
                        const afterRange = glTo && j.date > glTo;
                        if (beforeRange) {
                            broughtForward += meta.type === 'debit' ? (j.dr - j.cr) : (j.cr - j.dr);
                        } else if (!afterRange) {
                            displayLines.push(j);
                        }
                    });

                    let running = broughtForward;
                    const openingLabel = glFrom ? 'Balance Brought Forward' : 'Opening Balance';
                    const openingBalLabel = broughtForward === 0 ? '' : (broughtForward > 0 ? (meta.type==='debit'?' Dr':' Cr') : (meta.type==='debit'?' Cr':' Dr'));
                    let rows = `<tr style="background:var(--surface-2);"><td class="text-secondary" colspan="4" style="font-style:italic;">${openingLabel}</td><td colspan="2"></td><td style="font-weight:700;">${PKR(Math.abs(broughtForward))}${openingBalLabel}</td><td></td></tr>`;
                    if (!displayLines.length) {
                        rows += `<tr><td colspan="7" class="text-muted" style="text-align:center;padding:16px;">No transactions in this date range.</td></tr>`;
                    }
                    displayLines.forEach(j => {
                        running += meta.type === 'debit' ? (j.dr - j.cr) : (j.cr - j.dr);
                        const cb = j.source === 'cashbook';
                        const balLabel = running === 0 ? '' : (running > 0 ? (meta.type==='debit'?' Dr':' Cr') : (meta.type==='debit'?' Cr':' Dr'));
                        rows +=
                            `<tr><td class="text-secondary">${esc(j.date)}</td><td><span class="mono" style="font-size:12px;background:${cb?'var(--teal-light)':'var(--surface-2)'};color:${cb?'var(--teal)':'inherit'};padding:2px 8px;border-radius:4px;">${esc(j.ref||'-')}</span></td><td class="text-secondary" style="font-size:12px;">${esc(j.desc)}</td><td class="debit-val">${j.dr>0?PKR(j.dr):''}</td><td class="credit-val">${j.cr>0?PKR(j.cr):''}</td><td style="font-weight:600;">${PKR(Math.abs(running))}${balLabel}</td><td>${cb ? `<span class="text-muted" style="font-size:11px;" title="Linked to a Cash Book entry — delete it there instead"><ion-icon name="lock-closed"></ion-icon></span>` : `<button class="btn btn-sm btn-danger" onclick="deleteJournalEntry('${j.id}')"><ion-icon name="close"></ion-icon></button>`}</td></tr>`;
                    });
                    const closingLabel = glTo ? 'Balance as of ' + esc(glTo) : 'Closing Balance';
                    h += `<div class="panel panel-0" style="margin-top:14px;"><div class="panel-head"><div class="flex-between" style="align-items:center;flex-wrap:wrap;gap:8px;"><div class="sec-title" style="margin-bottom:0;"><span class="mono text-muted" style="margin-right:8px;">${meta.code}</span>${esc(glAccount)}<span class="text-muted" style="font-size:12px;font-weight:400;margin-left:8px;">(${meta.section} · normal balance: ${meta.type==='debit'?'Debit':'Credit'})</span></div><button class="btn btn-sm" onclick="exportGeneralLedgerCSV()"><ion-icon name="download"></ion-icon> Export CSV</button></div></div><div class="tbl-wrap"><table><thead><tr><th>Date</th><th>Ref</th><th>Description</th><th>Debit (Rs.)</th><th>Credit (Rs.)</th><th>Balance</th><th style="min-width:50px;"></th></tr></thead><tbody>${rows}</tbody><tfoot><tr><td colspan="5" style="text-align:right;color:rgba(255,255,255,.7);">${closingLabel}</td><td colspan="2" style="font-weight:700;color:var(--gold);">${PKR(Math.abs(running))}${running===0?'':(running>0?(meta.type==='debit'?' Dr':' Cr'):(meta.type==='debit'?' Cr':' Dr'))}</td></tr></tfoot></table></div></div>`;
                } else {
                    h += `<div class="panel"><div class="panel-body">${emptyState('<ion-icon name="document"></ion-icon>','No account activity yet','Record entries in the Cash Book to populate the general ledger.')}</div></div>`;
                }
            } else if (accTab === 'summary') {
                h +=
                    `<div class="grid-3" style="margin-bottom:16px;"><div class="card"><div class="card-label">Total Credits</div><div class="card-value teal-t">${PKR(totCr)}</div></div><div class="card"><div class="card-label">Total Debits</div><div class="card-value">${PKR(totDr)}</div></div><div class="card"><div class="card-label">Ledger Lines</div><div class="card-value gold-t">${journal.length}</div></div></div>`;
                let anyAccounts = false;
                for (const sec in coa) {
                    const data = coa[sec];
                    const used = data.accts.filter(a => journal.some(j => j.account === a.name) || (a.opening || 0) !== 0);
                    if (!used.length) continue;
                    anyAccounts = true;
                    h +=
                        `<div class="panel" style="margin-bottom:12px;"><div class="panel-body"><div class="sec-title" style="color:${data.color};">${sec}</div>`;
                    used.forEach(a => {
                        const net = a.opening + ((() => { let x = 0; journal.forEach(j => { if (j.account === a.name) x += j.dr - j.cr; }); return x; })());
                        h +=
                            `<div class="stat-row" style="cursor:pointer;" onclick="setAccTab('ledger');setGLAccount('${esc(a.name)}')"><span><span class="mono text-muted" style="margin-right:8px;">${a.code}</span>${esc(a.name)}</span><span style="font-weight:700;color:${net>0?'var(--teal)':'var(--coral)'};">${net>0?'Dr':'Cr'} ${PKR(Math.abs(net))}</span></div>`;
                    });
                    h += `</div></div>`;
                }
                if (!anyAccounts) {
                    h +=
                        `<div class="panel"><div class="panel-body">${emptyState('<ion-icon name="bar-chart"></ion-icon>','No account activity yet','Record entries in the Cash Book to see balances grouped by account.')}</div></div>`;
                }
            } else if (accTab === 'trial') {
                h += ``;
                if (!journal.length) {
                    h +=
                        `<div class="panel"><div class="panel-body">${emptyState('<ion-icon name="barbell"></ion-icon>','Trial balance is empty','Once you record entries, this report tallies debits against credits.')}</div></div>`;
                    return h;
                }
                h += `<div style="margin-bottom:10px;"><button class="btn btn-sm" onclick="exportTrialBalanceCSV()"><ion-icon name="download"></ion-icon> Export CSV</button></div>`;
                h += `<div class="panel panel-0"><div class="tbl-wrap"><table><thead><tr><th>Date</th><th>Ref</th><th>Account</th><th>Description</th><th>Debit (Rs.)</th><th>Credit (Rs.)</th></tr></thead><tbody>`;
                journal.forEach(j => {
                    h +=
                        `<tr><td class="text-secondary">${esc(j.date)}</td><td class="mono" style="font-size:12px;">${esc(j.ref||'-')}</td><td style="font-weight:600;">${esc(j.account)}</td><td class="text-secondary" style="font-size:12px;">${esc(j.desc)}</td><td class="debit-val">${j.dr>0?PKR(j.dr):''}</td><td class="credit-val">${j.cr>0?PKR(j.cr):''}</td></tr>`;
                });
                h +=
                    `</tbody><tfoot><tr><td colspan="4" style="text-align:right;color:rgba(255,255,255,.75);">Trial Balance Totals</td><td style="color:#9FE1CB;">${PKR(totDr)}</td><td style="color:#F5C4B3;">${PKR(totCr)}</td></tr></tfoot></table></div></div>`;
                if (totDr === totCr) h +=
                    `<div class="alert alert-success" style="margin-top:12px;"><ion-icon name="checkmark-circle"></ion-icon> Balanced. Debits = Credits = ${PKR(totDr)}</div>`;
                else h +=
                    `<div class="alert alert-warning" style="margin-top:12px;"><ion-icon name="alert-circle"></ion-icon> Imbalance detected. Difference: ${PKR(Math.abs(totDr-totCr))}</div>`;
            } else if (accTab === 'income') {
                const inclOpen = allTime;
                const revAccts = coa['Revenue'] ? coa['Revenue'].accts.filter(a => accountHasActivity(a, period.from, period.to, inclOpen)) : [];
                const cogsAccts = coa['Cost of Sales'] ? coa['Cost of Sales'].accts.filter(a => accountHasActivity(a, period.from, period.to, inclOpen)) : [];
                const opexAccts = coa['Operating Expenses'] ? coa['Operating Expenses'].accts.filter(a => accountHasActivity(a, period.from, period.to, inclOpen)) : [];
                const totalRev = sectionTotalRange('Revenue', 'credit', period.from, period.to, inclOpen);
                const totalCogs = sectionTotalRange('Cost of Sales', 'debit', period.from, period.to, inclOpen);
                const grossProfit = totalRev - totalCogs;
                const totalOpex = sectionTotalRange('Operating Expenses', 'debit', period.from, period.to, inclOpen);
                const netProfit = grossProfit - totalOpex;
                const margin = totalRev > 0 ? Math.round((netProfit / totalRev) * 100) : 0;

                h += ``;
                h += periodBarHtml();
                if (!revAccts.length && !cogsAccts.length && !opexAccts.length) {
                    h +=
                        `<div class="panel"><div class="panel-body">${emptyState('<ion-icon name="analytics"></ion-icon>','No activity in this period','Try a wider period, or record entries in the Cash Book.')}</div></div>`;
                    return h;
                }
                h += `<div class="flex gap-8" style="margin-bottom:10px;flex-wrap:wrap;"><button class="btn btn-sm" onclick="exportIncomeStatementCSV()"><ion-icon name="arrow-down"></ion-icon> Export CSV</button><button class="btn btn-sm" onclick="printReport('income')"><ion-icon name="print"></ion-icon> Print</button></div>`;
                h += `<div class="grid-3" style="margin-bottom:16px;">
                    <div class="card"><div class="card-label">Total Revenue</div><div class="card-value teal-t">${PKR(totalRev)}</div></div>
                    <div class="card"><div class="card-label">Total Expenses</div><div class="card-value coral-t">${PKR(totalCogs+totalOpex)}</div></div>
                    <div class="card"><div class="card-label">Net ${netProfit>=0?'Profit':'Loss'}</div><div class="card-value" style="color:${netProfit>=0?'var(--teal)':'var(--coral)'};">${PKR(Math.abs(netProfit))}</div><div class="card-sub">${totalRev>0?margin+'% margin':''}</div></div>
                </div>`;
                h += `<div class="panel panel-0"><div class="panel-body">`;
                h += `<div class="sec-title" style="color:${coa['Revenue']?coa['Revenue'].color:''};">Revenue</div>`;
                revAccts.forEach(a => { h +=
                        `<div class="stat-row" style="cursor:pointer;" onclick="drillTo('${esc(a.name)}')"><span>${esc(a.name)}</span><span style="font-weight:600;">${PKR(accountNetRange(a,'credit',period.from,period.to,inclOpen))}</span></div>`; });
                h +=
                    `<div class="stat-row" style="border-top:1px solid var(--border);margin-top:6px;padding-top:8px;"><span style="font-weight:700;">Total Revenue</span><span style="font-weight:700;color:var(--teal);">${PKR(totalRev)}</span></div>`;
                if (cogsAccts.length) {
                    h += `<div class="sec-title" style="margin-top:18px;color:${coa['Cost of Sales']?coa['Cost of Sales'].color:''};">Cost of Sales</div>`;
                    cogsAccts.forEach(a => { h +=
                            `<div class="stat-row" style="cursor:pointer;" onclick="drillTo('${esc(a.name)}')"><span>${esc(a.name)}</span><span style="font-weight:600;">${PKR(accountNetRange(a,'debit',period.from,period.to,inclOpen))}</span></div>`; });
                    h +=
                        `<div class="stat-row" style="border-top:1px solid var(--border);margin-top:6px;padding-top:8px;"><span style="font-weight:700;">Total Cost of Sales</span><span style="font-weight:700;color:var(--coral);">${PKR(totalCogs)}</span></div>`;
                }
                h +=
                    `<div class="stat-row" style="margin-top:12px;background:var(--surface-2);padding:10px 12px;border-radius:var(--radius-sm);"><span style="font-weight:700;">Gross Profit</span><span style="font-weight:700;">${PKR(grossProfit)}</span></div>`;
                if (opexAccts.length) {
                    h += `<div class="sec-title" style="margin-top:18px;color:${coa['Operating Expenses']?coa['Operating Expenses'].color:''};">Operating Expenses</div>`;
                    opexAccts.forEach(a => { h +=
                            `<div class="stat-row" style="cursor:pointer;" onclick="drillTo('${esc(a.name)}')"><span>${esc(a.name)}</span><span style="font-weight:600;">${PKR(accountNetRange(a,'debit',period.from,period.to,inclOpen))}</span></div>`; });
                    h +=
                        `<div class="stat-row" style="border-top:1px solid var(--border);margin-top:6px;padding-top:8px;"><span style="font-weight:700;">Total Operating Expenses</span><span style="font-weight:700;color:var(--coral);">${PKR(totalOpex)}</span></div>`;
                }
                h +=
                    `<div class="stat-row" style="margin-top:14px;background:${netProfit>=0?'var(--teal-light)':'var(--coral-light)'};padding:12px 14px;border-radius:var(--radius-sm);"><span style="font-weight:800;font-size:15px;">Net ${netProfit>=0?'Profit':'Loss'}</span><span style="font-weight:800;font-size:15px;color:${netProfit>=0?'var(--teal)':'var(--coral)'};">${PKR(Math.abs(netProfit))}</span></div>`;
                h += `</div></div>`;
            } else if (accTab === 'balance') {
                // Balance Sheet is "as of" the period end — cumulative, always includes opening balances.
                const asOf = period.to;
                const assetAccts = coa['Assets'] ? coa['Assets'].accts.filter(a => accountHasActivity(a, '', asOf, true)) : [];
                const liabAccts = coa['Liabilities'] ? coa['Liabilities'].accts.filter(a => accountHasActivity(a, '', asOf, true)) : [];
                const equityAccts = coa['Equity'] ? coa['Equity'].accts.filter(a => accountHasActivity(a, '', asOf, true)) : [];
                const totalAssets = sectionTotalRange('Assets', 'debit', '', asOf, true);
                const totalLiab = sectionTotalRange('Liabilities', 'credit', '', asOf, true);
                const totalEquityPosted = sectionTotalRange('Equity', 'credit', '', asOf, true);
                const netProfit = sectionTotalRange('Revenue', 'credit', '', asOf, true) - sectionTotalRange('Cost of Sales', 'debit', '', asOf, true) - sectionTotalRange('Operating Expenses', 'debit', '', asOf, true);
                const totalLiabEquity = totalLiab + totalEquityPosted + netProfit;
                const diff = totalAssets - totalLiabEquity;

                h += ``;
                h += periodBarHtml();
                if (!assetAccts.length && !liabAccts.length && !equityAccts.length) {
                    h +=
                        `<div class="panel"><div class="panel-body">${emptyState('<ion-icon name="business"></ion-icon>','No balance sheet activity yet','Record entries, or set an opening balance on an account, to see this report.')}</div></div>`;
                    return h;
                }
                h += `<div class="flex gap-8" style="margin-bottom:10px;flex-wrap:wrap;"><button class="btn btn-sm" onclick="exportBalanceSheetCSV()"><ion-icon name="arrow-down"></ion-icon> Export CSV</button><button class="btn btn-sm" onclick="printReport('balance')"><ion-icon name="print"></ion-icon> Print</button></div>`;
                h += `<div class="panel panel-0"><div class="panel-body">`;
                h += `<div class="sec-title" style="color:${coa['Assets']?coa['Assets'].color:''};">Assets</div>`;
                assetAccts.forEach(a => { h +=
                        `<div class="stat-row" style="cursor:pointer;" onclick="drillTo('${esc(a.name)}')"><span>${esc(a.name)}</span><span style="font-weight:600;">${PKR(accountNetRange(a,'debit','',asOf,true))}</span></div>`; });
                h +=
                    `<div class="stat-row" style="margin-top:6px;padding-top:8px;"><span style="font-weight:700;">Total Assets</span><span style="font-weight:700;color:var(--teal);">${PKR(totalAssets)}</span></div>`;

                h += `<div class="sec-title" style="margin-top:18px;color:${coa['Liabilities']?coa['Liabilities'].color:''};">Liabilities</div>`;
                if (liabAccts.length) liabAccts.forEach(a => { h +=
                        `<div class="stat-row" style="cursor:pointer;" onclick="drillTo('${esc(a.name)}')"><span>${esc(a.name)}</span><span style="font-weight:600;">${PKR(accountNetRange(a,'credit','',asOf,true))}</span></div>`; });
                else h += `<div class="text-muted" style="font-size:12px;">No liabilities recorded.</div>`;
                h +=
                    `<div class="stat-row" style="border-top:1px solid var(--border);margin-top:6px;padding-top:8px;"><span style="font-weight:700;">Total Liabilities</span><span style="font-weight:700;">${PKR(totalLiab)}</span></div>`;

                h += `<div class="sec-title" style="margin-top:18px;color:${coa['Equity']?coa['Equity'].color:''};">Equity</div>`;
                equityAccts.forEach(a => { h +=
                        `<div class="stat-row" style="cursor:pointer;" onclick="drillTo('${esc(a.name)}')"><span>${esc(a.name)}</span><span style="font-weight:600;">${PKR(accountNetRange(a,'credit','',asOf,true))}</span></div>`; });
                if (netProfit !== 0) h +=
                    `<div class="stat-row"><span>Net ${netProfit>=0?'Profit':'Loss'} to date <span class="text-muted" style="font-size:11px;">(not yet closed to equity)</span></span><span style="font-weight:600;">${PKR(netProfit)}</span></div>`;
                h +=
                    `<div class="stat-row" style="margin-top:6px;padding-top:8px;"><span style="font-weight:700;">Total Equity</span><span style="font-weight:700;">${PKR(totalEquityPosted+netProfit)}</span></div>`;

                h +=
                    `<div class="stat-row" style="margin-top:14px;background:var(--surface-2);padding:10px 12px;border-radius:var(--radius-sm);"><span style="font-weight:700;">Total Liabilities + Equity</span><span style="font-weight:700;">${PKR(totalLiabEquity)}</span></div>`;

                if (Math.abs(diff) < 1) h +=
                    `<div class="alert alert-success" style="margin-top:12px;"><ion-icon name="checkmark-circle"></ion-icon> Balanced. Total Assets = Total Liabilities + Equity = ${PKR(totalAssets)}</div>`;
                else h +=
                    `<div class="alert alert-warning" style="margin-top:12px;"><ion-icon name="alert-circle"></ion-icon> Off by ${PKR(Math.abs(diff))}. If you recently entered opening balances, make sure they balance each other too — e.g. an opening balance on General Cash should be matched by one on Owner's Capital.</div>`;
                h += `</div></div>`;
            }
            return h;
        }

        function periodBarHtml() {
            const r = getPeriodRange();
            const opts = [
                ['this-month', 'This Month'],
                ['last-month', 'Last Month'],
                ['this-quarter', 'This Quarter'],
                ['this-year', 'This Year'],
                ['all', 'All Time'],
                ['custom', 'Custom range…']
            ];
            let h = `<div class="flex gap-12" style="margin-bottom:14px;flex-wrap:wrap;align-items:center;background:var(--surface-2);padding:10px 12px;border-radius:var(--radius-sm);">`;
            h += `<span style="font-size:12px;font-weight:700;"><ion-icon name="calendar"></ion-icon> Period</span>`;
            h += `<select style="max-width:190px;" onchange="setAcctPeriod(this.value)">${opts.map(o=>`<option value="${o[0]}" ${acctPeriod===o[0]?'selected':''}>${o[1]}</option>`).join('')}</select>`;
            if (acctPeriod === 'custom') {
                h += `<input type="date" style="max-width:165px;" value="${esc(acctFrom)}" onchange="setAcctFrom(this.value)">`;
                h += `<span class="text-muted" style="font-size:12px;">to</span>`;
                h += `<input type="date" style="max-width:165px;" value="${esc(acctTo)}" onchange="setAcctTo(this.value)">`;
            }
            h += `<span class="text-muted" style="font-size:12px;">${esc(r.from || 'beginning')} → ${esc(r.to || 'today')}</span>`;
            h += `</div>`;
            return h;
        }

        function setAcctPeriod(v) {
            acctPeriod = v;
            if (v === 'custom' && !acctFrom && !acctTo) {
                const now = new Date();
                acctFrom = now.getFullYear() + '-' + ('0' + (now.getMonth() + 1)).slice(-2) + '-01';
                acctTo = today();
            }
            render();
        }

        function setAcctFrom(v) { acctFrom = v;
            render(); }

        function setAcctTo(v) { acctTo = v;
            render(); }

        // Click any figure in a report to see the transactions behind it (QuickBooks-style drill-down).
        function drillTo(accountName) {
            const r = getPeriodRange();
            glAccount = accountName;
            glFrom = r.from;
            glTo = r.to;
            accTab = 'ledger';
            render();
        }

        function exportReceivablesCSV() {
            const rows = getReceivables();
            if (!rows.length) { alert('Nobody owes you anything right now.'); return; }
            let r = 'Customer,Type,Current (0-30),31-60 days,61-90 days,90+ days,Total Owed\n';
            rows.forEach(x => {
                r += [csvCell(x.name), csvCell(x.kind), csvCell(x.current), csvCell(x.d30), csvCell(x.d60), csvCell(x.d90), csvCell(x.total)].join(',') + '\n';
            });
            const t = rows.reduce((s, x) => ({ current: s.current + x.current, d30: s.d30 + x.d30, d60: s.d60 + x.d60, d90: s.d90 + x.d90, total: s.total + x.total }), { current: 0, d30: 0, d60: 0, d90: 0, total: 0 });
            r += [csvCell('TOTAL'), csvCell(''), csvCell(t.current), csvCell(t.d30), csvCell(t.d60), csvCell(t.d90), csvCell(t.total)].join(',') + '\n';
            dl(r, 'who-owes-me.csv');
        }

        // Builds a clean, printer-friendly version of the current report.
        function printReport(which) {
            const period = getPeriodRange();
            const allTime = acctPeriod === 'all';
            let title = '',
                sub = '',
                body = '';
            const row = (label, val, cls) => `<div class="rp-row ${cls||''}"><span>${esc(label)}</span><span>${val}</span></div>`;

            if (which === 'income') {
                const inclOpen = allTime;
                title = 'Profit &amp; Loss';
                sub = `Star Accommodations · ${esc(period.label)} (${esc(period.from||'beginning')} → ${esc(period.to||'today')})`;
                const totalRev = sectionTotalRange('Revenue', 'credit', period.from, period.to, inclOpen);
                const totalCogs = sectionTotalRange('Cost of Sales', 'debit', period.from, period.to, inclOpen);
                const totalOpex = sectionTotalRange('Operating Expenses', 'debit', period.from, period.to, inclOpen);
                const net = totalRev - totalCogs - totalOpex;
                body += `<div class="rp-sec">Revenue</div>`;
                (coa['Revenue'] ? coa['Revenue'].accts : []).forEach(a => {
                    if (accountHasActivity(a, period.from, period.to, inclOpen)) body += row(a.name, PKR(accountNetRange(a, 'credit', period.from, period.to, inclOpen)));
                });
                body += row('Total Revenue', PKR(totalRev), 'rp-total');
                if (coa['Cost of Sales']) {
                    body += `<div class="rp-sec">Cost of Sales</div>`;
                    coa['Cost of Sales'].accts.forEach(a => {
                        if (accountHasActivity(a, period.from, period.to, inclOpen)) body += row(a.name, PKR(accountNetRange(a, 'debit', period.from, period.to, inclOpen)));
                    });
                    body += row('Total Cost of Sales', PKR(totalCogs), 'rp-total');
                }
                body += row('Gross Profit', PKR(totalRev - totalCogs), 'rp-total');
                if (coa['Operating Expenses']) {
                    body += `<div class="rp-sec">Operating Expenses</div>`;
                    coa['Operating Expenses'].accts.forEach(a => {
                        if (accountHasActivity(a, period.from, period.to, inclOpen)) body += row(a.name, PKR(accountNetRange(a, 'debit', period.from, period.to, inclOpen)));
                    });
                    body += row('Total Operating Expenses', PKR(totalOpex), 'rp-total');
                }
                body += row('NET ' + (net >= 0 ? 'PROFIT' : 'LOSS'), PKR(Math.abs(net)), 'rp-total');
            } else if (which === 'balance') {
                const asOf = period.to;
                title = 'Balance Sheet';
                sub = `Star Accommodations · As of ${esc(asOf || 'today')}`;
                const totalAssets = sectionTotalRange('Assets', 'debit', '', asOf, true);
                const totalLiab = sectionTotalRange('Liabilities', 'credit', '', asOf, true);
                const totalEq = sectionTotalRange('Equity', 'credit', '', asOf, true);
                const net = sectionTotalRange('Revenue', 'credit', '', asOf, true) - sectionTotalRange('Cost of Sales', 'debit', '', asOf, true) - sectionTotalRange('Operating Expenses', 'debit', '', asOf, true);
                [
                    ['Assets', 'debit'],
                    ['Liabilities', 'credit'],
                    ['Equity', 'credit']
                ].forEach(pair => {
                    if (!coa[pair[0]]) return;
                    body += `<div class="rp-sec">${pair[0]}</div>`;
                    coa[pair[0]].accts.forEach(a => {
                        if (accountHasActivity(a, '', asOf, true)) body += row(a.name, PKR(accountNetRange(a, pair[1], '', asOf, true)));
                    });
                    if (pair[0] === 'Assets') body += row('Total Assets', PKR(totalAssets), 'rp-total');
                    if (pair[0] === 'Liabilities') body += row('Total Liabilities', PKR(totalLiab), 'rp-total');
                    if (pair[0] === 'Equity') {
                        if (net !== 0) body += row('Net ' + (net >= 0 ? 'Profit' : 'Loss') + ' to date', PKR(net));
                        body += row('Total Equity', PKR(totalEq + net), 'rp-total');
                    }
                });
                body += row('Total Liabilities + Equity', PKR(totalLiab + totalEq + net), 'rp-total');
            } else if (which === 'receivables') {
                title = 'Who Owes Me (Accounts Receivable)';
                sub = `Star Accommodations · As of ${esc(today())}`;
                const rows = getReceivables();
                body += `<table><thead><tr><th>Customer</th><th>Type</th><th>Current</th><th>31–60</th><th>61–90</th><th>90+</th><th>Total</th></tr></thead><tbody>`;
                rows.forEach(x => {
                    body += `<tr><td>${esc(x.name)}</td><td>${esc(x.kind)}</td><td>${x.current?PKR(x.current):''}</td><td>${x.d30?PKR(x.d30):''}</td><td>${x.d60?PKR(x.d60):''}</td><td>${x.d90?PKR(x.d90):''}</td><td><strong>${PKR(x.total)}</strong></td></tr>`;
                });
                const t = rows.reduce((s, x) => s + x.total, 0);
                body += `</tbody></table>`;
                body += row('TOTAL OWED', PKR(t), 'rp-total');
            } else {
                return;
            }

            const div = document.createElement('div');
            div.className = 'report-print';
            div.innerHTML = `<h2>${title}</h2><div class="rp-sub">${sub}</div>${body}<div style="margin-top:18px;font-size:11px;color:#777;">Generated ${esc(today())}</div>`;
            document.body.appendChild(div);
            document.body.classList.add('printing-report');
            window.print();
            setTimeout(() => {
                document.body.classList.remove('printing-report');
                if (document.body.contains(div)) document.body.removeChild(div);
            }, 1000);
        }

        function setGLAccount(name) { glAccount = name;
            render(); }

        function setGLFrom(v) { glFrom = v;
            render(); }

        function setGLTo(v) { glTo = v;
            render(); }

        function clearGLDateFilter() { glFrom = '';
            glTo = '';
            render(); }

        function onJeSearch(v) { jeSearch = v;
            render(); }

        function exportJournalCSV() {
            if (!journal.length) { alert('No journal entries to export yet.'); return; }
            let r = 'Date,Ref,Account,Description,Debit (Rs.),Credit (Rs.),Source\n';
            journal.slice().reverse().forEach(j => {
                r += [csvCell(j.date), csvCell(j.ref || ''), csvCell(j.account), csvCell(j.desc || ''), csvCell(j.dr || 0), csvCell(j.cr || 0), csvCell(j.source === 'cashbook' ? 'Cash Book' : 'Manual')].join(',') + '\n';
            });
            dl(r, 'journal-entries.csv');
        }

        function exportGeneralLedgerCSV() {
            if (!glAccount) { alert('Select an account first.'); return; }
            const meta = findAccountMeta(glAccount);
            const allLines = journal.slice().reverse()
                .filter(j => j.account === glAccount)
                .sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : 0);
            let broughtForward = meta.opening;
            const displayLines = [];
            allLines.forEach(j => {
                const beforeRange = glFrom && j.date < glFrom;
                const afterRange = glTo && j.date > glTo;
                if (beforeRange) broughtForward += meta.type === 'debit' ? (j.dr - j.cr) : (j.cr - j.dr);
                else if (!afterRange) displayLines.push(j);
            });
            let running = broughtForward;
            let r = 'Date,Ref,Description,Debit (Rs.),Credit (Rs.),Balance\n';
            r += [csvCell(''), csvCell(''), csvCell(glFrom ? 'Balance Brought Forward' : 'Opening Balance'), csvCell(''), csvCell(''), csvCell(broughtForward)].join(',') + '\n';
            displayLines.forEach(j => {
                running += meta.type === 'debit' ? (j.dr - j.cr) : (j.cr - j.dr);
                r += [csvCell(j.date), csvCell(j.ref || ''), csvCell(j.desc || ''), csvCell(j.dr || 0), csvCell(j.cr || 0), csvCell(running)].join(',') + '\n';
            });
            r += [csvCell(''), csvCell(''), csvCell(glTo ? 'Balance as of ' + glTo : 'Closing Balance'), csvCell(''), csvCell(''), csvCell(running)].join(',') + '\n';
            dl(r, 'general-ledger-' + glAccount.replace(/[^a-z0-9]+/gi, '-') + '.csv');
        }

        function exportTrialBalanceCSV() {
            if (!journal.length) { alert('No entries to export yet.'); return; }
            let totDr = 0,
                totCr = 0;
            let r = 'Date,Ref,Account,Description,Debit (Rs.),Credit (Rs.)\n';
            journal.forEach(j => { totDr += j.dr;
                totCr += j.cr;
                r += [csvCell(j.date), csvCell(j.ref || ''), csvCell(j.account), csvCell(j.desc || ''), csvCell(j.dr || 0), csvCell(j.cr || 0)].join(',') + '\n'; });
            r += [csvCell(''), csvCell(''), csvCell(''), csvCell('TOTALS'), csvCell(totDr), csvCell(totCr)].join(',') + '\n';
            dl(r, 'trial-balance.csv');
        }

        function exportIncomeStatementCSV() {
            const period = getPeriodRange();
            const inclOpen = acctPeriod === 'all';
            let r = 'Profit & Loss,' + csvCell(period.label) + ',' + csvCell((period.from || 'beginning') + ' to ' + (period.to || 'today')) + '\n';
            r += 'Section,Account,Amount (Rs.)\n';
            ['Revenue', 'Cost of Sales', 'Operating Expenses'].forEach(sec => {
                if (!coa[sec]) return;
                const orient = sec === 'Revenue' ? 'credit' : 'debit';
                coa[sec].accts.forEach(a => {
                    if (!accountHasActivity(a, period.from, period.to, inclOpen)) return;
                    r += [csvCell(sec), csvCell(a.name), csvCell(accountNetRange(a, orient, period.from, period.to, inclOpen))].join(',') + '\n';
                });
            });
            const totalRev = sectionTotalRange('Revenue', 'credit', period.from, period.to, inclOpen);
            const totalCogs = sectionTotalRange('Cost of Sales', 'debit', period.from, period.to, inclOpen);
            const totalOpex = sectionTotalRange('Operating Expenses', 'debit', period.from, period.to, inclOpen);
            r += [csvCell(''), csvCell('Total Revenue'), csvCell(totalRev)].join(',') + '\n';
            r += [csvCell(''), csvCell('Total Cost of Sales'), csvCell(totalCogs)].join(',') + '\n';
            r += [csvCell(''), csvCell('Gross Profit'), csvCell(totalRev - totalCogs)].join(',') + '\n';
            r += [csvCell(''), csvCell('Total Operating Expenses'), csvCell(totalOpex)].join(',') + '\n';
            r += [csvCell(''), csvCell('Net Profit'), csvCell(totalRev - totalCogs - totalOpex)].join(',') + '\n';
            dl(r, 'profit-and-loss.csv');
        }

        function exportBalanceSheetCSV() {
            const period = getPeriodRange();
            const asOf = period.to;
            let r = 'Balance Sheet,As of ' + csvCell(asOf || 'today') + '\n';
            r += 'Section,Account,Amount (Rs.)\n';
            [
                ['Assets', 'debit'],
                ['Liabilities', 'credit'],
                ['Equity', 'credit']
            ].forEach(pair => {
                const sec = pair[0],
                    orient = pair[1];
                if (!coa[sec]) return;
                coa[sec].accts.forEach(a => {
                    if (!accountHasActivity(a, '', asOf, true)) return;
                    r += [csvCell(sec), csvCell(a.name), csvCell(accountNetRange(a, orient, '', asOf, true))].join(',') + '\n';
                });
            });
            const totalAssets = sectionTotalRange('Assets', 'debit', '', asOf, true);
            const totalLiab = sectionTotalRange('Liabilities', 'credit', '', asOf, true);
            const totalEquity = sectionTotalRange('Equity', 'credit', '', asOf, true);
            const netProfit = sectionTotalRange('Revenue', 'credit', '', asOf, true) - sectionTotalRange('Cost of Sales', 'debit', '', asOf, true) - sectionTotalRange('Operating Expenses', 'debit', '', asOf, true);
            r += [csvCell(''), csvCell('Total Assets'), csvCell(totalAssets)].join(',') + '\n';
            r += [csvCell(''), csvCell('Total Liabilities'), csvCell(totalLiab)].join(',') + '\n';
            r += [csvCell(''), csvCell('Net Profit (not yet closed to equity)'), csvCell(netProfit)].join(',') + '\n';
            r += [csvCell(''), csvCell('Total Equity'), csvCell(totalEquity + netProfit)].join(',') + '\n';
            r += [csvCell(''), csvCell('Total Liabilities + Equity'), csvCell(totalLiab + totalEquity + netProfit)].join(',') + '\n';
            dl(r, 'balance-sheet.csv');
        }

        function deleteJournalEntry(id) {
            const j = byId(journal, id);
            if (!j) { noticeModal('Journal entry not found.', 'Delete entry'); return; }
            if (j.source === 'cashbook') {
                noticeModal('This entry is linked to a Cash Book transaction. Delete it from the Cash Book instead — the matching journal lines will be removed automatically.', 'Linked to Cash Book');
                return;
            }
            const group = j.pairId ? journal.filter(x => x.pairId === j.pairId) : [j];
            let msg;
            if (group.length > 1) {
                const drLine = group.find(x => x.dr > 0);
                const crLine = group.find(x => x.cr > 0);
                msg = `Delete this journal entry on ${esc(j.date)}? Both sides will be removed together — Debit ${esc(drLine?drLine.account:'')} ${PKR(drLine?drLine.dr:0)} and Credit ${esc(crLine?crLine.account:'')} ${PKR(crLine?crLine.cr:0)}.`;
            } else {
                msg = `Delete this journal entry — ${esc(j.account)}, ${j.dr>0?'Debit '+PKR(j.dr):'Credit '+PKR(j.cr)}, on ${esc(j.date)}?`;
            }
            confirmModal(msg, function() {
                const ids = group.map(x => x.id);
                journal = journal.filter(x => ids.indexOf(x.id) === -1);
                save();
                render();
                toast(group.length > 1 ? 'Journal entry deleted — both sides removed.' : 'Journal entry deleted.');
            }, { danger: true, title: 'Delete journal entry', yesLabel: 'Delete' });
        }

        // ─── CHART OF ACCOUNTS (unchanged) ─────────────────────
