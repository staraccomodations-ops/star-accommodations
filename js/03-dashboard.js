        function pageDashboard() {
            const t = totals();
            const monthly = monthlyRevenue();
            let maxBar = 0;
            monthly.forEach(r => { if (r.v > maxBar) maxBar = r.v; });
            const T = tierByKey('member');

            let h =
                ``;

            // First-time sync hint: only shown before the user has ever set up sync AND
            // has dismissed it. Encourages setup or explicit dismissal.
            if (!loadOr('hms_sync_hint_dismissed', false) && syncState === 'off' && !!window.showSaveFilePicker) {
                h +=
                    `<div class="alert alert-info" style="display:flex;align-items:flex-start;gap:12px;margin-bottom:16px;">` +
                    `<div style="font-size:24px;line-height:1;"><ion-icon name="sync-circle"></ion-icon></div>` +
                    `<div style="flex:1;">` +
                    `<div style="font-weight:700;margin-bottom:4px;">Want this data on your other computers?</div>` +
                    `<div style="font-size:13px;margin-bottom:10px;">Star Accommodations can save all your data to a file inside your Dropbox or Google Drive folder. Every change syncs to your other computers automatically. Takes 2 minutes to set up.</div>` +
                    `<div class="flex gap-8" style="flex-wrap:wrap;"><button class="btn btn-sm btn-gold" onclick="openSyncInstructions()">Show me how</button><button class="btn btn-sm" onclick="go('settings')"><ion-icon name="settings"></ion-icon> Open Settings</button><button class="btn btn-sm" onclick="dismissSyncHint()">Dismiss</button></div>` +
                    `</div></div>`;
            }

            h += `<div class="grid-4" style="margin-bottom:20px;">`;
            h +=
                `<div class="card"><div class="card-label">Total Members</div><div class="card-value">${guests.length}</div><div class="card-sub">Registered guests</div></div>`;
            h +=
                `<div class="card"><div class="card-label">Total Revenue</div><div class="card-value gold-t">${PKR(t.rev)}</div><div class="card-sub">From all transactions</div></div>`;
            h +=
                `<div class="card"><div class="card-label">Points Issued</div><div class="card-value teal-t">${t.pts >= 1000 ? Math.round(t.pts/1000)+'K' : t.pts.toLocaleString()}</div><div class="card-sub">Across all members</div></div>`;
            h +=
                `<div class="card"><div class="card-label">${esc(T.name)} Benefits</div><div class="card-value navy-t">${T.discount}% off · ${(redeemRules.earnPerRoom||0).toLocaleString()} pts/room</div><div class="card-sub">All members enjoy the same perks</div></div>`;
            h += `</div>`;

            h += `<div class="grid-2" style="margin-bottom:16px;">`;
            h += `<div class="panel"><div class="panel-body"><div class="sec-title"><span class="ic"><ion-icon name="bar-chart"></ion-icon></span>Monthly Revenue (PKR)</div>`;
            if (monthly.length) {
                h += `<div class="chart-bars">`;
                monthly.forEach(r => {
                    const pct = maxBar > 0 ? (r.v / maxBar) * 100 : 0;
                    h +=
                        `<div class="bar-col"><div class="bar-val">${r.v >= 1000 ? Math.round(r.v/1000)+'K' : r.v}</div><div class="bar-rect" style="height:${Math.max(4, pct)}px"></div><div class="bar-lbl">${r.m}</div></div>`;
                });
                h += `</div>`;
            } else h += emptyState('<ion-icon name="bar-chart"></ion-icon>', 'No revenue yet', 'Record transactions to see your monthly revenue chart.');
            h += `</div></div>`;

            h += `<div class="panel"><div class="panel-body"><div class="sec-title"><span class="ic"><ion-icon name="people" ></ion-icon></span>Member Overview</div>`;
            h +=
                `<div style="margin-bottom:12px;"><div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px;"><span style="font-weight:600;">All members</span><span class="text-secondary">${guests.length} members · ${T.discount}% discount · ${earnRateLabel()}</span></div><div class="prog-wrap"><div class="prog-bar" style="width:100%;background:${T.color};"></div></div></div>`;
            h += `</div></div></div>`;

            h +=
                `<div class="panel panel-0"><div class="panel-head"><div class="sec-title" style="margin-bottom:0;"><span class="ic"><ion-icon name="time" ></ion-icon></span>Recent Bookings</div></div>`;
            if (txs.length) {
                h += `<div class="tbl-wrap"><table><thead><tr><th>Guest</th><th>Type</th><th>Amount</th><th>Points</th><th>Date</th></tr></thead><tbody>`;
                txs.slice(0, 5).forEach(tx => {
                    let guestName = bookingGuestName(tx);
                    h +=
                        `<tr><td style="font-weight:600;">${esc(guestName)}</td><td>${esc(tx.type)}</td><td style="font-weight:700;color:var(--gold-dark);">${PKR(tx.amount)}</td><td><span class="pts-chip">${(tx.pts||0).toLocaleString()}</span></td><td class="text-secondary">${esc(tx.date)}</td></tr>`;
                });
                h += `</tbody></table></div>`;
            } else h += emptyState('<ion-icon name="calendar"></ion-icon>', 'No bookings yet', 'Record guest stays on the Bookings page.');
            h += `</div>`;

            h +=
                `<div class="flex gap-12" style="margin-top:16px;flex-wrap:wrap;"><button class="btn btn-gold" onclick="openAddGuest()"><ion-icon name="add"></ion-icon> Add Guest</button><button class="btn btn-primary" onclick="openAddTx()"><ion-icon name="calendar"></ion-icon> New Booking</button><button class="btn" onclick="openCashEntry()"><ion-icon name="wallet"></ion-icon> Cash Entry</button></div>`;

            return h;
        }

        // ─── BOOKINGS ──────────────────────────────────────────
