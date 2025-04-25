require('dotenv').config();
const fs = require('fs');
const { Client, MessageMedia, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

// Shop Configuration
const SHOP_INFO = {
  name: "Saravanakumar Dress World",
  address: "15, Bazaar Street, Coimbatore",
  phone: "8610820043",
  workingHours: "9:00 AM - 9:00 PM",
  location: "https://maps.app.goo.gl/example"
};

// Product Database
const PRODUCTS = {
  '1': {
    id: '1',
    name: 'Saree',
    price: 1200,
    description: 'Silk Saree - Multiple Colors',
    image: './assets/products/lehenga1.jpg'
  },
  '2': {
    id: '2',
    name: 'Salwar Kameez',
    price: 1500,
    description: 'Designer Salwar Kameez',
    image: './assets/products/lehenga2.jpg'
  },
  '3': {
    id: '3',
    name: 'Pant & Shirt',
    price: 999,
    description: 'Elegant Formal Wear',
    image: './assets/products/lehenga3.jpg'
  }
};

// Initialize Client
const client = new Client({
  authStrategy: new LocalAuth({ 
    dataPath: './sessions',
    logoutOnDisconnect: false,
    bypassPathLock: true
  }),
  puppeteer: { 
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-extensions'
    ]
  },
  takeoverOnConflict: true,
  restartOnAuthFail: true
});

// ======================
// Event Handlers
// ======================

client.on('qr', qr => {
  qrcode.generate(qr, { small: true });
  console.log('📸 Scan the QR Code...');
});

client.on('authenticated', () => {
  console.log('✅ Authentication successful!');
});

client.on('auth_failure', msg => {
  console.error('❌ Authentication failed:', msg);
  notifyAdmin('🔴 Authentication failed!');
});

client.on('ready', () => {
  console.log('🤖 Saravanakumar Dress World Bot is Ready!');
  notifyAdmin(`🟢 ${SHOP_INFO.name} Bot is Ready!\n📅 ${new Date().toLocaleString('en-IN')}`);
});

client.on('disconnected', (reason) => {
  console.log('🔌 Disconnected:', reason);
  notifyAdmin(`⚠️ Bot disconnected: ${reason}\nServer will restart.`);
  process.exit(1); // Let Railway automatically restart
});

// ======================
// Message Handler
// ======================

client.on('message', async message => {
  console.log('📩 Received:', message.body);
  
  const text = message.body.toLowerCase().trim();
  const sender = message.from;

  try {
    if (['hi', 'menu'].includes(text)) {
      return await showMainMenu(sender);
    }
    if (['1', 'products'].includes(text)) {
      return await showProducts(sender);
    }
    if (['3', 'contact'].includes(text)) {
      return await showContact(sender);
    }
    if (['4', 'offers'].includes(text)) {
      return await showOffers(sender);
    }
    if (text.startsWith('p')) {
      const productId = text.substring(1);
      return await showProductDetails(sender, productId);
    }

    // Default reply
    await reply(sender,
      '🙏 Welcome!\n' +
      'Thanks for contacting Saravanakumar Dress World.\n\n' +
      '📌 Send *hi* for menu\n' +
      '👕 Send *1* to view products'
    );
    
  } catch (error) {
    console.error('❌ Message handling error:', error);
    await reply(sender, '⚠️ Something went wrong. Please try again later.');
  }
});

// ======================
// Shop Functions
// ======================

async function showMainMenu(chatId) {
  const menu = `👕 *${SHOP_INFO.name}* - Main Menu\n
1. 👗 View Products
2. 🛒 My Order
3. 📞 Contact Us
4. 🎉 Offers

📌 Send *hi* for menu`;
  await reply(chatId, menu);
}

async function showProducts(chatId) {
  let productsList = `👗 *${SHOP_INFO.name} - Our Products*\n\n`;
  
  Object.values(PRODUCTS).forEach(product => {
    productsList += `*${product.id}*: ${product.name} - ₹${product.price}\n`;
    productsList += `💎 ${product.description}\n\n`;
  });
  
  productsList += 'To view a product, send *p<number>* (e.g., p1)';
  await reply(chatId, productsList);
}

async function showProductDetails(chatId, productId) {
  const product = PRODUCTS[productId];
  
  if (!product) {
    return await reply(chatId, '❌ Invalid product ID. Please try again.');
  }

  try {
    if (fs.existsSync(product.image)) {
      const media = MessageMedia.fromFilePath(product.image);
      await client.sendMessage(chatId, media, { 
        caption: `*${product.name}*\n💰 Price: ₹${product.price}\n📝 ${product.description}`
      });
    } else {
      await reply(chatId, 
        `*${product.name}*\n💰 Price: ₹${product.price}\n📝 ${product.description}`
      );
    }

    await reply(chatId,
      `🛒 To place an order:\n` +
      `📞 Contact: ${SHOP_INFO.phone}\n\n` +
      `📍 Visit us: ${SHOP_INFO.address}\n` +
      `🕒 Working Hours: ${SHOP_INFO.workingHours}`
    );
    
  } catch (error) {
    console.error('❌ Product sending error:', error);
    await reply(chatId, '⚠️ Unable to display product details. Please try again.');
  }
}

async function showContact(chatId) {
  await reply(chatId, 
    `📞 *${SHOP_INFO.name}*\n\n` +
    `📍 Address: ${SHOP_INFO.address}\n` +
    `📱 Phone: ${SHOP_INFO.phone}\n` +
    `🕒 Working Hours: ${SHOP_INFO.workingHours}\n\n` +
    `🗺️ Location: ${SHOP_INFO.location}\n\n` +
    `🚚 Free delivery for orders above ₹3000`
  );
}

async function showOffers(chatId) {
  await reply(chatId,
    `🎉 *${SHOP_INFO.name} - Current Offers*\n\n` +
    `1. 15% Discount on all Sarees\n` +
    `2. Free Delivery on orders above ₹3000\n` +
    `3. Buy 2 Salwar Kameez & Get 1 Saree Free\n\n` +
    `⏰ Offer valid till: 31-12-2023\n\n` +
    `📞 Contact to order: ${SHOP_INFO.phone}`
  );
}

// ======================
// Utility Functions
// ======================

async function reply(chatId, text) {
  try {
    await client.sendMessage(chatId, text);
  } catch (err) {
    console.error('❌ Failed to reply:', err);
  }
}

async function notifyAdmin(message) {
  if (process.env.ADMIN_NUMBER) {
    try {
      await reply(process.env.ADMIN_NUMBER, message);
    } catch (err) {
      console.error('❌ Failed to notify admin:', err);
    }
  }
}

// Error Handling
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  notifyAdmin(`🔴 Bot crashed: ${err.message}`);
});

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
});

// Clean Exit
process.on('SIGINT', async () => {
  console.log('🚪 Shutting down gracefully...');
  try {
    await client.destroy();
  } catch (e) {
    console.error('Cleanup error:', e);
  }
  process.exit();
});

// Initialize
client.initialize();

// Create required directories
if (!fs.existsSync('./assets/products')) {
  fs.mkdirSync('./assets/products', { recursive: true });
}
