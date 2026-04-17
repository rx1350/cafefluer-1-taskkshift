let adminEmail = 'admin@cafefleur.com';
let adminPassword = 'password123';

// Data structure for initial testing, matches Figma design.
// Later, this will be fetched from Supabase.
const MOCK_ORDERS = [
    {
        id: 'ord_1',
        roomNumber: 'Room 204',
        status: 'new',
        createdAt: new Date(Date.now() - 4 * 60000).toISOString(), // 4 mins ago
        items: [
            { name: 'Lavender Honey Latte', qty: 2, price: 18.50 },
            { name: 'Rosebud Pistachio Tart', qty: 1, price: 12.00 }
        ]
    },
    {
        id: 'ord_2',
        roomNumber: 'Room 412',
        status: 'preparing',
        createdAt: new Date(Date.now() - 18 * 60000).toISOString(), // 18 mins ago
        items: [
            { name: 'Signature Green House Salad', qty: 2, price: 34.00 },
            { name: 'Hibiscus Sparkling Water', qty: 2, price: 14.00 },
            { name: 'Truffle Fries to Share', qty: 1, price: 18.00 }
        ]
    },
    {
        id: 'ord_3',
        roomNumber: 'Penthouse B',
        status: 'ready',
        createdAt: new Date(Date.now() - 53 * 60000).toISOString(), // 53 mins ago
        items: [
            { name: 'Afternoon Tea Service for Two', qty: 1, price: 85.00 },
            { name: 'Moët & Chandon Brut (Glass)', qty: 2, price: 52.00 }
        ]
    },
    {
        id: 'ord_4',
        roomNumber: 'Room 105',
        status: 'preparing',
        createdAt: new Date(Date.now() - 12 * 60000).toISOString(), // 12 mins ago
        items: [
            { name: 'Wild Mushroom Risotto', qty: 1, price: 28.00 },
            { name: 'Chardonnay Reserve', qty: 1, price: 18.00 }
        ]
    },
    {
        id: 'ord_5',
        roomNumber: 'Room 309',
        status: 'new',
        createdAt: new Date(Date.now() - 1 * 60000).toISOString(), // 1 min ago
        items: [
            { name: 'Classic French Croissant', qty: 3, price: 15.00 },
            { name: 'Earl Grey Tea Pot', qty: 1, price: 9.00 }
        ]
    }
];

const MOCK_HISTORY = [
    {
        id: 'HCF-8912',
        roomNumber: 'Fern Gallery',
        date: 'Oct 24, 2023',
        time: '10:30 PM',
        items: [
            { name: 'Lavender Latte', qty: 1 },
            { name: 'Rose Macarons', qty: 1 }
        ],
        total: 28.50,
        status: 'done'
    },
    {
        id: 'HCF-8918',
        roomNumber: 'Sunroom Loft',
        date: 'Oct 25, 2023',
        time: '12:45 PM',
        items: [
            { name: 'Hibiscus Iced Tea', qty: 2 }
        ],
        total: 32.00,
        status: 'done'
    },
    {
        id: 'HCF-8905',
        roomNumber: 'Ivy Corridor',
        date: 'Oct 25, 2023',
        time: '10:15 AM',
        items: [
            { name: 'Matcha Moon', qty: 1 }
        ],
        total: 7.50,
        status: 'canceled'
    },
    {
        id: 'HCF-8930',
        roomNumber: 'Fern Gallery',
        date: 'Oct 25, 2023',
        time: '09:00 AM',
        items: [
            { name: 'Espresso', qty: 4 },
            { name: 'Basil Croissants', qty: 2 }
        ],
        total: 41.30,
        status: 'done'
    }
];

// Supabase setup
const SUPABASE_URL = 'https://soonmrhsedfywqodjwjq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvb25tcmhzZWRmeXdxb2Rqd2pxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNjk0NzksImV4cCI6MjA5MTk0NTQ3OX0.xEZuchbfoGDnqZfzgKqM2izJVaGC7rsA7iA6juPH04k';

