import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabase = createClient(
  "YOUR_SUPABASE_URL",
  "YOUR_SUPABASE_ANON_KEY"
);

const data = JSON.parse(fs.readFileSync("firebase-export.json"));

async function importData() {
  for (let user of data.users) {
    await supabase.from('users').insert(user);
  }

  for (let product of data.products) {
    await supabase.from('products').insert(product);
  }

  for (let order of data.orders) {
    await supabase.from('orders').insert(order);
  }

  console.log("Migration done ✅");
}

importData();