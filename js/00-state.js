        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        //  HELPERS
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        const PKR = (n) => 'Rs. ' + Math.round(n).toLocaleString('en-PK');
        const esc = (s) => ('' + (s == null ? '' : s)).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
        const today = () => { const d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); };
        const byId = (arr, id) => { for (let i = 0; i < arr.length; i++) { if (arr[i].id === id) return arr[i]; } return null; };
        const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
        const pad3 = (n) => { n = '' + n; while (n.length < 3) n = '0' + n; return n; };

        // Check if a date is older than 7 days
        function isOlderThanWeek(dateStr) {
            const entryDate = new Date(dateStr);
            const now = new Date();
            const diffTime = now - entryDate;
            const diffDays = diffTime / (1000 * 60 * 60 * 24);
            return diffDays > 7;
        }

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        //  ARCHIVE HELPERS
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        function getCurrentMonth() {
            const d = new Date();
            return ('0' + (d.getMonth() + 1)).slice(-2) + '/' + d.getFullYear();
        }

        function getPreviousMonth() {
            const d = new Date();
            d.setMonth(d.getMonth() - 1);
            return ('0' + (d.getMonth() + 1)).slice(-2) + '/' + d.getFullYear();
        }

        function getMonthFromDate(dateStr) {
            const s = String(dateStr);
            const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
            if (m) return m[2] + '/' + m[1];
            const d = new Date(dateStr);
            return ('0' + (d.getMonth() + 1)).slice(-2) + '/' + d.getFullYear();
        }

        function isFirstMonday(dateStr) {
            const d = new Date(dateStr);
            return d.getDay() === 1 && d.getDate() <= 7;
        }

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        //  CONFIG – Single tier: Member (10% discount, points per room — see redeemRules.earnPerRoom)
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        const DEFAULT_TIERS = [
            { key: 'member', name: 'Member', minNights: 0, discount: 10, mult: 0.05, color: '#C9A84C', letter: 'M' }
        ];

        // BASE COA – we'll merge with user-added accounts
        const BASE_COA = {
            'Assets': {
                color: '#0F6E56',
                accts: [
                    { code: '1001', name: 'General Cash', type: 'debit' },
                    { code: '1001.1', name: 'Petty Cash', type: 'debit' },
                    { code: '1002', name: 'Bank Account', type: 'debit' },
                    { code: '1003', name: 'Credit Card Account', type: 'debit' },
                    { code: '1101', name: 'Accounts Receivable - Guests', type: 'debit' },
                    { code: '1102', name: 'Accounts Receivable - Corporate', type: 'debit' },
                    { code: '1201', name: 'Prepaid Expenses', type: 'debit' },
                    { code: '1301', name: 'Inventory - F&B', type: 'debit' },
                    { code: '1302', name: 'Inventory - Housekeeping Supplies', type: 'debit' },
                    { code: '1501', name: 'Property & Building', type: 'debit' },
                    { code: '1502', name: 'Furniture & Fixtures', type: 'debit' },
                    { code: '1503', name: 'Accumulated Depreciation', type: 'credit' }
                ]
            },
            'Liabilities': {
                color: '#D85A30',
                accts: [
                    { code: '2001', name: 'Accounts Payable - Vendors', type: 'credit' },
                    { code: '2101', name: 'Guest Deposits & Advances', type: 'credit' },
                    { code: '2102', name: 'Loyalty Points Liability', type: 'credit' },
                    { code: '2201', name: 'Sales Tax Payable (17% GST)', type: 'credit' },
                    { code: '2202', name: 'Withholding Tax (WHT) Payable', type: 'credit' },
                    { code: '2301', name: 'Salaries Payable', type: 'credit' },
                    { code: '2401', name: 'Short-term Bank Loans', type: 'credit' },
                    { code: '2501', name: 'Long-term Mortgage', type: 'credit' }
                ]
            },
            'Equity': {
                color: '#7F77DD',
                accts: [
                    { code: '3001', name: "Owner's Capital", type: 'credit' },
                    { code: '3002', name: 'Retained Earnings', type: 'credit' },
                    { code: '3003', name: 'Current Year Profit / Loss', type: 'credit' },
                    { code: '3004', name: "Owner's Drawings", type: 'debit' }
                ]
            },
            'Revenue': {
                color: '#C9A84C',
                accts: [
                    { code: '4001', name: 'Room Revenue', type: 'credit' },
                    { code: '4002', name: 'Suite Revenue', type: 'credit' },
                    { code: '4101', name: 'Food & Beverage - Restaurant', type: 'credit' },
                    { code: '4102', name: 'Food & Beverage - Room Service', type: 'credit' },
                    { code: '4103', name: 'Food & Beverage - Banquets', type: 'credit' },
                    { code: '4201', name: 'Conference & Events Revenue', type: 'credit' },
                    { code: '4301', name: 'Loyalty Redemption Discount (contra)', type: 'debit' },
                    { code: '4401', name: 'Miscellaneous Revenue', type: 'credit' }
                ]
            },
            'Cost of Sales': {
                color: '#BA7517',
                accts: [
                    { code: '5001', name: 'Room Supplies & Amenities', type: 'debit' },
                    { code: '5101', name: 'F&B Cost of Goods Sold', type: 'debit' },
                    { code: '5201', name: 'Laundry & Linen', type: 'debit' }
                ]
            },
            'Operating Expenses': {
                color: '#533AB7',
                accts: [
                    { code: '6001', name: 'Salaries - Front Desk', type: 'debit' },
                    { code: '6002', name: 'Salaries - Housekeeping', type: 'debit' },
                    { code: '6003', name: 'Salaries - Kitchen', type: 'debit' },
                    { code: '6004', name: 'Salaries - Management', type: 'debit' },
                    { code: '6101', name: 'Electricity & WAPDA', type: 'debit' },
                    { code: '6102', name: 'Gas (SNGPL)', type: 'debit' },
                    { code: '6103', name: 'Water & Sewerage', type: 'debit' },
                    { code: '6201', name: 'Marketing & Advertising', type: 'debit' },
                    { code: '6202', name: 'Website & Online Platforms', type: 'debit' },
                    { code: '6301', name: 'Repairs & Maintenance', type: 'debit' },
                    { code: '6401', name: 'Depreciation Expense', type: 'debit' },
                    { code: '6501', name: 'Insurance', type: 'debit' },
                    { code: '6601', name: 'Bank Charges', type: 'debit' },
                    { code: '6701', name: 'Loyalty Program Cost', type: 'debit' },
                    { code: '6801', name: 'Miscellaneous Expense', type: 'debit' },
                    { code: '6802', name: 'Cash Over / Short', type: 'debit' }
                ]
            }
        };

        // Default cash categories – will be merged with user-added ones
        const DEFAULT_CASH_CATEGORIES = [
            { label: 'Room income', dir: 'in', account: 'Room Revenue', reg: true, custom: false },
            { label: 'Room service income', dir: 'in', account: 'Food & Beverage - Room Service', reg: true,
            custom: false },
            { label: 'Suite income', dir: 'in', account: 'Suite Revenue', reg: false, custom: false },
            { label: 'Restaurant income', dir: 'in', account: 'Food & Beverage - Restaurant', reg: false,
            custom: false },
            { label: 'Events / banquet income', dir: 'in', account: 'Conference & Events Revenue', reg: false,
                custom: false },
            { label: 'Other income', dir: 'in', account: 'Miscellaneous Revenue', reg: false, custom: false },
            { label: 'Supplies', dir: 'out', account: 'Room Supplies & Amenities', reg: true, custom: false },
            { label: 'Food & drink stock', dir: 'out', account: 'F&B Cost of Goods Sold', reg: true, custom: false },
            { label: 'Laundry & linen', dir: 'out', account: 'Laundry & Linen', reg: true, custom: false },
            { label: 'Electricity bill', dir: 'out', account: 'Electricity & WAPDA', reg: true, custom: false },
            { label: 'Gas bill', dir: 'out', account: 'Gas (SNGPL)', reg: true, custom: false },
            { label: 'Water bill', dir: 'out', account: 'Water & Sewerage', reg: true, custom: false },
            { label: 'Repairs & maintenance', dir: 'out', account: 'Repairs & Maintenance', reg: true,
            custom: false },
            { label: 'Staff wages / salary', dir: 'out', account: 'Salaries - Management', reg: false, custom: false },
            { label: 'Marketing & ads', dir: 'out', account: 'Marketing & Advertising', reg: false, custom: false },
            { label: 'Website & online', dir: 'out', account: 'Website & Online Platforms', reg: false,
            custom: false },
            { label: 'Insurance', dir: 'out', account: 'Insurance', reg: false, custom: false },
            { label: 'Bank charges', dir: 'out', account: 'Bank Charges', reg: false, custom: false },
            { label: 'Other expense', dir: 'out', account: 'Miscellaneous Expense', reg: false, custom: false },
            { label: "Owner's Capital", dir: 'in', account: "Owner's Capital", reg: false, custom: false },
            { label: "Owner's Drawings", dir: 'out', account: "Owner's Drawings", reg: false, custom: false }
        ];

        // Sub-categories (common items) shown when a parent category is selected in the Cash Book.
        // Keyed by the parent category label. Editable in Admin mode.
        const DEFAULT_SUBCATEGORIES = {
            'Supplies': [
                'Toiletries (soap, shampoo)',
                'Towels & bed linen',
                'Toilet rolls & tissues',
                'Cleaning supplies (phenyl, Surf, bleach)',
                'Room fresheners & sprays',
                'Slippers & disposables',
                'Tea, coffee & sugar sachets',
                'Mineral water bottles',
                'Crockery & cutlery',
                'Light bulbs & batteries',
                'Stationery & printing',
                'Garbage bags'
            ],
            'Food & drink stock': [
                'Meat & chicken',
                'Vegetables & fruit',
                'Rice, atta & pulses',
                'Cooking oil & ghee',
                'Spices & masala',
                'Milk, yogurt & butter',
                'Eggs',
                'Bread & bakery',
                'Tea, coffee & sugar',
                'Soft drinks & juices',
                'Mineral water',
                'Naan / roti supplies'
            ],
            'Repairs & maintenance': [
                'Plumbing (taps, pipes, geyser)',
                'Electrical (wiring, switches, fans)',
                'AC service & repair',
                'Generator / UPS maintenance',
                'Painting & whitewash',
                'Carpentry (doors, furniture)',
                'Masonry & civil work',
                'Water motor / pump repair',
                'Appliance repair',
                'Lift / elevator maintenance',
                'Pest control',
                'General handyman work'
            ]
        };

        // Loyalty redemption rules (editable in Admin mode)
        const DEFAULT_REDEEM_RULES = {
            ratePer1000: 10,           // Rs. value per 1,000 points (used for redeemable-value display)
            minPoints: 6000,           // minimum points per redemption — 6,000 pts = 1 free room
            earnPerRoom: 1000,         // points earned per room per booking
            rewards: ['Free room', 'Room upgrade', 'Room discount', 'Restaurant / F&B voucher', 'Late checkout', 'Other reward']
        };

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        //  STATE
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        const loadOr = (key, def) => { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; } catch (
            e) { return def; } };

        let tiers = loadOr('hms_tiers', JSON.parse(JSON.stringify(DEFAULT_TIERS)));
        let guests = loadOr('hms_guests', []);
        let txs = loadOr('hms_txs', []);
        let journal = loadOr('hms_journal', []);
        let cashbook = loadOr('hms_cashbook', []);
        let cbSeq = loadOr('hms_cbseq', 0);
        let jeSeq = loadOr('hms_jeseq', 0);
        let archivedCashbooks = loadOr('hms_archived_cashbooks', {});
        let verifiers = loadOr('hms_verifiers', ['AQ', 'NM']);
        let companies = loadOr('hms_companies', []);
        let page = 'dashboard';
        let selGuestId = null;
        let search = '';
        let cbSearch = '';
        let cbFilterCat = '';
        let cbFilterMethod = '';
        let cbFilterDir = '';
        let reconciliations = loadOr('hms_reconciliations', []);
        let accTab = 'overview';
        let acctPeriod = 'this-month';
        let acctFrom = '';
        let acctTo = '';
        let glAccount = null;
        let jeSearch = '';
        let glFrom = '';
        let glTo = '';
        let coaOpen = {};
        let adminUnlocked = false;
        let adminPass = loadOr('hms_adminpass', null);
        let darkMode = loadOr('hms_darkmode', false);

        // Load COA with user-added accounts
        let coa = loadOr('hms_coa', JSON.parse(JSON.stringify(BASE_COA)));
        // Migration: add Owner's Drawings account to installs that predate it
        if (coa['Equity'] && !coa['Equity'].accts.some(a => a.name === "Owner's Drawings")) {
            coa['Equity'].accts.push({ code: '3004', name: "Owner's Drawings", type: 'debit' });
            saveCoa();
        }

        // Load cash categories (merge defaults + user-added)
        let cashCategories = loadOr('hms_cash_categories', null);
        if (!cashCategories) {
            cashCategories = JSON.parse(JSON.stringify(DEFAULT_CASH_CATEGORIES));
            saveCashCategories();
        }
        // Migration: add Owner's Capital / Owner's Drawings categories to installs that predate them
        if (!cashCategories.some(c => c.label === "Owner's Capital")) {
            cashCategories.push({ label: "Owner's Capital", dir: 'in', account: "Owner's Capital", reg: false, custom: false });
            saveCashCategories();
        }
        if (!cashCategories.some(c => c.label === "Owner's Drawings")) {
            cashCategories.push({ label: "Owner's Drawings", dir: 'out', account: "Owner's Drawings", reg: false, custom: false });
            saveCashCategories();
        }

        // Load sub-categories (common items per parent category)
        let subCategories = loadOr('hms_subcategories', null);
        if (!subCategories) {
            subCategories = JSON.parse(JSON.stringify(DEFAULT_SUBCATEGORIES));
            saveSubCategories();
        }

        // Load redemption rules
        let redeemRules = loadOr('hms_redeem_rules', null);
        if (!redeemRules) {
            redeemRules = JSON.parse(JSON.stringify(DEFAULT_REDEEM_RULES));
            saveRedeemRules();
        }
        if (typeof redeemRules.ratePer1000 !== 'number') redeemRules.ratePer1000 = 10;
        if (typeof redeemRules.minPoints !== 'number') redeemRules.minPoints = 0;
        if (typeof redeemRules.earnPerRoom !== 'number') redeemRules.earnPerRoom = 1000;
        if (!Array.isArray(redeemRules.rewards) || !redeemRules.rewards.length) redeemRules.rewards = DEFAULT_REDEEM_RULES.rewards.slice();

        // ─── MIGRATE COA (rename old accounts, add new ones) ───
        function migrateCoa() {
            let updated = false;
            if (!coa.Assets) return;

            // Rename 'Cash on Hand' to 'General Cash'
            const cashOnHand = coa.Assets.accts.find(a => a.name === 'Cash on Hand');
            if (cashOnHand) {
                cashOnHand.name = 'General Cash';
                updated = true;
            }

            // Add 'Petty Cash' if it doesn't exist
            if (!coa.Assets.accts.find(a => a.name === 'Petty Cash')) {
                coa.Assets.accts.push({ code: '1001.1', name: 'Petty Cash', type: 'debit' });
                updated = true;
            }

            // Rename 'Bank Account - HBL' to 'Bank Account'
            const hblAcct = coa.Assets.accts.find(a => a.name === 'Bank Account - HBL');
            if (hblAcct) {
                hblAcct.name = 'Bank Account';
                updated = true;
            } else if (!coa.Assets.accts.find(a => a.name === 'Bank Account')) {
                coa.Assets.accts.push({ code: '1002', name: 'Bank Account', type: 'debit' });
                updated = true;
            }

            // Add 'Credit Card Account' if it doesn't exist (for the Credit Card payment method)
            if (!coa.Assets.accts.find(a => a.name === 'Credit Card Account')) {
                coa.Assets.accts.push({ code: '1003', name: 'Credit Card Account', type: 'debit', opening: 0 });
                updated = true;
            }

            // Add 'Cash Over / Short' if it doesn't exist (used by the cash reconciliation helper)
            if (coa['Operating Expenses'] && !coa['Operating Expenses'].accts.find(a => a.name === 'Cash Over / Short')) {
                coa['Operating Expenses'].accts.push({ code: '6802', name: 'Cash Over / Short', type: 'debit', opening: 0 });
                updated = true;
            }

            // Ensure no duplicate codes (just in case)
            const codes = coa.Assets.accts.map(a => a.code);
            if (new Set(codes).size !== codes.length) {
                // Remove duplicates, keeping the first occurrence
                const seen = new Set();
                coa.Assets.accts = coa.Assets.accts.filter(a => {
                    if (seen.has(a.code)) return false;
                    seen.add(a.code);
                    return true;
                });
                updated = true;
            }

            // Ensure every account has an opening-balance field (migration for older installs)
            for (const sec in coa) {
                coa[sec].accts.forEach(a => {
                    if (typeof a.opening !== 'number') { a.opening = 0; updated = true; }
                });
            }

            if (updated) {
                saveCoa();
            }
        }

        function saveCoa() {
            try { localStorage.setItem('hms_coa', JSON.stringify(coa)); } catch (e) {}
        }

        function saveCashCategories() {
            try { localStorage.setItem('hms_cash_categories', JSON.stringify(cashCategories)); } catch (e) {}
        }

        function saveSubCategories() {
            try { localStorage.setItem('hms_subcategories', JSON.stringify(subCategories)); } catch (e) {}
        }

        function saveRedeemRules() {
            try { localStorage.setItem('hms_redeem_rules', JSON.stringify(redeemRules)); } catch (e) {}
        }

        // Central place to compute balances by payment method — avoids each caller
        // re-deriving this (which is exactly how a card/company entry once got
        // miscounted as "general cash" in one spot but not another).
        function computeCashBalances() {
            let generalCash = 0,
                pettyCash = 0,
                bankBal = 0,
                cardBal = 0,
                companyBal = 0;
            cashbook.forEach(e => {
                if (e.method === 'bank') bankBal += e.dir === 'in' ? e.amount : -e.amount;
                else if (e.method === 'card') cardBal += e.dir === 'in' ? e.amount : -e.amount;
                else if (e.method === 'company') companyBal += e.dir === 'in' ? e.amount : -e.amount;
                else if (e.cashType === 'petty') pettyCash += e.dir === 'in' ? e.amount : -e.amount;
                else generalCash += e.dir === 'in' ? e.amount : -e.amount;
            });
            return { generalCash, pettyCash, bankBal, cardBal, companyBal };
        }

        function saveCompanies() {
            try { localStorage.setItem('hms_companies', JSON.stringify(companies)); } catch (e) {}
        }

        function saveReconciliations() {
            try { localStorage.setItem('hms_reconciliations', JSON.stringify(reconciliations)); } catch (e) {}
        }

        // Looks up an account's normal-balance type ('debit'/'credit') and section from the Chart of Accounts.
        function findAccountMeta(name) {
            for (const sec in coa) {
                const a = coa[sec].accts.find(x => x.name === name);
                if (a) return { type: a.type, section: sec, code: a.code, color: coa[sec].color, opening: a.opening || 0 };
            }
            return { type: 'debit', section: '', code: '', color: 'var(--text)', opening: 0 };
        }

        // Protected system accounts — hardcoded in cash-book posting logic. Renaming, retyping, or
        // deleting these would break core cash flow, so account editing blocks changes to them.
        const PROTECTED_ACCOUNTS = ['General Cash', 'Petty Cash', 'Bank Account', 'Credit Card Account', 'Accounts Receivable - Corporate'];

        // Central source of truth for what a Cash Book "payment method" posts against.
        // Used everywhere a method needs to become an account name or a display label,
        // so every part of the app stays consistent when a method is added.
        function methodAccountName(method, cashType) {
            switch (method) {
                case 'bank': return 'Bank Account';
                case 'card': return 'Credit Card Account';
                case 'company': return 'Accounts Receivable - Corporate';
                default: return cashType === 'petty' ? 'Petty Cash' : 'General Cash';
            }
        }

        function methodLabel(method, cashType) {
            switch (method) {
                case 'bank': return 'Bank';
                case 'card': return 'Credit Card';
                case 'company': return 'Company Account';
                default: return cashType === 'petty' ? 'Petty' : 'General';
            }
        }

        const PAYMENT_METHOD_OPTIONS = [
            { value: 'cash', label: 'Cash' },
            { value: 'bank', label: 'Bank' },
            { value: 'card', label: 'Credit Card' },
            { value: 'company', label: 'Company Account' }
        ];

        // ─── REPORTING PERIODS (QuickBooks-style) ──────────────
        // Income Statement reports activity DURING a period; Balance Sheet reports
        // position AS OF a date. These helpers keep that distinction correct.
        function getPeriodRange() {
            const now = new Date();
            const y = now.getFullYear(),
                m = now.getMonth();
            const fmt = d => d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
            switch (acctPeriod) {
                case 'this-month':
                    return { from: fmt(new Date(y, m, 1)), to: fmt(new Date(y, m + 1, 0)), label: 'This Month' };
                case 'last-month':
                    return { from: fmt(new Date(y, m - 1, 1)), to: fmt(new Date(y, m, 0)), label: 'Last Month' };
                case 'this-quarter': {
                    const q = Math.floor(m / 3);
                    return { from: fmt(new Date(y, q * 3, 1)), to: fmt(new Date(y, q * 3 + 3, 0)), label: 'This Quarter' };
                }
                case 'this-year':
                    return { from: fmt(new Date(y, 0, 1)), to: fmt(new Date(y, 11, 31)), label: 'This Year' };
                case 'custom':
                    return { from: acctFrom, to: acctTo, label: 'Custom Range' };
                default:
                    return { from: '', to: '', label: 'All Time' };
            }
        }

        function inRange(dateStr, from, to) {
            if (from && dateStr < from) return false;
            if (to && dateStr > to) return false;
            return true;
        }

        // Net balance of one account within a date window.
        // includeOpening: true for Balance Sheet (position as-of), false for P&L period activity.
        function accountNetRange(a, orientation, from, to, includeOpening) {
            let net = includeOpening ? (a.opening || 0) : 0;
            journal.forEach(j => {
                if (j.account !== a.name) return;
                if (!inRange(j.date, from, to)) return;
                net += orientation === 'debit' ? (j.dr - j.cr) : (j.cr - j.dr);
            });
            return net;
        }

        function sectionTotalRange(sectionName, orientation, from, to, includeOpening) {
            if (!coa[sectionName]) return 0;
            let total = 0;
            coa[sectionName].accts.forEach(a => { total += accountNetRange(a, orientation, from, to, includeOpening); });
            return total;
        }

        function accountHasActivity(a, from, to, includeOpening) {
            if (includeOpening && (a.opening || 0) !== 0) return true;
            return journal.some(j => j.account === a.name && inRange(j.date, from, to));
        }

        // Net balance of one account, oriented so a positive number means "normal side" for the given orientation.
        function accountNet(a, orientation) {
            let net = a.opening || 0;
            journal.forEach(j => { if (j.account === a.name) net += orientation === 'debit' ? (j.dr - j.cr) : (j.cr - j.dr); });
            return net;
        }

        // Total of a whole COA section, oriented the same way (contra accounts within the section net out naturally).
        function sectionTotal(sectionName, orientation) {
            if (!coa[sectionName]) return 0;
            let total = 0;
            coa[sectionName].accts.forEach(a => { total += accountNet(a, orientation); });
            return total;
        }

        // ─── RECEIVABLES (who owes us money) ───────────────────
        function getReceivables() {
            const open = txs.filter(t => (t.balance || 0) > 0 && !t.redemption);
            const groups = {};
            const todayStr = today();
            open.forEach(t => {
                const key = t.isCompany ? 'co:' + (t.companyId || t.companyName) :
                    (t.nonMember ? 'nm:' + (t.nonMemberName || 'Non-member') : 'g:' + t.gId);
                if (!groups[key]) {
                    groups[key] = { name: bookingGuestName(t), kind: t.isCompany ? 'Company' : (t.nonMember ? 'Non-member' : 'Member'), total: 0, current: 0, d30: 0, d60: 0, d90: 0, items: [] };
                }
                const days = Math.floor((new Date(todayStr) - new Date(t.date)) / 86400000);
                const bal = t.balance;
                groups[key].total += bal;
                if (days <= 30) groups[key].current += bal;
                else if (days <= 60) groups[key].d30 += bal;
                else if (days <= 90) groups[key].d60 += bal;
                else groups[key].d90 += bal;
                groups[key].items.push({ date: t.date, days, bal, desc: t.desc, id: t.id });
            });
            return Object.keys(groups).map(k => groups[k]).sort((a, b) => b.total - a.total);
        }

        // Resolves the display name for any booking row: member guest, company, or non-member.
        function bookingGuestName(tx) {
            if (tx.isCompany) {
                const c = byId(companies, tx.companyId);
                return c ? c.name : (tx.companyName || 'Unknown company');
            }
            if (tx.nonMember) return tx.nonMemberName || 'Non-member';
            const g = byId(guests, tx.gId);
            return g ? g.name : 'Unknown';
        }

        function pointsValue(pts) {
            return (pts / 1000) * (redeemRules.ratePer1000 || 0);
        }

        function redeemRateLabel() {
            return `1,000 pts = ${PKR(redeemRules.ratePer1000 || 0)}`;
        }

        function earnPointsForBooking(rooms) {
            return Math.max(0, Math.round((rooms || 1) * (redeemRules.earnPerRoom || 0)));
        }

        function earnRateLabel() {
            return `${(redeemRules.earnPerRoom || 0).toLocaleString()} points per room`;
        }

        function freeRoomLabel() {
            return `${(redeemRules.minPoints || 0).toLocaleString()} points = 1 free room`;
        }

        function save() {
            try {
                localStorage.setItem('hms_guests', JSON.stringify(guests));
                localStorage.setItem('hms_txs', JSON.stringify(txs));
                localStorage.setItem('hms_journal', JSON.stringify(journal));
                localStorage.setItem('hms_cashbook', JSON.stringify(cashbook));
                localStorage.setItem('hms_darkmode', JSON.stringify(darkMode));
                localStorage.setItem('hms_tiers', JSON.stringify(tiers));
                localStorage.setItem('hms_archived_cashbooks', JSON.stringify(archivedCashbooks));
                localStorage.setItem('hms_verifiers', JSON.stringify(verifiers));
                localStorage.setItem('hms_last_saved', JSON.stringify(new Date().toISOString()));
                saveCoa();
                saveCashCategories();
            } catch (e) {}
            scheduleSyncWrite();
        }

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