let supabaseClient = null;
try {
    if (window.supabase) {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } else {
        console.warn("Supabase library not found on window object.");
    }
} catch (e) {
    console.error("Failed to initialize Supabase client:", e);
}

async function fetchOrdersFromSupabase() {
    if (!supabaseClient) {
        console.log("Supabase client not initialized, using mock data...");
        renderOrders(MOCK_ORDERS);
        renderHistory(MOCK_HISTORY);
        return;
    }
    
    console.log("Fetching orders from Supabase...");
    
    // We try to fetch all columns from orders, and the nested items
    const { data: dbOrders, error } = await supabaseClient
        .from('orders')
        .select(`*, items:order_items(*)`)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching data from Supabase:", error);
        // Fallback to mock data if there's an error
        renderOrders(MOCK_ORDERS);
        renderHistory(MOCK_HISTORY);
        return;
    }

    if (dbOrders && dbOrders.length > 0) {
        console.log("Successfully retrieved data:", dbOrders);
        
        // Map to our internal shape
        const mappedData = dbOrders.map(dbOrder => {
            const createdAtDate = new Date(dbOrder.created_at);
            
            // Format dates
            const dateStr = createdAtDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            const timeStr = createdAtDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

            // Calculate total if not provided by db
            let calculatedTotal = 0;
            const mappedItems = (dbOrder.items || []).map(item => {
                calculatedTotal += item.price * (item.qty || 1);
                return {
                    name: item.name,
                    qty: item.qty || 1,
                    price: item.price || 0
                };
            });

            const total = dbOrder.total !== undefined ? dbOrder.total : calculatedTotal;

            return {
                id: dbOrder.id,
                roomNumber: dbOrder.room_number || dbOrder.roomNumber || 'Unknown Room',
                status: dbOrder.status || 'new',
                createdAt: dbOrder.created_at,
                date: dateStr,
                time: timeStr,
                total: total,
                items: mappedItems
            };
        });

        const liveData = mappedData.filter(o => o.status !== 'done' && o.status !== 'canceled');
        // Render
        renderOrders(liveData);
        renderHistory(mappedData);
    } else {
        console.log("No data found in Supabase tables. Using mock data for preview display.");
        renderOrders(MOCK_ORDERS);
        renderHistory(MOCK_HISTORY);
    }
}

// --- UI RENDERING LOGIC ---

async function updateOrderStatus(orderId, currentStatus) {
    let nextStatus = 'new';
    if (currentStatus === 'new') nextStatus = 'preparing';
    else if (currentStatus === 'preparing') nextStatus = 'ready';
    else if (currentStatus === 'ready') nextStatus = 'done';
    
    if (nextStatus === currentStatus) return;

    // Call Supabase update
    const { error } = await supabaseClient
        .from('orders')
        .update({ status: nextStatus })
        .eq('id', orderId);
        
    if (error) {
        console.error("Error updating status:", error);
        alert("Failed to update status. Please make sure you have UPDATE permissions in Supabase Policies.");
    } else {
        // Refresh data after successful update
        fetchOrdersFromSupabase();
    }
}

