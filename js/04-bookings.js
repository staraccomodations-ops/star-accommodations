        function pageBookings() {
            let sum = 0;
            let totalPoints = 0;
            let totalPaid = 0;
            let totalBalance = 0;
            let totalRedeemed = 0;
            txs.forEach(t => {
                sum += t.amount;
                totalPoints += (t.pts || 0);
                totalPaid += (t.paid || 0);
                totalBalance += (t.balance || 0);
                totalRedeemed += (t.pointsRedeemed || 0);
            });
            let h =
                ``;
            h +=
                `<div class="flex-between" style="margin-bottom:14px;">
                <div> </div><div class="flex gap-8"><button class="btn" onclick="openManageCompanies()"><ion-icon name="business"></ion-icon> Companies</button><button class="btn btn-gold" onclick="openAddTx()"><ion-icon name="add"></ion-icon> New Booking</button></div></div>`;
            if (!txs.length) {
                h += `<div class="panel"><div class="panel-body">${emptyState('<ion-icon name="calendar"></ion-icon>','No bookings yet','Click "New Booking" to log a room stay or charge.')}</div></div>`;
                return h;
            }
            h += `<div class="panel panel-0"><div class="tbl-wrap"><table><thead><tr><th>Date</th><th>Guest</th><th>Description</th><th>Nights</th><th>Paid</th><th>Balance</th><th>Points</th><th style="min-width:120px;">Actions</th></tr></thead><tbody>`;
            txs.forEach(tx => {
                let guestName = bookingGuestName(tx);
                const isOld = isOlderThanWeek(tx.date);
                const canEdit = adminUnlocked || !isOld;
                const editDisabled = !canEdit ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : '';
                const deleteDisabled = !canEdit ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : '';

                // Payment status
                let statusHtml = '';
                const balance = tx.balance || 0;
                if (tx.redemption) {
                    statusHtml = `<span class="redeem-badge"><ion-icon name="gift"></ion-icon> Redeemed</span>`;
                } else if (balance <= 0) {
                    statusHtml = `<span class="paid-check"><ion-icon name="checkmark-circle"></ion-icon></span>`;
                } else {
                    statusHtml = `<span class="balance-badge">Remaining: ${PKR(balance)}</span>`;
                }

                if (tx.redemption) {
                    h +=
                        `<tr><td class="text-secondary">${esc(tx.date)}</td><td style="font-weight:600;">${esc(guestName)} ${statusHtml}</td><td class="text-secondary" style="font-size:12px;">${esc(tx.desc)}</td><td style="text-align:center;">-</td><td class="redeem-out">−${(tx.pointsRedeemed||0).toLocaleString()} pts</td><td class="text-muted">—</td><td style="font-weight:600;">${(tx.pointsBalanceAfter||0).toLocaleString()} pts</td>
                        <td><div class="flex gap-8" style="flex-wrap:wrap;"><button class="btn btn-sm btn-teal" onclick="openEditBooking(${tx.id})" ${editDisabled}><ion-icon name="create"></ion-icon></button><button class="btn btn-sm btn-danger" onclick="deleteBooking(${tx.id})" ${deleteDisabled}><ion-icon name="add" rotate-45></ion-icon></button><button class="btn btn-sm btn-outline-gold" onclick="printReceipt(${tx.id})"><ion-icon name="print"></ion-icon></button></div></td></tr>`;
                    return;
                }

                h +=
                    `<tr><td class="text-secondary">${esc(tx.date)}</td><td style="font-weight:600;">${esc(guestName)} ${statusHtml}</td><td class="text-secondary" style="font-size:12px;">${esc(tx.desc)}</td><td style="text-align:center;">${(tx.nights||0)>0?tx.nights:'-'}</td><td style="font-weight:600;color:var(--teal);">${PKR(tx.paid||0)}</td><td style="font-weight:600;color:${balance>0?'var(--coral)':'var(--teal)'};">${PKR(balance)}</td><td><span class="pts-chip">${(tx.pts||0).toLocaleString()}</span></td>
                    <td><div class="flex gap-8" style="flex-wrap:wrap;"><button class="btn btn-sm btn-teal" onclick="openEditBooking(${tx.id})" ${editDisabled}><ion-icon name="create"></ion-icon></button><button class="btn btn-sm btn-danger" onclick="deleteBooking(${tx.id})" ${deleteDisabled}><ion-icon name="close"></ion-icon></button><button class="btn btn-sm btn-outline-gold" onclick="printReceipt(${tx.id})"><ion-icon name="print"></ion-icon></button></div></td></tr>`;
            });
            h += `</tbody></table></div></div>`;
            return h;
        }

        // ─── GUESTS ─────────────────────────────────────────────
