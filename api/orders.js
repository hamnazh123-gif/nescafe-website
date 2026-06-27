const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // On Vercel, write permission is only granted to /tmp. 
    // We will check process.env.VERCEL or catch write errors to fall back to /tmp/orders.json.
    const isVercel = process.env.VERCEL || process.env.NOW_REGION;
    
    let ordersFilePath = path.join(process.cwd(), 'orders.json');
    if (isVercel) {
        ordersFilePath = path.join('/tmp', 'orders.json');
    }

    // Helper to read orders
    const getOrders = () => {
        try {
            if (fs.existsSync(ordersFilePath)) {
                const fileContent = fs.readFileSync(ordersFilePath, 'utf8');
                return JSON.parse(fileContent || '[]');
            }
        } catch (err) {
            console.error("Error reading orders file, attempting root file fallback:", err);
            try {
                const rootPath = path.join(process.cwd(), 'orders.json');
                if (fs.existsSync(rootPath)) {
                    const fileContent = fs.readFileSync(rootPath, 'utf8');
                    return JSON.parse(fileContent || '[]');
                }
            } catch (rootErr) {
                console.error("Root file read fallback failed:", rootErr);
            }
        }
        return [];
    };

    if (req.method === 'GET') {
        const orders = getOrders();
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).json(orders);
    }

    if (req.method === 'POST') {
        try {
            const orderData = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

            if (!orderData || !orderData.product || !orderData.quantity || !orderData.name || !orderData.email || !orderData.address) {
                return res.status(400).json({ error: 'All fields are required' });
            }

            const orderId = `NES-GOLD-${Math.floor(100000 + Math.random() * 900000)}`;
            const newOrder = {
                orderId,
                product: orderData.product,
                quantity: parseInt(orderData.quantity),
                name: orderData.name,
                email: orderData.email,
                address: orderData.address,
                timestamp: new Date().toISOString()
            };

            const orders = getOrders();
            orders.push(newOrder);

            try {
                fs.writeFileSync(ordersFilePath, JSON.stringify(orders, null, 2), 'utf8');
            } catch (writeErr) {
                console.error("Failed writing to target path, trying fallback /tmp:", writeErr);
                try {
                    const fallbackPath = path.join('/tmp', 'orders.json');
                    fs.writeFileSync(fallbackPath, JSON.stringify(orders, null, 2), 'utf8');
                } catch (tmpErr) {
                    console.error("Fallback /tmp write failed:", tmpErr);
                }
            }

            res.setHeader('Content-Type', 'application/json');
            return res.status(201).json({ success: true, order: newOrder });
        } catch (e) {
            console.error("POST handling error:", e);
            return res.status(400).json({ error: 'Invalid JSON payload' });
        }
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
};
