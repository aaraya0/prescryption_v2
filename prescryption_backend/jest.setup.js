const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env.test') });

jest.setTimeout(30000); // Aumentamos el timeout porque levantar Mongo puede tardar unos segundos
