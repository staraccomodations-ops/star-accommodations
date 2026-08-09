        function pageAnalytics() {
            const t = totals();
            const now = new Date();
            const thirtyDaysAgo = new Date(now);
            thirtyDaysAgo.setDate(now.getDate() - 30);
            const cutoff = thirtyDaysAgo.toISOString().slice(0, 10);

            const guestSpend = {};
            const guestNights = {};
            txs.forEach(tx => {
                if (tx.date < cutoff || tx.nonMember) return;
                const gId = tx.gId;
                if (!guestSpend[gId]) guestSpend[gId] = 0;
                guestSpend[gId] += tx.amount;
                if (tx.nights) {
                    if (!guestNights[gId]) guestNights[gId] = 0;
                    guestNights[gId] += tx.nights;
                }
            });
            const topGuests30 = Object.keys(guestSpend).map(gId => {
                const g = byId(guests, parseInt(gId));
                return { guest: g, spend: guestSpend[gId], nights: guestNights[gId] || 0 };
            }).filter(item => item.guest).sort((a, b) => b.spend - a.spend).slice(0, 5);

            const monthly = monthlyRevenue();
            let maxBar = 0;
            monthly.forEach(r => { if (r.v > maxBar) maxBar = r.v; });

            const dailyTip = getDailyTip();

            let h =
                ``;

            h +=
                ``;

            const total30 = Object.values(guestSpend).reduce((a, b) => a + b, 0);
            const uniqueGuests30 = Object.keys(guestSpend).length;

            h += `<div class="grid-4" style="margin-bottom:20px;">`;
            h +=
                `<div class="card"><div class="card-label">30‑Day Revenue</div><div class="card-value gold-t">${PKR(total30)}</div><div class="card-sub">From ${uniqueGuests30} guests</div></div>`;
            h +=
                `<div class="card"><div class="card-label">Avg. Daily Revenue</div><div class="card-value">${PKR(total30/30)}</div><div class="card-sub">Last 30 days</div></div>`;
            h +=
                `<div class="card"><div class="card-label">Total Members</div><div class="card-value">${guests.length}</div><div class="card-sub">All time</div></div>`;
            h +=
                `<div class="card"><div class="card-label">Points Liability</div><div class="card-value coral-t">${PKR(pointsValue(t.pts))}</div><div class="card-sub">Redeemable value</div></div>`;
            h += `</div>`;

            h += `<div class="panel" style="margin-bottom:16px;"><div class="panel-body"><div class="sec-title"><span class="ic"><ion-icon name="bar-chart"></ion-icon></span>Monthly Revenue (PKR)</div>`;
            if (monthly.length) {
                h += `<div class="chart-bars">`;
                monthly.forEach(r => {
                    const pct = maxBar > 0 ? (r.v / maxBar) * 100 : 0;
                    h +=
                        `<div class="bar-col"><div class="bar-val">${r.v >= 1000 ? Math.round(r.v/1000)+'K' : r.v}</div><div class="bar-rect" style="height:${Math.max(4, pct)}px"></div><div class="bar-lbl">${r.m}</div></div>`;
                });
                h += `</div>`;
            } else h += emptyState('<ion-icon name="bar-chart"></ion-icon>', 'No revenue data', 'Record bookings to see your revenue trend.');
            h += `</div></div>`;

            h += `<div class="panel"><div class="panel-body"><div class="sec-title"><span class="ic">👑</span>Top Guests (Last 30 Days)</div>`;
            if (topGuests30.length) {
                topGuests30.forEach((item, i) => {
                    const g = item.guest;
                    h +=
                        `<div class="stat-row"><div class="flex gap-8" style="align-items:center;"><div style="width:28px;height:28px;border-radius:50%;background:var(--gold-light);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:var(--gold-dark);">${i+1}</div><div><div style="font-weight:600;font-size:13px;">${esc(g.name)}</div>${tierBadge('member')}</div></div><div style="text-align:right;"><div style="font-weight:700;color:var(--gold-dark);">${PKR(item.spend)}</div><div class="text-muted" style="font-size:11px;">${item.nights} nights</div></div></div>`;
                });
            } else {
                h += emptyState('<ion-icon name="person"></ion-icon>', 'No guest activity in last 30 days', 'Book some stays to see top performers.');
            }
            h += `</div></div>`;

            // h += `<div class="panel" style="margin-top:16px;"><div class="panel-body"><div class="sec-title"><span class="ic"><ion-icon name="bulb"></ion-icon></span>Campaign Ideas</div>`;
            // const camps = [
            //     ['Member', 'Priority booking, free breakfast, referral bonus', '#C9A84C']
            // ];
            // camps.forEach(c => {
            //     h +=
            //         `<div style="margin-bottom:10px;padding:10px 14px;background:var(--surface-2);border-radius:var(--radius-sm);border-left:3px solid ${c[2]};"><div class="flex-between" style="margin-bottom:4px;"><span style="font-weight:700;font-size:13px;color:${c[2]};">${c[0]}</span><span class="text-secondary" style="font-size:12px;">${guests.length} members</span></div><div class="text-secondary" style="font-size:12px;">${c[1]}</div></div>`;
            // });
            h += `</div></div>`;

            return h;
        }

        // ─── CASH BOOK ──────────────────────────────────────────
