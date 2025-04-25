require('dotenv').config();
const fs = require('fs');
const { Client, MessageMedia, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

// Shop Configuration
const SHOP_INFO = {
  name: "சரவணகுமார் டிரஸ் வேர்ல்ட்",
  address: "15, பஜார் வீதி, கோயம்புத்தூர்",
  phone: "8610820043",
  workingHours: "காலை 9:00 - இரவு 9:00",
  location: "https://maps.app.goo.gl/example"
};

// Product Database
const PRODUCTS = {
  '1': {
    id: '1',
    name: 'சேலை',
    price: 1200,
    description: 'பட்டு சேலை - பல வண்ணங்கள்',
    image: './assets/products/lehenga1.jpg'
  },
  '2': {
    id: '2',
    name: 'சல்வார் கமீஸ்',
    price: 1500,
    description: 'டிசைன் சல்வார் கமீஸ்',
    image: './assets/products/lehenga2.jpg'
  },
  '3': {
    id: '3',
    name: 'பேன்ட் & சட்டை',
    price: 999,
    description: 'அழகான ஃபார்மல் அணிவகை',
    image: './assets/products/lehenga3.jpg'
  }
};

// Initialize Client with enhanced settings
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
  console.log('QR ஸ்கேன் செய்யவும்...');
});

client.on('authenticated', () => {
  console.log('✅ Authentication successful!');
});

client.on('auth_failure', msg => {
  console.error('❌ Auth failure:', msg);
  notifyAdmin('🔴 Authentication failed!');
});

client.on('ready', () => {
  console.log('🤖 Saravanakumar Dress World Bot Ready!');
  notifyAdmin(`🟢 ${SHOP_INFO.name} போட் தயார்!\n📅 ${new Date().toLocaleString()}`);
});

client.on('disconnected', (reason) => {
  console.log('🔌 Disconnected:', reason);
  notifyAdmin(`⚠️ Bot disconnected: ${reason}\nAttempting reconnect...`);
  setTimeout(() => client.initialize(), 5000);
});

// Enhanced message handler with debugging
client.on('message', async message => {
  console.log('📩 Received:', message.body);
  
  const text = message.body.toLowerCase().trim();
  const sender = message.from;

  try {
    // Handle both English and Tamil commands
    if (['hi', 'menu', 'வணக்கம்', 'மெனு'].includes(text)) {
      return await showMainMenu(sender);
    }
    
    if (['1', 'products', 'பொருட்கள்'].includes(text)) {
      return await showProducts(sender);
    }
    
    if (['3', 'contact', 'தொடர்பு'].includes(text)) {
      return await showContact(sender);
    }
    
    if (['4', 'offers', 'சலுகைகள்'].includes(text)) {
      return await showOffers(sender);
    }
    
    if (text.startsWith('p')) {
      const productId = text.substring(1);
      return await showProductDetails(sender, productId);
    }

    // Default reply
    await reply(sender,
      '🙏 வணக்கம்!\n' +
      'எங்கள் டிரஸ் கடைக்கு வரவேற்கிறோம்.\n\n' +
      '📌 உதவிக்கு *hi* அனுப்பவும்\n' +
      '👕 பொருட்களைப் பார்க்க *1* அனுப்பவும்'
    );
    
  } catch (error) {
    console.error('❌ Message error:', error);
    await reply(sender, '⚠️ தவறு ஏற்பட்டுள்ளது. பிறகு முயற்சிக்கவும்.');
  }
});

// ======================
// Shop Functions (Improved)
// ======================

async function showMainMenu(chatId) {
  const menu = `👕 *${SHOP_INFO.name}* - முதன்மை மெனு\n
1. 👗 பொருட்களைப் பார்க்க
2. 🛒 என் ஆர்டர்
3. 📞 எங்களைத் தொடர்பு கொள்ள
4. 🎉 சலுகைகள்

📌 உதவிக்கு *hi* அனுப்பவும்`;
  await reply(chatId, menu);
}

async function showProducts(chatId) {
  let productsList = `👗 *${SHOP_INFO.name} - எங்கள் பொருட்கள்*\n\n`;
  
  Object.values(PRODUCTS).forEach(product => {
    productsList += `*${product.id}*: ${product.name} - ₹${product.price}\n`;
    productsList += `💎 ${product.description}\n\n`;
  });
  
  productsList += 'ஒரு பொருளைப் பார்க்க *p<number>* அனுப்பவும் (எ.கா: p1)';
  await reply(chatId, productsList);
}

async function showProductDetails(chatId, productId) {
  const product = PRODUCTS[productId];
  
  if (!product) {
    return await reply(chatId, '❌ தவறான பொருள் ID. மீண்டும் முயற்சிக்கவும்.');
  }

  try {
    // Try to send image
    if (fs.existsSync(product.image)) {
      const media = MessageMedia.fromFilePath(product.image);
      await client.sendMessage(chatId, media, { 
        caption: `*${product.name}*\n💰 விலை: ₹${product.price}\n📝 ${product.description}`
      });
    } else {
      await reply(chatId, 
        `*${product.name}*\n💰 விலை: ₹${product.price}\n📝 ${product.description}`
      );
    }
    
    // Add call-to-action
    await reply(chatId,
      `🛒 ஆர்டர் செய்ய:\n` +
      `📞 ${SHOP_INFO.phone} ஐ தொடர்பு கொள்ளவும்\n\n` +
      `📍 எங்கள் கடை: ${SHOP_INFO.address}\n` +
      `🕒 நேரம்: ${SHOP_INFO.workingHours}`
    );
    
  } catch (error) {
    console.error('❌ Product error:', error);
    await reply(chatId, '⚠️ பொருளைக் காட்ட முடியவில்லை. பிறகு முயற்சிக்கவும்.');
  }
}

async function showContact(chatId) {
  await reply(chatId, 
    `📞 *${SHOP_INFO.name}*\n\n` +
    `📍 முகவரி: ${SHOP_INFO.address}\n` +
    `📱 போன்: ${SHOP_INFO.phone}\n` +
    `🕒 நேரம்: ${SHOP_INFO.workingHours}\n\n` +
    `🗺️ இருப்பிடம்: ${SHOP_INFO.location}\n\n` +
    `🚚 இலவச விநியோகம் ₹3000+ ஆர்டர்களுக்கு`
  );
}

async function showOffers(chatId) {
  await reply(chatId,
    `🎉 *${SHOP_INFO.name} - தற்போதைய சலுகைகள்*\n\n` +
    `1. 15% தள்ளுபடி அனைத்து சேலைகளிலும்\n` +
    `2. ₹3000+ ஆர்டர்களுக்கு இலவச விநியோகம்\n` +
    `3. 2 சல்வார் கமீஸ் வாங்கினால் 1 சேலை இலவசம்\n\n` +
    `⏰ சலுகை காலம்: 31-12-2023 வரை\n\n` +
    `📞 ஆர்டர் செய்ய: ${SHOP_INFO.phone}`
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