
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://vnnnwakrutaombkqfwqf.supabase.co";
const supabaseAnonKey = "sb_publishable_wgNaUMLqaXwMvkThsPs2BA_pzNMvWXp";

console.log('Testing with:');
console.log('URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
    try {
        // Try to fetch something from a likely public metadata or just try a dummy sign in
        console.log('Attempting to fetch auth settings (API call)...');
        const response = await fetch(`${supabaseUrl}/auth/v1/settings`, {
            headers: { 'apikey': supabaseAnonKey }
        });

        if (response.ok) {
            console.log('API call successful!');
            const data = await response.json();
            console.log('Auth providers:', Object.keys(data.external || {}));
        } else {
            console.error('API call failed:', response.status, response.statusText);
            const errorText = await response.text();
            console.error('Error details:', errorText);
        }
    } catch (err) {
        console.error('Fatal Error:', err.message);
    }
}

test();
