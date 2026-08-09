        function pageGuests() {
            let h =
                ``;
            h +=
                `<div class="flex flex-between gap-12" style="margin-bottom:16px;flex-wrap:wrap;"><input style="max-width:320px;" id="search-in" placeholder="Search by name, phone, or email..." value="${esc(search)}" oninput="onSearch(this.value)"><button class="btn btn-gold" onclick="openAddGuest()"><ion-icon name="add"></ion-icon> Add Guest</button></div>`;
            if (!guests.length) {
                h += `<div class="panel"><div class="panel-body">${emptyState('<ion-icon name="person"></ion-icon>','No guests registered yet','Click "+ Add Guest" above to register your first member.')}</div></div>`;
                return h;
            }
            const list = guests.filter(g => {
                const s = search.toLowerCase();
                return g.name.toLowerCase().indexOf(s) >= 0 ||
                    g.phone.indexOf(search) >= 0 ||
                    (g.email || '').toLowerCase().indexOf(s) >= 0;
            });
            h += `<div class="panel panel-0"><div class="tbl-wrap"><table><thead><tr><th>Name</th><th>Phone</th><th>Email</th><th>Status</th><th>Spend</th><th>Points</th><th></th></tr></thead><tbody>`;
            if (list.length) {
                list.forEach(g => {
                    resetTierIfInactive(g);
                    h +=
                        `<tr><td style="font-weight:600;">${esc(g.name)}</td><td class="text-secondary">${esc(g.phone)}</td><td class="text-secondary" style="font-size:12px;">${esc(g.email)}</td><td>${tierBadge('member')}</td><td style="font-weight:700;color:var(--gold-dark);">${PKR(g.spend)}</td><td><span class="pts-chip">${g.points.toLocaleString()}</span></td><td><button class="btn btn-sm" onclick="viewGuest(${g.id})">View</button></td></tr>`;
                });
            } else {
                h +=
                    `<tr><td colspan="7"><div class="empty"><div class="empty-title">No guests match your search</div></div></td></tr>`;
            }
            h += `</tbody></table></div></div>`;
            return h;
        }

        function pageGuestDetail() {
            const g = byId(guests, selGuestId);
            if (!g) return pageGuests();
            resetTierIfInactive(g);
            const T = tierByKey('member');
            const gTxs = txs.filter(t => t.gId === g.id && !t.nonMember);

            let h =
                `<button class="btn btn-ghost" style="margin-bottom:16px;" onclick="go('guests')"><ion-icon name="arrow-back-outline"></ion-icon> Back to Registry</button>`;
            h += `<div class="grid-2" style="margin-bottom:16px;">`;

            h += `<div class="panel"><div class="panel-body">`;
            h +=
                `<div class="flex gap-12" style="align-items:center;margin-bottom:14px;"><div class="tier-dot" style="background:${T.color};">${T.letter}</div><div><div style="font-size:20px;font-weight:700;">${esc(g.name)}</div>${tierBadge('member')} <span class="text-secondary" style="font-size:12px;">${T.discount}% discount · ${earnRateLabel()}</span></div></div>`;
            h += `<hr class="hr-div">`;
            h +=
                `<div class="stat-row"><span class="text-secondary">Phone</span><span>${esc(g.phone)}</span></div>`;
            h +=
                `<div class="stat-row"><span class="text-secondary">Email</span><span>${esc(g.email||'-')}</span></div>`;
            h +=
                `<div class="stat-row"><span class="text-secondary">Member Since</span><span>${esc(g.joined)}</span></div>`;
            h +=
                `<div class="stat-row"><span class="text-secondary">Stays / Last Visit</span><span>${g.stays||0} stays · ${esc(g.lastVisit)}</span></div>`;
            if (g.notes) h +=
                `<div style="margin-top:10px;padding:8px 12px;background:var(--surface-2);border-radius:var(--radius-sm);font-size:12px;color:var(--text-secondary);"><ion-icon name="reader"></ion-icon> ${esc(g.notes)}</div>`;
            h += `</div></div>`;

            h += `<div class="panel"><div class="panel-body">`;
            h += `<div class="sec-title"><span class="ic"><ion-icon name="ribbon"></ion-icon></span>Member Benefits</div>`;
            h +=
                `<div class="grid-2" style="margin-bottom:14px;"><div style="text-align:center;padding:12px;background:var(--surface-2);border-radius:var(--radius-sm);"><div class="text-secondary" style="font-size:11px;">Room Discount</div><div style="font-size:22px;font-weight:700;color:var(--gold-dark);">${T.discount}%</div></div><div style="text-align:center;padding:12px;background:var(--surface-2);border-radius:var(--radius-sm);"><div class="text-secondary" style="font-size:11px;">Points Earned</div><div style="font-size:22px;font-weight:700;color:var(--gold-dark);">${(redeemRules.earnPerRoom||0).toLocaleString()}/room</div></div></div>`;
            h += `<hr class="hr-div">`;
            h +=
                `<div class="text-secondary" style="font-size:12px;">Total spend: <strong>${PKR(g.spend)}</strong></div>`;
            h +=
                `<div class="text-secondary" style="font-size:12px;margin-top:4px;">Points balance: <strong>${g.points.toLocaleString()}</strong></div>`;
            h +=
                `<div class="text-secondary" style="font-size:12px;margin-top:4px;">Redeemable value: <strong>${PKR(pointsValue(g.points))}</strong> (${redeemRateLabel()})</div>`;
            h +=
                `<div style="margin-top:14px;"><button class="btn btn-gold" onclick="openRedeemPoints(${g.id})" ${g.points > 0 ? '' : 'disabled style="opacity:.5;cursor:not-allowed;"'}><ion-icon name="gift"></ion-icon> Redeem Points</button></div>`;
            h += `</div></div></div>`;

            h +=
                `<div class="panel panel-0"><div class="panel-head"><div class="sec-title" style="margin-bottom:0;"><span class="ic"><ion-icon name="calendar"></ion-icon></span>Booking History</div></div>`;
            if (gTxs.length) {
                h += `<div class="tbl-wrap"><table><thead><tr><th>Date</th><th>Type</th><th>Description</th><th>Nights</th><th>Amount</th><th>Paid</th><th>Balance</th><th>Points</th></tr></thead><tbody>`;
                gTxs.forEach(tx => {
                    if (tx.redemption) {
                        h +=
                            `<tr><td class="text-secondary">${esc(tx.date)}</td><td><ion-icon name="gift"></ion-icon> ${esc(tx.type)}</td><td class="text-secondary" style="font-size:12px;">${esc(tx.desc)}</td><td style="text-align:center;">-</td><td class="text-muted">—</td><td class="redeem-out">−${(tx.pointsRedeemed||0).toLocaleString()} pts</td><td style="font-weight:600;">${(tx.pointsBalanceAfter||0).toLocaleString()} pts</td><td class="text-muted">—</td></tr>`;
                        return;
                    }
                    h +=
                        `<tr><td class="text-secondary">${esc(tx.date)}</td><td>${esc(tx.type)}</td><td class="text-secondary" style="font-size:12px;">${esc(tx.desc)}</td><td style="text-align:center;">${(tx.nights||0)>0?tx.nights:'-'}</td><td style="font-weight:700;color:var(--gold-dark);">${PKR(tx.amount)}</td><td style="font-weight:600;color:var(--teal);">${PKR(tx.paid||0)}</td><td style="font-weight:600;color:${(tx.balance||0)>0?'var(--coral)':'var(--teal)'};">${PKR(tx.balance||0)}</td><td><span class="pts-chip">${(tx.pts||0).toLocaleString()}</span></td></tr>`;
                });
                h += `</tbody></table></div>`;
            } else h += emptyState('<ion-icon name="calendar"></ion-icon>', 'No bookings yet', 'This guest has no recorded stays.');
            h += `</div>`;
            return h;
        }

        // ─── LOYALTY INFO ──────────────────────────────────────
