        //  RESET (protected by admin)
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        function openResetModal() {
            if (!adminUnlocked) {
                alert('Admin mode is required to clear all data. Please unlock admin first.');
                return;
            }
            const b =
                `<div class="alert alert-danger" style="margin-bottom:16px;"><ion-icon name="alert-circle"></ion-icon> This permanently deletes all ${guests.length} guest(s), ${txs.length} booking(s), ${cashbook.length} cash book entr(ies), and ${journal.length} ledger line(s). This cannot be undone. Consider exporting your data first.</div>` +
                `<div class="form-group"><label>To confirm, type <strong>ERASE ALL DATA</strong> exactly</label><input id="reset-confirm" placeholder="ERASE ALL DATA" autocomplete="off" spellcheck="false"></div>`;

            const ov = document.createElement('div');
            ov.className = 'modal-overlay';
            ov.innerHTML =
                `<div class="modal"><div class="modal-title" style="color:var(--coral);"><ion-icon name="trash"></ion-icon> Clear all data</div><div>${b}</div><div class="modal-footer"><button class="btn" id="r-cancel">Cancel</button><button class="btn" id="r-confirm" style="background:var(--coral);color:#fff;border-color:var(--coral);opacity:.45;cursor:not-allowed;">Erase everything</button></div></div>`;
            document.body.appendChild(ov);

            const input = ov.querySelector('#reset-confirm'),
                btn = ov.querySelector('#r-confirm');
            input.oninput = function() {
                const ok = input.value === 'ERASE ALL DATA';
                btn.style.opacity = ok ? '1' : '.45';
                btn.style.cursor = ok ? 'pointer' : 'not-allowed';
            };
            ov.querySelector('#r-cancel').onclick = function() { document.body.removeChild(ov); };
            ov.onclick = function(e) { if (e.target === ov) document.body.removeChild(ov); };
            btn.onclick = function() {
                if (input.value !== 'ERASE ALL DATA') { input.style.borderColor = 'var(--coral)';
                    input.focus(); return; }
                if (!confirm('Final check: erase everything and return to a clean slate?')) return;
                guests = [];
                txs = [];
                journal = [];
                cashbook = [];
                archivedCashbooks = {};
                cbSeq = 0;
                jeSeq = 0;
                selGuestId = null;
                coa = JSON.parse(JSON.stringify(BASE_COA));
                cashCategories = JSON.parse(JSON.stringify(DEFAULT_CASH_CATEGORIES));
                saveCashCategories();
                subCategories = JSON.parse(JSON.stringify(DEFAULT_SUBCATEGORIES));
                saveSubCategories();
                redeemRules = JSON.parse(JSON.stringify(DEFAULT_REDEEM_RULES));
                saveRedeemRules();
                companies = [];
                saveCompanies();
                reconciliations = [];
                saveReconciliations();
                saveCoa();
                try { localStorage.setItem('hms_cbseq', '0'); } catch (e) {}
                try { localStorage.setItem('hms_jeseq', '0'); } catch (e) {}
                save();
                document.body.removeChild(ov);
                page = 'dashboard';
                render();
                toast('All data cleared. Clean slate ready.');
            };
            input.focus();
        }

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        //  EXPORT
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        function dl(rows, fn) {
            // 1) Preferred: Blob URL. Anchor must be in the DOM, and the URL must not
            //    be revoked until the download has started, or browsers block it.
            try {
                const b = new Blob([rows], { type: 'text/csv;charset=utf-8' });
                const u = URL.createObjectURL(b);
                const a = document.createElement('a');
                a.href = u;
                a.download = fn;
                a.style.display = 'none';
                document.body.appendChild(a);
                a.click();
                setTimeout(() => {
                    document.body.removeChild(a);
                    URL.revokeObjectURL(u);
                }, 2000);
                toast('Downloaded ' + fn);
                return;
            } catch (e1) {
                // fall through
            }
            // 2) Fallback: data URI (works in some environments where blob: is blocked)
            try {
                const a = document.createElement('a');
                a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(rows);
                a.download = fn;
                a.style.display = 'none';
                document.body.appendChild(a);
                a.click();
                setTimeout(() => { document.body.removeChild(a); }, 2000);
                toast('Downloaded ' + fn);
                return;
            } catch (e2) {
                // fall through
            }
            // 3) Last resort: show the content so it can be copied and saved manually
            dlFallbackModal(rows, fn);
        }

        function dlFallbackModal(rows, fn) {
            const b =
                `<div class="alert alert-info" style="margin-bottom:14px;">Your browser blocked the automatic download. Copy the report below and paste it into a file named <strong>${esc(fn)}</strong> (or into Excel).</div>` +
                `<div class="form-group"><textarea id="dl-content" rows="12" readonly style="width:100%;padding:10px;border:1px solid var(--border);border-radius:var(--radius-sm);font-family:monospace;font-size:12px;resize:vertical;background:var(--surface);color:var(--text);white-space:pre;">${esc(rows)}</textarea></div>`;
            const ov = modal('<ion-icon name="document-text"></ion-icon> ' + fn, b, function(ov) {
                const ta = ov.querySelector('#dl-content');
                ta.select();
                ta.setSelectionRange(0, ta.value.length);
                let ok = false;
                try { ok = document.execCommand('copy'); } catch (e) {}
                if (!ok && navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(ta.value).then(() => toast('Copied to clipboard.')).catch(() => {});
                    return false;
                }
                toast(ok ? 'Copied to clipboard.' : 'Select the text and copy it manually.');
                return false;
            }, 'Copy to Clipboard');
            const ta = ov.querySelector('#dl-content');
            ta.focus();
            ta.select();
        }

        function exportGuests() {
            if (!guests.length) { alert('No guests to export yet.'); return; }
            let r = 'Name,Phone,Email,SpendPKR,Points,Stays,LastVisit,JoinDate,Notes\n';
            guests.forEach(g => {
                r +=
                    `"${g.name}","${g.phone}","${g.email||''}",${g.spend},${g.points},${g.stays||0},"${g.lastVisit}","${g.joined}","${g.notes||''}"\n`;
            });
            dl(r, 'guests.csv');
        }

        function exportTx() {
            if (!txs.length) { alert('No bookings to export yet.'); return; }
            let r = 'Date,Guest,Type,Description,Nights,Rooms,PricePerRoom,Subtotal,DiscountApplied,AmountPKR,PaidPKR,BalancePKR,PointsEarned,NonMember,NonMemberName,Company\n';
            txs.forEach(t => {
                const guestName = bookingGuestName(t);
                r +=
                    `"${t.date}","${guestName}","${t.type}","${t.desc||''}",${t.nights||0},${t.rooms||1},${t.pricePerRoom||0},${t.subtotal||0},${t.discountApplied||0},${t.amount},${t.paid||0},${t.balance||0},${t.pts||0},"${t.nonMember?'Yes':'No'}","${t.nonMemberName||''}","${t.isCompany?(t.companyName||''):''}"\n`;
            });
            dl(r, 'bookings.csv');
        }

        // ─── EXPENSE REPORT (CSV) ──────────────────────────────
        function csvCell(v) {
            return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
        }

        function buildExpenseReportCSV(month) {
            const expenses = cashbook.filter(e =>
                e.dir === 'out' &&
                !e.isTransfer && !e.isReplenish &&
                !String(e.catLabel || '').startsWith('Transfer') &&
                getMonthFromDate(e.date) === month
            );
            const byCat = {};
            let grand = 0;
            expenses.forEach(e => {
                const k = e.catLabel || 'Uncategorised';
                if (!byCat[k]) byCat[k] = { count: 0, total: 0 };
                byCat[k].count++;
                byCat[k].total += e.amount;
                grand += e.amount;
            });
            const cats = Object.keys(byCat).sort((a, b) => byCat[b].total - byCat[a].total);
            let out = '';
            out += csvCell('Star Accommodations — Expense Report') + '\n';
            out += csvCell('Month:') + ',' + csvCell(month) + '\n';
            out += csvCell('Generated:') + ',' + csvCell(today()) + '\n';
            out += '\n';
            out += csvCell('Summary by Category') + '\n';
            out += ['Category', 'Entries', 'Total (PKR)'].map(csvCell).join(',') + '\n';
            cats.forEach(c => {
                out += [csvCell(c), csvCell(byCat[c].count), csvCell(byCat[c].total)].join(',') + '\n';
            });
            out += [csvCell('TOTAL'), csvCell(expenses.length), csvCell(grand)].join(',') + '\n';
            out += '\n';
            out += csvCell('Detailed Expenses') + '\n';
            out += ['Date', 'Category', 'Account', 'Reference', 'Description', 'Amount (PKR)'].map(csvCell).join(',') + '\n';
            const sorted = expenses.slice().sort((a, b) => {
                const ca = a.catLabel || '', cb = b.catLabel || '';
                if (ca !== cb) return ca < cb ? -1 : 1;
                if (a.date !== b.date) return a.date < b.date ? -1 : 1;
                return (a.seq || 0) - (b.seq || 0);
            });
            sorted.forEach(e => {
                out += [csvCell(e.date), csvCell(e.catLabel || ''), csvCell(e.account || ''), csvCell(e.ref || ''), csvCell(e.desc || ''), csvCell(e.amount)].join(',') + '\n';
            });
            return { csv: out, count: expenses.length, grand: grand };
        }

        function getExpenseMonths() {
            const current = getCurrentMonth();
            const seen = {};
            cashbook.forEach(e => {
                if (e.dir !== 'out') return;
                if (e.isTransfer || e.isReplenish) return;
                if (String(e.catLabel || '').startsWith('Transfer')) return;
                seen[getMonthFromDate(e.date)] = true;
            });
            seen[current] = true; // always allow the current month
            return Object.keys(seen).sort((a, b) => monthSortKey(b) - monthSortKey(a));
        }

        function openExpenseReport() {
            if (!adminUnlocked) { noticeModal('Admin mode required to download the expense report.', 'Admin required'); return; }
            const months = getExpenseMonths();
            const opts = months.map(m => `<option value="${esc(m)}">${esc(m)}</option>`).join('');
            const b =
                `<div class="alert alert-info" style="margin-bottom:14px;">Choose the month to export. The CSV lists all expenses for that month, grouped by category with totals.</div>` +
                `<div class="form-group"><label>Month</label><select id="er-month">${opts}</select></div>` +
                `<div id="er-summary" class="text-secondary" style="font-size:12px;"></div>`;
            const ov = modal('<ion-icon name="document-text"></ion-icon> Expense Report', b, function(ov) {
                const month = ov.querySelector('#er-month').value;
                const res = buildExpenseReportCSV(month);
                if (!res.count) { noticeModal(`No expenses recorded for ${month}.`, 'Expense Report'); return false; }
                dl(res.csv, 'expense-report-' + month.replace('/', '-') + '.csv');
                return true;
            }, 'Download CSV');
            const sel = ov.querySelector('#er-month');
            const summary = ov.querySelector('#er-summary');
            function upd() {
                const res = buildExpenseReportCSV(sel.value);
                summary.textContent = res.count ?
                    `${res.count} expense ${res.count === 1 ? 'entry' : 'entries'} · ${PKR(res.grand)} total` :
                    'No expenses recorded for this month.';
            }
            sel.onchange = upd;
            upd();
        }

        function exportCashbook() {
            if (!cashbook.length) { alert('No cash book entries yet.'); return; }
            const s = cashbook.slice().sort((a, b) => { if (a.date !== b.date) return a.date < b.date ? -1 : 1; return a
                    .seq - b.seq; });
            let r = 'Date,Ref,Note,Category,Direction,Account,AmountPKR,LedgerAccount,Month,Archived\n';
            s.forEach(e => {
                const acct = methodLabel(e.method, e.cashType);
                r +=
                    `"${e.date}","${e.ref}","${e.desc||''}","${e.catLabel}","${e.dir==='in'?'Money In':'Money Out'}","${acct}",${e.amount},"${e.account}","${e.month||''}","${e.archived?'Yes':'No'}"\n`;
            });
            dl(r, 'cashbook.csv');
        }

        function exportJournal() {
            if (!journal.length) { alert('No ledger lines to export yet.'); return; }
            let r = 'Date,Ref,Account,Description,DebitPKR,CreditPKR,Source\n';
            journal.forEach(j => {
                r +=
                    `"${j.date}","${j.ref||''}","${j.account}","${j.desc||''}",${j.dr},${j.cr},"${j.source||'manual'}"\n`;
            });
            dl(r, 'ledger.csv');
        }

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
