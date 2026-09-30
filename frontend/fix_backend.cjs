const fs = require('fs');

const serverFile = '../backend/src/server.js';
let content = fs.readFileSync(serverFile, 'utf8');

if (!content.includes('razorpay')) {
  // Insert razorpay import
  content = content.replace(
    "import { dirname, join } from 'node:path';",
    "import { dirname, join } from 'node:path';\nimport Razorpay from 'razorpay';"
  );

  // Add razorpay routes inside the handle function
  const routesStr = `
    // Razorpay Integration
    if (request.method === 'POST' && path === '/payments/create-order') {
      const user = requireUser(request, response); if (!user) return;
      const body = await getBody(request);
      const amount = body.amount;
      if (!amount) return error(response, 400, 'Amount is required');
      
      try {
        const razorpay = new Razorpay({
          key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
          key_secret: process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder'
        });
        const options = {
          amount: amount * 100, // amount in the smallest currency unit
          currency: "INR",
          receipt: "order_rcptid_" + Math.random().toString(36).substring(7)
        };
        const order = await razorpay.orders.create(options);
        return send(response, 200, { orderId: order.id, amount: order.amount, currency: order.currency });
      } catch (err) {
        console.error(err);
        return error(response, 500, 'Razorpay order creation failed');
      }
    }

    if (request.method === 'POST' && path === '/payments/verify') {
      const user = requireUser(request, response); if (!user) return;
      const body = await getBody(request);
      const crypto = await import('crypto');
      const text = body.razorpay_order_id + "|" + body.razorpay_payment_id;
      const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder')
                                    .update(text.toString())
                                    .digest('hex');
                                    
      if (expectedSignature === body.razorpay_signature) {
        // Payment successful
        return send(response, 200, { success: true });
      } else {
        return error(response, 400, 'Invalid payment signature');
      }
    }
`;

  content = content.replace("if (request.method === 'GET' && path === '/services') return send(response, 200, { services: store.data.serviceCategories.filter((service) => service.active) });", routesStr + "\n    if (request.method === 'GET' && path === '/services') return send(response, 200, { services: store.data.serviceCategories.filter((service) => service.active) });");
  
  fs.writeFileSync(serverFile, content, 'utf8');
  console.log('Backend server updated with Razorpay routes');
} else {
  console.log('Razorpay already integrated in backend');
}