function calculateTimeAgo(dateString) {
    const past = new Date(dateString);
    const now = new Date();
    const diffMins = Math.floor((now - past) / 60000);
    
    if (diffMins < 1) return 'JUST NOW';
    if (diffMins === 1) return '1 MIN AGO';
    if (diffMins < 60) return `${diffMins} MINS AGO`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours} HR${diffHours > 1 ? 'S' : ''} AGO`;
}

function getStatusDetails(status) {
    const map = {
        'new': { label: 'NEW', btnLabel: 'Mark as Preparing', btnClass: 'new', icon: 'alert-circle' },
        'preparing': { label: 'PREPARING', btnLabel: 'Mark as Ready', btnClass: 'preparing', icon: 'check-circle' },
        'ready': { label: 'READY', btnLabel: 'Mark as Delivered', btnClass: 'ready', icon: 'send' }
    };
    return map[status.toLowerCase()] || map['new'];
}

function updateSummaryCounters(orders) {
    const counts = { new: 0, preparing: 0, ready: 0, done: 0 };
    orders.forEach(o => {
        if (counts[o.status] !== undefined) {
            counts[o.status]++;
        }
    });

    document.getElementById('active-orders-count').textContent = orders.length;
    document.getElementById('count-new').textContent = counts.new;
    document.getElementById('count-preparing').textContent = counts.preparing;
    document.getElementById('count-ready').textContent = counts.ready;
    document.getElementById('count-done').textContent = counts.done;
}

function renderOrders(ordersData) {
    const container = document.getElementById('orders-container');
    const orderTemplate = document.getElementById('order-card-template');
    const itemTemplate = document.getElementById('order-item-template');

    container.innerHTML = ''; // Clear existing
    updateSummaryCounters(ordersData);

    ordersData.forEach(order => {
        const statusDetails = getStatusDetails(order.status);
        const cardClone = orderTemplate.content.cloneNode(true);
        const article = cardClone.querySelector('.order-card');
        
        article.classList.add(`status-${order.status}`);
        
        // Header
        cardClone.querySelector('.room-number').textContent = order.roomNumber;
        const statusBadge = cardClone.querySelector('.status-badge');
        statusBadge.textContent = statusDetails.label;
        statusBadge.classList.add(order.status);

        // Time
        cardClone.querySelector('.time-ago').textContent = calculateTimeAgo(order.createdAt);

        // Items
        const itemsList = cardClone.querySelector('.order-items');
        let totalVal = 0;
        
        order.items.forEach(item => {
            const itemClone = itemTemplate.content.cloneNode(true);
            itemClone.querySelector('.item-name').textContent = item.name;
            itemClone.querySelector('.item-qty').textContent = `x${item.qty}`;
            itemClone.querySelector('.item-price').textContent = `$${item.price.toFixed(2)}`;
            itemsList.appendChild(itemClone);
            totalVal += item.price;
        });

        // Total
        cardClone.querySelector('.total-amount').textContent = `$${totalVal.toFixed(2)}`;

        // Button
        const btn = cardClone.querySelector('.action-btn');
        btn.classList.add(statusDetails.btnClass);
        btn.innerHTML = `<i data-lucide="${statusDetails.icon}"></i> ${statusDetails.btnLabel}`;
        
        // Actual Database Interaction
        btn.addEventListener('click', (event) => {
            // Give immediate visual feedback by disabling the button and changing text
            btn.disabled = true;
            btn.innerHTML = `<i data-lucide="loader-2" class="spin"></i> UPDATING...`;
            updateOrderStatus(order.id, order.status, event);
        });

        container.appendChild(cardClone);
    });

    // Re-initialize icons inside new DOM elements
    lucide.createIcons();
}

function renderHistory(historyData) {
    const tbody = document.getElementById('history-table-body');
    const template = document.getElementById('history-row-template');
    
    tbody.innerHTML = '';
    
    historyData.forEach(row => {
        const clone = template.content.cloneNode(true);
        
        clone.querySelector('.col-id').textContent = row.id;
        clone.querySelector('.room-name').textContent = row.roomNumber;
        
        if (row.status === 'canceled') {
            clone.querySelector('.room-dot').classList.add('canceled-dot');
        }
        
        const dateHtml = `${row.date}<span class="time-text">${row.time}</span>`;
        clone.querySelector('.col-date').innerHTML = dateHtml;
        
        const itemsHtml = row.items.map(i => `${i.qty}x ${i.name}`).join('<br>');
        clone.querySelector('.col-items').innerHTML = itemsHtml;
        
        clone.querySelector('.col-total').textContent = `$${row.total.toFixed(2)}`;
        
        const badge = clone.querySelector('.badge');
        badge.textContent = row.status.toUpperCase();
        badge.classList.add(row.status);
        
        tbody.appendChild(clone);
    });
}

function setupNavigation() {
    const navLive = document.getElementById('nav-live');
    const navHistory = document.getElementById('nav-history');
    const navSettings = document.getElementById('nav-settings');
    const sectionLive = document.getElementById('section-live');
    const sectionHistory = document.getElementById('section-history');
    const sectionSettings = document.getElementById('section-settings');
    
    navLive.addEventListener('click', (e) => {
        e.preventDefault();
        navLive.classList.add('active');
        navHistory.classList.remove('active');
        navSettings.classList.remove('active');
        sectionLive.style.display = 'block';
        sectionHistory.style.display = 'none';
        sectionSettings.style.display = 'none';
        document.getElementById('main-page-title').textContent = 'Order Dashboard';
    });
    
    navHistory.addEventListener('click', (e) => {
        e.preventDefault();
        navHistory.classList.add('active');
        navLive.classList.remove('active');
        navSettings.classList.remove('active');
        sectionHistory.style.display = 'block';
        sectionLive.style.display = 'none';
        sectionSettings.style.display = 'none';
        document.getElementById('main-page-title').textContent = 'Conservatory Dashboard';
    });
    
    navSettings.addEventListener('click', (e) => {
        e.preventDefault();
        navSettings.classList.add('active');
        navLive.classList.remove('active');
        navHistory.classList.remove('active');
        sectionSettings.style.display = 'flex'; // Actually we can use block, wait layout is flex/col
        // Wait, standard is block. the inner layout has `display: flex; flex-direction: column`
        sectionSettings.style.display = 'block';
        sectionLive.style.display = 'none';
        sectionHistory.style.display = 'none';
        document.getElementById('main-page-title').textContent = 'Settings Dashboard';
    });
}

function setupLogin() {
    const loginForm = document.getElementById('login-form');
    const emailInput = document.getElementById('login-email');
    const pwdInput = document.getElementById('login-password');
    const errorMsg = document.getElementById('login-error');
    
    // Add helpful pre-fill values to make testing easier
    emailInput.value = adminEmail;
    pwdInput.value = adminPassword;
    
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        try {
            const enteredEmail = emailInput.value.trim();
            const enteredPwd = pwdInput.value;
            
            console.log("Attempting login...");
            if(enteredEmail === adminEmail && enteredPwd === adminPassword) {
                console.log("Login successful.");
                document.getElementById('login-view').style.display = 'none';
                document.getElementById('dashboard-view').style.display = 'flex';
                // Trigger default dashboard view
                const navLive = document.getElementById('nav-live');
                if (navLive) navLive.click();
            } else {
                console.warn("Invalid credentials.");
                errorMsg.style.display = 'block';
                errorMsg.textContent = "Invalid credentials";
            }
        } catch (err) {
            console.error("Error during login transition:", err);
            errorMsg.style.display = 'block';
            errorMsg.textContent = "System Error: " + err.message;
        }
    });
}

function setupSettingsActions() {
    const changePwdBtn = document.getElementById('change-pwd-btn');
    const saveBtn = document.getElementById('save-settings-btn');
    const settingsEmailInput = document.getElementById('settings-email');

    changePwdBtn.addEventListener('click', () => {
        const newPwd = prompt("Enter new password for " + adminEmail + ":");
        if (newPwd) {
            adminPassword = newPwd;
            alert("Password successfully updated. Please use the new password on next login.");
        }
    });

    saveBtn.addEventListener('click', () => {
        const newEmail = settingsEmailInput.value;
        if (newEmail && newEmail !== '') {
            adminEmail = newEmail;
            alert("Administrative preferences saved.");
        }
    });
    
    settingsEmailInput.value = adminEmail;
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Initialize icons for static HTML
        if (window.lucide) {
            lucide.createIcons();
        } else {
            console.warn("Lucide icons failed to load.");
        }
        
        setupLogin();
        setupNavigation();
        setupSettingsActions();
        
        // Fetch data from Supabase
        fetchOrdersFromSupabase();
        
        // Set up an interval to refresh data from Supabase
        setInterval(() => {
            fetchOrdersFromSupabase();
        }, 60000); // refresh every minute
    } catch(err) {
        console.error("Initialization error:", err);
        alert("There was an error initializing the dashboard: " + err.message);
    }
});
