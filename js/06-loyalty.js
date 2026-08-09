        function pageLoyalty() {
            const T = tierByKey('member');
            let h =
                ``;
            h +=
                `<div class="tier-card" style="border-top:3px solid ${T.color};"><div class="tier-dot" style="background:${T.color};">${T.letter}</div><div style="font-size:20px;font-weight:700;color:${T.color};margin-bottom:4px;">${esc(T.name)}</div><div class="text-secondary" style="font-size:12px;margin-bottom:12px;">All members</div>`;
            h +=
                `<div class="stat-row"><span class="text-secondary">Room discount</span><span style="font-weight:700;color:${T.color};">${T.discount}%</span></div>`;
            h +=
                `<div class="stat-row"><span class="text-secondary">Points earned</span><span style="font-weight:600;">${(redeemRules.earnPerRoom||0).toLocaleString()}/room</span></div>`;
            h +=
                `<div class="stat-row" style="border-bottom:none;"><span class="text-secondary">Current members</span><span style="font-weight:700;">${guests.length}</span></div></div>`;
            h += `<div class="panel" style="margin-top: 20px;"><div class="panel-body"><div class="flex-between" style="align-items:center;"><div class="sec-title" style="margin-bottom:0;"><span class="ic"><ion-icon name="information-circle"></ion-icon></span>Points Rules</div>${adminUnlocked ? `<button class="btn btn-sm btn-gold" onclick="openRedeemRules()"><ion-icon name="settings"></ion-icon> Edit Rules</button>` : ''}</div><div class="grid-3" style="margin-top:12px;">`;
            const rules = [
                ['Points earned', earnRateLabel()],
                ['Free room redemption', freeRoomLabel()],
                ['Redemption value', redeemRateLabel()],
                ['Rewards offered', redeemRules.rewards.length + ' options'],
                ['Discount basis', '10% off room charges']
            ];
            rules.forEach(r => {
                h +=
                    `<div style="background:var(--surface-2);border-radius:var(--radius-sm);padding:12px;"><div class="text-secondary" style="font-size:11px;">${r[0]}</div><div style="font-weight:700;font-size:13px;">${r[1]}</div></div>`;
            });
            h += `</div></div></div>`;
            h +=
                ``;
            return h;
        }

        // ─── ANALYTICS ──────────────────────────────────────────
        // ─── DAILY BUSINESS TIP ────────────────────────────────
        const MARKETING_TIPS = [
            'Ask every happy guest to leave a Google review — most Pakistani travellers check Maps ratings before booking.',
            'Offer a small discount for direct WhatsApp bookings to cut commission paid to booking sites.',
            'Keep rooms listed on Booking.com and local sites, but nudge repeat guests to book with you directly.',
            'Send a warm Eid or festival greeting to past guests on WhatsApp to stay top of mind.',
            'Partner with nearby wedding halls and offer discounted room blocks for out-of-town baraat guests.',
            'Photograph your cleanest, brightest room in daylight — good photos lift bookings more than price cuts.',
            'Advertise fast, reliable Wi-Fi in your listing; it is a top deciding factor for guests.',
            'Add a simple complimentary breakfast (paratha, egg, chai) — it is cheap and boosts your rating.',
            'Collect guest phone numbers at check-in and message a return-visit offer a month later.',
            'List clear directions and a nearby landmark; many guests struggle with exact addresses.',
            'Raise rates during wedding and holiday seasons, and keep weekdays flexible to fill rooms.',
            'Train staff to greet each guest by name — personal service drives word-of-mouth referrals.',
            'Offer airport or bus-stand pickup for a small fee; convenience wins out-of-town bookings.',
            'Run a referral scheme: a returning guest who brings a friend gets a free night or discount.',
            'Reply politely to every online review, good or bad — future guests read your responses.',
            'Put a small welcome card in each room listing nearby mosques, food, and attractions.',
            'Keep washrooms spotless; cleanliness is the single biggest driver of good reviews here.',
            'Post a monthly photo update on Facebook and Instagram; locals discover hotels there.',
            'Offer corporate rates to nearby offices and factories for their visiting staff and clients.',
            'Bundle a family package (extra bed + breakfast) during summer and school holidays.',
            'Keep a reliable generator ready — dependable power during load-shedding is a real selling point.',
            'Send a thank-you message after checkout and ask for a review while the stay is fresh.',
            'Stock bottled water, tea, and a clean prayer mat in every room — small touches get remembered.',
            'Review which rooms and months earn the most, and focus marketing on your slow periods.'
        ];

        function getDailyTip() {
            const now = new Date();
            const start = new Date(now.getFullYear(), 0, 0);
            const dayOfYear = Math.floor((now - start) / 86400000);
            return MARKETING_TIPS[((dayOfYear % MARKETING_TIPS.length) + MARKETING_TIPS.length) % MARKETING_TIPS.length];
        }

