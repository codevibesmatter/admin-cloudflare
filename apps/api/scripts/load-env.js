import { readFileSync } from 'fs';
import { resolve } from 'path';
// Load environment variables from .dev.vars
const loadEnv = () => {
    try {
        const envPath = resolve(process.cwd(), '.dev.vars');
        const envContent = readFileSync(envPath, 'utf-8');
        envContent.split('\n').forEach(line => {
            const [key, ...valueParts] = line.split('=');
            if (key && valueParts.length > 0) {
                let value = valueParts.join('=').trim();
                // Remove surrounding quotes if present
                if ((value.startsWith('"') && value.endsWith('"')) ||
                    (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                }
                process.env[key.trim()] = value;
            }
        });
    }
    catch (error) {
        console.error('Error loading .dev.vars:', error);
        process.exit(1);
    }
};
export default loadEnv;
//# sourceMappingURL=load-env.js.map